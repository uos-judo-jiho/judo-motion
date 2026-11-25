import { DEFAULT_CAST, resolveCast } from "../characters/index.ts";
import { renderMat } from "../core/mat.ts";
import { TECHNIQUES, findTechnique, fullName } from "../techniques/index.ts";
import { engine } from "./engine.ts";
import type { View } from "./engine.ts";
import { GRIDS } from "../ids.ts";
import type {
  CharacterId,
  GiId,
  Grid,
  TechniqueId,
  TechniqueName,
} from "../ids.ts";
import { describe } from "../techniques/info.ts";
import type { TechniqueInfo } from "../techniques/info.ts";

/** Lets the module be imported during server rendering, where there is no DOM. */
const Base = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

/** `true` or "" draws the tatami inside the frame, "wide" lets it spill past the sides. */
export type MatMode = boolean | "" | "wide";

/**
 * <judo-motion technique="seoi-nage" grid="96" fps="0" speed="1"></judo-motion>
 * tori / uke: character ids, tori-gi / uke-gi: jacket colours. Looks only; the motion is the same.
 * mat / mat="wide": draw the tatami layer behind the fighters (wide spills past the frame).
 * Drop-in replacement for a GIF: transparent, loops, and shares one GPU context across the page.
 */
export class JudoMotionElement extends Base {
  static readonly observedAttributes: readonly string[] = [
    "technique",
    "grid",
    "fps",
    "speed",
    "paused",
    "mat",
    "tori",
    "uke",
    "tori-gi",
    "uke-gi",
  ];
  readonly #view: View;
  readonly #floor: HTMLCanvasElement;
  readonly #internals: ElementInternals | undefined;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    // Accessibility goes through internals: writing attributes here would break React hydration.
    this.#internals = this.attachInternals?.();
    if (this.#internals) this.#internals.role = "img";
    root.innerHTML = `<style>:host{display:inline-block;position:relative;aspect-ratio:1;width:96px}canvas{display:block;position:relative;width:100%;height:100%;image-rendering:pixelated}.mat{position:absolute;top:0;pointer-events:none}.mat[hidden]{display:none}</style><canvas class="mat" hidden></canvas><canvas class="fighters"></canvas>`;
    const canvas = root.querySelector<HTMLCanvasElement>(".fighters")!;
    this.#floor = root.querySelector<HTMLCanvasElement>(".mat")!;
    canvas.width = canvas.height = 96;
    this.#view = {
      canvas,
      ctx: canvas.getContext("2d")!,
      technique: TECHNIQUES[0],
      cast: DEFAULT_CAST,
      grid: 96,
      speed: 1,
      fps: 0,
      playing: true,
      time: 0,
      visible: false,
      dirty: true,
    };
  }

  connectedCallback(): void {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.#view.playing = false;
      this.#view.time = this.#view.technique.poster;
    }
    this.#label();
    engine().add(this.#view);
  }
  disconnectedCallback(): void {
    engine().remove(this.#view);
  }

  attributeChangedCallback(
    name: string,
    _: string | null,
    value: string | null,
  ): void {
    const v = this.#view;
    if (name === "technique") {
      const t = findTechnique(value ?? "");
      if (t) {
        v.technique = t;
        v.time = v.playing ? 0 : t.poster;
        this.#label();
      }
    }
    if (name === "grid") {
      const g = GRIDS.find((x) => x === Number(value));
      if (g) {
        v.grid = g;
        v.canvas.width = v.canvas.height = g;
      }
    }
    if (name === "fps") v.fps = Math.max(0, Number(value) || 0);
    if (name === "speed") v.speed = Math.max(0, Number(value ?? 1) || 0);
    if (name === "paused") v.playing = value === null;
    if (/^(tori|uke)(-gi)?$/.test(name)) this.#recast();
    if (name === "mat" || name === "grid") this.#paintMat();
    v.dirty = true;
    if (this.isConnected) engine().wake();
  }

  /** Unknown ids keep the previous look instead of breaking the page. */
  #recast() {
    const at = (k: string) => this.getAttribute(k) ?? undefined;
    try {
      this.#view.cast = resolveCast({
        tori: at("tori"),
        uke: at("uke"),
        toriGi: at("tori-gi"),
        ukeGi: at("uke-gi"),
      });
    } catch (e) {
      console.warn((e as Error).message);
    }
  }

  /** The tatami is a separate static canvas, so it costs nothing per frame and can be dropped at any time. */
  #paintMat() {
    const mode = this.getAttribute("mat"),
      wide = mode === "wide" ? 3 : 1,
      { grid } = this.#view;
    this.#floor.hidden = mode === null;
    if (mode === null) return;
    this.#floor.width = grid * wide;
    this.#floor.height = grid;
    this.#floor.style.width = `${wide * 100}%`;
    this.#floor.style.left = `${((1 - wide) / 2) * 100}%`;
    this.#floor
      .getContext("2d")!
      .putImageData(
        new ImageData(
          new Uint8ClampedArray(renderMat(grid, wide)),
          grid * wide,
          grid,
        ),
        0,
        0,
      );
  }

  #label() {
    if (this.#internals)
      this.#internals.ariaLabel = `${fullName(this.#view.technique)} 애니메이션`;
  }
  /** The technique being shown. */
  get info(): TechniqueInfo {
    return describe(this.#view.technique);
  }
  /** Called with the time in seconds after every drawn frame. */
  get onFrame(): ((time: number) => void) | null {
    return this.#view.onFrame ?? null;
  }
  set onFrame(f: ((time: number) => void) | null) {
    this.#view.onFrame = f ?? undefined;
  }

  // Frameworks assign properties rather than attributes when both exist, so each one reflects.
  get technique(): TechniqueId {
    return this.#view.technique.id;
  }
  set technique(v: TechniqueName) {
    this.#reflect("technique", v);
  }
  get tori(): CharacterId {
    return this.#view.cast.tori.character.id;
  }
  set tori(v: CharacterId | null | undefined) {
    this.#reflect("tori", v);
  }
  get uke(): CharacterId {
    return this.#view.cast.uke.character.id;
  }
  set uke(v: CharacterId | null | undefined) {
    this.#reflect("uke", v);
  }
  get toriGi(): GiId {
    return this.#view.cast.tori.gi.id;
  }
  set toriGi(v: GiId | null | undefined) {
    this.#reflect("tori-gi", v);
  }
  get ukeGi(): GiId {
    return this.#view.cast.uke.gi.id;
  }
  set ukeGi(v: GiId | null | undefined) {
    this.#reflect("uke-gi", v);
  }
  get grid(): Grid {
    return this.#view.grid;
  }
  set grid(v: Grid | null | undefined) {
    this.#reflect("grid", v);
  }
  get fps(): number {
    return this.#view.fps;
  }
  set fps(v: number | null | undefined) {
    this.#reflect("fps", v);
  }
  get speed(): number {
    return this.#view.speed;
  }
  set speed(v: number | null | undefined) {
    this.#reflect("speed", v);
  }
  get paused(): boolean {
    return !this.#view.playing;
  }
  set paused(v: boolean | null | undefined) {
    this.#reflect("paused", v);
  }
  get mat(): MatMode {
    const m = this.getAttribute("mat");
    return m === null ? false : m === "wide" ? "wide" : true;
  }
  set mat(v: MatMode | null | undefined) {
    this.#reflect("mat", v);
  }
  #reflect(name: string, value: string | number | boolean | null | undefined) {
    if (value === null || value === undefined || value === false)
      this.removeAttribute(name);
    else this.setAttribute(name, value === true ? "" : String(value));
  }

  /** Playback position in seconds. */
  get currentTime(): number {
    return this.#view.time;
  }
  set currentTime(t: number) {
    this.#view.time = t;
    this.#view.dirty = true;
    engine().wake();
  }
}

// Importing twice (hot reload, two bundles) must not throw.
if (typeof customElements !== "undefined" && !customElements.get("judo-motion"))
  customElements.define("judo-motion", JudoMotionElement);
declare global {
  interface HTMLElementTagNameMap {
    "judo-motion": JudoMotionElement;
  }
}
