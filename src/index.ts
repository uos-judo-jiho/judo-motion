/** Importing this registers <judo-motion> in the browser. Safe to import during server rendering. */
import { CHARACTERS as characters, GIS as gis } from "./characters/index";
import type { CharacterId, GiId, TechniqueName } from "./ids";
import { TECHNIQUES as techniques, findTechnique } from "./techniques/index";
import { describe } from "./techniques/info";
import type { TechniqueInfo } from "./techniques/info";

export { JudoMotionElement } from "./gpu/element";
export type { MatMode } from "./gpu/element";
export { CHARACTER_IDS, GI_IDS, GRIDS, TECHNIQUE_IDS } from "./ids";
export type {
  CharacterId,
  GiId,
  Grid,
  TechniqueBase,
  TechniqueId,
  TechniqueName,
} from "./ids";
export { TECHNIQUE_CATEGORIES } from "./techniques/categories";
export type {
  TechniqueCategoryId,
  TechniqueCategoryInfo,
  TechniqueGroupId,
  TechniqueSubgroupId,
} from "./techniques/categories";
export { TECHNIQUE_CATALOG } from "./techniques/catalog";
export type { TechniqueCatalogEntry } from "./techniques/catalog";
export { TECHNIQUE_STATUS } from "./techniques/definitions";
export type {
  TechniqueCanonicalId,
  TechniqueDevelopmentMeta,
  TechniqueRelease,
  TechniqueStatus,
} from "./techniques/definitions";
export type { TechniqueInfo } from "./techniques/info";
export { CAMERA_VIEWS } from "./core/camera";
export type { CameraView } from "./core/camera";

export interface Option<Id extends string> {
  readonly id: Id;
  readonly ko: string;
}

/** Lists for building pickers. */
export const TECHNIQUES: readonly TechniqueInfo[] = techniques.map(describe);
export const CHARACTERS: readonly Option<CharacterId>[] = characters.map(
  ({ id, ko }) => ({ id, ko }),
);
export const GIS: readonly Option<GiId>[] = gis.map(({ id, ko }) => ({
  id,
  ko,
}));

/** Look up a playable ID or resolve a base name to its default variant. */
export function getTechniqueInfo(id: string): TechniqueInfo | undefined {
  const technique = findTechnique(id);
  return technique && describe(technique);
}

/** Narrow an arbitrary string, e.g. a URL parameter. */
export const isTechnique = (id: string): id is TechniqueName =>
  findTechnique(id) !== undefined;
export const isCharacter = (id: string): id is CharacterId =>
  characters.some((c) => c.id === id);
export const isGi = (id: string): id is GiId => gis.some((g) => g.id === id);
