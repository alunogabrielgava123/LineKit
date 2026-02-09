import { store } from "../../state";
import type { Point, Line } from "../../types";
import type { BaseTool, ToolContext } from "./BaseTool";
import * as actions from '../../state/actions';
import { registerRenderer } from '../elementRenderers';

function drawLine(ctx: CanvasRenderingContext2D, line: Line) {
  const { startX, startY, endX, endY, color, opacity, lineWidth, controlX, controlY } = line;

  ctx.save();
  ctx.globalAlpha = opacity ?? 1;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  if (controlX !== undefined && controlY !== undefined) {
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
  } else {
    ctx.lineTo(endX, endY);
  }
  ctx.stroke();

  ctx.restore();
}

registerRenderer('line', drawLine);

export const LineTool: BaseTool = {
    name: "line",
    cursor: "crosshair",


    onActivate(context: ToolContext) {
        context.canvas.style.cursor = 'crosshair';
    },

    onMouseDown(_e: MouseEvent, point: Point, _context: ToolContext) {
        const state = store.getState();

        actions.setIsCreatingLine(true);
        actions.setCurrentLine({
            startX: point.x,
            startY: point.y,
            endX: point.x,
            endY: point.y,
            color: state.strokeColor,
            opacity: state.strokeOpacity,
            lineWidth: state.strokeWidth,
        });
    },

    onMouseMove(_e: MouseEvent, point: Point, context: ToolContext) {
        const state = store.getState();


        if (state.isCreatingLine && state.currentLine) {
            state.currentLine.endX = point.x;
            state.currentLine.endY = point.y;
            context.render();
        }
    },

    onMouseUp(_e: MouseEvent, _point: Point, context: ToolContext) {
        const state = store.getState();
        const countBefore = state.elements.length;
        actions.commitCurrentLine();
        if (state.elements.length > countBefore) {
            const newElement = state.elements[state.elements.length - 1];
            context.setTool('select');
            actions.selectElement(newElement);
        }
    },

}