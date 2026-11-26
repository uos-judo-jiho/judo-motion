/** Importing this registers <judo-motion> in the browser. Safe to import during server rendering. */
import { CHARACTERS as characters, GIS as gis } from "./characters/index.ts";
import type { CharacterId, GiId, TechniqueName } from "./ids.ts";
import { TECHNIQUES as techniques } from "./techniques/index.ts";
import { describe } from "./techniques/info.ts";
import type { TechniqueInfo } from "./techniques/info.ts";

export { JudoMotionElement } from "./gpu/element.ts";
export type { MatMode } from "./gpu/element.ts";
export { CHARACTER_IDS, GI_IDS, GRIDS, TECHNIQUE_IDS } from "./ids.ts";
export type {
  CharacterId,
  GiId,
  Grid,
  TechniqueBase,
  TechniqueId,
  TechniqueName,
} from "./ids.ts";
export type { TechniqueInfo } from "./techniques/info.ts";
export { CAMERA_VIEWS } from "./core/camera.ts";
export type { CameraView } from "./core/camera.ts";

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

/** Narrow an arbitrary string, e.g. a URL parameter. */
export const isTechnique = (id: string): id is TechniqueName =>
  techniques.some((t) => t.id === id || t.variant?.of === id);
export const isCharacter = (id: string): id is CharacterId =>
  characters.some((c) => c.id === id);
export const isGi = (id: string): id is GiId => gis.some((g) => g.id === id);
