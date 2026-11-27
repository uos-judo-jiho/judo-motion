import type { TechniqueBase, TechniqueId } from "../ids.ts";
import type { TechniqueCanonicalId } from "../techniques/definitions.ts";
import type { Pair, Pose } from "./rig.ts";

/**
 * Where a hand is. Grips resolve against the opponent, so contact survives any motion.
 * lapel: opponent's collar / collar: same grip folded against own shoulder while turned in
 * sleeve: opponent's elbow on the mirrored side / cuff: further down uke's right sleeve
 * drawn: arm pulled over the opponent's shoulder / held: arm kept up by the opponent after landing
 * beside: arm drawn past the head toward an opponent who is also lying down
 */
export type Grip =
  | "lapel"
  | "collar"
  | "sleeve"
  | "cuff"
  | "drawn"
  | "held"
  | "beside"
  | "back-collar"
  | "elbow-wrap"
  | "pinned-arm"
  | "rest"
  | "slap";

export interface Key {
  t: number;
  /** Uke meets the mat here: arrives at speed and stops. */
  hit?: boolean;
  tori: Pose;
  uke: Pose;
  toriGrip: Pair<Grip>;
  ukeGrip: Pair<Grip>;
}
export interface Phase {
  name: string;
  t: number;
}
interface TechniqueData {
  id: TechniqueId;
  ko: string;
  ja: string;
  romaji: string;
  group: string;
  canonicalId: TechniqueCanonicalId;
  note: string;
  /** One of several equally valid ways to do technique `of`. Numbers are labels, not progress. */
  variant?: { of: TechniqueBase; name: string; label: string };
  /** Tori leads uke into a step before entering, so entry is judged from 들어가기 instead of the start. */
  draws?: boolean;
  /** Tori ends lying down, so the right hand need not cross to the sleeve. */
  keepsLapel?: boolean;
  /** Pull the camera back for throws that travel far: `scale` about world x = `center`. The mat stays put. */
  camera?: { scale: number; center: number };
  /** How far the jacket stretches before a grip drags the bodies together. */
  slack?: number;
  duration: number;
  phases: Phase[];
  keys: Key[];
  /** Time used for still thumbnails / reduced motion. */
  poster: number;
}

export type Technique = TechniqueData &
  (
    | {
        kind?: "throw";
        /** How uke lands after the throw. */
        ukemi: "side" | "back";
        impact: { t: number; x: number; z?: number };
      }
    | { kind: "osaekomi"; ukemi?: never; impact?: never }
  );
