/**
 * Five-heads-tall fighter in 3D. x = screen right, y = height above the mat, z = toward the viewer.
 * Limbs are anatomical (r/l), so right-handed technique rules survive any turn of the body.
 */
export type V2 = [number, number];
export type V3 = [number, number, number];
export const WORLD = 96;
/** Screen row of the mat at z = 0. */
export const GROUND = 86;
/** How far one unit of depth moves a point down the screen (slightly raised camera). */
const PITCH = 0.34;
const RAD = Math.PI / 180;
export const ANKLE = 1.7;
export const BONES = {
  TORSO: 15,
  SHOULDER: 12.5,
  THIGH: 11.6,
  SHIN: 11.1,
  UPPER_ARM: 9.4,
  FOREARM: 9.4,
  HIP_W: 2,
  SHOULDER_W: 3.8,
};

export type Side = "r" | "l";
export interface Pair<T> {
  r: T;
  l: T;
}
export const SIDES: Side[] = ["r", "l"];
/** +1 for the right side of the body. */
export const sign = (s: Side): 1 | -1 => (s === "r" ? 1 : -1);

export interface Pose {
  /** Pelvis: [x, height, depth]. */
  p: V3;
  /** 0 = facing screen right, 90 = facing the viewer, 180 = facing screen left. */
  yaw: number;
  /** Whole-body somersault, forward positive. */
  rot?: number;
  /** Whole-body tilt toward the fighter's own right. */
  roll?: number;
  /** Whole-body turn around the spine; positive lifts the right side when lying on the back. */
  spin?: number;
  lean?: number;
  head?: number;
  /** Planted ankles: [x, depth, height?]. */
  feet?: Pair<[number, number, number?]>;
  /** Free legs: [thigh, shin, outward?] degrees from straight down, forward positive. The shin never passes the thigh: knees only fold back. */
  legs?: Pair<[number, number, number?]>;
  /** 0 = right elbow hangs naturally, 1 = right elbow points to the sky. */
  elbowUp?: number;
}

export const add = (a: V3, b: V3, k = 1): V3 => [
  a[0] + b[0] * k,
  a[1] + b[1] * k,
  a[2] + b[2] * k,
];
export const sub = (a: V3, b: V3): V3 => add(a, b, -1);
export const dot = (a: V3, b: V3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const length = (a: V3): number => Math.sqrt(dot(a, a));
export const unit = (a: V3): V3 => {
  const n = length(a) || 1;
  return [a[0] / n, a[1] / n, a[2] / n];
};
export const lerp = (a: number, b: number, u: number): number =>
  a + (b - a) * u;
export const mix = (a: V3, b: V3, u: number): V3 => [
  lerp(a[0], b[0], u),
  lerp(a[1], b[1], u),
  lerp(a[2], b[2], u),
];
export const project = (v: V3): V2 => [v[0], GROUND - v[1] + v[2] * PITCH];

/** Two-bone IK bending toward `pole`. Unreachable targets are clamped so bones never stretch. */
export function ik(
  root: V3,
  target: V3,
  l1: number,
  l2: number,
  pole: V3,
): [V3, V3] {
  const to = sub(target, root),
    dir = unit(to);
  const m = Math.min(
    Math.max(length(to), Math.abs(l1 - l2) + 0.5),
    l1 + l2 - 0.01,
  );
  const cos = Math.max(
    -1,
    Math.min(1, (l1 * l1 + m * m - l2 * l2) / (2 * l1 * m)),
  );
  const bend = unit(add(pole, dir, -dot(pole, dir)));
  return [
    add(add(root, dir, cos * l1), bend, Math.sqrt(1 - cos * cos) * l1),
    add(root, dir, m),
  ];
}

export interface Limb {
  a: V3;
  b: V3;
  c: V3;
}
export interface Axes {
  F: V3;
  U: V3;
  R: V3;
}
export interface Body {
  pelvis: V3;
  neck: V3;
  head: V3;
  /** Chest axes: forward, up along the spine, toward own right. */
  F: V3;
  U: V3;
  R: V3;
  /** Pelvis axes: the hips take half of the spine's lean. */
  hip: Axes;
  /** Head axes. */
  look: V3;
  up: V3;
  shoulders: Pair<V3>;
  hips: Pair<V3>;
  legs: Pair<Limb>;
  /** Horizontal direction the toes point when planted. */
  toes: V3;
  elbowUp: number;
  /** Point on the trunk: along the spine, out toward the chest, sideways toward own right. */
  at: (along: number, out: number, side?: number) => V3;
}

const neg = (a: V3): V3 => [-a[0], -a[1], -a[2]];
/** Combine two axes: cos*a + sin*b. */
const turn = (a: V3, b: V3, deg: number): V3 =>
  add(
    [
      a[0] * Math.cos(deg * RAD),
      a[1] * Math.cos(deg * RAD),
      a[2] * Math.cos(deg * RAD),
    ],
    b,
    Math.sin(deg * RAD),
  );
/** Smallest rotation taking unit vector `a` to unit vector `b`, applied to `v`. */
export function carry(v: V3, a: V3, b: V3): V3 {
  const sum = add(a, b);
  return add(
    add(v, sum, -dot(sum, v) / Math.max(1 + dot(a, b), 0.05)),
    b,
    2 * dot(a, v),
  );
}

function rootAxes(pose: Pose): Axes & { F0: V3 } {
  const c = Math.cos(pose.yaw * RAD),
    s = Math.sin(pose.yaw * RAD);
  const F0: V3 = [c, 0, s],
    R0: V3 = [-s, 0, c],
    rot = pose.rot ?? 0,
    roll = pose.roll ?? 0,
    spin = pose.spin ?? 0;
  const F = turn(F0, [0, 1, 0], -rot),
    U0 = turn([0, 1, 0], F0, rot),
    R = turn(R0, U0, -roll);
  return {
    F0,
    F: turn(F, R, -spin),
    U: turn(U0, R0, roll),
    R: turn(R, F, spin),
  };
}
const leaned = (a: Axes, deg: number): Axes => ({
  U: turn(a.U, a.F, deg),
  F: turn(a.F, a.U, -deg),
  R: a.R,
});

/**
 * A knee is a hinge, so a leg is fully described by hip-to-ankle direction (in hip axes: forward,
 * down, right) and flexion (degrees, never negative). Blending these can never bend it sideways or backward.
 */
export interface LegState {
  dir: V3;
  flex: number;
}
const local = (a: Axes, v: V3): V3 => [dot(v, a.F), -dot(v, a.U), dot(v, a.R)];
const world = (a: Axes, v: V3): V3 =>
  add(
    add([a.F[0] * v[0], a.F[1] * v[0], a.F[2] * v[0]], a.U, -v[1]),
    a.R,
    v[2],
  );
export const reach = (flex: number): number =>
  Math.sqrt(
    BONES.THIGH ** 2 +
      BONES.SHIN ** 2 +
      2 * BONES.THIGH * BONES.SHIN * Math.cos(flex * RAD),
  );
export const MAX_REACH: number = reach(4);
/** Deepest knee bend allowed. */
export const MIN_REACH: number = reach(145);

export const pelvisAxes = (pose: Pose): Axes =>
  leaned(rootAxes(pose), (pose.lean ?? 0) * 0.5);
export const hipPoint = (pose: Pose, axes: Axes, s: Side): V3 =>
  add(pose.p, axes.R, BONES.HIP_W * sign(s));
export const footPoint = ([x, z, h = 0]: [number, number, number?]): V3 => [
  x,
  ANKLE + h,
  z,
];

/** Hip-relative leg state, whichever way the pose was authored. */
export function legState(pose: Pose, s: Side): LegState {
  const axes = pelvisAxes(pose);
  if (pose.feet) {
    const to = sub(footPoint(pose.feet[s]), hipPoint(pose, axes, s)),
      d = Math.max(MIN_REACH, Math.min(MAX_REACH, length(to)));
    const cos =
      (d * d - BONES.THIGH ** 2 - BONES.SHIN ** 2) /
      (2 * BONES.THIGH * BONES.SHIN);
    return {
      dir: local(axes, unit(to)),
      flex: Math.acos(Math.max(-1, Math.min(1, cos))) / RAD,
    };
  }
  const [thigh, shin, out = 0] = pose.legs![s],
    root = rootAxes(pose);
  const dir = (a: number) =>
    turn(turn(neg(root.U), root.F, a), root.R, out * sign(s));
  const to = add([0, 0, 0], dir(thigh), BONES.THIGH),
    ankle = add(to, dir(shin), BONES.SHIN);
  return { dir: local(axes, unit(ankle)), flex: Math.max(0, thigh - shin) };
}
export const ankleFrom = (pose: Pose, s: Side, leg: LegState): V3 => {
  const axes = pelvisAxes(pose);
  return add(
    hipPoint(pose, axes, s),
    world(axes, unit(leg.dir)),
    reach(leg.flex),
  );
};

/** What the collision solver may change. Everything else follows, so joints stay anatomical. */
export interface Offsets {
  root: V3;
  spine: V3;
  head: V3;
  ankle: Pair<V3>;
  elbow: Pair<V3>;
}
export const noOffsets = (): Offsets => ({
  root: [0, 0, 0],
  spine: [0, 0, 0],
  head: [0, 0, 0],
  ankle: { r: [0, 0, 0], l: [0, 0, 0] },
  elbow: { r: [0, 0, 0], l: [0, 0, 0] },
});

/** `loose` (0..1 per foot): how much a foot travels with the pelvis correction instead of staying on its spot. */
export function buildBody(
  pose: Pose,
  ankles: Pair<V3>,
  o: Offsets,
  loose: Pair<number>,
): Body {
  const root = rootAxes(pose),
    chest = leaned(root, pose.lean ?? 0),
    hip = pelvisAxes(pose);
  const pelvis = add(pose.p, o.root);
  const bent = unit(
    add(
      [
        chest.U[0] * BONES.TORSO,
        chest.U[1] * BONES.TORSO,
        chest.U[2] * BONES.TORSO,
      ],
      o.spine,
    ),
  );
  const F = unit(carry(chest.F, chest.U, bent)),
    R = unit(carry(chest.R, chest.U, bent)),
    U = bent;
  const at = (along: number, out: number, side = 0) =>
    add(add(add(pelvis, U, along), F, out), R, side);
  const neck = at(BONES.TORSO - 1, 0.3),
    h = pose.head ?? 0;
  const up0 = turn(U, F, h),
    look0 = turn(F, U, -h);
  const up = unit(add([up0[0] * 7.2, up0[1] * 7.2, up0[2] * 7.2], o.head)),
    look = unit(carry(look0, up0, up));
  const hips = {
    r: add(pelvis, hip.R, BONES.HIP_W),
    l: add(pelvis, hip.R, -BONES.HIP_W),
  };
  const leg = (s: Side): Limb => {
    const to = sub(add(add(ankles[s], o.ankle[s]), o.root, loose[s]), hips[s]),
      dir = unit(to),
      d = Math.max(MIN_REACH, Math.min(MAX_REACH, length(to)));
    // The kneecap faces wherever the hip carries it; it cannot flip to the other side.
    const [b, c] = ik(
      hips[s],
      add(hips[s], dir, d),
      BONES.THIGH,
      BONES.SHIN,
      carry(hip.F, neg(hip.U), dir),
    );
    return { a: hips[s], b, c };
  };
  return {
    pelvis,
    neck,
    head: add(neck, up, 7.2),
    F,
    U,
    R,
    hip,
    look,
    up,
    at,
    hips,
    toes: root.F0,
    elbowUp: pose.elbowUp ?? 0,
    shoulders: {
      r: at(BONES.SHOULDER, 0, BONES.SHOULDER_W),
      l: at(BONES.SHOULDER, 0, -BONES.SHOULDER_W),
    },
    legs: { r: leg("r"), l: leg("l") },
  };
}

export function solveArm(
  body: Body,
  side: Side,
  target: V3,
  push: V3 = [0, 0, 0],
  elbowGuide?: { direction: V3; weight: number },
): Limb {
  const a = body.shoulders[side],
    dir = unit(sub(target, a));
  // The elbow swings with the arm: behind when it hangs, below when it reaches forward, in front when it reaches overhead.
  const swing = add(
    [
      body.F[0] * dot(dir, body.U),
      body.F[1] * dot(dir, body.U),
      body.F[2] * dot(dir, body.U),
    ],
    body.U,
    -dot(dir, body.F),
  );
  const natural = unit(
    add(add(swing, body.R, 0.6 * sign(side)), body.U, -0.25),
  );
  const size = length(push),
    eased: V3 =
      size > 1.6
        ? [
            (push[0] * 1.6) / size,
            (push[1] * 1.6) / size,
            (push[2] * 1.6) / size,
          ]
        : push;
  const bend = side === "r" ? mix(natural, [0, 1, 0], body.elbowUp) : natural;
  const pole = add(
    elbowGuide ? mix(bend, elbowGuide.direction, elbowGuide.weight) : bend,
    eased,
  );
  const [b, c] = ik(a, target, BONES.UPPER_ARM, BONES.FOREARM, pole);
  return { a, b, c };
}
