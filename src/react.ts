/** React 19 wrapper. Renders on the server; the element comes alive when the client loads. */
import { createElement } from "react";
import type {
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
  Ref,
} from "react";
import type { JudoMotionElement, MatMode } from "./gpu/element.ts";
import type { CameraView } from "./core/camera.ts";
import type { CharacterId, GiId, Grid, TechniqueName } from "./ids.ts";

export * from "./index.ts";

export interface JudoMotionProps extends Omit<
  HTMLAttributes<JudoMotionElement>,
  "children"
> {
  technique: TechniqueName;
  view?: CameraView;
  /** Attacker and defender. */
  tori?: CharacterId;
  uke?: CharacterId;
  toriGi?: GiId;
  ukeGi?: GiId;
  /** Art pixels per side. */
  grid?: Grid;
  /** 0 follows the display. */
  fps?: number;
  speed?: number;
  paused?: boolean;
  /** Tatami floor; "wide" spills past the frame. */
  mat?: MatMode;
  ref?: Ref<JudoMotionElement>;
}

export function JudoMotion({
  toriGi,
  ukeGi,
  style,
  ...rest
}: JudoMotionProps): ReactElement {
  return createElement("judo-motion", {
    ...rest,
    "tori-gi": toriGi,
    "uke-gi": ukeGi,
    // Reserve the box before the script loads so nothing shifts. An inline
    // width would beat utility classes, so it is only a fallback.
    style: {
      display: "inline-block",
      aspectRatio: "1",
      ...(rest.className ? {} : { width: 96 }),
      ...style,
    },
  });
}

type ElementProps = DetailedHTMLProps<
  HTMLAttributes<JudoMotionElement>,
  JudoMotionElement
> &
  Omit<
    JudoMotionProps,
    keyof HTMLAttributes<JudoMotionElement> | "ref" | "toriGi" | "ukeGi"
  > & { "tori-gi"?: GiId; "uke-gi"?: GiId };

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "judo-motion": ElementProps;
    }
  }
}
