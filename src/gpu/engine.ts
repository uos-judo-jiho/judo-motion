/**
 * One WebGL2 context renders every visible animation into a shared atlas in a single instanced
 * draw call, then each view copies its tile to its own small canvas. Upscaling is left to the
 * compositor (image-rendering: pixelated), so cost depends on art pixels, not screen pixels.
 */
import { rasterize } from "../core/raster.ts";
import { MAX_PRIMS, STRIDE, buildScene, createScene } from "../core/scene.ts";
import type { Grid } from "../ids.ts";
import type { Cast } from "../characters/index.ts";
import type { Technique } from "../core/scene.ts";
import { FRAG, VERT } from "./shader.ts";

export interface View {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  technique: Technique;
  cast: Cast;
  grid: Grid;
  speed: number;
  /** 0 = follow the display refresh rate. */
  fps: number;
  playing: boolean;
  time: number;
  visible: boolean;
  dirty: boolean;
  onFrame?: ((time: number) => void) | undefined;
}

const CELL = 128,
  COLS = 8,
  MAX_ROWS = 8,
  CAPACITY = COLS * MAX_ROWS;

export const stats = { backend: "", fps: 0, cpuMs: 0, drawn: 0 };

class Engine {
  private views = new Set<View>();
  private raf = 0;
  private last = 0;
  private gl: WebGL2RenderingContext | null = null;
  private surface = document.createElement("canvas");
  private uSize: WebGLUniformLocation | null = null;
  private prims = new Float32Array(CAPACITY * MAX_PRIMS * STRIDE);
  private inst = new Float32Array(CAPACITY * 6);
  private scene = createScene();
  private ticks: number[] = [];
  private observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        for (const v of this.views)
          if (v.canvas === e.target) {
            v.visible = e.isIntersecting;
            v.dirty = true;
          }
      this.wake();
    },
    { rootMargin: "80px" },
  );

  constructor() {
    this.surface.width = CELL * COLS;
    this.surface.height = CELL;
    this.surface.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.gl = null;
      stats.backend = "CPU (GPU 컨텍스트 복구 중)";
    });
    this.surface.addEventListener("webglcontextrestored", () => {
      this.init();
      this.invalidate();
    });
    this.init();
  }

  private init() {
    const gl = this.surface.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
    this.gl = null;
    stats.backend = "CPU";
    if (!gl) return;
    const program = gl.createProgram()!;
    for (const [type, src] of [
      [gl.VERTEX_SHADER, VERT],
      [gl.FRAGMENT_SHADER, FRAG],
    ] as const) {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(sh));
      gl.attachShader(program, sh);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);
    this.uSize = gl.getUniformLocation(program, "uSize");
    gl.uniform1i(gl.getUniformLocation(program, "uPrims"), 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texStorage2D(
      gl.TEXTURE_2D,
      1,
      gl.RGBA32F,
      MAX_PRIMS * (STRIDE / 4),
      CAPACITY,
    );
    for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
      gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, this.inst.byteLength, gl.DYNAMIC_DRAW);
    for (const [loc, size, off] of [
      [0, 4, 0],
      [1, 2, 16],
    ]) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 24, off);
      gl.vertexAttribDivisor(loc, 1);
    }
    this.gl = gl;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    stats.backend = String(
      info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "WebGL2",
    );
  }

  add(v: View): void {
    this.views.add(v);
    this.observer.observe(v.canvas);
    this.wake();
  }
  remove(v: View): void {
    this.views.delete(v);
    this.observer.unobserve(v.canvas);
  }
  invalidate(): void {
    for (const v of this.views) v.dirty = true;
    this.wake();
  }
  wake(): void {
    if (!this.raf) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  private tick = (now: number) => {
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
    this.last = now;
    const batch: View[] = [];
    let active = false;
    for (const v of this.views) {
      if (!v.visible) continue;
      if (v.playing) {
        active = true;
        const before = v.fps ? Math.floor(v.time * v.fps) : -1;
        v.time = (v.time + dt * v.speed) % v.technique.duration;
        // Retro frame rates skip GPU work entirely between frames.
        if (!v.fps || Math.floor(v.time * v.fps) !== before) v.dirty = true;
      }
      if (v.dirty) {
        v.dirty = false;
        batch.push(v);
      }
    }
    const t0 = performance.now();
    for (let i = 0; i < batch.length; i += CAPACITY)
      this.draw(batch.slice(i, i + CAPACITY));
    if (batch.length)
      stats.cpuMs += (performance.now() - t0 - stats.cpuMs) * 0.1;
    stats.drawn = batch.length;
    this.ticks.push(now);
    while (now - this.ticks[0] > 1000) this.ticks.shift();
    stats.fps =
      this.ticks.length > 1
        ? ((this.ticks.length - 1) * 1000) / (now - this.ticks[0])
        : 0;
    // Sleep when nothing is moving; wake() restarts the loop.
    this.raf = active ? requestAnimationFrame(this.tick) : 0;
  };

  private draw(batch: View[]) {
    const { gl, inst, prims, scene } = this;
    const rows = Math.ceil(batch.length / COLS),
      height = rows * CELL;
    if (gl && this.surface.height < height) this.surface.height = height;
    const H = this.surface.height;
    batch.forEach((v, i) => {
      // Snap retro frame rates to whole frames.
      const t = v.fps ? Math.floor(v.time * v.fps + 1e-6) / v.fps : v.time;
      buildScene(v.technique, t, scene, v.cast);
      if (gl) {
        prims.set(scene.data, i * MAX_PRIMS * STRIDE);
        inst.set(
          [
            (i % COLS) * CELL,
            H - ((i / COLS) | 0) * CELL - v.grid,
            v.grid,
            i,
            scene.count,
            scene.dissolve,
          ],
          i * 6,
        );
      } else {
        const px = new Uint8ClampedArray(rasterize(scene, v.grid));
        v.ctx.putImageData(new ImageData(px, v.grid, v.grid), 0, 0);
      }
      v.onFrame?.(v.time);
    });
    if (!gl) return;
    gl.viewport(0, 0, this.surface.width, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(this.uSize, this.surface.width, H);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      MAX_PRIMS * (STRIDE / 4),
      batch.length,
      gl.RGBA,
      gl.FLOAT,
      prims,
      0,
    );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, inst, 0, batch.length * 6);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, batch.length);
    batch.forEach((v, i) => {
      v.ctx.globalCompositeOperation = "copy";
      v.ctx.drawImage(
        this.surface,
        (i % COLS) * CELL,
        ((i / COLS) | 0) * CELL,
        v.grid,
        v.grid,
        0,
        0,
        v.grid,
        v.grid,
      );
    });
  }
}

let instance: Engine | undefined;
export const engine = (): Engine => (instance ??= new Engine());
