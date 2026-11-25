/** Technique data + time -> list of drawing primitives. Pure, shared by GPU and CPU renderers. */
import { DEFAULT_CAST } from '../characters/index.ts';
import type { Cast } from '../characters/index.ts';
import { drawHead } from '../characters/head.ts';
import { DUST, IMPACT, LINE } from './palette.ts';
import { solve } from './physics.ts';
import { GROUND, SIDES, WORLD, add, mix, project, unit } from './rig.ts';
import type { Limb, V2, V3 } from './rig.ts';
import type { Technique } from './types.ts';

export type { Grip, Key, Phase, Technique } from './types.ts';
export { solve } from './physics.ts';

/** Flat layout, 12 floats each: ax ay bx by | ra rb colour owner+8*group | za zb (depth) shade inner-line. Colours are 24-bit ints. */
export const STRIDE = 12;
export const MAX_PRIMS = 112;
export interface Scene { data: Float32Array; count: number; dissolve: number }
export const createScene = (): Scene => ({ data: new Float32Array(MAX_PRIMS * STRIDE), count: 0, dissolve: 0 });

const depthOf = (l: Limb) => (l.a[2] + l.b[2] + l.c[2]) / 3;

export function buildScene(tech: Technique, time: number, out: Scene, cast: Cast = DEFAULT_CAST): Scene {
  const t = ((time % tech.duration) + tech.duration) % tech.duration;
  const s = solve(tech, t);
  const { scale, center } = tech.camera ?? { scale: 1, center: WORLD / 2 };
  let n = 0, tag = 0, bias = 0, inner = LINE;
  const put2 = (a: V2, b: V2, ra: number, rb: number, col: number, shade: number = col, za = -99, zb = za) => {
    if (n >= MAX_PRIMS) throw new Error('MAX_PRIMS exceeded');
    // Fine details (eyes, lapels) keep their size so they do not drop out between pixels.
    const x = (v: number) => WORLD / 2 + (v - center) * scale, y = (v: number) => GROUND + (v - GROUND) * scale, r = (v: number) => Math.max(v * scale, Math.min(v, 0.6));
    out.data.set([x(a[0]), y(a[1]), x(b[0]), y(b[1]), r(ra), r(rb), col, tag, za * scale, zb * scale, shade, inner], n++ * STRIDE);
  };
  const put = (a: V3, b: V3, ra: number, rb: number, col: number, shade?: number) => put2(project(a), project(b), ra, rb, col, shade, a[2] + bias, b[2] + bias);
  const ball = (p: V3, r: number, col: number, shade?: number) => put(p, p, r, r, col, shade);

  // Impact, drawn behind the fighters: dust skims the mat while short sparks burst outward.
  const k = (t - tech.impact.t) / 0.32;
  if (k >= 0 && k < 1) {
    tag = 0;
    const e = 1 - (1 - k) ** 2, [gx, gy] = project([tech.impact.x, 0, tech.impact.z ?? 0]);
    for (const side of [-1, 1]) {
      for (let j = 0; j < 3; j++) {
        const p: V2 = [gx + side * (9 + j * 3 + e * (6 + j * 2)), gy - 1 - j * 1.2 - e * (1 + j * 2)];
        put2(p, p, (2.4 - j * 0.5) * (1 - k), (2.4 - j * 0.5) * (1 - k), DUST);
      }
      const ang = side * (0.95 + 0.1 * e), r0 = 14 + e * 9, r1 = r0 + 5 * (1 - k);
      put2([gx + Math.sin(ang) * r0, gy - 4 - Math.cos(ang) * r0], [gx + Math.sin(ang) * r1, gy - 4 - Math.cos(ang) * r1], 0.8, 0.5, IMPACT);
    }
  }

  // Each part is one contour group. Occlusion is decided per pixel by depth; sorting only settles contour ties.
  const parts: { z: number; owner: number; inner: number; draw: () => void }[] = [];
  for (const owner of [1, 2]) {
    const body = owner === 1 ? s.tori : s.uke, arms = owner === 1 ? s.toriArms : s.ukeArms, fighter = owner === 1 ? cast.tori : cast.uke;
    const { character: who, gi: wear } = fighter, [cloth, clothD] = wear.cloth, [paw, pawD] = who.paws ?? who.skin, B = (r: number) => r * (who.bulk ?? 1);
    const mid = (body.pelvis[2] + body.neck[2]) / 2;
    const part = (z: number, draw: () => void) => parts.push({ z, owner, inner: wear.inner, draw });
    for (const side of SIDES) {
      const arm = arms[side], az = depthOf(arm), armFar = az < depthOf(arms[side === 'r' ? 'l' : 'r']) - 1.5;
      part(az, () => {
        bias = 0.8; // sleeves lie on top of the cloth they grip
        const gi = armFar ? clothD : cloth, skin = armFar ? pawD : paw, cuff = mix(arm.b, arm.c, 0.62);
        put(cuff, arm.c, 1.35, 1.3, skin);
        put(arm.a, arm.b, B(2.5), B(2.1), gi, clothD);
        put(arm.b, cuff, B(2.1), B(2.2), gi, clothD);
        ball(arm.c, 1.7, skin);
      });
      const leg = body.legs[side], lz = depthOf(leg), legFar = lz < depthOf(body.legs[side === 'r' ? 'l' : 'r']) - 1.2;
      part(lz - 0.4, () => {
        bias = -0.4;
        const gi = legFar ? clothD : cloth, skin = legFar ? pawD : paw, hem = mix(leg.b, leg.c, 0.78);
        // The foot lies flat near the mat and otherwise points along the front of the shin.
        const shin = unit(add(leg.c, leg.b, -1));
        const flat = Math.max(0, Math.min(1, (7 - leg.c[1]) / 3)) * Math.max(0, -shin[1]);
        const free = unit(add([shin[0] * 0.7, shin[1] * 0.7, shin[2] * 0.7], body.F, 0.5));
        const toe = mix(free, [body.toes[0], -0.1, body.toes[2]], flat);
        put(hem, leg.c, 1.5, 1.4, skin);
        put(leg.c, add(leg.c, toe, 3.2), 1.5, 1.2, skin);
        put(leg.a, leg.b, B(3.4), B(2.8), gi, clothD);
        put(leg.b, hem, B(2.8), B(2.7), gi, clothD);
      });
    }
    part(mid, () => {
      bias = 0;
      const { at, shoulders, hips } = body, facing = body.F[2];
      if (who.tail) {
        const lift = (p: V3): V3 => [p[0], Math.max(1.4, p[1]), p[2]], [a, b, c] = [at(-1, -2.5), lift(at(-2.5, -5.5)), lift(at(0.5, -7))];
        put(a, b, 1.1, 1.1, who.skin[0], who.skin[1]); put(b, c, 1.1, 0.9, who.skin[0], who.skin[1]);
      }
      put(body.neck, add(body.neck, body.up, 2.5), 1.7, 1.7, who.skin[1]);
      put(shoulders.l, shoulders.r, B(2.5), B(2.5), cloth, clothD);
      put(at(12, -0.2, -1), at(4, 0, -0.6), B(3.4), B(3.5), cloth, clothD);
      put(at(12, -0.2, 1), at(4, 0, 0.6), B(3.4), B(3.5), cloth, clothD);
      put(at(4, 0), at(-1.2, 0.2), B(3.6), B(3.6), cloth, clothD);
      put(hips.l, hips.r, B(3.6), B(3.6), cloth, clothD);
      if (facing > -0.35) {
        put(at(14, 1.4, 1.6), at(5, 3, -1.2), 0.6, 0.6, wear.inner);
        if (facing > 0.4) put(at(14, 1.4, -1.6), at(8, 3, 0.4), 0.6, 0.6, wear.inner);
      }
      // Belt: perpendicular to the spine as seen on screen.
      const [cx, cy] = project(at(3.6, 0)), [ux, uy] = project(at(6, 0)), len = Math.hypot(ux - cx, uy - cy) || 1;
      const bx = (-(uy - cy) / len) * B(3.3), by = ((ux - cx) / len) * B(3.3);
      put2([cx - bx, cy - by], [cx + bx, cy + by], 1, 1, who.belt, who.belt, at(3.6, 0)[2]);
      if (facing > -0.35) {
        put(at(3.2, 3.2, 0), at(-0.6, 4.2, 1.2), 0.7, 0.7, who.belt);
        if (facing > 0.4) put(at(3.2, 3.2, 0), at(-0.6, 4.2, -1.2), 0.7, 0.7, who.belt);
      }
    });
    part(body.head[2] + 0.6, () => {
      bias = 0.6;
      drawHead({ put, ball }, body, who, LINE);
    });
  }
  parts.sort((a, b) => a.z - b.z).forEach((p, i) => { tag = p.owner + 8 * (i + 1); inner = p.inner; p.draw(); });

  out.count = n;
  out.dissolve = Math.max(0, (t - (tech.duration - 0.25)) / 0.25);
  return out;
}
