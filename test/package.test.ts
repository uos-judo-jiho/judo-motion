/** The public ids, the data behind them and the published entry points must agree. */
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { CHARACTERS, GIS } from "../src/characters/index.ts";
import { CHARACTER_IDS, GI_IDS, TECHNIQUE_IDS } from "../src/ids.ts";
import {
  JudoMotion,
  TECHNIQUES as INFO,
  TECHNIQUE_CATEGORIES,
  isCharacter,
  isGi,
  isTechnique,
} from "../src/react.ts";
import { TECHNIQUES, variantsOf } from "../src/techniques/index.ts";

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
    new Set(variantsOf("ko-uchi-gari").map((t) => t.category)).size,
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
