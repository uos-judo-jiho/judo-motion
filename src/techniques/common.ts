import type { Pair, Pose, V3 } from "../core/rig.ts";
import type { Grip, Key } from "../core/scene.ts";

type Foot = [number, number, number?];
export const feet = (r: Foot, l: Foot): Pair<Foot> => ({ r, l });
export const grip = (r: Grip, l: Grip): Pair<Grip> => ({ r, l });

/** Right-handed standard grip: right hand on the lapel, left hand on the sleeve. */
export const KUMI: Pair<Grip> = grip("lapel", "sleeve");
/** Same grip while turned in: the right hand folds in with the collar, the left keeps pulling the sleeve. */
export const TURNED: Pair<Grip> = grip("collar", "sleeve");
/** Uchi-mata: right hand stays high on the lapel (pair with elbowUp), left pulls the sleeve. */
export const HIGH: Pair<Grip> = grip("lapel", "sleeve");
/** After the throw the right hand leaves the lapel and joins the left on the sleeve. */
export const FINISH: Pair<Grip> = grip("cuff", "sleeve");
/** Uke while the right arm is being pulled over tori. */
export const CARRIED: Pair<Grip> = grip("drawn", "rest");
/** Uke on the mat: right arm held up by tori, left arm breaks the fall. */
export const FALLEN: Pair<Grip> = grip("held", "slap");

/** Both in right posture (right foot forward), tori on the right of the screen, so uke's right side faces the viewer. */
export const ukeStand = (x: number): Pose => ({
  p: [x, 23.3, 0],
  yaw: 10,
  lean: 3,
  feet: feet([x + 4, 3], [x - 3, -3]),
});
export const toriStand = (x: number): Pose => ({
  p: [x, 23, 0],
  yaw: 170,
  lean: 4,
  feet: feet([x - 4, -3], [x + 4, 3]),
});

export const opening = (uke: Pose, toriX: number): Key[] => {
  const tori = toriStand(toriX),
    grips = { toriGrip: KUMI, ukeGrip: KUMI };
  return [
    { t: 0, tori, uke, ...grips },
    { t: 0.15, tori, uke, ...grips },
  ];
};

/**
 * Side breakfall (yoko-ukemi) after a right-handed throw: rolled onto the left side, left leg
 * straight, right knee bent 90 degrees. `settle` 0 = first contact, legs still high; 1 = at rest.
 */
export const sideFall = (
  p: V3,
  yaw: number,
  rot: 270 | -90,
  settle: number,
): Pose => {
  const lift = 16 * (1 - settle);
  return {
    p,
    yaw,
    rot,
    spin: 16,
    head: 16,
    legs: { r: [52 + lift, -38 + lift, 4], l: [8 + lift, 4 + lift, 6] },
  };
};

/**
 * Back breakfall (ushiro-ukemi): flat on the back, chin tucked, legs up. Pair with SLAP at impact.
 * `settle` 0 = first contact, both legs high; 1 = at rest, left knee up, right leg lowered.
 */
export const backFall = (p: V3, yaw: number, settle: number): Pose => {
  const at = (high: number, rest: number) => high + (rest - high) * settle;
  return {
    p,
    yaw,
    rot: -90,
    head: 30,
    legs: { r: [at(48, 22), at(26, 2), 24], l: [at(66, 56), at(34, -34), 24] },
  };
};
/** Both arms strike the mat. */
export const SLAP: Pair<Grip> = grip("slap", "slap");
