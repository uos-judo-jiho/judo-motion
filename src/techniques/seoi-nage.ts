import type { Technique } from "../core/scene";
import {
  CARRIED,
  FALLEN,
  FINISH,
  KUMI,
  TURNED,
  feet,
  opening,
  sideFall,
  ukeStand,
} from "./common";

// Parallel "11" stance set on a diagonal: both feet side by side, perpendicular to the direction tori faces.
const YAW = 35,
  SET = feet([38.4, 3.7], [43.6, -3.7]);

export const seoiNage: Technique = {
  id: "seoi-nage",
  ko: "업어치기",
  ja: "背負投",
  romaji: "Seoi-nage",
  canonicalId: "seoi-nage",
  group: "손기술",
  note: "오른발부터 파고들어 두 발을 11자로 나란히 놓고, 상대를 등에 업어 어깨 너머로 메친다.",
  ukemi: "side",
  duration: 3.2,
  impact: { t: 1.6, x: 60, z: 8 },
  poster: 1.2,
  phases: [
    { name: "기울이기", t: 0 },
    { name: "들어가기", t: 0.24 },
    { name: "걸기", t: 0.94 },
    { name: "낙법", t: 1.6 },
  ],
  keys: [
    ...opening(ukeStand(29), 50),
    {
      t: 0.36,
      tori: {
        p: [49, 22, 0],
        yaw: 162,
        lean: 4,
        feet: feet([42, 0, 3], [54, 3]),
      },
      uke: { ...ukeStand(29), lean: 7 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 0.5,
      tori: {
        p: [48, 20.6, 1],
        yaw: 140,
        lean: 8,
        feet: feet([38.4, 3.7], [54, 3]),
      },
      uke: { ...ukeStand(29), rot: 6, lean: 6 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 0.72,
      tori: {
        p: [42.5, 18, 0.5],
        yaw: 85,
        lean: 10,
        feet: feet([38.4, 3.7], [50, -3, 3]),
      },
      uke: { ...ukeStand(29), p: [30, 23.3, 0], rot: 11, lean: 6 },
      toriGrip: TURNED,
      ukeGrip: CARRIED,
    },
    {
      t: 0.94,
      tori: { p: [39.5, 14.5, 0], yaw: YAW, lean: 26, feet: SET },
      uke: { ...ukeStand(29), p: [32, 23.5, 1], yaw: 20, rot: 22, lean: 8 },
      toriGrip: TURNED,
      ukeGrip: CARRIED,
    },
    {
      t: 1.22,
      tori: { p: [38.5, 20, 0], yaw: YAW, lean: 66, head: -10, feet: SET },
      uke: {
        p: [40, 34, 3],
        yaw: YAW,
        rot: 112,
        legs: { r: [0, -16, 4], l: [-10, -30, 4] },
      },
      toriGrip: TURNED,
      ukeGrip: CARRIED,
    },
    {
      t: 1.44,
      tori: { p: [37.5, 20, 0], yaw: YAW, lean: 88, feet: SET },
      uke: {
        p: [59, 24, 9],
        yaw: 28,
        rot: 228,
        lean: 8,
        legs: { r: [12, -6, 4], l: [0, -22, 4] },
      },
      toriGrip: TURNED,
      ukeGrip: CARRIED,
    },
    {
      t: 1.6,
      hit: true,
      tori: { p: [37.5, 19.4, 0], yaw: YAW, lean: 74, feet: SET },
      uke: sideFall([62, 4.4, 9], 8, 270, 0),
      toriGrip: KUMI,
      ukeGrip: FALLEN,
    },
    {
      t: 1.95,
      tori: { p: [37.5, 20.5, 0], yaw: 25, lean: 52, feet: SET },
      uke: sideFall([62, 4.4, 9], 8, 270, 0.8),
      toriGrip: FINISH,
      ukeGrip: FALLEN,
    },
    {
      t: 3.2,
      tori: { p: [37.5, 21, 0], yaw: 25, lean: 44, feet: SET },
      uke: sideFall([62, 4.4, 9], 8, 270, 1),
      toriGrip: FINISH,
      ukeGrip: FALLEN,
    },
  ],
};
