import assert from "node:assert/strict";
import test from "node:test";
import { drawHead } from "../src/characters/head";
import type { Pen } from "../src/characters/head";
import { CAMERA_VIEWS } from "../src/core/camera";
import { LINE } from "../src/core/palette";
import { parseJob } from "../server/exporter";
import {
  CHARACTERS,
  GIS,
  castSuffix,
  resolveCast,
} from "../src/characters/index";
import { rasterize } from "../src/core/raster";
import {
  MAX_PRIMS,
  STRIDE,
  buildScene,
  createScene,
  solve,
} from "../src/core/scene";
import { TECHNIQUES, findTechnique } from "../src/techniques/index";

for (const c of CHARACTERS)
  test(`${c.id}: works in every technique, in frame, in both roles`, () => {
    const n = 64;
    for (const tech of TECHNIQUES)
      for (const cast of [
        resolveCast({ tori: c.id }),
        resolveCast({ uke: c.id }),
      ])
        for (let t = 0; t < tech.duration; t += 0.07) {
          const scene = buildScene(tech, t, createScene(), cast);
          assert.ok(scene.count <= MAX_PRIMS);
          const px = rasterize(scene, n);
          for (let i = 0; i < n; i++)
            for (const q of [i, (n - 1) * n + i, i * n, i * n + n - 1])
              assert.equal(
                px[q * 4 + 3],
                0,
                `${tech.id} clipped at ${t.toFixed(2)}`,
              );
        }
  });

test("every character looks different", () => {
  const seen = new Map<string, string>();
  for (const c of CHARACTERS) {
    const key = Buffer.from(
      rasterize(
        buildScene(
          TECHNIQUES[0],
          0,
          createScene(),
          resolveCast({ tori: c.id }),
        ),
        96,
      ),
    ).toString("base64");
    assert.ok(!seen.has(key), `${c.id} equals ${seen.get(key)}`);
    seen.set(key, c.id);
  }
});

test("characters stay within what the contact solver assumes", () => {
  for (const c of CHARACTERS)
    assert.ok((c.bulk ?? 1) >= 0.9 && (c.bulk ?? 1) <= 1.1, c.id);
  assert.equal(new Set(CHARACTERS.map((c) => c.id)).size, CHARACTERS.length);
});

test("looks never change the motion", () => {
  // The first fighter part is the same capsule whoever wears it, up to thickness.
  const ends = (ids: Parameters<typeof resolveCast>[0]) => {
    const s = buildScene(TECHNIQUES[0], 0.9, createScene(), resolveCast(ids)),
      out: number[] = [];
    for (let i = 0; i < 4; i++)
      out.push(...s.data.subarray(i * STRIDE, i * STRIDE + 4));
    return out;
  };
  assert.deepEqual(
    ends({}),
    ends({ tori: "bear", uke: "robot", toriGi: "black", ukeGi: "red" }),
  );
});

test("export accepts known looks, rejects others, and names files apart", () => {
  const job = parseJob({
    technique: "seoi-nage",
    tori: "bear",
    uke: "cat",
    toriGi: "black",
  });
  assert.equal(castSuffix(job.cast), "-bear_black-vs-cat");
  assert.equal(castSuffix(parseJob({ technique: "seoi-nage" }).cast), "");
  for (const bad of [{ tori: "../x" }, { uke: "nobody" }, { toriGi: "plaid" }])
    assert.throws(() => parseJob({ technique: "seoi-nage", ...bad }));
  assert.ok(GIS.length >= 2);
});

test("turning the camera preserves the world-space hair strokes", () => {
  const { tori } = solve(TECHNIQUES[0], 0);
  for (const character of CHARACTERS) {
    if (!["short", "ponytail", "bun", "curly"].includes(character.head))
      continue;
    const strokes = CAMERA_VIEWS.map((view) => {
      const hair: unknown[] = [];
      const put: Pen["put"] = (...stroke) => {
        if (character.hair.includes(stroke[4])) hair.push(stroke);
      };
      const ball: Pen["ball"] = (p, r, color, shade) =>
        put(p, p, r, r, color, shade);
      drawHead({ put, ball }, tori, character, LINE, view);
      return hair;
    });
    assert.ok(strokes[0].length > 0, character.id);
    assert.deepEqual(strokes[1], strokes[0], character.id);
    assert.deepEqual(strokes[2], strokes[0], character.id);
  }
});

test("brown hair stays visible across all camera presets in the opening pose", () => {
  const cast = resolveCast({ tori: "brown", uke: "robot" });
  const hair = cast.tori.character.hair;
  for (const view of CAMERA_VIEWS) {
    const frame = buildScene(TECHNIQUES[0], 0, createScene(), cast, view);
    const pixels = rasterize(frame, 128);
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const rgb = (pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2];
      if (pixels[i + 3] && hair.includes(rgb)) count++;
    }
    assert.ok(count >= 45, `${view}: ${count} visible hair pixels`);
  }
});

test("uchi-mata keeps tori's navy hair visible throughout kake in side view", () => {
  const cast = resolveCast({
    tori: "navy",
    uke: "curly",
    toriGi: "blue",
    ukeGi: "red",
  });
  const tech = findTechnique("uchi-mata")!;
  const start = tech.phases.find(({ name }) => name === "걸기")!.t;
  const end = tech.phases.find(({ name }) => name === "낙법")!.t;
  for (let time = start; time < end; time += 1 / 60) {
    const pixels = rasterize(
      buildScene(tech, time, createScene(), cast, "side"),
      128,
    );
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const rgb = (pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2];
      if (pixels[i + 3] && cast.tori.character.hair.includes(rgb)) count++;
    }
    assert.ok(count >= 30, `${time.toFixed(3)}: ${count} visible hair pixels`);
  }
});
