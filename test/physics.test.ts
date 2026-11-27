/** Bodies are solid, knees are hinges, motion is continuous. Checked between baked frames too. */
import assert from "node:assert/strict";
import test from "node:test";
import { capsules, closest, collides, overlap } from "../src/core/physics";
import { SIDES, carry, dot, length, sub, unit } from "../src/core/rig";
import type { V3 } from "../src/core/rig";
import { solve } from "../src/core/scene";
import { TECHNIQUES, findTechnique } from "../src/techniques/index";

const each = (duration: number, f: (t: number) => void) => {
  for (let t = 0; t < duration; t += 1 / 144) f(t);
};
const neg = (v: V3): V3 => [-v[0], -v[1], -v[2]];

for (const tech of TECHNIQUES) {
  test(`${tech.id}: fighters never pass through each other`, () =>
    each(tech.duration, (t) => {
      const s = solve(tech, t);
      for (const a of capsules(s.tori, s.toriArms))
        for (const b of capsules(s.uke, s.ukeArms))
          if (collides(a.part, b.part)) {
            const d = overlap(a, b);
            assert.ok(
              d < 1.5,
              `tori ${a.part} into uke ${b.part} by ${d.toFixed(2)} at ${t.toFixed(2)}`,
            );
          }
    }));

  test(`${tech.id}: knees only fold the way knees fold`, () =>
    each(tech.duration, (t) => {
      const s = solve(tech, t);
      for (const [who, b] of [
        ["tori", s.tori],
        ["uke", s.uke],
      ] as const)
        for (const k of SIDES) {
          const l = b.legs[k],
            thigh = unit(sub(l.b, l.a)),
            shin = unit(sub(l.c, l.b)),
            flex = (Math.acos(Math.min(1, dot(thigh, shin))) * 180) / Math.PI;
          assert.ok(flex <= 146, `${who} ${k} knee folded ${flex.toFixed(0)}`);
          if (flex < 8) continue;
          const kneecap = carry(b.hip.F, neg(b.hip.U), unit(sub(l.c, l.a)));
          assert.ok(
            dot(unit(sub(thigh, shin)), unit(kneecap)) > 0.95,
            `${who} ${k} knee bent off its hinge at ${t.toFixed(2)}`,
          );
        }
    }));

  test(`${tech.id}: hips stay in human range`, () =>
    each(tech.duration, (t) => {
      const s = solve(tech, t);
      for (const [who, b] of [
        ["tori", s.tori],
        ["uke", s.uke],
      ] as const)
        for (const k of SIDES) {
          const l = b.legs[k],
            thigh = unit(sub(l.b, l.a)),
            swing =
              (Math.atan2(dot(thigh, b.hip.F), -dot(thigh, b.hip.U)) * 180) /
              Math.PI;
          assert.ok(
            swing > -75 && swing < 130,
            `${who} ${k} hip at ${swing.toFixed(0)} degrees, t=${t.toFixed(2)}`,
          );
        }
    }));

  const impact = tech.impact;
  if (impact)
    test(`${tech.id}: uke is on the mat at impact and stays there`, () =>
      each(tech.duration, (t) => {
        if (t < impact.t) return;
        const { uke } = solve(tech, t);
        assert.ok(
          uke.pelvis[1] < 6.5 && uke.shoulders.l[1] < 7,
          `pelvis ${uke.pelvis[1].toFixed(1)}, shoulder ${uke.shoulders.l[1].toFixed(1)} at ${t.toFixed(2)}`,
        );
      }));

  test(`${tech.id}: arms never bend behind the back`, () =>
    each(tech.duration, (t) => {
      const s = solve(tech, t);
      for (const [who, b, arms] of [
        ["tori", s.tori, s.toriArms],
        ["uke", s.uke, s.ukeArms],
      ] as const)
        for (const k of SIDES) {
          const upper = unit(sub(arms[k].b, arms[k].a)),
            forward = dot(upper, b.F),
            up = dot(upper, b.U);
          // Uchi-mata's raised elbow reaches back to the collar on purpose.
          if (k === "r" && b.elbowUp > 0.1) continue;
          // A hanging arm may trail back; one at shoulder height or above may not.
          assert.ok(
            forward > (up < -0.3 ? -0.9 : -0.7),
            `${who} ${k} upper arm behind the back (forward ${forward.toFixed(2)}, up ${up.toFixed(2)}) at ${t.toFixed(2)}`,
          );
        }
    }));

  test(`${tech.id}: elbows stay continuous between baked frames`, () => {
    let previous = solve(tech, 0);
    each(tech.duration, (t) => {
      const current = solve(tech, t);
      for (const who of ["toriArms", "ukeArms"] as const)
        for (const side of SIDES) {
          const travel = length(
            sub(current[who][side].b, previous[who][side].b),
          );
          assert.ok(
            travel < 3,
            `${who} ${side} elbow moves ${travel.toFixed(2)} at ${t.toFixed(3)}s`,
          );
        }
      previous = current;
    });
  });

  test(`${tech.id}: nothing teleports`, () => {
    let prev = solve(tech, 0);
    for (let t = 1 / 60; t < tech.duration; t += 1 / 60) {
      const s = solve(tech, t);
      for (const who of ["tori", "uke"] as const) {
        const a = prev[who],
          b = s[who];
        for (const [name, p, q, max] of [
          ["pelvis", a.pelvis, b.pelvis, 3.5],
          ["head", a.head, b.head, 5],
          ["r foot", a.legs.r.c, b.legs.r.c, 6.5],
          ["l foot", a.legs.l.c, b.legs.l.c, 6.5],
          ["r knee", a.legs.r.b, b.legs.r.b, 5],
          ["l knee", a.legs.l.b, b.legs.l.b, 5],
        ] as [string, V3, V3, number][])
          assert.ok(
            length(sub(q, p)) < max,
            `${who} ${name} jumps ${length(sub(q, p)).toFixed(1)} at ${t.toFixed(2)}`,
          );
      }
      prev = s;
    }
  });
}

test("seoi-nage keeps the shoulder lines apart during the turnover", () => {
  const tech = findTechnique("seoi-nage")!;
  for (let t = 1.22; t <= 1.5; t += 1 / 144) {
    const { tori, uke } = solve(tech, t);
    const { dist } = closest(
      { a: tori.shoulders.l, b: tori.shoulders.r },
      { a: uke.shoulders.l, b: uke.shoulders.r },
    );
    assert.ok(
      dist > 3.4,
      `shoulder clearance ${dist.toFixed(2)} at ${t.toFixed(3)}s`,
    );
  }
});
