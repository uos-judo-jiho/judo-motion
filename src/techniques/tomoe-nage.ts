import type { Pose } from "../core/rig.ts";
import type { Technique } from "../core/scene.ts";
import { KUMI, feet, grip, sideFall } from "./common.ts";

const tori: Pose = {
  p: [31, 22.6, -1],
  yaw: 172,
  lean: 5,
  feet: feet([28, -4], [36.5, 2]),
};
const uke: Pose = {
  p: [10, 22.6, 0],
  yaw: 8,
  lean: 3,
  feet: feet([13.5, 8], [6, -8]),
};
/** Tori's right foot, deep between uke's feet; the hips sit down behind it. */
const DEEP: [number, number] = [17, -4];
/** Left hand further down the sleeve, right hand let go toward the lapel. */
const HELD = grip("lapel", "cuff");
const thrown = grip("beside", "slap");
const landed = (settle: number) => sideFall([77.6, 4.4, 5], 8, 270, settle);

export const tomoeNage: Technique = {
  id: "tomoe-nage",
  ko: "배대뒤치기",
  ja: "巴投",
  romaji: "Tomoe-nage",
  category: "ma-sutemi-waza",
  group: "누우며메치기",
  note: "오른발이 깊이 들어가고, 따라오는 왼발을 그대로 상대 배에 대어 뒤로 누우며 머리 너머로 넘긴다.",
  ukemi: "side",
  keepsLapel: true,
  slack: 20,
  camera: { scale: 0.86, center: 52 },
  duration: 3.2,
  impact: { t: 1.48, x: 75, z: 5 },
  poster: 1.02,
  phases: [
    { name: "기울이기", t: 0 },
    { name: "들어가기", t: 0.16 },
    { name: "걸기", t: 0.64 },
    { name: "낙법", t: 1.48 },
  ],
  keys: [
    { t: 0, tori, uke, toriGrip: KUMI, ukeGrip: KUMI },
    { t: 0.14, tori, uke, toriGrip: KUMI, ukeGrip: KUMI },
    // Step 1: the right foot enters deep.
    {
      t: 0.36,
      tori: {
        p: [26.5, 20, -2],
        yaw: 175,
        lean: 4,
        feet: feet(DEEP, [36.5, 2]),
      },
      uke: { ...uke, rot: 5 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    // Step 2: the left foot follows and, without touching down, goes up to the belly.
    {
      t: 0.46,
      tori: {
        p: [26.6, 18, -2],
        yaw: 177,
        rot: -10,
        lean: 10,
        feet: feet(DEEP, [31, 1.5, 3]),
      },
      uke: { ...uke, rot: 10, lean: 5 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 0.55,
      tori: {
        p: [26.8, 14.5, -2],
        yaw: 179,
        rot: -32,
        lean: 26,
        feet: feet(DEEP, [22.5, 0.5, 5]),
      },
      uke: { ...uke, p: [10.3, 22.7, 0], rot: 16, lean: 8 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 0.64,
      tori: {
        p: [26.8, 10, -2],
        yaw: 180,
        rot: -65,
        lean: 40,
        feet: feet(DEEP, [18.4, 0, 8.5]),
      },
      uke: { ...uke, p: [10.8, 22.9, 0], rot: 25, lean: 9 },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    // Tori sits close to the right heel and rolls back on a rounded spine; the left sole lifts uke.
    {
      t: 0.75,
      tori: {
        p: [26.7, 5.6, -2],
        yaw: 180,
        rot: -89,
        lean: 46,
        head: 12,
        feet: feet(DEEP, [18.2, 0, 15.8]),
      },
      uke: {
        p: [13.2, 23.6, 0],
        yaw: 8,
        rot: 45,
        lean: 7,
        legs: { r: [38, 14, 10], l: [32, 8, 10] },
      },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 0.87,
      tori: {
        p: [27, 4.7, -2],
        yaw: 180,
        rot: -90,
        lean: 36,
        head: 12,
        feet: feet(DEEP, [20.6, 0, 21.6]),
      },
      uke: {
        p: [17.2, 28.8, 0],
        yaw: 8,
        rot: 75,
        lean: 4,
        legs: { r: [76, 40, 10], l: [70, 34, 10] },
      },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 1.0,
      tori: {
        p: [27.2, 4.4, -2],
        yaw: 180,
        rot: -94,
        lean: 18,
        head: 8,
        feet: feet(DEEP, [26.2, 0, 23.4]),
      },
      uke: {
        p: [25.2, 32.8, 0.5],
        yaw: 8,
        rot: 118,
        legs: { r: [78, 40, 10], l: [70, 32, 10] },
      },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 1.12,
      tori: {
        p: [27.2, 4.4, -2.5],
        yaw: 180,
        rot: -95,
        lean: 8,
        head: 4,
        feet: feet(DEEP, [29.8, 0, 22.6]),
      },
      uke: {
        p: [37.5, 36, 2],
        yaw: 8,
        rot: 156,
        legs: { r: [58, 18, 8], l: [48, 8, 8] },
      },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 1.22,
      tori: {
        p: [28.6, 5.4, -3],
        yaw: 180,
        rot: -100,
        lean: 5,
        head: 8,
        feet: feet(DEEP, [28, -0.5, 20]),
      },
      uke: {
        p: [51.5, 35, 4],
        yaw: 8,
        rot: 188,
        legs: { r: [46, -4, 8], l: [32, -8, 8] },
      },
      toriGrip: KUMI,
      ukeGrip: KUMI,
    },
    {
      t: 1.34,
      tori: {
        p: [29.8, 6.2, -3.5],
        yaw: 180,
        rot: -104,
        lean: 3,
        head: 10,
        feet: feet(DEEP, [26.5, -1, 18]),
      },
      uke: {
        p: [66, 26, 5],
        yaw: 8,
        rot: 226,
        legs: { r: [44, -16, 6], l: [22, 0, 6] },
      },
      toriGrip: KUMI,
      ukeGrip: grip("lapel", "slap"),
    },
    {
      t: 1.48,
      hit: true,
      tori: {
        p: [30, 6, -4],
        yaw: 180,
        rot: -103,
        head: 10,
        feet: feet(DEEP, [25.5, -2, 16]),
      },
      uke: landed(0),
      toriGrip: KUMI,
      ukeGrip: thrown,
    },
    // The left hand keeps the sleeve overhead; the right is simply left reaching toward the lapel.
    {
      t: 1.95,
      tori: {
        p: [28.6, 4.6, -4],
        yaw: 180,
        rot: -90,
        spin: 8,
        lean: 1,
        head: 2,
        feet: feet([19, -8], [18, 0]),
      },
      uke: landed(0.8),
      toriGrip: HELD,
      ukeGrip: thrown,
    },
    {
      t: 3.2,
      tori: {
        p: [28.2, 4.4, -4],
        yaw: 180,
        rot: -90,
        spin: 8,
        lean: 1,
        head: 4,
        feet: feet([19, -8], [18, 0]),
      },
      uke: landed(1),
      toriGrip: HELD,
      ukeGrip: thrown,
    },
  ],
};
