import type { TextBlock, BoundingBox } from '../../types';
import type { ElementHandler } from '../types';

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

  rotate(data, angle, pivotX, pivotY, ctx?) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Compute the bounding box center (like shapes do)
    const lines = data.text.split('\n');
    const lineHeight = data.fontSize * 1.25;
    const totalHeight = lines.length * lineHeight;

    let maxWidth = 0;
    if (ctx) {
      const fontWeight = data.fontStyle === 'bold' ? 'bold' : 'normal';
      const fontStyleCss = data.fontStyle === 'italic' ? 'italic' : 'normal';
      ctx.font = `${fontStyleCss} ${fontWeight} ${data.fontSize}px ${data.fontFamily || 'sans-serif'}`;
      for (const line of lines) {
        const w = ctx.measureText(line).width;
        if (w > maxWidth) maxWidth = w;
      }
    }

    const centerX = data.x + maxWidth / 2;
    const centerY = data.y - data.fontSize * 0.75 + totalHeight / 2;

    // Orbit the center around the pivot
    const dx = centerX - pivotX;
    const dy = centerY - pivotY;
    const newCenterX = pivotX + dx * cos - dy * sin;
    const newCenterY = pivotY + dx * sin + dy * cos;

    // Derive data.x/y from the new center
    data.x = newCenterX - maxWidth / 2;
    data.y = newCenterY + data.fontSize * 0.75 - totalHeight / 2;
    data.rotation += angle;
  },

  getBoundingBox(data, ctx): BoundingBox | null {
    const lines = data.text.split('\n');
    const lineHeight = data.fontSize * 1.25;
    let maxWidth = 0;

    const fontWeight = data.fontStyle === 'bold' ? 'bold' : 'normal';
    const fontStyleCss = data.fontStyle === 'italic' ? 'italic' : 'normal';
    ctx.font = `${fontStyleCss} ${fontWeight} ${data.fontSize}px ${data.fontFamily || 'sans-serif'}`;
    for (const line of lines) {
      const width = ctx.measureText(line).width;
      if (width > maxWidth) maxWidth = width;
    }

    return {
      x: data.x,
      y: data.y - data.fontSize * 0.75,
      width: maxWidth,
      height: lines.length * lineHeight,
    };
  },
};
