import type { Pose } from "../core/rig.ts";
import type { Key, Technique } from "../core/scene.ts";
import { FALLEN, FINISH, KUMI, SLAP, backFall, feet } from "./common.ts";

// Same view as the reference footage: uke's right side faces the viewer, tori's reaping foot shows behind the heel.
const tori: Pose = {
  p: [65, 22.6, 0],
  yaw: 168,
  lean: 5,
  feet: feet([60, -3], [69, 3]),
};
const uke: Pose = {
  p: [43, 22.7, 0.5],
  yaw: 10,
  lean: 3,
  feet: feet([48, 6], [34, -6]),
};
const down = (settle: number) => backFall([38, 4.4, 0], 8, settle);
/** Uke after the rear foot has followed: weight on the right foot. */
const drawn: Pose = {
  p: [46, 22, 0.5],
  yaw: 8,
  lean: 9,
  feet: feet([48, 6], [38.5, -9]),
};

const shared = {
  ko: "안뒤축걸기",
  ja: "小内刈",
  romaji: "Ko-uchi-gari",
  canonicalId: "ko-uchi-gari" as const,
  group: "발기술",
  ukemi: "back" as const,
  duration: 3.2,
  impact: { t: 1.66, x: 28 },
  poster: 1.3,
};

/** From the hooked heel to the mat; identical for both entries. `support` is where tori's left foot stands, `lead` how much earlier the reap starts than in v1. */
const reap = (support: number, lead = 0): Key[] => [
  // Reap the heel forward along the mat, drive the chest back; uke's left leg opens out as the hips drop.
  {
    t: 1.18 - lead,
    tori: {
      p: [57.8, 18.2, 1],
      yaw: 178,
      lean: 32,
      feet: feet([49, 2, 1.2], [support, 4]),
    },
    uke: {
      p: [44, 19, 0.5],
      yaw: 8,
      rot: -26,
      legs: { r: [13, -2, 10], l: [-24, -64, 20] },
    },
    toriGrip: KUMI,
    ukeGrip: KUMI,
  },
  {
    t: 1.34 - lead,
    tori: {
      p: [56.5, 18.4, 0.5],
      yaw: 180,
      lean: 44,
      feet: feet([53.5, 0.5, 2.5], support > 66 ? [69, 4, 1.5] : [66, 4]),
    },
    uke: {
      p: [41, 12, 0],
      yaw: 8,
      rot: -44,
      legs: { r: [26, 13, 13], l: [31, -74, 34] },
    },
    toriGrip: KUMI,
    ukeGrip: KUMI,
  },
  {
    t: 1.5 - lead,
    tori: {
      p: [55, 18.6, 0],
      yaw: 180,
      lean: 56,
      feet: feet([55, 0, 2], [66, 4]),
    },
    uke: {
      p: [39, 6, 0],
      yaw: 8,
      rot: -68,
      head: 22,
      legs: { r: [32, 18, 20], l: [62, -10, 30] },
    },
    toriGrip: KUMI,
    ukeGrip: { r: "lapel", l: "slap" },
  },
  {
    t: 1.66 - lead,
    hit: true,
    tori: {
      p: [51, 17.6, 0],
      yaw: 180,
      lean: 79,
      head: -14,
      feet: feet([55, 0], [66, 4]),
    },
    uke: down(0),
    toriGrip: KUMI,
    ukeGrip: SLAP,
  },
  {
    t: 2.05 - lead,
    tori: { p: [54, 20, -1], yaw: 180, lean: 60, feet: feet([55, 0], [66, 4]) },
    uke: down(0.85),
    toriGrip: FINISH,
    ukeGrip: FALLEN,
  },
  {
    t: 3.2 - lead,
    tori: {
      p: [54.5, 20.6, -1],
      yaw: 180,
      lean: 56,
      feet: feet([55, 0], [66, 4]),
    },
    uke: down(1),
    toriGrip: FINISH,
    ukeGrip: FALLEN,
  },
];

/** v1: tori gives ground and leads uke into a step, then reaps the foot that takes the weight. */
export const koUchiGariV1: Technique = {
  ...shared,
  id: "ko-uchi-gari-v1",
  variant: { of: "ko-uchi-gari", name: "v1", label: "끌어서 걸기" },
  draws: true,
  note: "상대를 끌어 오른발에 체중을 싣게 한 뒤, 오른발로 상대 오른발 뒤꿈치를 안쪽에서 쓸어 뒤로 넘긴다.",
  phases: [
    { name: "기울이기", t: 0 },
    { name: "들어가기", t: 0.56 },
    { name: "걸기", t: 1.04 },
    { name: "낙법", t: 1.66 },
  ],
  keys: [
    { t: 0, tori, uke, toriGrip: KUMI, ukeGrip: KUMI },
    { t: 0.12, tori, uke, toriGrip: KUMI, ukeGrip: KUMI },
    // Tori gives ground with the left foot; uke's rear foot follows.
    {
      t: 0.34,
      tori: {
        ...tori,
        p: [66.5, 22, 0],
        lean: 3,
        feet: feet([60, -3], [71, 4]),
      },
      uke: {
        ...uke,
        p: [45, 22.4, 0.5],
        lean: 8,
        feet: feet([48, 6], [36, -8, 2]),
      },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 0.56,
      tori: {
        ...tori,
        p: [65.5, 21.6, 0],
        lean: 6,
        feet: feet([60, -3], [71, 4]),
      },
      uke: drawn,
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    // The right foot slips in between uke's legs while the hips drop...
    {
      t: 0.8,
      tori: {
        p: [61.5, 19.8, 0.5],
        yaw: 174,
        lean: 14,
        feet: feet([52, 0, 2], [71, 4]),
      },
      uke: { ...drawn, lean: 5, rot: -2 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    // ...and the sole settles behind uke's right heel.
    {
      t: 1.04,
      tori: {
        p: [58.5, 18, 1],
        yaw: 176,
        lean: 22,
        feet: feet([43.2, 2.6, 0.5], [71, 4]),
      },
      uke: { ...drawn, p: [45.5, 21.9, 0.5], lean: 0, rot: -11 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    ...reap(71),
  ],
};

const far: Pose = {
  p: [66, 22, 0],
  yaw: 169,
  lean: 5,
  feet: feet([61.5, -3], [73, 3]),
};
const set: Pose = { p: [45.5, 22, 0.5], yaw: 8, lean: 3, feet: drawn.feet };

/** v2: two steps. The right foot enters; as the left follows, the right is already attacking. */
const LEAD = 0.4;
export const koUchiGariV2: Technique = {
  ...shared,
  id: "ko-uchi-gari-v2",
  variant: { of: "ko-uchi-gari", name: "v2", label: "들어가서 걸기" },
  duration: shared.duration - LEAD,
  impact: { ...shared.impact, t: 1.26 },
  poster: shared.poster - LEAD,
  note: "오른발이 들어가고, 왼발이 빠르게 따라붙는 동시에 오른발로 상대 오른발 뒤꿈치를 안쪽에서 쓸어 뒤로 넘긴다.",
  phases: [
    { name: "기울이기", t: 0 },
    { name: "들어가기", t: 0.16 },
    { name: "걸기", t: 0.64 },
    { name: "낙법", t: 1.26 },
  ],
  keys: [
    { t: 0, tori: far, uke: set, toriGrip: KUMI, ukeGrip: KUMI },
    { t: 0.14, tori: far, uke: set, toriGrip: KUMI, ukeGrip: KUMI },
    // Step 1: the right foot enters.
    {
      t: 0.36,
      tori: {
        p: [62.5, 20.6, 0],
        yaw: 171,
        lean: 9,
        feet: feet([53, -1], [73, 3]),
      },
      uke: { ...set, lean: 2, rot: -3 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    // Step 2: the left foot is already closing in...
    {
      t: 0.46,
      tori: {
        p: [61, 19.6, 0.4],
        yaw: 173,
        lean: 13,
        feet: feet([53, -1], [69, 3.5, 1]),
      },
      uke: { ...set, lean: 1, rot: -6 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    // ...and before it settles the right foot is on its way to the heel.
    {
      t: 0.56,
      tori: {
        p: [59.5, 18.6, 0.8],
        yaw: 175,
        lean: 18,
        feet: feet([47.5, 0.8, 1.6], [66, 4]),
      },
      uke: { ...set, p: [45.5, 21.9, 0.5], lean: 0, rot: -9 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 0.64,
      tori: {
        p: [58.5, 18, 1],
        yaw: 176,
        lean: 22,
        feet: feet([43.2, 2.6, 0.5], [66, 4]),
      },
      uke: { ...set, p: [45.5, 21.9, 0.5], lean: 0, rot: -11 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    ...reap(66, LEAD),
  ],
};
