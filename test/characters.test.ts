import assert from "node:assert/strict";
import test from "node:test";
import { parseJob } from "../server/exporter.ts";
import {
  CHARACTERS,
  GIS,
  castSuffix,
  resolveCast,
} from "../src/characters/index.ts";
import { rasterize } from "../src/core/raster.ts";
import {
  MAX_PRIMS,
  STRIDE,
  buildScene,
  createScene,
} from "../src/core/scene.ts";
import { TECHNIQUES } from "../src/techniques/index.ts";

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
