import assert from "node:assert/strict";
import test from "node:test";
import { FORMATS, parseJob } from "../server/exporter";
import { over, renderMat } from "../src/core/mat";
import { rasterize } from "../src/core/raster";
import { CAMERA_VIEWS, cameraPoint, worldPoint } from "../src/core/camera";
import { BONES, SIDES, dot, length, sub } from "../src/core/rig";
import type { V3 } from "../src/core/rig";
import {
  DEPTH_SORTED_GROUP,
  STRIDE,
  buildScene,
  createScene,
  solve,
} from "../src/core/scene";
import { TECHNIQUES } from "../src/techniques/index";

const near = (a: number, b: number, m: string) =>
  assert.ok(Math.abs(a - b) < 1e-6, `${m}: ${a} != ${b}`);
const dist = (a: V3, b: V3) => length(sub(a, b));
const each = (duration: number, f: (t: number) => void) => {
  for (let t = 0; t < duration; t += 1 / 60) f(t);
};

for (const tech of TECHNIQUES) {
  test(`${tech.id}: bones never stretch`, () =>
    each(tech.duration, (t) => {
      const s = solve(tech, t);
      for (const arms of [s.toriArms, s.ukeArms])
        for (const k of SIDES) {
          near(dist(arms[k].a, arms[k].b), BONES.UPPER_ARM, "upper arm");
          near(dist(arms[k].b, arms[k].c), BONES.FOREARM, "forearm");
        }
      for (const b of [s.tori, s.uke])
        for (const k of SIDES) {
          near(dist(b.legs[k].a, b.legs[k].b), BONES.THIGH, "thigh");
          near(dist(b.legs[k].b, b.legs[k].c), BONES.SHIN, "shin");
        }
    }));

  test(`${tech.id}: head decorations use a rigid local frame`, () =>
    each(tech.duration, (t) => {
      const { tori, uke } = solve(tech, t);
      for (const { look, up, headRight } of [tori, uke]) {
        near(length(look), 1, "head forward length");
        near(length(up), 1, "head up length");
        near(length(headRight), 1, "head right length");
        near(dot(look, up), 0, "head forward and up");
        near(dot(look, headRight), 0, "head forward and right");
        near(dot(up, headRight), 0, "head up and right");
      }
    }));

  test(`${tech.id}: nobody sinks into the mat`, () =>
    each(tech.duration, (t) => {
      const s = solve(tech, t);
      for (const [who, b, arms] of [
        ["tori", s.tori, s.toriArms],
        ["uke", s.uke, s.ukeArms],
      ] as const) {
        const points: [string, V3][] = [
          ["pelvis", b.pelvis],
          ["head", b.head],
        ];
        for (const k of SIDES)
          points.push(
            [`${k} shoulder`, b.shoulders[k]],
            [`${k} knee`, b.legs[k].b],
            [`${k} ankle`, b.legs[k].c],
            [`${k} elbow`, arms[k].b],
            [`${k} hand`, arms[k].c],
          );
        for (const [name, p] of points)
          assert.ok(
            p[1] >= 0,
            `${who} ${name} at ${p[1].toFixed(1)}, t=${t.toFixed(2)}`,
          );
      }
    }));

  test(`${tech.id}: fighters stay inside the frame`, () =>
    each(tech.duration, (t) => {
      const n = 96,
        px = rasterize(buildScene(tech, t, createScene()), n);
      for (let i = 0; i < n; i++)
        for (const q of [i, (n - 1) * n + i, i * n, i * n + n - 1])
          assert.equal(
            px[q * 4 + 3],
            0,
            `clipped at t=${t.toFixed(2)} pixel ${q % n},${(q / n) | 0}`,
          );
    }));

  test(`${tech.id}: planted feet are reachable`, () => {
    for (const key of tech.keys)
      for (const [who, pose, body] of [
        ["tori", key.tori, solve(tech, key.t).tori],
        ["uke", key.uke, solve(tech, key.t).uke],
      ] as const) {
        if (!pose.feet) continue;
        for (const k of SIDES)
          if (!pose.feet[k][2]) {
            const want: V3 = [pose.feet[k][0], 1.7, pose.feet[k][1]],
              off = dist(body.legs[k].c, want);
            assert.ok(
              off < 1,
              `${who} ${k} foot misses by ${off.toFixed(1)} at t=${key.t}`,
            );
          }
      }
  });

  test(`${tech.id}: timeline is ordered and covers the loop`, () => {
    const ts = tech.keys.map((k) => k.t);
    assert.deepEqual(
      ts,
      [...ts].sort((a, b) => a - b),
    );
    assert.equal(ts[0], 0);
    assert.equal(ts.at(-1), tech.duration);
  });
}

test("tatami is a separate layer: transparent above the floor, never over the fighters", () => {
  const n = 96,
    floor = renderMat(n),
    fighters = rasterize(buildScene(TECHNIQUES[0], 0, createScene()), n),
    both = over(floor, fighters);
  assert.equal(floor[3], 0);
  assert.equal(floor[(n * n - 1) * 4 + 3], 255);
  for (let i = 0; i < fighters.length; i += 4)
    if (fighters[i + 3])
      assert.deepEqual(both.slice(i, i + 4), fighters.slice(i, i + 4));
});

test("camera views share technique data and rotate the rendered 3D scene", () => {
  const tech = TECHNIQUES.find((t) => t.id === "seoi-nage")!;
  const keys = structuredClone(tech.keys);
  const defaultFront = buildScene(tech, 1, createScene());
  const front = buildScene(tech, 1, createScene(), undefined, "front"),
    diagonal = buildScene(tech, 1, createScene(), undefined, "three-quarter"),
    side = buildScene(tech, 1, createScene(), undefined, "side");
  assert.ok(front.count > 0 && diagonal.count > 0 && side.count > 0);
  assert.deepEqual(front, defaultFront);
  assert.notDeepEqual(front.data, diagonal.data);
  assert.notDeepEqual(front.data, side.data);
  assert.deepEqual(cameraPoint([48, 12, 4], "front"), [48, 12, 4]);
  for (const view of CAMERA_VIEWS) {
    const original: V3 = [59, 12, -7],
      restored = worldPoint(cameraPoint(original, view), view);
    for (let axis = 0; axis < 3; axis++)
      assert.ok(Math.abs(original[axis]! - restored[axis]!) < 1e-10);
  }
  assert.deepEqual(tech.keys, keys);
});

test("fighters stay in frame in every camera view", () => {
  for (const tech of TECHNIQUES)
    for (const view of CAMERA_VIEWS)
      for (let time = 0; time < tech.duration; time += 1 / 30) {
        const scene = buildScene(tech, time, createScene(), undefined, view);
        for (let i = 0; i < scene.count; i++) {
          const o = i * STRIDE,
            r = Math.max(scene.data[o + 4]!, scene.data[o + 5]!);
          assert.ok(
            Math.min(scene.data[o]!, scene.data[o + 2]!) - r >= 0 &&
              Math.max(scene.data[o]!, scene.data[o + 2]!) + r <= 96 &&
              Math.min(scene.data[o + 1]!, scene.data[o + 3]!) - r >= 0 &&
              Math.max(scene.data[o + 1]!, scene.data[o + 3]!) + r <= 96,
            `${tech.id} clipped in ${view} at ${time.toFixed(2)}s`,
          );
        }
      }
});

test("mat uses the same camera view and front remains the default", () => {
  assert.deepEqual(renderMat(64), renderMat(64, 1, "front"));
  assert.notDeepEqual(renderMat(64), renderMat(64, 1, "side"));
});

test("export jobs reject anything outside the allow-list", () => {
  assert.equal(
    FORMATS.includes(parseJob({ technique: "seoi-nage" }).format),
    true,
  );
  assert.equal(parseJob({ technique: "seoi-nage", view: "side" }).view, "side");
  for (const bad of [
    { technique: "../x" },
    { technique: "seoi-nage", format: "exe" },
    { technique: "seoi-nage", size: 9999 },
    { technique: "seoi-nage", fps: 0 },
    { technique: "seoi-nage", view: "orbit" },
  ])
    assert.throws(() => parseJob(bad));
});

test("overlapping limb and head primitives keep the closest surface color", () => {
  const scene = createScene();
  const point = 48.75; // Centre of pixel 32 at a 64-pixel grid.
  const group = 16 + DEPTH_SORTED_GROUP + 1;
  const capsule = (color: number, depth: number, tag: number) => [
    point,
    point,
    point,
    point,
    4,
    4,
    color,
    tag,
    depth,
    depth,
    color,
    0,
  ];
  const hair = 0x2c2e46;
  scene.data.set(capsule(hair, 10, group));
  scene.data.set(capsule(0xf4c49a, 4, group), STRIDE);
  scene.data.set(capsule(0xa02c30, 8, 32 + DEPTH_SORTED_GROUP + 2), 2 * STRIDE);
  scene.count = 3;
  const pixels = rasterize(scene, 64);
  const pixel = (32 * 64 + 32) * 4;
  assert.deepEqual([...pixels.subarray(pixel, pixel + 4)], [44, 46, 70, 255]);
});
