import type { BaseTool, ToolContext } from './BaseTool';
import type { Point, Shape } from '../../types';
import { store } from '../../state/store';
import * as actions from '../../state/actions';
import { registerRenderer } from '../elementRenderers';

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  const { x, y, width, height, shapeType, fillColor, fillOpacity, strokeColor, strokeOpacity, strokeWidth, borderRadius, rotation } = shape;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const hasFill = fillColor !== 'transparent';
  const hasStroke = strokeColor !== 'transparent' && strokeWidth > 0;

  ctx.save();

  if (rotation !== 0) {
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);
  }

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  const baseFillOpacity = fillOpacity ?? 1;
  const baseStrokeOpacity = strokeOpacity ?? 1;

  switch (shapeType) {
    case 'rectangle':
    case 'square': {
      const maxRadius = Math.min(width, height) / 2;
      const radius = Math.min(borderRadius, maxRadius);

      ctx.beginPath();
      if (radius > 0) {
        ctx.roundRect(x, y, width, height, radius);
      } else {
        ctx.rect(x, y, width, height);
      }
      if (hasFill) {
        ctx.globalAlpha = baseFillOpacity;
        ctx.fill();
      }
      if (hasStroke) {
        ctx.globalAlpha = baseStrokeOpacity;
        ctx.stroke();
      }
      break;
    }

    case 'circle':
    case 'ellipse': {
      const radiusX = width / 2;
      const radiusY = height / 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      if (hasFill) {
        ctx.globalAlpha = baseFillOpacity;
        ctx.fill();
      }
      if (hasStroke) {
        ctx.globalAlpha = baseStrokeOpacity;
        ctx.stroke();
      }
      break;
    }

    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(centerX, y);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.closePath();
      if (hasFill) {
        ctx.globalAlpha = baseFillOpacity;
        ctx.fill();
      }
      if (hasStroke) {
        ctx.globalAlpha = baseStrokeOpacity;
        ctx.stroke();
      }
      break;
    }

    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(centerX, y);
      ctx.lineTo(x + width, centerY);
      ctx.lineTo(centerX, y + height);
      ctx.lineTo(x, centerY);
      ctx.closePath();
      if (hasFill) {
        ctx.globalAlpha = baseFillOpacity;
        ctx.fill();
      }
      if (hasStroke) {
        ctx.globalAlpha = baseStrokeOpacity;
        ctx.stroke();
      }
      break;
    }

    case 'cylinder': {
      const ellipseHeight = height * 0.15;
      const bodyHeight = height - ellipseHeight;

      ctx.beginPath();
      ctx.moveTo(x, y + ellipseHeight / 2);
      ctx.lineTo(x, y + bodyHeight);
      ctx.ellipse(centerX, y + bodyHeight, width / 2, ellipseHeight / 2, 0, Math.PI, 0, true);
      ctx.lineTo(x + width, y + ellipseHeight / 2);
      ctx.ellipse(centerX, y + ellipseHeight / 2, width / 2, ellipseHeight / 2, 0, 0, Math.PI, true);
      ctx.closePath();
      if (hasFill) {
        ctx.globalAlpha = baseFillOpacity;
        ctx.fill();
      }
      if (hasStroke) {
        ctx.globalAlpha = baseStrokeOpacity;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.ellipse(centerX, y + ellipseHeight / 2, width / 2, ellipseHeight / 2, 0, 0, Math.PI * 2);
      if (hasFill) {
        ctx.globalAlpha = baseFillOpacity;
        ctx.fill();
      }
      if (hasStroke) {
        ctx.globalAlpha = baseStrokeOpacity;
        ctx.stroke();
      }
      break;
    }

    case 'pyramid': {
      const baseY = y + height * 0.7;
      const baseHeight = height * 0.3;
      const apex = { x: centerX, y: y };

      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(x, baseY + baseHeight / 2);
      ctx.lineTo(centerX, baseY + baseHeight);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      if (hasFill) {
        ctx.globalAlpha = baseFillOpacity;
        ctx.fill();
      }
      if (hasStroke) {
        ctx.globalAlpha = baseStrokeOpacity;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(centerX, baseY + baseHeight);
      ctx.lineTo(x + width, baseY + baseHeight / 2);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      if (hasFill) {
        ctx.globalAlpha = baseFillOpacity;
        ctx.fill();
      }
      if (hasStroke) {
        ctx.globalAlpha = baseStrokeOpacity;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(x + width, baseY + baseHeight / 2);
      ctx.lineTo(centerX, baseY);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      if (hasFill) {
        ctx.globalAlpha = baseFillOpacity * 0.7;
        ctx.fill();
      }
      if (hasStroke) {
        ctx.globalAlpha = baseStrokeOpacity;
        ctx.stroke();
      }
      break;
    }
  }

  ctx.restore();
}

registerRenderer('shape', drawShape);

export const ShapeTool: BaseTool = {
  name: 'shape',
  cursor: 'crosshair',

  onActivate(context: ToolContext) {
    context.canvas.style.cursor = 'crosshair';
  },

  onMouseDown(_e: MouseEvent, point: Point, _context: ToolContext) {
    const state = store.getState();

    actions.setIsCreatingShape(true);
    actions.setShapeStart(point);
    actions.setCurrentShape({
      shapeType: state.shapeType,
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      fillColor: state.shapeFillColor,
      fillOpacity: state.shapeFillOpacity,
      strokeColor: state.shapeStrokeColor,
      strokeOpacity: state.shapeStrokeOpacity,
      strokeWidth: state.shapeStrokeWidth,
      borderRadius: state.shapeBorderRadius,
      rotation: 0,
    });
  },

  onMouseMove(_e: MouseEvent, point: Point, context: ToolContext) {
    const state = store.getState();

    if (state.isCreatingShape && state.currentShape) {
      const minX = Math.min(state.shapeStart.x, point.x);
      const minY = Math.min(state.shapeStart.y, point.y);
      let width = Math.abs(point.x - state.shapeStart.x);
      let height = Math.abs(point.y - state.shapeStart.y);

      // For square and circle, make dimensions equal
      if (state.currentShape.shapeType === 'square' || state.currentShape.shapeType === 'circle') {
        const size = Math.max(width, height);
        width = size;
        height = size;
      }

      state.currentShape.x = minX;
      state.currentShape.y = minY;
      state.currentShape.width = width;
      state.currentShape.height = height;
      context.render();
    }
  },

  onMouseUp(_e: MouseEvent, _point: Point, context: ToolContext) {
    const state = store.getState();
    const countBefore = state.elements.length;
    actions.commitCurrentShape();
    if (state.elements.length > countBefore) {
      const newElement = state.elements[state.elements.length - 1];
      context.setTool('select');
      actions.selectElement(newElement);
    }
  },
};
