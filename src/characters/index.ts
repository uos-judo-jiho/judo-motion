/**
 * Looks only. A character never touches bones, keyframes or physics, so every character works with
 * every technique. Add one by appending to CHARACTERS.
 */
export type Rgb = number;
/** [lit, shaded] */
export type Tone = readonly [Rgb, Rgb];
export type Head = 'short' | 'bald' | 'ponytail' | 'bun' | 'curly' | 'bear' | 'cat' | 'panda' | 'robot';

export interface Character {
  id: string; ko: string; head: Head;
  /** Skin or fur on the face, hands and feet. */
  skin: Tone;
  /** Hands and feet when they differ from the face. */
  paws?: Tone;
  hair: Tone;
  /** Muzzle, visor light and other highlights. */
  accent?: Rgb;
  belt: Rgb;
  /** Limb and trunk thickness. Kept within 0.9..1.1 so bodies still fit the solved contacts. */
  bulk?: number;
  beard?: boolean; tail?: boolean;
}

export interface Gi { id: string; ko: string; cloth: Tone; inner: Rgb }

const BLACK_BELT = 0x262636;

export const CHARACTERS: Character[] = [
  { id: 'brown', ko: '갈색 머리', head: 'short', skin: [0xf4c49a, 0xd49670], hair: [0x4a302a, 0x322020], belt: BLACK_BELT },
  { id: 'navy', ko: '남색 머리', head: 'short', skin: [0xf4c49a, 0xd49670], hair: [0x2c2e46, 0x1e1f32], belt: BLACK_BELT },
  { id: 'ponytail', ko: '포니테일', head: 'ponytail', skin: [0xf7cfae, 0xd89f7c], hair: [0x8c4a2f, 0x643220], belt: BLACK_BELT, bulk: 0.95 },
  { id: 'bun', ko: '당고 머리', head: 'bun', skin: [0xf0bd90, 0xcb8f66], hair: [0x3a2c3e, 0x281e2c], belt: 0x7a4a2c, bulk: 0.94 },
  { id: 'curly', ko: '곱슬머리', head: 'curly', skin: [0x9a6242, 0x74462e], hair: [0x2a2024, 0x1a1418], belt: BLACK_BELT },
  { id: 'master', ko: '민머리 사범', head: 'bald', skin: [0xeab88c, 0xc48a62], hair: [0xe6e4dc, 0xb8b6b2], belt: 0xc83c34, bulk: 1.06, beard: true },
  { id: 'bear', ko: '곰', head: 'bear', skin: [0xa86c3e, 0x7e4e2c], hair: [0xa86c3e, 0x7e4e2c], accent: 0xe6c296, belt: BLACK_BELT, bulk: 1.08 },
  { id: 'cat', ko: '고양이', head: 'cat', skin: [0xf2a04a, 0xc8782e], hair: [0xf2a04a, 0xc8782e], accent: 0xfff0dc, belt: BLACK_BELT, bulk: 0.95, tail: true },
  { id: 'panda', ko: '판다', head: 'panda', skin: [0xf4f2ea, 0xc8c8d0], paws: [0x36364a, 0x262636], hair: [0x36364a, 0x262636], belt: 0x3c8c50, bulk: 1.08 },
  { id: 'robot', ko: '로봇', head: 'robot', skin: [0xb4c0cc, 0x8692a4], hair: [0x56627a, 0x3e4860], accent: 0x5cf0e0, belt: 0xe0a028 },
];

export const GIS: Gi[] = [
  { id: 'white', ko: '백', cloth: [0xf6f4ec, 0xcbcfde], inner: 0x969cb6 },
  { id: 'blue', ko: '청', cloth: [0x3870e0, 0x264eb0], inner: 0x18307a },
  { id: 'black', ko: '흑', cloth: [0x4a4c5e, 0x343648], inner: 0x74778c },
  { id: 'red', ko: '적', cloth: [0xd84a4a, 0xa83038], inner: 0x701c28 },
];

export interface Fighter { character: Character; gi: Gi }
export interface Cast { tori: Fighter; uke: Fighter }
/** Ids as they arrive from attributes, forms or the command line. */
export interface CastIds { tori?: string; uke?: string; toriGi?: string; ukeGi?: string }

export const DEFAULT_IDS = { tori: 'brown', uke: 'navy', toriGi: 'white', ukeGi: 'blue' } as const;

export function resolveCast(ids: CastIds = {}): Cast {
  const pick = <T extends { id: string }>(list: T[], id: string, what: string): T => {
    const found = list.find((x) => x.id === id);
    if (!found) throw new Error(`알 수 없는 ${what}: ${id}`);
    return found;
  };
  const at = (k: keyof CastIds) => ids[k] || DEFAULT_IDS[k];
  return {
    tori: { character: pick(CHARACTERS, at('tori'), '캐릭터'), gi: pick(GIS, at('toriGi'), '도복') },
    uke: { character: pick(CHARACTERS, at('uke'), '캐릭터'), gi: pick(GIS, at('ukeGi'), '도복') },
  };
}
export const DEFAULT_CAST = resolveCast();
/** File-name suffix; empty for the default pairing. */
export const castSuffix = ({ tori, uke }: Cast) => {
  const one = (f: Fighter, gi: string) => f.character.id + (f.gi.id === gi ? '' : `_${f.gi.id}`);
  const name = `${one(tori, 'white')}-vs-${one(uke, 'blue')}`;
  return name === 'brown-vs-navy' ? '' : `-${name}`;
};
