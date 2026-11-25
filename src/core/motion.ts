/** Keyframes -> smooth intended poses. Velocity is continuous through keys; nothing stops and restarts. */
import {
  add,
  ankleFrom,
  buildBody,
  footPoint,
  legState,
  mix,
  noOffsets,
  sign,
  solveArm,
} from "./rig.ts";
import type { Body, Limb, Offsets, Pair, Pose, Side, V3 } from "./rig.ts";
import type { Grip, Technique } from "./types.ts";

const CHANNELS = [
  "yaw",
  "rot",
  "roll",
  "spin",
  "lean",
  "head",
  "elbowUp",
] as const;

/** Monotone cubic (PCHIP): passes through every key without overshoot, holds still between equal keys. */
function curve(ts: number[], ys: number[], hits: boolean[]) {
  const n = ts.length,
    s: number[] = [],
    into: number[] = [],
    out: number[] = [];
  for (let i = 0; i < n - 1; i++)
    s.push((ys[i + 1] - ys[i]) / (ts[i + 1] - ts[i]));
  for (let i = 0; i < n; i++) {
    const a = s[i - 1],
      b = s[i];
    let m = 0;
    if (i > 0 && i < n - 1 && a * b > 0) {
      const h0 = ts[i] - ts[i - 1],
        h1 = ts[i + 1] - ts[i],
        w0 = 2 * h1 + h0,
        w1 = h1 + 2 * h0;
      m = (w0 + w1) / (w0 / a + w1 / b);
    }
    // A hit arrives at speed and stops dead, like a body meeting the mat.
    into.push(hits[i] && i > 0 ? a * 1.2 : m);
    out.push(hits[i] ? 0 : m);
  }
  return (t: number) => {
    let i = 0;
    while (i < n - 2 && t >= ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i],
      u = Math.max(0, Math.min(1, (t - ts[i]) / h)),
      u2 = u * u,
      u3 = u2 * u;
    return (
      (2 * u3 - 3 * u2 + 1) * ys[i] +
      (u3 - 2 * u2 + u) * h * out[i] +
      (3 * u2 - 2 * u3) * ys[i + 1] +
      (u3 - u2) * h * into[i + 1]
    );
  };
}

export interface Intent {
  pose: Pose;
  ankles: Pair<V3>;
  planted: Pair<boolean>;
  loose: Pair<number>;
}

function track(
  ts: number[],
  poses: Pose[],
  hits: boolean[],
): (t: number) => Intent {
  const c = (f: (p: Pose) => number) => curve(ts, poses.map(f), hits);
  const xyz = (f: (p: Pose) => V3) => {
    const k = [0, 1, 2].map((i) => c((p) => f(p)[i]));
    return (t: number): V3 => [k[0](t), k[1](t), k[2](t)];
  };
  const p = xyz((q) => q.p),
    ch = CHANNELS.map((k) => [k, c((q) => q[k] ?? 0)] as const);
  const legs = (s: Side) => ({
    dir: xyz((q) => legState(q, s).dir),
    flex: c((q) => legState(q, s).flex),
    foot: xyz((q) =>
      q.feet ? footPoint(q.feet[s]) : ankleFrom(q, s, legState(q, s)),
    ),
  });
  const tracks = { r: legs("r"), l: legs("l") };
  const stillAt = (t: number, s: Side) => {
    let i = 0;
    while (i < ts.length - 2 && t >= ts[i + 1]) i++;
    const a = poses[i].feet?.[s],
      b = poses[i + 1].feet?.[s];
    return !!a && !!b && a[0] === b[0] && a[1] === b[1] && !a[2] && !b[2];
  };
  return (t) => {
    let i = 0;
    while (i < ts.length - 2 && t >= ts[i + 1]) i++;
    const a = poses[i],
      b = poses[i + 1];
    const pose = {
      p: p(t),
      ...Object.fromEntries(ch.map(([k, f]) => [k, f(t)])),
    } as unknown as Pose;
    const ankle = (s: Side): V3 =>
      a.feet && b.feet
        ? tracks[s].foot(t)
        : ankleFrom(pose, s, {
            dir: tracks[s].dir(t),
            flex: Math.max(0, tracks[s].flex(t)),
          });
    const still = (s: Side) => stillAt(t, s);
    // A foot leaves and rejoins the mat gradually, never moving while it is planted.
    const loose = (s: Side) =>
      still(s)
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              i > 0 && stillAt(ts[i] - 1e-6, s) ? (t - ts[i]) / 0.1 : 1,
              i < ts.length - 2 && stillAt(ts[i + 1] + 1e-6, s)
                ? (ts[i + 1] - t) / 0.1
                : 1,
            ),
          );
    return {
      pose,
      ankles: { r: ankle("r"), l: ankle("l") },
      planted: { r: still("r"), l: still("l") },
      loose: { r: loose("r"), l: loose("l") },
    };
  };
}

export interface Motion {
  tori(t: number): Intent;
  uke(t: number): Intent;
}
const motions = new WeakMap<Technique, Motion>();
export function motionOf(tech: Technique): Motion {
  let m = motions.get(tech);
  if (!m) {
    const ts = tech.keys.map((k) => k.t),
      hits = tech.keys.map((k) => !!k.hit),
      none = hits.map(() => false);
    motions.set(
      tech,
      (m = {
        tori: track(
          ts,
          tech.keys.map((k) => k.tori),
          none,
        ),
        uke: track(
          ts,
          tech.keys.map((k) => k.uke),
          hits,
        ),
      }),
    );
  }
  return m;
}

function gripPoint(
  g: Grip,
  side: Side,
  self: Body,
  other: Body,
  otherArms?: Pair<Limb>,
): V3 {
  const k = sign(side),
    opposite = otherArms?.[side === "r" ? "l" : "r"];
  switch (g) {
    case "lapel":
      return other.at(10, 3.6, -1.4 * k);
    case "collar":
      return mix(other.at(11, 3.3, -1.4 * k), self.at(11, 4, 3 * k), 0.35);
    case "sleeve":
      return opposite
        ? mix(opposite.b, opposite.c, 0.12)
        : other.at(10, 4, -4.5 * k);
    case "cuff":
      return otherArms
        ? mix(otherArms.r.b, otherArms.r.c, 0.6)
        : other.at(8, 5);
    case "drawn":
      return other.at(7.5, 6, 1);
    case "held":
      return other.at(5, 7);
    case "beside":
      return other.at(20, 20, -2);
    case "rest":
      return self.at(-2, 1, 6.5 * k);
    case "slap":
      return self.at(-5, 0.3, 7 * k);
  }
}

export interface Solved {
  tori: Body;
  uke: Body;
  toriArms: Pair<Limb>;
  ukeArms: Pair<Limb>;
  toriTargets: Pair<V3>;
}

/** Bodies and arms for the intended pose plus the solver's corrections. */
export function assemble(
  tech: Technique,
  t: number,
  it: Intent,
  iu: Intent,
  ot: Offsets = noOffsets(),
  ou: Offsets = noOffsets(),
): Solved {
  const tori = buildBody(it.pose, it.ankles, ot, it.loose),
    uke = buildBody(iu.pose, iu.ankles, ou, iu.loose),
    keys = tech.keys;
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1].t) i++;
  const a = keys[i],
    b = keys[i + 1],
    x = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))),
    u = x * x * (3 - 2 * x);
  const target = (
    from: Grip,
    to: Grip,
    s: Side,
    self: Body,
    other: Body,
    arms?: Pair<Limb>,
  ) =>
    from === to
      ? gripPoint(from, s, self, other, arms)
      : mix(
          gripPoint(from, s, self, other, arms),
          gripPoint(to, s, self, other, arms),
          u,
        );
  const ukeArm = (s: Side, arms?: Pair<Limb>) =>
    solveArm(
      uke,
      s,
      target(a.ukeGrip[s], b.ukeGrip[s], s, uke, tori, arms),
      ou.elbow[s],
    );
  // Tori grips uke's right arm, which never depends on tori's arms; uke's left then grips tori's right.
  const right = ukeArm("r"),
    first = { r: right, l: ukeArm("l") };
  const toriTargets = {
    r: target(a.toriGrip.r, b.toriGrip.r, "r", tori, uke, first),
    l: target(a.toriGrip.l, b.toriGrip.l, "l", tori, uke, first),
  };
  const toriArms = {
    r: solveArm(tori, "r", toriTargets.r, ot.elbow.r),
    l: solveArm(tori, "l", toriTargets.l, ot.elbow.l),
  };
  return {
    tori,
    uke,
    toriArms,
    toriTargets,
    ukeArms: { r: right, l: ukeArm("l", toriArms) },
  };
}

/** Linear blend of two correction sets. */
export function mixOffsets(a: Offsets, b: Offsets, u: number): Offsets {
  const pair = (x: Pair<V3>, y: Pair<V3>) => ({
    r: mix(x.r, y.r, u),
    l: mix(x.l, y.l, u),
  });
  return {
    root: mix(a.root, b.root, u),
    spine: mix(a.spine, b.spine, u),
    head: mix(a.head, b.head, u),
    ankle: pair(a.ankle, b.ankle),
    elbow: pair(a.elbow, b.elbow),
  };
}
/** Visit every correction vector. */
export function vectors(o: Offsets): V3[] {
  return [o.root, o.spine, o.head, o.ankle.r, o.ankle.l, o.elbow.r, o.elbow.l];
}
export function shift(v: V3, d: V3, k: number): void {
  const n = add(v, d, k);
  v[0] = n[0];
  v[1] = n[1];
  v[2] = n[2];
}
