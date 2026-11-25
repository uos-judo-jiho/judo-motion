export interface TechniqueInfo { id: string; ko: string; ja: string; romaji: string; group: string; variant: { of: string; name: string; label: string } | null; duration: number }
export interface Named { id: string; ko: string }
export declare const TECHNIQUES: TechniqueInfo[];
export declare const CHARACTERS: Named[];
export declare const GIS: Named[];

/** Attributes of <judo-motion>. */
export interface JudoMotionAttributes {
  technique?: string;
  /** Character ids. */
  tori?: string; uke?: string;
  /** Jacket colour ids. */
  'tori-gi'?: string; 'uke-gi'?: string;
  /** Art pixels per side. */
  grid?: 64 | 96 | 128 | '64' | '96' | '128';
  /** 0 follows the display. */
  fps?: number | string;
  speed?: number | string;
  paused?: boolean | '';
  /** Tatami floor; "wide" spills past the frame. */
  mat?: boolean | '' | 'wide';
}

export declare class JudoMotion extends HTMLElement {
  technique: string;
  tori: string; uke: string; toriGi: string; ukeGi: string;
  grid: number; fps: number; speed: number;
  paused: boolean;
  mat: boolean | string;
  readonly info: { readonly id: string; readonly ko: string; readonly duration: number };
  /** Seconds. */
  currentTime: number;
}

declare global { interface HTMLElementTagNameMap { 'judo-motion': JudoMotion } }
