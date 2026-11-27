/**
 * Contact solver. Keyframes say what the fighters intend; this pass works out where two solid bodies
 * and a solid mat actually allow them to be. It runs once per technique and stores corrections, so
 * playback cost is a table lookup. Deterministic: same technique, same result, on page and in export.
 */
import { assemble, mixOffsets, motionOf, shift, vectors } from "./motion";
import type { Intent, Solved } from "./motion";
import {
  ANKLE,
  BONES,
  MAX_REACH,
  SIDES,
  add,
  dot,
  length,
  noOffsets,
  sub,
  unit,
} from "./rig";
import type { Body, Limb, Offsets, Pair, Side, V3 } from "./rig";
import type { Technique } from "./types";

export type Part =
  | "torso"
  | "shoulders"
  | "head"
  | `${Side}${"Thigh" | "Shin" | "Upper" | "Fore"}`;
export interface Capsule {
  part: Part;
  a: V3;
  b: V3;
  r: number;
}

/** Solid core of each part. Cloth and flesh outside this may press together. */
const RADIUS = {
  torso: 3.3,
  shoulders: 1.9,
  head: 4,
  Thigh: 2.7,
  Shin: 2.1,
  Upper: 1.8,
  Fore: 1.5,
};

export function capsules(b: Body, arms: Pair<Limb>): Capsule[] {
  const out: Capsule[] = [
    {
      part: "torso",
      a: b.pelvis,
      b: b.at(BONES.SHOULDER - 0.8, 0),
      r: RADIUS.torso,
    },
    // The torso centreline does not cover the full width of the shoulder girdle.
    {
      part: "shoulders",
      a: b.shoulders.l,
      b: b.shoulders.r,
      r: RADIUS.shoulders,
    },
    { part: "head", a: b.head, b: b.head, r: RADIUS.head },
  ];
  for (const s of SIDES) {
    const l = b.legs[s],
      m = arms[s];
    out.push(
      { part: `${s}Thigh`, a: l.a, b: l.b, r: RADIUS.Thigh },
      { part: `${s}Shin`, a: l.b, b: l.c, r: RADIUS.Shin },
      { part: `${s}Upper`, a: m.a, b: m.b, r: RADIUS.Upper },
      // The gripping end of the forearm is meant to touch.
      {
        part: `${s}Fore`,
        a: m.b,
        b: add(m.b, sub(m.c, m.b), 0.5),
        r: RADIUS.Fore,
      },
    );
  }
  return out;
}

/** Closest points between two segments: parameters along each and the vector from B to A. */
export function closest(
  A: Pick<Capsule, "a" | "b">,
  B: Pick<Capsule, "a" | "b">,
): { s: number; t: number; d: V3; dist: number } {
  const u = sub(A.b, A.a),
    v = sub(B.b, B.a),
    w = sub(A.a, B.a);
  const a = dot(u, u),
    e = dot(v, v),
    b = dot(u, v),
    c = dot(u, w),
    f = dot(v, w),
    den = a * e - b * b;
  const cl = (x: number) => Math.max(0, Math.min(1, x));
  let s = a < 1e-9 ? 0 : den > 1e-9 ? cl((b * f - c * e) / den) : 0.5,
    t = e < 1e-9 ? 0 : (b * s + f) / e;
  if (t < 0 || t > 1) {
    t = cl(t);
    s = a < 1e-9 ? 0 : cl((b * t - c) / a);
  }
  const d = add(add(w, u, s), v, -t);
  return { s, t, d, dist: length(d) };
}

const isArm = (p: Part) => p.endsWith("Upper") || p.endsWith("Fore");
/** Arms wrap around the opponent on purpose; they only have to stay out of the trunk and head. */
export const collides = (a: Part, b: Part): boolean => {
  if (a === "shoulders" || b === "shoulders") return a === b;
  if (isArm(a) && isArm(b)) return false;
  if (isArm(a)) return b === "torso" || b === "head";
  if (isArm(b)) return a === "torso" || a === "head";
  return true;
};

/** Distance at which two parts touch. A gripping arm sinks into the loose jacket, so it gets some slack. */
export const contact = (A: Capsule, B: Capsule): number =>
  A.r + B.r - (isArm(A.part) || isArm(B.part) ? 1.2 : 0);
/** How far two capsules overlap beyond contact. */
export const overlap = (A: Capsule, B: Capsule): number =>
  contact(A, B) - closest(A, B).dist;

/** Move whatever can move so that the point `u` along `part` shifts by `d`. */
function push(o: Offsets, intent: Intent, part: Part, u: number, d: V3) {
  const side = part[0] as Side;
  if (part === "shoulders") {
    shift(o.spine, d, 0.55);
    shift(o.root, d, 0.25);
  } else if (part === "torso") {
    shift(o.root, d, 0.8);
    shift(o.spine, d, 0.35 * u);
  } else if (part === "head") {
    shift(o.head, d, 0.6);
    shift(o.spine, d, 0.3);
    shift(o.root, d, 0.15);
  } else if (isArm(part)) {
    const k = part.endsWith("Upper") ? u : 1 - u;
    shift(o.elbow[side], d, 0.25 * k);
    shift(o.root, d, 0.03);
    shift(o.spine, d, 0.04);
  } else {
    const along = part.endsWith("Thigh") ? 0.5 * u : 0.5 + 0.5 * u;
    // With the foot planted, moving the pelvis only helps high up the leg.
    if (intent.planted[side]) return shift(o.root, d, 0.6 * (1 - along));
    shift(o.root, d, 0.5 * (1 - along));
    shift(o.ankle[side], d, 0.9 * along);
  }
}

const heavy = (i: Intent) => 1 + (i.planted.r ? 1 : 0) + (i.planted.l ? 1 : 0);

function floor(o: Offsets, b: Body, arms: Pair<Limb>) {
  const up = (v: V3, h: number, k: number) => {
    if (h > 0) shift(v, [0, 1, 0], h * k);
  };
  up(o.root, 4.1 - b.pelvis[1], 0.8);
  up(o.head, 4.2 - b.head[1], 0.6);
  up(o.spine, 4.2 - b.head[1], 0.3);
  for (const s of SIDES) {
    up(o.spine, 2.8 - b.shoulders[s][1], 0.6);
    up(o.ankle[s], ANKLE - b.legs[s].c[1], 1);
    up(o.ankle[s], 2.6 - b.legs[s].b[1], 0.6);
    up(o.elbow[s], 1.6 - arms[s].b[1], 0.15);
  }
}

/** Planted feet stay on the mat and grips stay in reach. */
function hold(o: Offsets, intent: Intent, b: Body) {
  for (const s of SIDES)
    if (intent.planted[s]) {
      const want = add(intent.ankles[s], o.ankle[s]),
        to = sub(want, b.hips[s]),
        far = length(to) - MAX_REACH;
      if (far > 0) shift(o.root, unit(to), far * 0.8);
    }
}

type Normals = Map<string, V3>;

function relax(
  tech: Technique,
  t: number,
  it: Intent,
  iu: Intent,
  ot: Offsets,
  ou: Offsets,
  normals: Normals,
  iterations: number,
): Solved {
  let s = assemble(tech, t, it, iu, ot, ou);
  for (let n = 0; n < iterations; n++) {
    const A = capsules(s.tori, s.toriArms),
      B = capsules(s.uke, s.ukeArms),
      mt = heavy(it),
      mu = heavy(iu);
    for (const a of A)
      for (const b of B) {
        if (!collides(a.part, b.part)) continue;
        const c = closest(a, b),
          sum = contact(a, b);
        const key = `${a.part}|${b.part}`,
          last = normals.get(key);
        let normal = c.dist > 1e-4 ? unit(c.d) : (last ?? [0, 0, 1]),
          depth = sum - c.dist;
        // If the centre lines crossed since last time, the bodies went through each other: push back out.
        if (last && c.dist < sum && dot(normal, last) < -0.2) {
          normal = last;
          depth = sum + c.dist;
        } else if (n === iterations - 1 || !last) normals.set(key, normal);
        if (depth <= 0) continue;
        const k = 0.5 * depth;
        push(ot, it, a.part, c.s, [
          (normal[0] * k * mu) / (mt + mu),
          (normal[1] * k * mu) / (mt + mu),
          (normal[2] * k * mu) / (mt + mu),
        ]);
        push(ou, iu, b.part, c.t, [
          (-normal[0] * k * mt) / (mt + mu),
          (-normal[1] * k * mt) / (mt + mu),
          (-normal[2] * k * mt) / (mt + mu),
        ]);
      }
    // Own legs do not pass through each other either.
    for (const [caps, o, i] of [
      [A, ot, it],
      [B, ou, iu],
    ] as const) {
      for (const x of ["rShin", "rThigh"] as const)
        for (const y of ["lShin", "lThigh"] as const) {
          if (x === "rThigh" && y === "lThigh") continue;
          const p = caps.find((q) => q.part === x)!,
            q = caps.find((r) => r.part === y)!,
            c = closest(p, q),
            depth = (p.r + q.r) * 0.8 - c.dist;
          if (depth <= 0 || c.dist < 1e-4) continue;
          const d = unit(c.d);
          push(o, i, x, c.s, [
            d[0] * depth * 0.2,
            d[1] * depth * 0.2,
            d[2] * depth * 0.2,
          ]);
          push(o, i, y, c.t, [
            -d[0] * depth * 0.2,
            -d[1] * depth * 0.2,
            -d[2] * depth * 0.2,
          ]);
        }
    }
    // A taut grip drags the two bodies together.
    for (const side of SIDES) {
      const pull = sub(s.toriTargets[side], s.toriArms[side].c);
      if (length(pull) > (tech.slack ?? 0.3)) {
        shift(ot.root, pull, 0.06);
        shift(ot.spine, pull, 0.1);
        shift(ou.root, pull, -0.14);
      }
    }
    floor(ot, s.tori, s.toriArms);
    floor(ou, s.uke, s.ukeArms);
    hold(ot, it, s.tori);
    hold(ou, iu, s.uke);
    s = assemble(tech, t, it, iu, ot, ou);
  }
  // Standing on the mat has the last word.
  for (let n = 0; n < 3; n++) {
    hold(ot, it, s.tori);
    hold(ou, iu, s.uke);
    s = assemble(tech, t, it, iu, ot, ou);
  }
  return s;
}

const RATE = 60;
const copy = (o: Offsets) => mixOffsets(o, o, 0);
interface Bake {
  tori: Offsets[];
  uke: Offsets[];
}
const bakes = new WeakMap<Technique, Bake>();

/** Gaussian smoothing over time, so corrections ease in instead of popping. */
function smooth(frames: Offsets[], radius: number): Offsets[] {
  const src = frames.map(vectors);
  return frames.map((f, i) => {
    const out = copy(f);
    vectors(out).forEach((v, k) => {
      let w = 0;
      const acc: V3 = [0, 0, 0];
      for (let j = -radius; j <= radius; j++) {
        const q = Math.max(0, Math.min(frames.length - 1, i + j)),
          g = Math.exp(-2 * (j / radius) ** 2);
        w += g;
        shift(acc, src[q][k], g);
      }
      v[0] = acc[0] / w;
      v[1] = acc[1] / w;
      v[2] = acc[2] / w;
    });
    return out;
  });
}

export function bake(tech: Technique): Bake {
  let b = bakes.get(tech);
  if (b) return b;
  const m = motionOf(tech),
    count = Math.round(tech.duration * RATE) + 1,
    normals: Normals = new Map();
  let tori: Offsets[] = [],
    uke: Offsets[] = [],
    ot = noOffsets(),
    ou = noOffsets();
  for (let i = 0; i < count; i++) {
    const t = Math.min(i / RATE, tech.duration - 1e-6),
      it = m.tori(t),
      iu = m.uke(t);
    // Corrections fade as the intent clears the obstacle.
    for (const v of [...vectors(ot), ...vectors(ou)]) {
      v[0] *= 0.93;
      v[1] *= 0.93;
      v[2] *= 0.93;
    }
    for (const s of SIDES) {
      if (it.planted[s]) ot.ankle[s].fill(0);
      if (iu.planted[s]) ou.ankle[s].fill(0);
    }
    relax(tech, t, it, iu, ot, ou, normals, 14);
    tori.push(copy(ot));
    uke.push(copy(ou));
  }
  for (const [radius, iterations] of [
    [5, 8],
    [3, 4],
    [2, 0],
  ]) {
    tori = smooth(tori, radius);
    uke = smooth(uke, radius);
    if (iterations) {
      normals.clear();
      for (let i = 0; i < count; i++) {
        const t = Math.min(i / RATE, tech.duration - 1e-6);
        relax(
          tech,
          t,
          m.tori(t),
          m.uke(t),
          tori[i],
          uke[i],
          normals,
          iterations,
        );
      }
    }
  }
  bakes.set(tech, (b = { tori, uke }));
  return b;
}

/** Final, physically admissible state at time `t`. */
export function solve(tech: Technique, t: number): Solved {
  const b = bake(tech),
    m = motionOf(tech),
    f = Math.max(0, Math.min(b.tori.length - 1.001, t * RATE)),
    i = Math.floor(f),
    u = f - i;
  return assemble(
    tech,
    t,
    m.tori(t),
    m.uke(t),
    mixOffsets(b.tori[i], b.tori[i + 1], u),
    mixOffsets(b.uke[i], b.uke[i + 1], u),
  );
}
