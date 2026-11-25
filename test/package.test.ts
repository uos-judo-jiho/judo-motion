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
  isCharacter,
  isGi,
  isTechnique,
} from "../src/react.ts";
import { TECHNIQUES } from "../src/techniques/index.ts";

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
      tori: "bear",
      toriGi: "black",
      mat: true,
      paused: false,
      className: "size-48",
    }),
  );
  assert.match(html, /^<judo-motion /);
  assert.match(html, /technique="seoi-nage"/);
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
