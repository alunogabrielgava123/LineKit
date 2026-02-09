import type { CanvasElement } from '../types';

type ElementRenderer = (ctx: CanvasRenderingContext2D, data: any) => void;

const renderers = new Map<string, ElementRenderer>();

export function registerRenderer(type: string, renderer: ElementRenderer) {
  renderers.set(type, renderer);
}

export function renderElement(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const renderer = renderers.get(element.type);
  if (renderer) renderer(ctx, element.data);
}
