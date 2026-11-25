/** Head styles, built around the head's centre from capsules. All fit the ~4.8 radius the contact solver assumes. */
import { SIDES, add, sign } from "../core/rig.ts";
import type { Body, V3 } from "../core/rig.ts";
import type { Character, Rgb } from "./index.ts";

export interface Pen {
  put: (a: V3, b: V3, ra: number, rb: number, col: Rgb, shade?: Rgb) => void;
  ball: (p: V3, r: number, col: Rgb, shade?: Rgb) => void;
}

export function drawHead(
  { put, ball }: Pen,
  body: Body,
  c: Character,
  line: Rgb,
): void {
  const { look, up, R } = body,
    [skin, skinD] = c.skin,
    [hair, hairD] = c.hair,
    accent = c.accent ?? skin;
  const h = (fw: number, u: number, sd = 0): V3 =>
    add(add(add(body.head, look, fw), up, u), R, sd);
  const toward = look[2] > 0.45,
    away = look[2] < -0.45;
  /** Sides of the face that can be seen. */
  const seen = SIDES.filter((s) => look[2] * 2.6 + R[2] * 2 * sign(s) > 0.7);
  const eyes = (col: Rgb, fw = 2.7, u = 0.1) => {
    for (const s of seen)
      put(
        h(fw, u, 1.5 * sign(s)),
        h(fw, u - 0.8, 1.5 * sign(s)),
        0.55,
        0.55,
        col,
      );
  };
  const skull = () => put(h(0.2, 0.7), h(0.5, -1.5), 4.1, 3.2, skin, skinD);
  const nose = () => ball(h(4.3, -0.9), 0.75, skin);
  const ears = () => {
    for (const s of SIDES)
      if (look[2] < 0.45 && R[2] * sign(s) > 0.5)
        ball(h(-0.5, -0.9, 2.5 * sign(s)), 0.8, skinD);
  };
  const hairCap = () => {
    if (toward) {
      ball(h(0, 0.8), 4.7, hair, hairD);
      put(h(1, 0.2), h(1, -1.5), 3.6, 3.1, skin, skinD);
      put(h(0, 3.2, -2.2), h(0, 3.2, 2.2), 2, 2, hair, hairD);
    } else if (away) {
      skull();
      put(h(-1, 1.2), h(-1, -0.6), 4.5, 4, hair, hairD);
    } else {
      skull();
      nose();
      put(h(-2.4, -0.6), h(-1.6, 1.8), 2.2, 2.9, hair, hairD);
      put(h(-1.4, 2.7), h(2.1, 2.8), 2.4, 1.8, hair, hairD);
    }
  };
  /** Draw behind the skull unless the back of the head faces us. */
  const behind = (extra: () => void, rest: () => void) => {
    if (away) {
      rest();
      extra();
    } else {
      extra();
      rest();
    }
  };

  switch (c.head) {
    case "short":
      hairCap();
      eyes(line);
      ears();
      break;
    case "ponytail":
      behind(() => {
        put(h(-4, 1.8), h(-6.4, -2.8), 1.8, 1, hair, hairD);
        ball(h(-4.2, 1.8), 1.3, 0xe05a6c);
      }, hairCap);
      eyes(line);
      ears();
      break;
    case "bun":
      behind(() => ball(h(-2.2, 5), 2.2, hair, hairD), hairCap);
      eyes(line);
      ears();
      break;
    case "curly":
      if (away) {
        skull();
        ball(h(-0.6, 1), 5.2, hair, hairD);
      } else {
        if (toward) ball(h(-0.6, 1.2), 5.3, hair, hairD);
        else {
          ball(h(-2, 1), 4.3, hair, hairD);
          ball(h(0.2, 2.8), 3.6, hair, hairD);
        }
        put(h(1.2, -0.2), h(1.1, -1.6), 3.4, 3, skin, skinD);
        if (!toward) nose();
        put(h(-0.8, 3.4, -1.4), h(1.8, 3.2, 1.4), 2.2, 1.9, hair, hairD);
      }
      eyes(line);
      break;
    case "bald":
      put(h(-0.8, 1), h(0.5, -1.4), 4.5, 3.4, skin, skinD);
      if (!toward && !away) nose();
      if (c.beard && !away)
        put(h(1.2, -3), h(2.6, -3.4), 1.9, 1.5, hair, hairD);
      for (const s of seen)
        put(h(2.9, 1.4, 1 * sign(s)), h(2.9, 1.4, 2 * sign(s)), 0.6, 0.6, hair);
      eyes(line);
      ears();
      break;
    case "bear":
    case "panda": {
      const [ear, earD] = c.head === "panda" ? c.hair : c.skin;
      for (const s of SIDES) ball(h(-0.4, 4, 3 * sign(s)), 1.8, ear, earD);
      put(h(-0.4, 0.6), h(0.2, -1), 4.6, 4.2, skin, skinD);
      if (!away) {
        put(h(2.4, -1.6), h(3.4, -1.7), 2.1, 1.7, accent);
        ball(h(4.7, -1), 0.9, line);
      }
      if (c.head === "panda") {
        for (const s of seen) ball(h(2.4, 0.1, 1.7 * sign(s)), 1.6, hair);
        eyes(0xffffff, 2.9, 0.4);
      } else eyes(line, 2.7, 0.6);
      break;
    }
    case "cat":
      for (const s of SIDES)
        put(
          h(-0.4, 3, 2.4 * sign(s)),
          h(-0.6, 6, 2.8 * sign(s)),
          1.9,
          0.4,
          skin,
          skinD,
        );
      put(h(-0.4, 0.5), h(0.2, -1.1), 4.5, 4, skin, skinD);
      put(h(-2.6, 3.4), h(-0.4, 4.2), 0.6, 0.6, skinD);
      if (!away) {
        ball(h(2.6, -1.8), 1.9, accent);
        ball(h(4.3, -1.1), 0.65, 0xe06a7a);
      }
      eyes(line, 2.7, 0.5);
      break;
    case "robot":
      put(h(0, 4), h(0, 6.4), 0.6, 0.6, hair);
      ball(h(0, 6.8), 1.1, accent);
      put(h(0, 1.2), h(0.1, -1.4), 4.5, 4.2, skin, skinD);
      for (const s of SIDES)
        if (R[2] * sign(s) > 0.3)
          ball(h(-0.8, -0.2, 3.4 * sign(s)), 1.3, hair, hairD);
      if (!away) {
        put(h(2.2, 0.2, -1.9), h(2.2, 0.2, 1.9), 1.7, 1.7, 0x22283a);
        eyes(accent, 3.2, 0.5);
      }
      break;
  }
}
