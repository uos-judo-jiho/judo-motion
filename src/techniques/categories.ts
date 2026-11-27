export type TechniqueCategoryId =
  | "te-waza"
  | "koshi-waza"
  | "ashi-waza"
  | "ma-sutemi-waza"
  | "yoko-sutemi-waza"
  | "osaekomi-waza"
  | "shime-waza"
  | "kansetsu-waza";

export type TechniqueGroupId = "nage-waza" | "katame-waza";
export type TechniqueSubgroupId = "tachi-waza" | "sutemi-waza";

export interface TechniqueCategoryInfo {
  readonly id: TechniqueCategoryId;
  readonly group: TechniqueGroupId;
  readonly subgroup?: TechniqueSubgroupId;
  readonly nameKo: string;
  readonly nameJaRomanized: string;
}

export const TECHNIQUE_CATEGORIES: Readonly<
  Record<TechniqueCategoryId, TechniqueCategoryInfo>
> = {
  "te-waza": {
    id: "te-waza",
    group: "nage-waza",
    subgroup: "tachi-waza",
    nameKo: "손기술",
    nameJaRomanized: "Te-waza",
  },
  "koshi-waza": {
    id: "koshi-waza",
    group: "nage-waza",
    subgroup: "tachi-waza",
    nameKo: "허리기술",
    nameJaRomanized: "Koshi-waza",
  },
  "ashi-waza": {
    id: "ashi-waza",
    group: "nage-waza",
    subgroup: "tachi-waza",
    nameKo: "발기술",
    nameJaRomanized: "Ashi-waza",
  },
  "ma-sutemi-waza": {
    id: "ma-sutemi-waza",
    group: "nage-waza",
    subgroup: "sutemi-waza",
    nameKo: "바로 누우면서 메치기",
    nameJaRomanized: "Ma-sutemi-waza",
  },
  "yoko-sutemi-waza": {
    id: "yoko-sutemi-waza",
    group: "nage-waza",
    subgroup: "sutemi-waza",
    nameKo: "모로 누우면서 메치기",
    nameJaRomanized: "Yoko-sutemi-waza",
  },
  "osaekomi-waza": {
    id: "osaekomi-waza",
    group: "katame-waza",
    nameKo: "누르기",
    nameJaRomanized: "Osaekomi-waza",
  },
  "shime-waza": {
    id: "shime-waza",
    group: "katame-waza",
    nameKo: "조르기",
    nameJaRomanized: "Shime-waza",
  },
  "kansetsu-waza": {
    id: "kansetsu-waza",
    group: "katame-waza",
    nameKo: "꺾기",
    nameJaRomanized: "Kansetsu-waza",
  },
};
