/** Library entry: importing it registers <judo-motion>. */
export { JudoMotion } from './gpu/element.ts';
import { CHARACTERS as C, GIS as G } from './characters/index.ts';
import { TECHNIQUES as T } from './techniques/index.ts';

/** Plain lists for building pickers. */
export const TECHNIQUES = T.map((t) => ({ id: t.id, ko: t.ko, ja: t.ja, romaji: t.romaji, group: t.group, variant: t.variant ?? null, duration: t.duration }));
export const CHARACTERS = C.map((c) => ({ id: c.id, ko: c.ko }));
export const GIS = G.map((g) => ({ id: g.id, ko: g.ko }));
