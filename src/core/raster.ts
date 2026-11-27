/** CPU reference renderer for file export. Must stay in step with the shader in src/gpu/shader.ts. */
import { LINE } from "./palette.ts";
import { WORLD } from "./rig.ts";
import { DEPTH_SORTED_GROUP, STRIDE } from "./scene.ts";
import type { Scene } from "./scene.ts";

export const LIGHT = [-0.5, -0.866] as const;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function rasterize(scene: Scene, grid: number): Uint8Array {
  const out = new Uint8Array(grid * grid * 4),
    unit = WORLD / grid,
    d = scene.data;
  for (let py = 0; py < grid; py++)
    for (let px = 0; px < grid; px++) {
      if (scene.dissolve > (BAYER[(py & 3) * 4 + (px & 3)] + 0.5) / 16)
        continue;
      const x = (px + 0.5) * unit,
        y = (py + 0.5) * unit;
      let col = -1,
        own = -1,
        depth = -1e9,
        gHit = -1,
        gMin = 1e9,
        gDepth = -1e9,
        gEdge = -1e9,
        gTag = -1,
        gInner = 0;
      const flush = () => {
        if (gTag < 0) return;
        const owner = gTag & 7;
        if (gHit >= 0) {
          if (gDepth > depth) {
            col = gHit;
            own = owner;
            depth = gDepth;
          }
        } else if (owner > 0 && gMin <= unit && gEdge > depth) {
          col = own === owner ? gInner : LINE;
          own = owner;
          depth = gEdge;
        }
      };
      for (let i = 0; i < scene.count; i++) {
        const o = i * STRIDE,
          tag = d[o + 7];
        if (tag !== gTag) {
          flush();
          gTag = tag;
          gInner = d[o + 11];
          gHit = -1;
          gMin = 1e9;
          gDepth = -1e9;
        }
        // Beyond one art pixel a primitive affects neither fill nor contour.
        const pad = Math.max(d[o + 4], d[o + 5]) + unit;
        if (
          x < Math.min(d[o], d[o + 2]) - pad ||
          x > Math.max(d[o], d[o + 2]) + pad ||
          y < Math.min(d[o + 1], d[o + 3]) - pad ||
          y > Math.max(d[o + 1], d[o + 3]) + pad
        )
          continue;
        const ex = d[o + 2] - d[o],
          ey = d[o + 3] - d[o + 1];
        const k = Math.max(
          0,
          Math.min(
            1,
            ((x - d[o]) * ex + (y - d[o + 1]) * ey) /
              Math.max(ex * ex + ey * ey, 1e-6),
          ),
        );
        const ox = x - d[o] - ex * k,
          oy = y - d[o + 1] - ey * k,
          r = d[o + 4] + (d[o + 5] - d[o + 4]) * k;
        const dist = Math.sqrt(ox * ox + oy * oy) - r,
          z = d[o + 8] + (d[o + 9] - d[o + 8]) * k;
        if (dist <= 0) {
          const surface = z + Math.sqrt(Math.max(0, r * r - ox * ox - oy * oy));
          if (!(tag & DEPTH_SORTED_GROUP) || surface >= gDepth) {
            gHit =
              ox * LIGHT[0] + oy * LIGHT[1] < -0.38 * r ? d[o + 10] : d[o + 6];
          }
          gDepth = Math.max(gDepth, surface);
        }
        if (dist < gMin) {
          gMin = dist;
          gEdge = z + 0.6 * r;
        }
      }
      flush();
      if (col >= 0) {
        const q = (py * grid + px) * 4;
        out[q] = col >> 16;
        out[q + 1] = (col >> 8) & 255;
        out[q + 2] = col & 255;
        out[q + 3] = 255;
      }
    }
  return out;
}
