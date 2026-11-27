/** The public ids, the data behind them and the published entry points must agree. */
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { CHARACTERS, GIS } from "../src/characters/index";
import { CHARACTER_IDS, GI_IDS, TECHNIQUE_IDS } from "../src/ids";
import {
  JudoMotion,
  TECHNIQUES as INFO,
  TECHNIQUE_CATEGORIES,
  TECHNIQUE_CATALOG,
  TECHNIQUE_STATUS,
  getTechniqueInfo,
  isCharacter,
  isGi,
  isTechnique,
} from "../src/react";
import { TECHNIQUES, variantsOf } from "../src/techniques/index";

test("every public id has data, in order", () => {
  assert.deepEqual(
    TECHNIQUES.map((t) => t.id),
    [...TECHNIQUE_IDS],
  );
  assert.deepEqual(
    CHARACTERS.map((c) => c.id),
    [...CHARACTER_IDS],
  );
  assert.deepEqual(
    GIS.map((g) => g.id),
    [...GI_IDS],
  );
  assert.equal(INFO.length, TECHNIQUES.length);
  assert.ok(!("keys" in INFO[0]!), "keyframes stay internal");
});

test("guards accept ids and base names only", () => {
  assert.ok(isTechnique("seoi-nage") && isTechnique("ko-uchi-gari"));
  assert.ok(!isTechnique("nope") && !isCharacter("nope") && !isGi("nope"));
  assert.ok(isCharacter("bear") && isGi("black"));
});

test("public lookup resolves playable IDs and aliases like the renderer", () => {
  for (const expected of INFO) {
    assert.deepEqual(getTechniqueInfo(expected.id), expected);
  }
  assert.equal(getTechniqueInfo("ko-uchi-gari")?.id, "ko-uchi-gari-v1");
  assert.equal(
    getTechniqueInfo("ko-uchi-gari-v2")?.variant?.label,
    "들어가서 걸기",
  );
  assert.equal(getTechniqueInfo("osoto-gari")?.canonicalId, "o-soto-gari");
  assert.equal(getTechniqueInfo("o-soto-gari"), undefined);
  assert.equal(getTechniqueInfo("ippon-seoi-nage"), undefined);
  assert.equal(getTechniqueInfo("unknown"), undefined);
});

test("renders on the server with dashed attributes and a reserved box", () => {
  const html = renderToString(
    createElement(JudoMotion, {
      technique: "seoi-nage",
      view: "side",
      tori: "bear",
      toriGi: "black",
      mat: true,
      paused: false,
      className: "size-48",
    }),
  );
  assert.match(html, /^<judo-motion /);
  assert.match(html, /technique="seoi-nage"/);
  assert.match(html, /view="side"/);
  assert.match(html, /tori-gi="black"/);
  assert.match(html, /class="size-48"/);
  assert.match(html, /aspect-ratio:1/);
  assert.ok(!/width:/.test(html), "a class decides the width");
  const bare = renderToString(
    createElement(JudoMotion, { technique: "seoi-nage" }),
  );
  assert.match(bare, /width:96px/);
  assert.match(html, / mat=""/);
  assert.ok(!html.includes("paused"), html);
  assert.ok(!html.includes("uke"), html);
});

test("playable techniques expose their category without changing group or kind", () => {
  assert.deepEqual(
    INFO.map(({ id, category, group, kind }) => [id, category, group, kind]),
    [
      ["seoi-nage", "te-waza", "손기술", "throw"],
      ["uchi-mata", "ashi-waza", "발기술", "throw"],
      ["osoto-gari", "ashi-waza", "발기술", "throw"],
      ["ko-uchi-gari-v1", "ashi-waza", "발기술", "throw"],
      ["ko-uchi-gari-v2", "ashi-waza", "발기술", "throw"],
      ["tomoe-nage", "ma-sutemi-waza", "누우며메치기", "throw"],
      ["kesa-gatame", "osaekomi-waza", "누르기", "osaekomi"],
    ],
  );
  assert.equal(
    new Set(variantsOf("ko-uchi-gari").map((t) => t.canonicalId)).size,
    1,
  );
  assert.ok(!isTechnique("ippon-seoi-nage"));
});

test("every category exposes its Kodokan classification path", () => {
  const paths = Object.entries(TECHNIQUE_CATEGORIES).map(([key, category]) => {
    assert.equal(key, category.id);
    assert.ok(category.nameKo && category.nameJaRomanized);
    return [category.group, category.subgroup, category.id]
      .filter(Boolean)
      .join("/");
  });
  assert.deepEqual(paths.sort(), [
    "katame-waza/kansetsu-waza",
    "katame-waza/osaekomi-waza",
    "katame-waza/shime-waza",
    "nage-waza/sutemi-waza/ma-sutemi-waza",
    "nage-waza/sutemi-waza/yoko-sutemi-waza",
    "nage-waza/tachi-waza/ashi-waza",
    "nage-waza/tachi-waza/koshi-waza",
    "nage-waza/tachi-waza/te-waza",
  ]);
});

test("the full catalog preserves the Kodokan counts and playable IDs", () => {
  assert.equal(TECHNIQUE_CATALOG.length, 100);
  assert.equal(new Set(TECHNIQUE_CATALOG.map((entry) => entry.id)).size, 100);
  assert.deepEqual(
    Object.fromEntries(
      Object.keys(TECHNIQUE_CATEGORIES).map((id) => [
        id,
        TECHNIQUE_CATALOG.filter((entry) => entry.category === id).length,
      ]),
    ),
    {
      "te-waza": 16,
      "koshi-waza": 10,
      "ashi-waza": 21,
      "ma-sutemi-waza": 5,
      "yoko-sutemi-waza": 16,
      "osaekomi-waza": 10,
      "shime-waza": 12,
      "kansetsu-waza": 10,
    },
  );
  assert.deepEqual(
    TECHNIQUE_CATALOG.flatMap((entry) => entry.animationIds).sort(),
    [...TECHNIQUE_IDS].sort(),
  );

  for (const entry of TECHNIQUE_CATALOG) {
    if (entry.animationIds.length === 0) {
      assert.equal(entry.__meta.status, TECHNIQUE_STATUS.UNIMPLEMENTED);
      assert.equal(entry.__meta.since, undefined);
      assert.ok(!isTechnique(entry.id));
    } else {
      assert.equal(entry.__meta.status, TECHNIQUE_STATUS.AVAILABLE);
      for (const id of entry.animationIds) {
        const technique = INFO.find((info) => info.id === id);
        assert.equal(technique?.canonicalId, entry.id);
        assert.equal(technique?.category, entry.category);
        assert.deepEqual(technique?.__meta, entry.__meta);
      }
    }
  }
  const entries = new Map(TECHNIQUE_CATALOG.map((entry) => [entry.id, entry]));
  assert.deepEqual(entries.get("o-soto-gari")?.animationIds, ["osoto-gari"]);
  assert.deepEqual(entries.get("ko-uchi-gari")?.animationIds, [
    "ko-uchi-gari-v1",
    "ko-uchi-gari-v2",
  ]);
  assert.equal(entries.get("seoi-nage")?.__meta.since, "v0.1.0");
  assert.equal(entries.get("kesa-gatame")?.__meta.since, "v0.1.1");
  assert.equal(entries.get("obi-otoshi")?.provisionalKo, true);
});
