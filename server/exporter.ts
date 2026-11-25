/** Renders frames on the CPU and streams them into the locally installed ffmpeg. */
import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { castSuffix, resolveCast } from "../src/characters/index.ts";
import type { Cast, CastIds } from "../src/characters/index.ts";
import { over, renderMat } from "../src/core/mat.ts";
import { rasterize } from "../src/core/raster.ts";
import { buildScene, createScene } from "../src/core/scene.ts";
import { findTechnique } from "../src/techniques/index.ts";

export const OUT_DIR: string = fileURLToPath(
  new URL("../exports/", import.meta.url),
);
export const FORMATS = ["gif", "webp", "apng", "mp4", "webm"] as const;
/** Output size -> art grid. The ratio is always a whole number so pixels stay square. */
export const SIZES: Record<number, number> = {
  64: 64,
  96: 96,
  128: 128,
  192: 96,
  256: 128,
  384: 96,
  512: 128,
  768: 96,
};
/** GIF delays are whole centiseconds, so only divisors of 100 play at the exact speed. */
export const FPS = [10, 20, 25, 50] as const;
export type Format = (typeof FORMATS)[number];
export interface Job {
  technique: string;
  format: Format;
  size: number;
  fps: number;
  mat: boolean;
  cast: Cast;
}

/** Only plain strings and numbers from the outside world are accepted. */
const text = (v: unknown, fallback = ""): string =>
  typeof v === "string" || typeof v === "number" ? String(v) : fallback;

export function parseJob(q: Record<string, unknown>): Job {
  const job = {
    technique: text(q.technique),
    format: text(q.format, "gif") as Format,
    size: Number(q.size ?? 256),
    fps: Number(q.fps ?? 25),
    mat: q.mat === true || q.mat === "on",
    cast: resolveCast(
      Object.fromEntries(
        (["tori", "uke", "toriGi", "ukeGi"] as const).map((k) => [
          k,
          q[k] === undefined ? undefined : text(q[k]),
        ]),
      ) as CastIds,
    ),
  };
  if (!findTechnique(job.technique))
    throw new Error(`알 수 없는 기술: ${job.technique}`);
  if (!FORMATS.includes(job.format))
    throw new Error(`지원하지 않는 형식: ${job.format}`);
  if (!SIZES[job.size]) throw new Error(`지원하지 않는 크기: ${job.size}`);
  if (!FPS.some((f) => f === job.fps))
    throw new Error(`지원하지 않는 fps: ${job.fps}`);
  return job;
}

const hasVideoToolbox = process.platform === "darwin";

function codecArgs(format: Format): string[] {
  switch (format) {
    case "gif":
      return ["-loop", "0"];
    case "webp":
      return ["-c:v", "libwebp_anim", "-lossless", "1", "-loop", "0"];
    case "apng":
      return ["-plays", "0", "-f", "apng"];
    // Video has no portable alpha, so it is composited on the wall colour.
    case "mp4":
      return [
        ...(hasVideoToolbox
          ? ["-c:v", "h264_videotoolbox", "-b:v", "4M"]
          : ["-c:v", "libx264", "-crf", "14"]),
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
      ];
    case "webm":
      return [
        "-c:v",
        "libvpx-vp9",
        "-pix_fmt",
        "yuva420p",
        "-crf",
        "18",
        "-b:v",
        "0",
        "-auto-alt-ref",
        "0",
      ];
  }
}

export async function exportJob(
  job: Job,
): Promise<{ file: string; path: string; bytes: number; ms: number }> {
  const started = performance.now();
  await mkdir(OUT_DIR, { recursive: true });
  const tech = findTechnique(job.technique)!,
    grid = SIZES[job.size],
    frames = Math.round(tech.duration * job.fps);
  const file = `${tech.id}${castSuffix(job.cast)}-${job.size}${job.mat ? "-mat" : ""}.${job.format === "apng" ? "png" : job.format}`,
    path = join(OUT_DIR, file);
  const scale = `scale=${job.size}:${job.size}:flags=neighbor`;
  const filter =
    job.format === "gif"
      ? `${scale},split[a][b];[a]palettegen=reserve_transparent=1[p];[b][p]paletteuse=dither=none:alpha_threshold=128`
      : scale;
  const bg = job.format === "mp4";
  const ff = spawn("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-f",
    "rawvideo",
    "-pix_fmt",
    "rgba",
    "-s",
    `${grid}x${grid}`,
    "-r",
    String(job.fps),
    "-i",
    "-",
    "-vf",
    filter,
    ...codecArgs(job.format),
    path,
  ]);
  let err = "";
  ff.stderr.on("data", (d) => (err += d));
  const done = new Promise<void>((ok, fail) => {
    ff.on("error", (e) => fail(new Error(`ffmpeg 실행 실패: ${e.message}`)));
    ff.on("close", (code) =>
      code === 0
        ? ok()
        : fail(new Error(err.trim() || `ffmpeg 종료 코드 ${code}`)),
    );
  });
  // Surface ffmpeg failures through `done`; a closed pipe alone is not informative.
  done.catch(() => {});
  ff.stdin.on("error", () => {});
  const scene = createScene(),
    floor = job.mat ? renderMat(grid) : null;
  for (let i = 0; i < frames; i++) {
    const fighters = rasterize(
        buildScene(tech, i / job.fps, scene, job.cast),
        grid,
      ),
      px = floor ? over(floor, fighters) : fighters;
    if (bg)
      for (let j = 0; j < px.length; j += 4)
        if (!px[j + 3]) px.set([195, 211, 224, 255], j);
    if (!ff.stdin.write(px))
      await Promise.race([new Promise((r) => ff.stdin.once("drain", r)), done]);
  }
  ff.stdin.end();
  await done;
  return {
    file,
    path,
    bytes: (await stat(path)).size,
    ms: Math.round(performance.now() - started),
  };
}
