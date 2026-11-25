import { DEFAULT_CAST, resolveCast } from '../characters/index.ts';
import { renderMat } from '../core/mat.ts';
import type { Technique } from '../core/scene.ts';
import { TECHNIQUES, findTechnique, fullName } from '../techniques/index.ts';
import { GRIDS, engine } from './engine.ts';
import type { View } from './engine.ts';

/** Lets the module be imported during server rendering, where there is no DOM. */
const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

/**
 * <judo-motion technique="seoi-nage" grid="96" fps="0" speed="1"></judo-motion>
 * tori / uke: character ids, tori-gi / uke-gi: jacket colours. Looks only; the motion is the same.
 * mat / mat="wide": draw the tatami layer behind the fighters (wide spills past the frame).
 * Drop-in replacement for a GIF: transparent, loops, and shares one GPU context across the page.
 */
export class JudoMotion extends Base {
  static observedAttributes = ['technique', 'grid', 'fps', 'speed', 'paused', 'mat', 'tori', 'uke', 'tori-gi', 'uke-gi'];
  readonly view: View;
  private floor: HTMLCanvasElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>:host{display:inline-block;position:relative;aspect-ratio:1;width:96px}canvas{display:block;position:relative;width:100%;height:100%;image-rendering:pixelated}.mat{position:absolute;top:0;pointer-events:none}.mat[hidden]{display:none}</style><canvas class="mat" hidden></canvas><canvas class="fighters"></canvas>`;
    const canvas = root.querySelector<HTMLCanvasElement>('.fighters')!;
    this.floor = root.querySelector<HTMLCanvasElement>('.mat')!;
    canvas.width = canvas.height = 96;
    this.view = {
      canvas, ctx: canvas.getContext('2d')!, technique: TECHNIQUES[0], cast: DEFAULT_CAST, grid: 96,
      speed: 1, fps: 0, playing: true, time: 0, visible: false, dirty: true,
    };
  }

  connectedCallback() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { this.view.playing = false; this.view.time = this.view.technique.poster; }
    this.setAttribute('role', 'img');
    this.label();
    engine().add(this.view);
  }
  disconnectedCallback() { engine().remove(this.view); }

  attributeChangedCallback(name: string, _: string | null, value: string | null) {
    const v = this.view;
    if (name === 'technique') { const t = findTechnique(value ?? ''); if (t) { v.technique = t; v.time = v.playing ? 0 : t.poster; this.label(); } }
    if (name === 'grid') { const g = Number(value); if (GRIDS.some((x) => x === g)) { v.grid = g; v.canvas.width = v.canvas.height = g; } }
    if (name === 'fps') v.fps = Math.max(0, Number(value) || 0);
    if (name === 'speed') v.speed = Math.max(0, Number(value ?? 1) || 0);
    if (name === 'paused') v.playing = value === null;
    if (/^(tori|uke)(-gi)?$/.test(name)) this.recast();
    if (name === 'mat' || name === 'grid') this.paintMat();
    v.dirty = true;
    if (this.isConnected) engine().wake();
  }

  /** Unknown ids keep the previous look instead of breaking the page. */
  private recast() {
    const at = (k: string) => this.getAttribute(k) ?? undefined;
    try { this.view.cast = resolveCast({ tori: at('tori'), uke: at('uke'), toriGi: at('tori-gi'), ukeGi: at('uke-gi') }); } catch (e) { console.warn((e as Error).message); }
  }

  /** The tatami is a separate static canvas, so it costs nothing per frame and can be dropped at any time. */
  private paintMat() {
    const mode = this.getAttribute('mat'), wide = mode === 'wide' ? 3 : 1, { grid } = this.view;
    this.floor.hidden = mode === null;
    if (mode === null) return;
    this.floor.width = grid * wide; this.floor.height = grid;
    this.floor.style.width = `${wide * 100}%`; this.floor.style.left = `${((1 - wide) / 2) * 100}%`;
    this.floor.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(renderMat(grid, wide)), grid * wide, grid), 0, 0);
  }

  private label() { if (this.isConnected) this.setAttribute('aria-label', `${fullName(this.view.technique)} 애니메이션`); }
  /** Data of the technique being shown. */
  get info(): Technique { return this.view.technique; }

  // Frameworks assign properties rather than attributes when both exist, so each one reflects.
  private reflect(name: string, value: unknown) {
    if (value === null || value === undefined || value === false) this.removeAttribute(name);
    else this.setAttribute(name, value === true ? '' : String(value));
  }
  get technique() { return this.view.technique.id; }
  set technique(v: string) { this.reflect('technique', v); }
  get tori() { return this.view.cast.tori.character.id; }
  set tori(v: string) { this.reflect('tori', v); }
  get uke() { return this.view.cast.uke.character.id; }
  set uke(v: string) { this.reflect('uke', v); }
  get toriGi() { return this.view.cast.tori.gi.id; }
  set toriGi(v: string) { this.reflect('tori-gi', v); }
  get ukeGi() { return this.view.cast.uke.gi.id; }
  set ukeGi(v: string) { this.reflect('uke-gi', v); }
  get grid() { return this.view.grid; }
  set grid(v: number) { this.reflect('grid', v); }
  get fps() { return this.view.fps; }
  set fps(v: number) { this.reflect('fps', v); }
  get speed() { return this.view.speed; }
  set speed(v: number) { this.reflect('speed', v); }
  get paused() { return !this.view.playing; }
  set paused(v: boolean) { this.reflect('paused', v); }
  get mat(): string | boolean { return this.getAttribute('mat') ?? false; }
  set mat(v: string | boolean) { this.reflect('mat', v); }
  get currentTime() { return this.view.time; }
  set currentTime(t: number) { this.view.time = t; this.view.dirty = true; engine().wake(); }
}

// Importing twice (hot reload, two bundles) must not throw.
if (typeof customElements !== 'undefined' && !customElements.get('judo-motion')) customElements.define('judo-motion', JudoMotion);
declare global { interface HTMLElementTagNameMap { 'judo-motion': JudoMotion } }
