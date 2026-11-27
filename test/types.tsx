/** Compile-time checks of the public API, run by `pnpm type-check`. Never executed. */
import { createRef } from "react";
import type { ReactElement } from "react";
import {
  JudoMotion,
  TECHNIQUES,
  TECHNIQUE_CATEGORIES,
  isTechnique,
} from "../src/react";
import type {
  JudoMotionElement,
  JudoMotionProps,
  TechniqueCategoryId,
  TechniqueCategoryInfo,
  TechniqueName,
} from "../src/react";

const ref = createRef<JudoMotionElement>();

export const valid: ReactElement[] = [
  <JudoMotion key={1} technique="seoi-nage" />,
  <JudoMotion
    key={2}
    ref={ref}
    technique="ko-uchi-gari"
    tori="bear"
    uke="cat"
    toriGi="black"
    grid={128}
    mat="wide"
    paused
    className="size-48"
    onClick={(e) => e.currentTarget.currentTime}
  />,
  <judo-motion key={3} technique="tomoe-nage" tori-gi="red" mat />,
];

export const invalid: ReactElement[] = [
  // @ts-expect-error technique is required
  <JudoMotion key={1} />,
  // @ts-expect-error unknown technique
  <JudoMotion key={2} technique="seoi" />,
  // @ts-expect-error unknown character
  <JudoMotion key={3} technique="seoi-nage" tori="tiger" />,
  // @ts-expect-error unsupported grid
  <JudoMotion key={4} technique="seoi-nage" grid={100} />,
  // @ts-expect-error unknown mat mode
  <JudoMotion key={5} technique="seoi-nage" mat="huge" />,
  // @ts-expect-error no children
  <JudoMotion key={6} technique="seoi-nage">
    text
  </JudoMotion>,
  // @ts-expect-error unknown technique on the bare element
  <judo-motion key={7} technique="nope" />,
];

export const fromUrl = (id: string): TechniqueName =>
  isTechnique(id) ? id : TECHNIQUES[0]!.id;
export const props: JudoMotionProps = { technique: TECHNIQUES[0]!.id };
export const element: JudoMotionElement | null =
  document.querySelector("judo-motion");

export const categoryId: TechniqueCategoryId = TECHNIQUES[0]!.category;
export const categoryInfo: TechniqueCategoryInfo =
  TECHNIQUE_CATEGORIES[categoryId];
// @ts-expect-error only leaf categories can be assigned to a technique
export const invalidCategory: TechniqueCategoryId = "nage-waza";
