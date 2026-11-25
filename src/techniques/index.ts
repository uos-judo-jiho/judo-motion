import type { Technique } from "../core/scene.ts";
import { koUchiGariV1, koUchiGariV2 } from "./ko-uchi-gari.ts";
import { osotoGari } from "./osoto-gari.ts";
import { seoiNage } from "./seoi-nage.ts";
import type { TechniqueName } from "../ids.ts";
import { tomoeNage } from "./tomoe-nage.ts";
import { uchiMata } from "./uchi-mata.ts";

/** Add a technique by writing one data file and listing it here. */
export const TECHNIQUES: Technique[] = [
  seoiNage,
  uchiMata,
  osotoGari,
  koUchiGariV1,
  koUchiGariV2,
  tomoeNage,
];
/** The technique a variant belongs to; its own id when it has none. */
export const baseId = (t: Pick<Technique, "id" | "variant">): TechniqueName =>
  t.variant?.of ?? t.id;
export const variantsOf = (id: string): Technique[] =>
  TECHNIQUES.filter((t) => baseId(t) === id);
/** Exact id, or the first variant of a base id. */
export const findTechnique = (id: string): Technique | undefined =>
  TECHNIQUES.find((t) => t.id === id) ?? variantsOf(id)[0];
export const fullName = (t: Technique): string =>
  t.variant ? `${t.ko} ${t.variant.name} ${t.variant.label}` : t.ko;
