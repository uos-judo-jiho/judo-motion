import type { Technique } from "../core/scene";
import { kesaGatame } from "./kesa-gatame";
import { koUchiGariV1, koUchiGariV2 } from "./ko-uchi-gari";
import { osotoGari } from "./osoto-gari";
import { seoiNage } from "./seoi-nage";
import type { TechniqueName } from "../ids";
import { tomoeNage } from "./tomoe-nage";
import { uchiMata } from "./uchi-mata";

/** Add a technique by writing one data file and listing it here. */
export const TECHNIQUES: Technique[] = [
  seoiNage,
  uchiMata,
  osotoGari,
  koUchiGariV1,
  koUchiGariV2,
  tomoeNage,
  kesaGatame,
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
  t.variant ? `${t.ko} (${t.variant.label})` : t.ko;
