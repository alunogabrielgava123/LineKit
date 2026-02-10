# Architecture

## Overview

LineKit is a canvas drawing application built with a modular, state-driven architecture. No frameworks or runtime dependencies—just TypeScript, Canvas API, and Vite.

```
User Input (mouse, keyboard)
         ↓
    Canvas.ts (event handlers, coordinates)
         ↓
    Active Tool (SelectTool, DrawTool, TextTool, etc.)
         ↓
    Actions (state mutations)
         ↓
    Store (centralized state + pub/sub)
         ↓
    ┌─────────────┬──────────────┬──────────────┐
    ↓             ↓              ↓              ↓
  Canvas       Toolbar       SidePanel   ElementInfoPanel
  (render)     (update UI)   (update UI)   (update UI)
```

## Core Components

### Types (`src/types/index.ts`)

All TypeScript interfaces defined in one place:

```typescript
// Tool types
type Tool = 'select' | 'move' | 'draw' | 'text' | 'shape' | 'arrow' | 'line';

// Element data types
interface TextBlock {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontStyle: FontStyle;
  color: string;
  opacity: number;
  rotation: number;
}

interface DrawPath {
  points: Point[];
  lineWidth: number;
  color: string;
  opacity: number;
  rotation: number;
  centerX: number;
  centerY: number;
}

interface Shape {
  shapeType: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWidth: number;
  borderRadius: number;
  rotation: number;
}

interface Arrow {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  opacity: number;
  lineWidth: number;
  controlX?: number;
  controlY?: number;
}

interface Line {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  opacity: number;
  lineWidth: number;
  controlX?: number;
  controlY?: number;
}

// Union type for all canvas elements
type CanvasElement =
  | { type: 'text'; data: TextBlock }
  | { type: 'path'; data: DrawPath }
  | { type: 'shape'; data: Shape }
  | { type: 'arrow'; data: Arrow }
  | { type: 'line'; data: Line };
```

### Constants (`src/constants.ts`)

```typescript
// Selection handles
export const HANDLE_SIZE = 8;
export const ROTATE_HANDLE_OFFSET = 24;

// Zoom limits
export const MIN_SCALE = 0.25;
export const MAX_SCALE = 4;
export const ZOOM_FACTOR = 1.2;

// Default settings
export const DEFAULT_TEXT_SIZE = 24;
export const DEFAULT_TEXT_FONT_FAMILY = 'Inter, sans-serif';
export const DEFAULT_TEXT_COLOR = '#ffffff';
export const DEFAULT_STROKE_WIDTH = 4;
export const DEFAULT_STROKE_COLOR = '#ffffff';
// ... more defaults
```

### State Management (`src/state/`)

#### `store.ts` — Centralized State

The store holds all application state and provides a pub/sub listener system:

```typescript
interface State {
  // Elements
  elements: CanvasElement[];

  // History
  past: string[];      // JSON snapshots for undo
  future: string[];    // JSON snapshots for redo

  // Selection
  selectedElements: Set<CanvasElement>;
  selectionRotation: number;

  // Current tool
  currentTool: Tool;

  // View transform
  offset: Point;
  scale: number;

  // Tool settings
  textSize: number;
  textFontFamily: string;
  textStyle: FontStyle;
  textColor: string;
  // ... more tool settings
}

// API
store.subscribe(listener);           // General updates
store.subscribeToSelection(listener); // Selection changes
store.subscribeToTool(listener);      // Tool changes
store.subscribeToHistory(listener);   // Undo/redo state
```

#### `actions.ts` — State Mutations

All state changes go through actions:

```typescript
// Element actions
addElement(element);
removeElement(element);
removeSelectedElements();

// Selection actions
selectElement(element, addToSelection?);
deselectElement(element);
clearSelection();

// Tool actions
setTool(tool);
setTextSize(size);
setTextFontFamily(family);
setTextColor(color);
// ... more actions

// View actions
zoomIn(centerX, centerY);
zoomOut(centerX, centerY);
resetZoom();
setOffset(offset);

// History actions
undo();
redo();
```

### Canvas (`src/canvas/`)

#### `index.ts` — Canvas Orchestration

The Canvas class:

1. Sets up the 2D context
2. Manages the rendering loop
3. Routes events to the active tool
4. Provides public API methods

```typescript
interface Canvas {
  setTool(tool: Tool): void;
  setTextSize(size: number): void;
  setTextColor(color: string): void;
  zoomIn(): void;
  zoomOut(): void;
  resetZoom(): void;
  onToolChange(listener: (tool: Tool) => void): () => void;
  onSelectionChange(listener: (info: SelectionInfo) => void): () => void;
  // ... more methods
}
```

#### `elementRenderers.ts` — Element Drawing

Pure functions for rendering each element type:

```typescript
function drawText(ctx, block, showCursor?, cursorPos?, selectionStart?);
function drawPath(ctx, path);
function drawShape(ctx, shape);
function drawArrow(ctx, arrow);
function drawLine(ctx, line);
```

#### `tools/` — Tool System

Each tool implements the `BaseTool` interface:

```typescript
interface BaseTool {
  name: string;
  cursor: string;
  onActivate?(context: ToolContext): void;
  onDeactivate?(context: ToolContext): void;
  onMouseDown?(e: MouseEvent, point: Point, context: ToolContext): void;
  onMouseMove?(e: MouseEvent, point: Point, context: ToolContext): void;
  onMouseUp?(e: MouseEvent, point: Point, context: ToolContext): void;
  onDoubleClick?(e: MouseEvent, point: Point, context: ToolContext): void;
  onKeyDown?(e: KeyboardEvent, context: ToolContext): void;
}
```

Tools are registered in a map:

```typescript
export const tools: Record<Tool, BaseTool> = {
  select: SelectTool,
  move: MoveTool,
  draw: DrawTool,
  text: TextTool,
  shape: ShapeTool,
  arrow: ArrowTool,
  line: LineTool,
};
```

**Available Tools:**

- `SelectTool.ts` — Selection, move, resize, rotate, copy/paste
- `MoveTool.ts` — Pan canvas
- `DrawTool.ts` — Freehand drawing
- `TextTool.ts` — Text placement and editing
- `ShapeTool.ts` — Geometric shapes
- `ArrowTool.ts` — Arrows with arrowheads
- `LineTool.ts` — Lines with optional curves

### Components (`src/components/`)

UI components that connect to the canvas:

- `Toolbar.ts` — Tool selection buttons
- `ShapePanel.ts` — Shape type selector
- `SidePanel.ts` — Tool-specific options (colors, sizes, opacity)
- `ZoomControls.ts` — Zoom in/out buttons
- `HistoryControls.ts` — Undo/redo buttons
- `ElementInfoPanel.ts` — Edit element properties
- `Menu.ts` — Menu dropdown

Each component:
1. Queries the DOM for its elements
2. Attaches event listeners
3. Calls canvas/action methods on interaction
4. Subscribes to state changes to update UI

### Elements (`src/elements/`)

Per-element-type logic for transformations:

#### `handlers/` — Transformation Handlers

Each element type has a handler with methods for:

- `move(data, dx, dy)` — Move element
- `scale(data, scaleX, scaleY, centerX, centerY)` — Scale element
- `rotate(data, angle, pivotX, pivotY, ctx?)` — Rotate element
- `getBoundingBox(data, ctx)` — Get bounding box

```typescript
// Example: textHandler
export const textHandler: ElementHandler<TextBlock> = {
  move(data, dx, dy) {
    data.x += dx;
    data.y += dy;
  },

  scale(data, scaleX, scaleY, centerX, centerY) {
    const scale = Math.max(scaleX, scaleY);
    data.fontSize = Math.max(8, data.fontSize * scale);
    data.x = centerX + (data.x - centerX) * scaleX;
    data.y = centerY + (data.y - centerY) * scaleY;
  },

  getBoundingBox(data, ctx) {
    // Calculate text dimensions and return bounding box
    // ...
  }
};
```

### Utilities (`src/utils/`)

#### `geometry.ts` — Geometric Calculations

```typescript
// Get bounding box of a single element
getBoundingBox(element, ctx): BoundingBox | null;

// Get bounding box encompassing all selected elements
getSelectionBoundingBox(selectedElements, ctx): BoundingBox | null;

// Check if two boxes intersect
boxesIntersect(boxA, boxB): boolean;

// Find element under cursor
hitTest(point, elements, ctx): CanvasElement | null;

// Find handle under cursor
hitTestHandle(point, box, selectionRotation): HandleType;

// Get handle positions for a bounding box
// ... (internal helpers)
```

#### `dom.ts` — DOM Helpers

```typescript
$(selector);           // document.querySelector with typing
$all(selector);        // document.querySelectorAll
show(element);         // Remove 'hidden' class
hide(element);         // Add 'hidden' class
```

## Rendering Pipeline

```typescript
// Main render loop in Canvas.ts
function render() {
  ctx.clearRect(0, 0, width, height);
  ctx.save();

  // Apply view transform
  ctx.translate(offset.x, offset.y);
  ctx.scale(scale, scale);

  // Draw elements
  for (const element of elements) {
    const renderer = elementRenderers[element.type];
    renderer(ctx, element.data);
  }

  // Draw selection UI
  if (selectedElements.size > 0) {
    drawSelectionUI(ctx, selectionBox, selectionRotation);
  }

  // Draw marquee if selecting
  if (isMarqueeSelecting) {
    drawMarquee(ctx, marqueeStart, marqueeEnd);
  }

  ctx.restore();
  requestAnimationFrame(render);
}
```

## Data Flow

1. **User Input** → Mouse/keyboard events fire on canvas
2. **Canvas Router** → Canvas.ts routes to active tool
3. **Tool Handler** → Tool interprets input and calls actions
4. **Actions** → Mutations update store state
5. **Store Notify** → Listeners are called
6. **Canvas Render** → Re-renders with new state
7. **UI Update** → Components update if subscribed

## Persistence

Elements are saved to `localStorage` with a 300ms debounce:

```typescript
const STORAGE_KEY = 'g-draw-elements';

function saveElements(elements: CanvasElement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
}

function loadElements(): CanvasElement[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}
```

## Adding a New Tool

1. Create `src/canvas/tools/MyTool.ts`:

```typescript
import type { BaseTool, ToolContext } from './BaseTool';
import type { Point } from '../../types';
import { store } from '../../state/store';
import * as actions from '../../state/actions';

export const MyTool: BaseTool = {
  name: 'mytool',
  cursor: 'crosshair',

  onActivate(context) {
    context.canvas.style.cursor = 'crosshair';
  },

  onMouseDown(_e, point, context) {
    // Handle mouse down
  },

  onMouseMove(_e, point, context) {
    // Handle mouse move
  },

  onMouseUp(_e, point, context) {
    // Handle mouse up
  },
};
```

2. Export in `src/canvas/tools/index.ts`:

```typescript
export { MyTool } from './MyTool';

export const tools: Record<Tool, BaseTool> = {
  // ... existing
  mytool: MyTool,
};
```

3. Add type in `src/types/index.ts`:

```typescript
export type Tool = 'select' | 'move' | 'draw' | 'text' | 'shape' | 'arrow' | 'line' | 'mytool';
```

4. Add button in `src/main.ts`

5. Add styles in `src/style.css` if needed

## Performance Considerations

- **Canvas rendering** — Uses `requestAnimationFrame` for smooth 60fps
- **State listeners** — Only subscribed components update
- **Bounding box caching** — Recalculated only when needed (element changes or selection changes)
- **localStorage debouncing** — Saves only once per 300ms of changes
- **Event delegation** — Global mouse/keyboard handlers route to active tool

## Browser Support

G-Draw requires:
- ES2020+ (async/await, optional chaining, nullish coalescing)
- Canvas 2D API
- localStorage
- Modern CSS (CSS variables, grid, flexbox)

Tested on Chrome, Firefox, Safari, and Edge.
