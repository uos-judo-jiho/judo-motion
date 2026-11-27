import { LINE } from "../core/palette";
import { LIGHT } from "../core/raster";
import { WORLD } from "../core/rig";
import { DEPTH_SORTED_GROUP } from "../core/scene";
import fragment from "./shaders/fighter.frag.glsl?raw";
import vertex from "./shaders/fighter.vert.glsl?raw";

export const VERT: string = vertex;

// Keep these values in sync with the CPU renderer by using its constants.
export const FRAG: string = fragment.replace(
  "#version 300 es",
  `#version 300 es
#define JUDO_LINE ${LINE}
#define JUDO_LIGHT_X ${LIGHT[0]}
#define JUDO_LIGHT_Y ${LIGHT[1]}
#define JUDO_WORLD ${WORLD.toFixed(1)}
#define JUDO_DEPTH_SORTED_GROUP ${DEPTH_SORTED_GROUP}`,
);
