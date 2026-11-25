import { rasterize } from '../core/raster.ts';
import { project } from '../core/rig.ts';
import { STRIDE, buildScene, createScene, solve } from '../core/scene.ts';
import { TECHNIQUES } from '../techniques/index.ts';
import { resolveCast } from './index.ts';

const SIZE = 22, GRID = 96;

/** Head-and-shoulders picture of a character, cut from the opening stance. */
export function portrait(id: string, role: 'tori' | 'uke'): HTMLCanvasElement {
  const tech = TECHNIQUES[0], cast = resolveCast({ [role]: id });
  // Hide the opponent by drawing only this fighter's parts.
  const full = buildScene(tech, 0, createScene(), cast), own = role === 'tori' ? 1 : 2, scene = createScene();
  for (let i = 0; i < full.count; i++) if ((full.data[i * STRIDE + 7] & 7) === own) scene.data.set(full.data.subarray(i * STRIDE, (i + 1) * STRIDE), scene.count++ * STRIDE);
  const px = rasterize(scene, GRID), [cx, cy] = project(solve(tech, 0)[role].head).map(Math.round);
  const canvas = document.createElement('canvas'), x0 = cx - SIZE / 2, y0 = cy - SIZE / 2;
  canvas.width = canvas.height = SIZE;
  const img = new ImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) img.data.set(px.subarray(((y0 + y) * GRID + x0) * 4, ((y0 + y) * GRID + x0 + SIZE) * 4), y * SIZE * 4);
  canvas.getContext('2d')!.putImageData(img, 0, 0);
  return canvas;
}
