import { WORLD } from "./rig";
import type { V3 } from "./rig";

export const CAMERA_VIEWS = ["front", "three-quarter", "side"] as const;
export type CameraView = (typeof CAMERA_VIEWS)[number];

const ANGLES: Record<CameraView, number> = {
  front: 0,
  "three-quarter": 35,
  side: 90,
};
// The side view pans upward slightly so grounded poses stay inside the square frame.
const DEPTH_OFFSETS: Record<CameraView, number> = {
  front: 0,
  "three-quarter": 0,
  side: -10,
};

export const isCameraView = (view: string): view is CameraView =>
  CAMERA_VIEWS.some((id) => id === view);

export function cameraPoint(p: V3, view: CameraView): V3 {
  if (view === "front") return p;
  const angle = (ANGLES[view] * Math.PI) / 180,
    cos = Math.cos(angle),
    sin = Math.sin(angle),
    x = p[0] - WORLD / 2;
  return [
    WORLD / 2 + x * cos - p[2] * sin,
    p[1],
    x * sin + p[2] * cos + DEPTH_OFFSETS[view],
  ];
}

export function worldPoint(p: V3, view: CameraView): V3 {
  if (view === "front") return p;
  const angle = (ANGLES[view] * Math.PI) / 180,
    cos = Math.cos(angle),
    sin = Math.sin(angle),
    x = p[0] - WORLD / 2,
    z = p[2] - DEPTH_OFFSETS[view];
  return [WORLD / 2 + x * cos + z * sin, p[1], -x * sin + z * cos];
}

export function cameraDirection(v: V3, view: CameraView): V3 {
  if (view === "front") return v;
  const angle = (ANGLES[view] * Math.PI) / 180,
    cos = Math.cos(angle),
    sin = Math.sin(angle);
  return [v[0] * cos - v[2] * sin, v[1], v[0] * sin + v[2] * cos];
}
