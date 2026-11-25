import { defineConfig } from "tsdown";
import type { UserConfig } from "tsdown";

const config: UserConfig[] = defineConfig([
  {
    entry: { index: "src/index.ts", react: "src/react.ts" },
    format: "esm",
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
    platform: "browser",
    target: "es2022",
    dts: false,
    minify: true,
    clean: false,
  },
]);

export default config;
