/** Public ids. Data files are typed against these, so a typo anywhere is a compile error. */
export const TECHNIQUE_IDS = [
  "seoi-nage",
  "uchi-mata",
  "osoto-gari",
  "ko-uchi-gari-v1",
  "ko-uchi-gari-v2",
  "tomoe-nage",
] as const;
export type TechniqueId = (typeof TECHNIQUE_IDS)[number];
/** Base names that stand for their first variant. */
export type TechniqueBase = "ko-uchi-gari";
export type TechniqueName = TechniqueId | TechniqueBase;

export const CHARACTER_IDS = [
  "brown",
  "navy",
  "ponytail",
  "bun",
  "curly",
  "master",
  "bear",
  "cat",
  "panda",
  "robot",
] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

export const GI_IDS = ["white", "blue", "black", "red"] as const;
export type GiId = (typeof GI_IDS)[number];

export const GRIDS = [64, 96, 128] as const;
export type Grid = (typeof GRIDS)[number];
