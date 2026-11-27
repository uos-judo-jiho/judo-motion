import type { Technique } from "../core/types";
import type { TechniqueBase, TechniqueId } from "../ids";
import { TECHNIQUE_STATUS, definitionFor } from "./definitions";
import type {
  TechniqueCanonicalId,
  TechniqueDevelopmentMeta,
} from "./definitions";
import type { TechniqueCategoryId } from "./categories";

/** What a page needs to know about a technique; keyframes stay internal. */
export interface TechniqueInfo {
  readonly id: TechniqueId;
  readonly ko: string;
  readonly ja: string;
  readonly romaji: string;
  readonly group: string;
  readonly canonicalId: TechniqueCanonicalId;
  readonly __meta: TechniqueDevelopmentMeta;
  readonly category: TechniqueCategoryId;
  readonly kind: NonNullable<Technique["kind"]>;
  readonly note: string;
  /** Seconds. */
  readonly duration: number;
  readonly phases: readonly { readonly name: string; readonly t: number }[];
  readonly variant?: {
    readonly of: TechniqueBase;
    readonly name: string;
    readonly label: string;
  };
}

export function describe(t: Technique): TechniqueInfo {
  const {
    id,
    ko,
    ja,
    romaji,
    group,
    canonicalId,
    note,
    duration,
    phases,
    variant,
  } = t;
  const { category, since } = definitionFor(canonicalId);
  return {
    id,
    ko,
    ja,
    romaji,
    group,
    canonicalId,
    category,
    __meta: { status: TECHNIQUE_STATUS.AVAILABLE, ...(since && { since }) },
    kind: t.kind ?? "throw",
    note,
    duration,
    phases,
    ...(variant && { variant }),
  };
}
