/**
 * Tatami floor as its own layer, independent of the fighters: show it, hide it or swap it freely.
 * Perspective is tuned so that, at the fighters' feet, depth matches the rig camera.
 */
import { GROUND, WORLD } from "./rig.ts";
import { worldPoint } from "./camera.ts";
import type { CameraView } from "./camera.ts";

const HORIZON = 40,
  FLOOR_TOP = 62,
  TILE = 29,
  DIST = 135;
const MAIN = [
    [250, 178, 82],
    [238, 150, 50],
  ],
  BORDER = [
    [216, 92, 48],
    [204, 82, 42],
  ];
const SEAM_MAIN = [222, 136, 42],
  SEAM_BORDER = [180, 66, 34],
  EDGE = [140, 52, 34];

function tile(x: number, z: number): [number, number] {
  return [Math.floor((x - WORLD / 2) / TILE + 0.5), Math.floor(z / TILE)];
}
const isMain = ([i, j]: [number, number]) => Math.abs(i) <= 2 && j >= -3;

/** RGBA pixels, `wide` times the square frame horizontally. Transparent above the floor. */
export function renderMat(
  grid: number,
  wide = 1,
  view: CameraView = "front",
): Uint8Array {
  const w = grid * wide,
    unit = WORLD / grid,
    out = new Uint8Array(w * grid * 4),
    shift = ((wide - 1) * WORLD) / 2;
  const floorTile = (x: number, y: number) => {
    const s = (y - HORIZON) / (GROUND - HORIZON),
      point = worldPoint(
        [WORLD / 2 + (x - WORLD / 2) / s, 0, DIST - DIST / s + 6],
        view,
      );
    return tile(point[0], point[2]);
  };
  for (let py = 0; py < grid; py++) {
    const y = (py + 0.5) * unit;
    if (y < FLOOR_TOP) continue;
    for (let px = 0; px < w; px++) {
      const x = (px + 0.5) * unit - shift,
        t = floorTile(x, y),
        right = floorTile(x + unit, y),
        below = floorTile(x, y + unit);
      const main = isMain(t),
        seam = t[0] !== right[0] || t[1] !== below[1];
      const c =
        y < FLOOR_TOP + unit
          ? EDGE
          : seam
            ? main
              ? SEAM_MAIN
              : SEAM_BORDER
            : (main ? MAIN : BORDER)[(t[0] + t[1]) & 1];
      out.set([c[0], c[1], c[2], 255], (py * w + px) * 4);
    }
  }
  return out;
}

/** Paint `top` over a copy of `base` (both binary alpha). */
export function over(base: Uint8Array, top: Uint8Array): Uint8Array {
  const out = base.slice();
  for (let i = 3; i < top.length; i += 4)
    if (top[i]) out.set(top.subarray(i - 3, i + 1), i - 3);
  return out;
}
