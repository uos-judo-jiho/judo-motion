import type { TechniqueCategoryId } from "./categories";

export type TechniqueRelease = `v${number}.${number}.${number}`;

export const TECHNIQUE_STATUS = {
  AVAILABLE: "available",
  UNIMPLEMENTED: "unimplemented",
} as const;

export type TechniqueStatus =
  (typeof TECHNIQUE_STATUS)[keyof typeof TECHNIQUE_STATUS];

export interface TechniqueDevelopmentMeta {
  readonly status: TechniqueStatus;
  /** First tagged release containing an animation of this technique. */
  readonly since?: TechniqueRelease;
}

interface TechniqueDefinition {
  readonly category: TechniqueCategoryId;
  readonly romaji: string;
  readonly ko: string;
  readonly provisionalKo?: true;
  readonly since?: TechniqueRelease;
}

/** Kodokan classification and Korean names from the mapping in issue #7. */
const definitions = {
  "seoi-nage": {
    category: "te-waza",
    romaji: "Seoi-nage",
    ko: "업어치기",
    since: "v0.1.0",
  },
  "ippon-seoi-nage": {
    category: "te-waza",
    romaji: "Ippon-seoi-nage",
    ko: "한팔업어치기",
  },
  "seoi-otoshi": {
    category: "te-waza",
    romaji: "Seoi-otoshi",
    ko: "떨어뜨려업어치기",
  },
  "tai-otoshi": { category: "te-waza", romaji: "Tai-otoshi", ko: "빗당겨치기" },
  "kata-guruma": {
    category: "te-waza",
    romaji: "Kata-guruma",
    ko: "어깨로메치기",
  },
  "sukui-nage": { category: "te-waza", romaji: "Sukui-nage", ko: "떠메치기" },
  "obi-otoshi": {
    category: "te-waza",
    romaji: "Obi-otoshi",
    ko: "띠잡아떨어뜨리기",
    provisionalKo: true,
  },
  "uki-otoshi": { category: "te-waza", romaji: "Uki-otoshi", ko: "띄어치기" },
  "sumi-otoshi": {
    category: "te-waza",
    romaji: "Sumi-otoshi",
    ko: "구석떨어뜨리기",
    provisionalKo: true,
  },
  "yama-arashi": {
    category: "te-waza",
    romaji: "Yama-arashi",
    ko: "산바람치기",
    provisionalKo: true,
  },
  "obi-tori-gaeshi": {
    category: "te-waza",
    romaji: "Obi-tori-gaeshi",
    ko: "띠잡아되치기",
    provisionalKo: true,
  },
  "morote-gari": {
    category: "te-waza",
    romaji: "Morote-gari",
    ko: "양다리잡아메치기",
  },
  "kuchiki-taoshi": {
    category: "te-waza",
    romaji: "Kuchiki-taoshi",
    ko: "한쪽다리잡아넘기기",
    provisionalKo: true,
  },
  "kibisu-gaeshi": {
    category: "te-waza",
    romaji: "Kibisu-gaeshi",
    ko: "발뒤축잡아넘기기",
    provisionalKo: true,
  },
  "uchi-mata-sukashi": {
    category: "te-waza",
    romaji: "Uchi-mata-sukashi",
    ko: "허벅다리걸기피해되치기",
    provisionalKo: true,
  },
  "ko-uchi-gaeshi": {
    category: "te-waza",
    romaji: "Ko-uchi-gaeshi",
    ko: "안뒤축후리기되치기",
    provisionalKo: true,
  },
  "uki-goshi": { category: "koshi-waza", romaji: "Uki-goshi", ko: "허리띄기" },
  "o-goshi": { category: "koshi-waza", romaji: "O-goshi", ko: "허리껴치기" },
  "koshi-guruma": {
    category: "koshi-waza",
    romaji: "Koshi-guruma",
    ko: "허리돌리기",
  },
  "tsurikomi-goshi": {
    category: "koshi-waza",
    romaji: "Tsurikomi-goshi",
    ko: "허리채기",
  },
  "sode-tsurikomi-goshi": {
    category: "koshi-waza",
    romaji: "Sode-tsurikomi-goshi",
    ko: "소매잡아허리채기",
    provisionalKo: true,
  },
  "harai-goshi": {
    category: "koshi-waza",
    romaji: "Harai-goshi",
    ko: "허리후리기",
  },
  "tsuri-goshi": {
    category: "koshi-waza",
    romaji: "Tsuri-goshi",
    ko: "띠잡아허리치기",
    provisionalKo: true,
  },
  "hane-goshi": {
    category: "koshi-waza",
    romaji: "Hane-goshi",
    ko: "허리튀기",
  },
  "utsuri-goshi": {
    category: "koshi-waza",
    romaji: "Utsuri-goshi",
    ko: "허리옮겨치기",
  },
  "ushiro-goshi": {
    category: "koshi-waza",
    romaji: "Ushiro-goshi",
    ko: "뒤허리안아치기",
  },
  "de-ashi-harai": {
    category: "ashi-waza",
    romaji: "De-ashi-harai",
    ko: "나오는발치기",
  },
  "hiza-guruma": {
    category: "ashi-waza",
    romaji: "Hiza-guruma",
    ko: "무릎대돌리기",
  },
  "sasae-tsurikomi-ashi": {
    category: "ashi-waza",
    romaji: "Sasae-tsurikomi-ashi",
    ko: "발목받치기",
  },
  "o-soto-gari": {
    category: "ashi-waza",
    romaji: "O-soto-gari",
    ko: "밭다리후리기",
    since: "v0.1.0",
  },
  "o-uchi-gari": {
    category: "ashi-waza",
    romaji: "O-uchi-gari",
    ko: "안다리후리기",
  },
  "ko-soto-gari": {
    category: "ashi-waza",
    romaji: "Ko-soto-gari",
    ko: "발뒤축후리기",
  },
  "ko-uchi-gari": {
    category: "ashi-waza",
    romaji: "Ko-uchi-gari",
    ko: "안뒤축걸기",
    since: "v0.1.0",
  },
  "okuri-ashi-harai": {
    category: "ashi-waza",
    romaji: "Okuri-ashi-harai",
    ko: "모두걸기",
  },
  "uchi-mata": {
    category: "ashi-waza",
    romaji: "Uchi-mata",
    ko: "허벅다리걸기",
    since: "v0.1.0",
  },
  "ko-soto-gake": {
    category: "ashi-waza",
    romaji: "Ko-soto-gake",
    ko: "발뒤축걸기",
  },
  "ashi-guruma": {
    category: "ashi-waza",
    romaji: "Ashi-guruma",
    ko: "다리대돌리기",
  },
  "harai-tsurikomi-ashi": {
    category: "ashi-waza",
    romaji: "Harai-tsurikomi-ashi",
    ko: "발목후리기",
    provisionalKo: true,
  },
  "o-guruma": {
    category: "ashi-waza",
    romaji: "O-guruma",
    ko: "큰다리돌리기",
    provisionalKo: true,
  },
  "o-soto-guruma": {
    category: "ashi-waza",
    romaji: "O-soto-guruma",
    ko: "밭다리돌리기",
    provisionalKo: true,
  },
  "o-soto-otoshi": {
    category: "ashi-waza",
    romaji: "O-soto-otoshi",
    ko: "밭다리떨어뜨리기",
    provisionalKo: true,
  },
  "tsubame-gaeshi": {
    category: "ashi-waza",
    romaji: "Tsubame-gaeshi",
    ko: "나오는발치기되치기",
    provisionalKo: true,
  },
  "o-soto-gaeshi": {
    category: "ashi-waza",
    romaji: "O-soto-gaeshi",
    ko: "밭다리후리기되치기",
  },
  "o-uchi-gaeshi": {
    category: "ashi-waza",
    romaji: "O-uchi-gaeshi",
    ko: "안다리후리기되치기",
  },
  "hane-goshi-gaeshi": {
    category: "ashi-waza",
    romaji: "Hane-goshi-gaeshi",
    ko: "허리튀기되치기",
  },
  "harai-goshi-gaeshi": {
    category: "ashi-waza",
    romaji: "Harai-goshi-gaeshi",
    ko: "허리후리기되치기",
  },
  "uchi-mata-gaeshi": {
    category: "ashi-waza",
    romaji: "Uchi-mata-gaeshi",
    ko: "허벅다리걸기되치기",
  },
  "tomoe-nage": {
    category: "ma-sutemi-waza",
    romaji: "Tomoe-nage",
    ko: "배대뒤치기",
    since: "v0.1.0",
  },
  "sumi-gaeshi": {
    category: "ma-sutemi-waza",
    romaji: "Sumi-gaeshi",
    ko: "안오금띄기",
  },
  "hikikomi-gaeshi": {
    category: "ma-sutemi-waza",
    romaji: "Hikikomi-gaeshi",
    ko: "끌어당겨되치기",
    provisionalKo: true,
  },
  "tawara-gaeshi": {
    category: "ma-sutemi-waza",
    romaji: "Tawara-gaeshi",
    ko: "들어뒤치기",
    provisionalKo: true,
  },
  "ura-nage": {
    category: "ma-sutemi-waza",
    romaji: "Ura-nage",
    ko: "누우면서던지기",
  },
  "yoko-otoshi": {
    category: "yoko-sutemi-waza",
    romaji: "Yoko-otoshi",
    ko: "모로떨어뜨리기",
    provisionalKo: true,
  },
  "tani-otoshi": {
    category: "yoko-sutemi-waza",
    romaji: "Tani-otoshi",
    ko: "오금대떨어뜨리기",
    provisionalKo: true,
  },
  "hane-makikomi": {
    category: "yoko-sutemi-waza",
    romaji: "Hane-makikomi",
    ko: "허리튀겨감아치기",
    provisionalKo: true,
  },
  "soto-makikomi": {
    category: "yoko-sutemi-waza",
    romaji: "Soto-makikomi",
    ko: "바깥감아치기",
  },
  "uchi-makikomi": {
    category: "yoko-sutemi-waza",
    romaji: "Uchi-makikomi",
    ko: "안감아치기",
  },
  "uki-waza": {
    category: "yoko-sutemi-waza",
    romaji: "Uki-waza",
    ko: "모로띄기",
  },
  "yoko-wakare": {
    category: "yoko-sutemi-waza",
    romaji: "Yoko-wakare",
    ko: "모로누워넘기기",
    provisionalKo: true,
  },
  "yoko-guruma": {
    category: "yoko-sutemi-waza",
    romaji: "Yoko-guruma",
    ko: "모로돌리기",
  },
  "yoko-gake": {
    category: "yoko-sutemi-waza",
    romaji: "Yoko-gake",
    ko: "모로걸기",
  },
  "daki-wakare": {
    category: "yoko-sutemi-waza",
    romaji: "Daki-wakare",
    ko: "안아넘기기",
    provisionalKo: true,
  },
  "o-soto-makikomi": {
    category: "yoko-sutemi-waza",
    romaji: "O-soto-makikomi",
    ko: "밭다리감아치기",
  },
  "uchi-mata-makikomi": {
    category: "yoko-sutemi-waza",
    romaji: "Uchi-mata-makikomi",
    ko: "허벅다리감아치기",
  },
  "harai-makikomi": {
    category: "yoko-sutemi-waza",
    romaji: "Harai-makikomi",
    ko: "허리후려감아치기",
    provisionalKo: true,
  },
  "ko-uchi-makikomi": {
    category: "yoko-sutemi-waza",
    romaji: "Ko-uchi-makikomi",
    ko: "안뒤축감아치기",
  },
  "kani-basami": {
    category: "yoko-sutemi-waza",
    romaji: "Kani-basami",
    ko: "가위치기",
  },
  "kawazu-gake": {
    category: "yoko-sutemi-waza",
    romaji: "Kawazu-gake",
    ko: "다리얽어걸기",
    provisionalKo: true,
  },
  "kesa-gatame": {
    category: "osaekomi-waza",
    romaji: "Kesa-gatame",
    ko: "곁누르기",
    since: "v0.1.1",
  },
  "kuzure-kesa-gatame": {
    category: "osaekomi-waza",
    romaji: "Kuzure-kesa-gatame",
    ko: "고쳐곁누르기",
  },
  "ushiro-kesa-gatame": {
    category: "osaekomi-waza",
    romaji: "Ushiro-kesa-gatame",
    ko: "뒤곁누르기",
  },
  "kata-gatame": {
    category: "osaekomi-waza",
    romaji: "Kata-gatame",
    ko: "어깨누르기",
  },
  "kami-shiho-gatame": {
    category: "osaekomi-waza",
    romaji: "Kami-shiho-gatame",
    ko: "위누르기",
  },
  "kuzure-kami-shiho-gatame": {
    category: "osaekomi-waza",
    romaji: "Kuzure-kami-shiho-gatame",
    ko: "위고쳐누르기",
  },
  "yoko-shiho-gatame": {
    category: "osaekomi-waza",
    romaji: "Yoko-shiho-gatame",
    ko: "가로누르기",
  },
  "tate-shiho-gatame": {
    category: "osaekomi-waza",
    romaji: "Tate-shiho-gatame",
    ko: "세로누르기",
  },
  "uki-gatame": {
    category: "osaekomi-waza",
    romaji: "Uki-gatame",
    ko: "띄어누르기",
    provisionalKo: true,
  },
  "ura-gatame": {
    category: "osaekomi-waza",
    romaji: "Ura-gatame",
    ko: "뒤누르기",
    provisionalKo: true,
  },
  "nami-juji-jime": {
    category: "shime-waza",
    romaji: "Nami-juji-jime",
    ko: "바로십자조르기",
  },
  "gyaku-juji-jime": {
    category: "shime-waza",
    romaji: "Gyaku-juji-jime",
    ko: "역십자조르기",
  },
  "kata-juji-jime": {
    category: "shime-waza",
    romaji: "Kata-juji-jime",
    ko: "엇십자조르기",
  },
  "hadaka-jime": {
    category: "shime-waza",
    romaji: "Hadaka-jime",
    ko: "맨손조르기",
  },
  "okuri-eri-jime": {
    category: "shime-waza",
    romaji: "Okuri-eri-jime",
    ko: "깃조르기",
  },
  "kataha-jime": {
    category: "shime-waza",
    romaji: "Kataha-jime",
    ko: "한쪽날개조르기",
  },
  "katate-jime": {
    category: "shime-waza",
    romaji: "Katate-jime",
    ko: "한손조르기",
  },
  "ryote-jime": {
    category: "shime-waza",
    romaji: "Ryote-jime",
    ko: "양손조르기",
  },
  "sode-guruma-jime": {
    category: "shime-waza",
    romaji: "Sode-guruma-jime",
    ko: "소매돌려조르기",
    provisionalKo: true,
  },
  "tsukkomi-jime": {
    category: "shime-waza",
    romaji: "Tsukkomi-jime",
    ko: "밀어넣어조르기",
    provisionalKo: true,
  },
  "sankaku-jime": {
    category: "shime-waza",
    romaji: "Sankaku-jime",
    ko: "삼각조르기",
  },
  "do-jime": { category: "shime-waza", romaji: "Do-jime", ko: "몸통조르기" },
  "ude-garami": {
    category: "kansetsu-waza",
    romaji: "Ude-garami",
    ko: "팔얽어꺾기",
  },
  "ude-hishigi-juji-gatame": {
    category: "kansetsu-waza",
    romaji: "Ude-hishigi-juji-gatame",
    ko: "십자팔꺾기",
  },
  "ude-hishigi-ude-gatame": {
    category: "kansetsu-waza",
    romaji: "Ude-hishigi-ude-gatame",
    ko: "팔꺾기",
  },
  "ude-hishigi-hiza-gatame": {
    category: "kansetsu-waza",
    romaji: "Ude-hishigi-hiza-gatame",
    ko: "무릎대팔꺾기",
  },
  "ude-hishigi-waki-gatame": {
    category: "kansetsu-waza",
    romaji: "Ude-hishigi-waki-gatame",
    ko: "겨드랑이팔꺾기",
  },
  "ude-hishigi-hara-gatame": {
    category: "kansetsu-waza",
    romaji: "Ude-hishigi-hara-gatame",
    ko: "배대팔꺾기",
  },
  "ude-hishigi-ashi-gatame": {
    category: "kansetsu-waza",
    romaji: "Ude-hishigi-ashi-gatame",
    ko: "다리대팔꺾기",
  },
  "ude-hishigi-te-gatame": {
    category: "kansetsu-waza",
    romaji: "Ude-hishigi-te-gatame",
    ko: "손으로팔꺾기",
  },
  "ude-hishigi-sankaku-gatame": {
    category: "kansetsu-waza",
    romaji: "Ude-hishigi-sankaku-gatame",
    ko: "삼각팔꺾기",
  },
  "ashi-garami": {
    category: "kansetsu-waza",
    romaji: "Ashi-garami",
    ko: "다리얽어꺾기",
  },
} as const;

export type TechniqueCanonicalId = keyof typeof definitions;

export function definitionFor(id: TechniqueCanonicalId): TechniqueDefinition {
  return definitions[id];
}

export const CANONICAL_IDS: readonly TechniqueCanonicalId[] = Object.keys(
  definitions,
) as TechniqueCanonicalId[];
