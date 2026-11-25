import { defineConfig } from "vite";
import type { UserConfig } from "vite";
import { exportApi } from "./server/vite-plugin.ts";

/** The local studio. The published library is built by tsdown. */
const config: UserConfig = defineConfig({
  plugins: [exportApi()],
  build: { outDir: "dist-app" },
  server: { port: 5180 },
  preview: { port: 5180 },
});

export default config;
