import type { TechniqueId } from "../ids";
import type { TechniqueCategoryId } from "./categories";
import { CANONICAL_IDS, TECHNIQUE_STATUS, definitionFor } from "./definitions";
import type {
  TechniqueCanonicalId,
  TechniqueDevelopmentMeta,
} from "./definitions";
import { TECHNIQUES } from "./index";

export interface TechniqueCatalogEntry {
  readonly id: TechniqueCanonicalId;
  readonly ko: string;
  readonly romaji: string;
  readonly category: TechniqueCategoryId;
  /** Korean label provisionally translated in the source mapping. */
  readonly provisionalKo?: true;
  readonly animationIds: readonly TechniqueId[];
  readonly __meta: TechniqueDevelopmentMeta;
}

/** All Kodokan techniques, including entries without an animation. */
export const TECHNIQUE_CATALOG: readonly TechniqueCatalogEntry[] =
  CANONICAL_IDS.map((id) => {
    const { since, ...definition } = definitionFor(id);
    const animationIds = TECHNIQUES.filter((t) => t.canonicalId === id).map(
      (t) => t.id,
    );
    return {
      id,
      ...definition,
      animationIds,
      __meta: {
        status: animationIds.length
          ? TECHNIQUE_STATUS.AVAILABLE
          : TECHNIQUE_STATUS.UNIMPLEMENTED,
        ...(since && { since }),
      },
    };
  });
