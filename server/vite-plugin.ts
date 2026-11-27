import type { IncomingMessage, ServerResponse } from "node:http";
import { execFile } from "node:child_process";
import type { Plugin } from "vite";
import { OUT_DIR, exportJob, parseJob } from "./exporter";

async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  let s = "";
  for await (const chunk of req) {
    s += chunk;
    if (s.length > 4096) throw new Error("요청이 너무 큽니다");
  }
  return JSON.parse(s || "{}");
}

async function handle(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  if (!req.url?.startsWith("/api/")) return next();
  const send = (code: number, data: unknown) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(data));
  };
  // Local tool endpoint: only same-origin JSON POSTs, so other sites cannot trigger ffmpeg.
  const origin = req.headers.origin;
  if (
    req.method !== "POST" ||
    !origin ||
    new URL(origin).host !== req.headers.host ||
    !req.headers["content-type"]?.startsWith("application/json")
  )
    return send(403, { error: "허용되지 않는 요청" });
  try {
    if (req.url === "/api/export")
      return send(200, await exportJob(parseJob(await body(req))));
    if (req.url === "/api/reveal") {
      if (process.platform === "darwin") execFile("open", [OUT_DIR]);
      return send(200, { ok: true });
    }
    send(404, { error: "없는 경로" });
  } catch (e) {
    send(400, { error: e instanceof Error ? e.message : String(e) });
  }
}

export const exportApi = (): Plugin => ({
  name: "judo-export-api",
  configureServer(s) {
    s.middlewares.use(handle);
  },
  configurePreviewServer(s) {
    s.middlewares.use(handle);
  },
});
