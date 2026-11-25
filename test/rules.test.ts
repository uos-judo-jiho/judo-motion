/** Right-handed judo rules every technique must obey. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { SIDES, dot, length, sub, unit } from '../src/core/rig.ts';
import type { Limb, V3 } from '../src/core/rig.ts';
import { capsules, closest, contact } from '../src/core/physics.ts';
import { solve } from '../src/core/scene.ts';
import type { Technique } from '../src/core/scene.ts';
import { findTechnique, TECHNIQUES, variantsOf } from '../src/techniques/index.ts';

const dist = (a: V3, b: V3) => length(sub(a, b));
const bend = (l: Limb) => (Math.acos(Math.max(-1, Math.min(1, dot(unit(sub(l.a, l.b)), unit(sub(l.c, l.b)))))) * 180) / Math.PI;
const phase = (t: Technique, name: string) => t.phases.find((p) => p.name === name)!.t;
const steps = (from: number, to: number, f: (t: number) => void) => { for (let t = from; t <= to; t += 1 / 60) f(t); };
const along = (p: V3, l: Limb) => Math.min(...[0, 0.25, 0.5, 0.75, 1].flatMap((u) => [[l.a, l.b], [l.b, l.c]].map(([a, b]) => dist(p, [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]))));

for (const tech of TECHNIQUES) {
  const kake = phase(tech, '걸기');

  test(`${tech.id}: right hand starts on the lapel, left on the sleeve`, () => {
    const s = solve(tech, 0);
    assert.ok(dist(s.toriArms.r.c, s.uke.at(10, 3.3, -1.4)) < 2, 'right hand on lapel');
    assert.ok(along(s.toriArms.l.c, s.ukeArms.r) < 2.5, 'left hand on right sleeve');
    steps(0, tech.impact.t, (t) => {
      const q = solve(tech, t);
      assert.ok(along(q.toriArms.l.c, q.ukeArms.r) < 4, `left hand off the sleeve at ${t.toFixed(2)}`);
      const lapel = q.uke.at(10, 3.3, -1.4), gap = dist(q.toriArms.r.c, lapel);
      assert.ok(gap < (tech.slack ? 9 : 5), `right hand ${gap.toFixed(1)} from the lapel at ${t.toFixed(2)}`);
    });
    for (const k of tech.keys) if (k.t < tech.impact.t) { assert.equal(k.toriGrip.l, 'sleeve'); assert.ok(['lapel', 'collar'].includes(k.toriGrip.r)); }
  });

  test(`${tech.id}: attacks within two steps, no shuffling`, () => {
    // Spells during which each of tori's feet is travelling, up to the throw.
    const spells = (k: 'r' | 'l', to: number) => {
      const out: [number, number][] = [];
      let on = -1, p = solve(tech, 0).tori.legs[k].c;
      for (let t = 1 / 120; t < to; t += 1 / 120) {
        const c = solve(tech, t).tori.legs[k].c, moving = dist(c, p) * 120 > 10;
        if (moving && on < 0) on = t;
        if (!moving && on >= 0) { out.push([on, t]); on = -1; }
        p = c;
      }
      if (on >= 0) out.push([on, to]);
      // Swinging in and reaping back is one attack, not two steps.
      return out.reduce<[number, number][]>((m, x) => { const last = m.at(-1); if (last && x[0] - last[1] < 0.05) last[1] = x[1]; else m.push([...x]); return m; }, []);
    };
    const r = spells('r', kake + 0.1), l = spells('l', kake + 0.1);
    assert.equal(l.length, 1, `left foot moves once: ${JSON.stringify(l)}`);
    if (tech.draws) { assert.equal(r.length, 1, 'one entry with the right'); return; }
    assert.ok(r.length <= 2, `right foot enters, then attacks: ${JSON.stringify(r)}`);
    assert.ok(l[0][0] - r[0][1] < 0.06, `left follows at once, waited ${(l[0][0] - r[0][1]).toFixed(2)}`);
    // Uchi-mata sweeps off the planted left foot, so it may start exactly on landing; the others must overlap.
    const slack = tech.id === 'uchi-mata' ? 0.03 : -0.04;
    if (r.length > 1) assert.ok(r[1][0] <= l[0][1] + slack, `attack must start while the left follows: right ${r[1][0].toFixed(2)}, left lands ${l[0][1].toFixed(2)}`);
  });

  test(`${tech.id}: after the throw ${tech.keepsLapel ? 'the left hand keeps' : 'both hands hold'} uke's right sleeve`, () => {
    const s = solve(tech, tech.duration - 0.01);
    for (const k of tech.keepsLapel ? (['l'] as const) : SIDES) assert.ok(along(s.toriArms[k].c, s.ukeArms.r) < 2.5, `${k} hand`);
  });

  test(`${tech.id}: right foot enters first, rear foot follows, uke is not dragged`, () => {
    const from = tech.draws ? phase(tech, '들어가기') : 0, start = solve(tech, from), moved: Partial<Record<'r' | 'l', number>> = {};
    // A drawn technique is a single entry with the right foot; the rear foot may follow during the throw.
    steps(from, tech.draws ? tech.impact.t : kake, (t) => {
      const s = solve(tech, t);
      for (const k of SIDES) {
        moved[k] ??= dist(s.tori.legs[k].c, start.tori.legs[k].c) > 3 ? t : undefined;
        if (t <= kake) assert.ok(dist(s.uke.legs[k].c, start.uke.legs[k].c) < 4, `uke ${k} foot moved at ${t.toFixed(2)}`);
      }
    });
    assert.ok(moved.r! + 0.05 < moved.l!, `right ${moved.r} before left ${moved.l}`);
    // Tori closes the distance instead of pulling uke over.
    const s = solve(tech, kake);
    assert.ok(Math.abs(s.tori.pelvis[0] - start.tori.pelvis[0]) > 3 * Math.abs(s.uke.pelvis[0] - start.uke.pelvis[0]));
  });

  if (tech.ukemi === 'back') test(`${tech.id}: uke lands in a back breakfall`, () => {
    const { uke, ukeArms } = solve(tech, tech.impact.t);
    assert.ok(Math.abs(uke.shoulders.r[1] - uke.shoulders.l[1]) < 1 && Math.abs(uke.hips.r[1] - uke.hips.l[1]) < 1, 'flat on the back');
    assert.ok(uke.F[1] > 0.9, 'chest faces up');
    assert.ok(uke.head[1] > uke.shoulders.r[1] + 1, 'chin tucked, head off the mat');
    for (const k of SIDES) {
      assert.ok(ukeArms[k].c[1] < 5, `${k} hand strikes the mat: ${ukeArms[k].c[1].toFixed(1)}`);
      assert.ok(uke.legs[k].c[1] > 10, `${k} leg stays up: ${uke.legs[k].c[1].toFixed(1)}`);
    }
  });
  else test(`${tech.id}: uke ends in a side breakfall`, () => {
    const { uke } = solve(tech, tech.duration - 0.01);
    assert.ok(bend(uke.legs.l) > 170, `left leg straight: ${bend(uke.legs.l)}`);
    assert.ok(Math.abs(bend(uke.legs.r) - 90) < 3, `right knee 90: ${bend(uke.legs.r)}`);
    assert.ok(uke.hips.r[1] > uke.hips.l[1], 'rolled onto the left side');
  });
}

test('osoto-gari: tori reaps uke\'s right leg with the right leg', () => {
  const tech = findTechnique('osoto-gari')!;
  let best = Infinity, touching = 0;
  steps(phase(tech, '걸기'), tech.impact.t, (t) => {
    const s = solve(tech, t), A = capsules(s.tori, s.toriArms), B = capsules(s.uke, s.ukeArms);
    let gap = Infinity;
    for (const a of A) for (const b of B) if (/^r(Thigh|Shin)$/.test(a.part) && /^r(Thigh|Shin)$/.test(b.part)) gap = Math.min(gap, closest(a, b).dist - contact(a, b));
    best = Math.min(best, gap); if (gap < 1.5) touching++;
  });
  assert.ok(best < 0.5 && touching > 8, `closest ${best.toFixed(1)}, frames in contact ${touching}`);
  const end = solve(tech, tech.impact.t), begin = solve(tech, phase(tech, '걸기'));
  assert.ok(dist(end.tori.legs.l.c, begin.tori.legs.l.c) < 1, 'left leg is the support');
});

test('seoi-nage: feet are parallel, side by side, on a diagonal', () => {
  const tech = findTechnique('seoi-nage')!, { tori } = solve(tech, phase(tech, '걸기')), [r, l] = [tori.legs.r.c, tori.legs.l.c];
  const line = unit([r[0] - l[0], 0, r[2] - l[2]]);
  assert.ok(Math.abs(dot(line, tori.toes)) < 0.1, 'neither foot leads');
  assert.ok(Math.abs(bend(tori.legs.r) - bend(tori.legs.l)) < 12, 'weight shared by both knees');
  assert.ok(Math.abs(tori.toes[2]) > 0.3 && Math.abs(tori.toes[0]) > 0.3, 'diagonal to uke');
});

test('uchi-mata: deep right step, elbow to the sky, right leg sweeps', () => {
  const tech = findTechnique('uchi-mata')!;
  const deep = solve(tech, 0.72);
  assert.ok(deep.tori.legs.r.c[0] < deep.uke.legs.r.c[0] + 3, 'right foot reaches uke\'s feet');
  steps(phase(tech, '걸기'), 1.26, (t) => { const { toriArms: a } = solve(tech, t); assert.ok(a.r.b[1] > Math.max(a.r.a[1], a.r.c[1]), `elbow above hand and shoulder at ${t.toFixed(2)}`); });
  const s = solve(tech, 1.26);
  assert.ok(s.tori.legs.r.c[1] > 25 && s.tori.legs.l.c[1] < 3);
});

for (const tech of variantsOf('ko-uchi-gari')) test(`${tech.id}: the right sole reaps uke's right heel from the inside`, () => {
  const kake = phase(tech, '걸기'), s = solve(tech, kake);
  const foot = s.tori.legs.r.c, heel = s.uke.legs.r.c, other = s.uke.legs.l.c;
  assert.ok(foot[2] < heel[2] && foot[2] > other[2], 'between uke\'s legs');
  assert.ok(foot[0] < heel[0] - 2, 'behind the heel');
  assert.ok(foot[1] < 4 && heel[1] < 4, 'low on the mat');
  assert.ok(dist(foot, heel) < 7, `foot ${dist(foot, heel).toFixed(1)} from the heel`);
  const later = solve(tech, kake + 0.25);
  assert.ok(later.uke.legs.r.c[0] > heel[0] + 5, 'heel swept toward uke\'s toes');
  assert.ok(later.tori.legs.r.c[0] < later.uke.legs.r.c[0], 'reaping foot stays behind it');
  assert.ok(later.uke.pelvis[0] < s.uke.pelvis[0] - 2, 'uke sits back');
});

test('ko-uchi-gari-v1: uke\'s rear foot follows the draw while the right foot takes the weight', () => {
  const tech = findTechnique('ko-uchi-gari-v1')!, a = solve(tech, 0), b = solve(tech, phase(tech, '들어가기'));
  assert.ok(b.uke.legs.l.c[0] > a.uke.legs.l.c[0] + 3 && dist(b.uke.legs.r.c, a.uke.legs.r.c) < 1);
});

test('ko-uchi-gari-v2: uke stands still while tori walks in', () => {
  const tech = findTechnique('ko-uchi-gari-v2')!, a = solve(tech, 0);
  steps(0, phase(tech, '걸기') - 0.02, (t) => { const s = solve(tech, t); for (const k of SIDES) assert.ok(dist(s.uke.legs[k].c, a.uke.legs[k].c) < 1.5, `${k} foot at ${t.toFixed(2)}`); });
});

test('a base id resolves to its variants', () => {
  assert.equal(findTechnique('ko-uchi-gari')!.id, 'ko-uchi-gari-v1');
  assert.deepEqual(variantsOf('ko-uchi-gari').map((t) => t.variant!.name), ['v1', 'v2']);
  assert.equal(new Set(TECHNIQUES.map((t) => t.id)).size, TECHNIQUES.length);
});

test('tomoe-nage: right foot deep between uke\'s feet, left sole on the belly, over the head', () => {
  const tech = findTechnique('tomoe-nage')!, kake = phase(tech, '걸기'), s = solve(tech, kake);
  const pivot = s.tori.legs.r.c, feet = SIDES.map((k) => s.uke.legs[k].c);
  assert.ok(pivot[2] < Math.max(...feet.map((f) => f[2])) && pivot[2] > Math.min(...feet.map((f) => f[2])), 'between uke\'s feet');
  assert.ok(pivot[0] < s.uke.legs.r.c[0] + 5, 'deep');
  // The left sole supports uke's belly while uke is lifted.
  steps(0.8, 1.02, (t) => { const q = solve(tech, t), gap = dist(q.tori.legs.l.c, q.uke.at(3, 3.3)); assert.ok(gap < 6, `sole ${gap.toFixed(1)} from the belly at ${t.toFixed(2)}`); });
  const top = solve(tech, 1.08);
  assert.ok(top.tori.pelvis[1] < 7 && top.tori.F[1] > 0.8, 'tori lies on the back');
  assert.ok(top.uke.pelvis[1] > 25, 'uke is carried overhead');
  const end = solve(tech, tech.impact.t);
  assert.ok(end.uke.pelvis[0] > end.tori.head[0] + 10, 'uke lands beyond tori\'s head');
});
