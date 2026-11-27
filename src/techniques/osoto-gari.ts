import type { Pose } from "../core/rig.ts";
import type { Technique } from "../core/scene.ts";
import { FALLEN, FINISH, KUMI, feet, grip, sideFall } from "./common.ts";

// Seen from the other side: tori's right leg is nearest to the viewer, so the reap stays visible.
const tori: Pose = {
  p: [31, 23, 0],
  yaw: 10,
  lean: 4,
  feet: feet([35, 3], [27, -3]),
};
const uke: Pose = {
  p: [52, 23.3, 0],
  yaw: 170,
  lean: 3,
  feet: feet([48, -3], [55, 3]),
};
const PIVOT: [number, number] = [45, -14];
const back = (settle: number) => sideFall([57, 4.4, 0], 172, -90, settle);

export const osotoGari: Technique = {
  id: "osoto-gari",
  ko: "밭다리후리기",
  ja: "大外刈",
  romaji: "Osoto-gari",
  canonicalId: "o-soto-gari",
  group: "발기술",
  note: "오른발이 들어가고 왼발이 상대 옆에 빠르게 따라붙는 동시에, 오른다리로 상대의 오른다리를 후려 넘긴다.",
  ukemi: "side",
  duration: 3.08,
  impact: { t: 1.44, x: 65 },
  poster: 1.12,
  phases: [
    { name: "기울이기", t: 0 },
    { name: "들어가기", t: 0.2 },
    { name: "걸기", t: 0.82 },
    { name: "낙법", t: 1.44 },
  ],
  keys: [
    { t: 0, tori, uke, toriGrip: KUMI, ukeGrip: KUMI },
    { t: 0.15, tori, uke, toriGrip: KUMI, ukeGrip: KUMI },
    // Step 1: the right foot enters.
    {
      t: 0.36,
      tori: {
        p: [36, 21.8, -1],
        yaw: 6,
        lean: 5,
        feet: feet([40.5, -4], [27, -3]),
      },
      uke: { ...uke, rot: -3 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    // Step 2: the left foot follows fast, and the right is already leaving as it lands.
    {
      t: 0.46,
      tori: {
        p: [38.5, 21.8, -4],
        yaw: 3,
        lean: 3,
        feet: feet([40.5, -4], [37, -12, 2.5]),
      },
      uke: { ...uke, rot: -6, roll: 3 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 0.58,
      tori: {
        p: [41, 22.2, -7.5],
        yaw: 0,
        lean: 0,
        feet: feet([42, -8.5, 3], PIVOT),
      },
      uke: { ...uke, rot: -10, roll: 5 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 0.69,
      tori: {
        p: [42.2, 22.6, -9.5],
        yaw: 0,
        lean: -2,
        feet: feet([47, -11, 8], PIVOT),
      },
      uke: { ...uke, p: [52.3, 23.1, -0.5], rot: -13, roll: 6 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    // The right leg travels past the outside of uke's right leg...
    {
      t: 0.82,
      tori: {
        p: [43.5, 23, -10],
        yaw: 0,
        lean: -4,
        feet: feet([58, -10.5, 11], PIVOT),
      },
      uke: { ...uke, p: [52.5, 23, -1], rot: -16, roll: 6 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    // ...hooks in behind it...
    {
      t: 0.93,
      tori: {
        p: [43.5, 23, -10],
        yaw: 0,
        lean: 4,
        feet: feet([56, -5, 7], PIVOT),
      },
      uke: {
        p: [52.8, 23, -1],
        yaw: 170,
        rot: -26,
        roll: 6,
        legs: { r: [30, 12], l: [0, -22] },
      },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    // ...and reaps it away.
    {
      t: 1.04,
      tori: {
        p: [43.5, 23, -10],
        yaw: 0,
        lean: 18,
        feet: feet([46, -4, 5], PIVOT),
      },
      uke: {
        p: [53.5, 22.2, -1],
        yaw: 170,
        rot: -42,
        roll: 5,
        legs: { r: [50, 32], l: [-2, -32] },
      },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 1.16,
      tori: {
        p: [43.5, 22.8, -9],
        yaw: 0,
        lean: 40,
        feet: feet([31, -4, 13], PIVOT),
      },
      uke: {
        p: [54.5, 19.5, -1],
        yaw: 171,
        rot: -62,
        roll: 3,
        legs: { r: [68, 48], l: [-8, -42] },
      },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 1.3,
      tori: {
        p: [43.5, 22.5, -8],
        yaw: 0,
        lean: 60,
        feet: feet([25, -5, 24], PIVOT),
      },
      uke: {
        p: [56, 12, 0],
        yaw: 172,
        rot: -80,
        legs: { r: [78, 40], l: [14, -50] },
      },
      toriGrip: KUMI,
      ukeGrip: grip("lapel", "slap"),
    },
    {
      t: 1.44,
      hit: true,
      tori: {
        p: [43.5, 22, -8],
        yaw: 0,
        lean: 64,
        feet: feet([25, -5, 24], PIVOT),
      },
      uke: back(0),
      toriGrip: KUMI,
      ukeGrip: FALLEN,
    },
    {
      t: 1.83,
      tori: {
        p: [42.5, 21, -8],
        yaw: 2,
        lean: 54,
        feet: feet([35, -4], PIVOT),
      },
      uke: back(0.8),
      toriGrip: FINISH,
      ukeGrip: FALLEN,
    },
    {
      t: 3.08,
      tori: {
        p: [42.5, 21.4, -8],
        yaw: 2,
        lean: 48,
        feet: feet([35, -4], PIVOT),
      },
      uke: back(1),
      toriGrip: FINISH,
      ukeGrip: FALLEN,
    },
  ],
};
