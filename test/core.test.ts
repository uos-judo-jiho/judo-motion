import assert from 'node:assert/strict';
import test from 'node:test';
import { FORMATS, parseJob } from '../server/exporter.ts';
import { over, renderMat } from '../src/core/mat.ts';
import { rasterize } from '../src/core/raster.ts';
import { BONES, SIDES, length, sub } from '../src/core/rig.ts';
import type { V3 } from '../src/core/rig.ts';
import { buildScene, createScene, solve } from '../src/core/scene.ts';
import { TECHNIQUES } from '../src/techniques/index.ts';

const near = (a: number, b: number, m: string) => assert.ok(Math.abs(a - b) < 1e-6, `${m}: ${a} != ${b}`);
const dist = (a: V3, b: V3) => length(sub(a, b));
const each = (duration: number, f: (t: number) => void) => { for (let t = 0; t < duration; t += 1 / 60) f(t); };

for (const tech of TECHNIQUES) {
  test(`${tech.id}: bones never stretch`, () => each(tech.duration, (t) => {
    const s = solve(tech, t);
    for (const arms of [s.toriArms, s.ukeArms]) for (const k of SIDES) { near(dist(arms[k].a, arms[k].b), BONES.UPPER_ARM, 'upper arm'); near(dist(arms[k].b, arms[k].c), BONES.FOREARM, 'forearm'); }
    for (const b of [s.tori, s.uke]) for (const k of SIDES) { near(dist(b.legs[k].a, b.legs[k].b), BONES.THIGH, 'thigh'); near(dist(b.legs[k].b, b.legs[k].c), BONES.SHIN, 'shin'); }
  }));

  test(`${tech.id}: nobody sinks into the mat`, () => each(tech.duration, (t) => {
    const s = solve(tech, t);
    for (const [who, b, arms] of [['tori', s.tori, s.toriArms], ['uke', s.uke, s.ukeArms]] as const) {
      const points: [string, V3][] = [['pelvis', b.pelvis], ['head', b.head]];
      for (const k of SIDES) points.push([`${k} shoulder`, b.shoulders[k]], [`${k} knee`, b.legs[k].b], [`${k} ankle`, b.legs[k].c], [`${k} elbow`, arms[k].b], [`${k} hand`, arms[k].c]);
      for (const [name, p] of points) assert.ok(p[1] >= 0, `${who} ${name} at ${p[1].toFixed(1)}, t=${t.toFixed(2)}`);
    }
  }));

  test(`${tech.id}: fighters stay inside the frame`, () => each(tech.duration, (t) => {
    const n = 96, px = rasterize(buildScene(tech, t, createScene()), n);
    for (let i = 0; i < n; i++) for (const q of [i, (n - 1) * n + i, i * n, i * n + n - 1]) assert.equal(px[q * 4 + 3], 0, `clipped at t=${t.toFixed(2)} pixel ${q % n},${(q / n) | 0}`);
  }));

  test(`${tech.id}: planted feet are reachable`, () => {
    for (const key of tech.keys) for (const [who, pose, body] of [['tori', key.tori, solve(tech, key.t).tori], ['uke', key.uke, solve(tech, key.t).uke]] as const) {
      if (!pose.feet) continue;
      for (const k of SIDES) if (!pose.feet[k][2]) {
        const want: V3 = [pose.feet[k][0], 1.7, pose.feet[k][1]], off = dist(body.legs[k].c, want);
        assert.ok(off < 1, `${who} ${k} foot misses by ${off.toFixed(1)} at t=${key.t}`);
      }
    }
  });

  test(`${tech.id}: timeline is ordered and covers the loop`, () => {
    const ts = tech.keys.map((k) => k.t);
    assert.deepEqual(ts, [...ts].sort((a, b) => a - b));
    assert.equal(ts[0], 0); assert.equal(ts.at(-1), tech.duration);
  });
}

test('tatami is a separate layer: transparent above the floor, never over the fighters', () => {
  const n = 96, floor = renderMat(n), fighters = rasterize(buildScene(TECHNIQUES[0], 0, createScene()), n), both = over(floor, fighters);
  assert.equal(floor[3], 0);
  assert.equal(floor[(n * n - 1) * 4 + 3], 255);
  for (let i = 0; i < fighters.length; i += 4) if (fighters[i + 3]) assert.deepEqual(both.slice(i, i + 4), fighters.slice(i, i + 4));
});

test('export jobs reject anything outside the allow-list', () => {
  assert.equal(FORMATS.includes(parseJob({ technique: 'seoi-nage' }).format), true);
  for (const bad of [{ technique: '../x' }, { technique: 'seoi-nage', format: 'exe' }, { technique: 'seoi-nage', size: 9999 }, { technique: 'seoi-nage', fps: 0 }]) assert.throws(() => parseJob(bad));
});
