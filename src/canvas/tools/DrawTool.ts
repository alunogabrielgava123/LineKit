import type { BaseTool, ToolContext } from './BaseTool';
import type { Point, DrawPath } from '../../types';
import { store } from '../../state/store';
import * as actions from '../../state/actions';
import { registerRenderer } from '../elementRenderers';

function drawPath(ctx: CanvasRenderingContext2D, path: DrawPath) {
  if (path.points.length < 2) return;

  ctx.save();

  if (path.rotation !== 0) {
    ctx.translate(path.centerX, path.centerY);
    ctx.rotate(path.rotation);
    ctx.translate(-path.centerX, -path.centerY);
  }

  ctx.globalAlpha = path.opacity ?? 1;
  ctx.strokeStyle = path.color;
  ctx.lineWidth = path.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(path.points[0].x, path.points[0].y);
  for (let i = 1; i < path.points.length; i++) {
    ctx.lineTo(path.points[i].x, path.points[i].y);
  }
  ctx.stroke();

  ctx.restore();
}

registerRenderer('path', drawPath);

export const DrawTool: BaseTool = {
  name: 'draw',
  cursor: 'crosshair',

  onActivate(context: ToolContext) {
    context.canvas.style.cursor = 'crosshair';
  },

  onMouseDown(_e: MouseEvent, point: Point, _context: ToolContext) {
    const state = store.getState();

    actions.setIsDrawing(true);
    actions.setCurrentPath({
      points: [point],
      lineWidth: state.strokeWidth,
      color: state.strokeColor,
      opacity: state.strokeOpacity,
      rotation: 0,
      centerX: point.x,
      centerY: point.y,
    });
  },

  onMouseMove(_e: MouseEvent, point: Point, context: ToolContext) {
    const state = store.getState();

    if (state.isDrawing && state.currentPath) {
      state.currentPath.points.push(point);
      context.render();
    }
  },

  onMouseUp(_e: MouseEvent, _point: Point, _context: ToolContext) {
    actions.commitCurrentPath();
  },
};
