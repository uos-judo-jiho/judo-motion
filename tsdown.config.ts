import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";
import type { UserConfig } from "tsdown";

// Resolve the same raw shader imports as Vite and inline them in both builds.
const glsl = {
  name: "glsl-raw",
  load(id: string) {
    if (!id.endsWith(".glsl?raw")) return;
    const source = readFileSync(id.slice(0, -"?raw".length), "utf8");
    return `export default ${JSON.stringify(source)};`;
  },
};

const config: UserConfig[] = defineConfig([
  {
    entry: { index: "src/index.ts", react: "src/react.ts" },
    format: "esm",
    plugins: [glsl],
    // Runs in browsers and is imported by SSR servers.
    platform: "neutral",
    target: "es2022",
    dts: true,
    sourcemap: true,
    clean: false,
    publint: true,
    attw: { profile: "esm-only" },
  },
  {
    // One minified file for plain <script type="module">.
    entry: { standalone: "src/index.ts" },
    format: "esm",
    plugins: [glsl],
    platform: "browser",
    target: "es2022",
    dts: false,
    minify: true,
    clean: false,
  },
]);

export default config;
