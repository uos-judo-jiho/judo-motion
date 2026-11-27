import type { Pose } from "../core/rig.ts";
import type { Key, Technique } from "../core/types.ts";
import { feet, grip } from "./common.ts";

const uke: Pose = {
  p: [45, 4.5, 2],
  yaw: 180,
  rot: -90,
  head: 5,
  feet: feet([27, -3], [27, 8]),
};

const ready: Pose = {
  p: [49, 14, -14],
  yaw: -30,
  roll: 12,
  lean: 10,
  feet: feet([65, -16], [38, -25]),
};

const hold: Pose = {
  p: [49, 5.5, -8],
  yaw: -30,
  roll: 62,
  lean: 10,
  feet: ready.feet,
};

const bridge: Pose = {
  ...uke,
  p: [44, 9, 2],
  rot: -108,
  spin: 12,
  head: 16,
};

const open = grip("rest", "rest");
const pin = grip("back-collar", "elbow-wrap");
const caught = grip("pinned-arm", "rest");
const key = (
  t: number,
  tori: Pose,
  receiver: Pose,
  toriGrip = pin,
  ukeGrip = caught,
): Key => ({ t, tori, uke: receiver, toriGrip, ukeGrip });

export const kesaGatame: Technique = {
  id: "kesa-gatame",
  ko: "곁누르기",
  ja: "袈裟固",
  romaji: "Kesa-gatame",
  group: "누르기",
  kind: "osaekomi",
  note: "받기의 오른쪽에서 머리와 오른팔을 감싸고, 두 다리로 지지하며 누른다.",
  camera: { scale: 0.85, center: 48 },
  duration: 5.6,
  poster: 2,
  phases: [
    { name: "준비·진입", t: 0 },
    { name: "누르기 자세", t: 0.8 },
    { name: "누르기 유지", t: 1.4 },
    { name: "탈출 시도·대응", t: 2.6 },
    { name: "종료", t: 4.4 },
  ],
  keys: [
    key(0, ready, uke, open, open),
    key(0.8, { ...ready, p: [49, 9.8, -11], roll: 32 }, uke),
    key(1.4, hold, uke),
    key(2.6, hold, uke),
    key(3.15, { ...hold, p: [49, 6.8, -9], roll: 60 }, bridge),
    key(3.8, hold, uke),
    key(4.4, hold, uke),
    key(5.6, hold, uke),
  ],
};
