import type { Technique } from "../core/types.ts";
import type { TechniqueBase, TechniqueId } from "../ids.ts";

/** What a page needs to know about a technique; keyframes stay internal. */
export interface TechniqueInfo {
  readonly id: TechniqueId;
  readonly ko: string;
  readonly ja: string;
  readonly romaji: string;
  readonly group: string;
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
  const { id, ko, ja, romaji, group, note, duration, phases, variant } = t;
  return {
    id,
    ko,
    ja,
    romaji,
    group,
    note,
    duration,
    phases,
    ...(variant && { variant }),
  };
}
