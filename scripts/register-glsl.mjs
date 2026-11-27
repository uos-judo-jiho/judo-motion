import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

// Match Vite's raw asset imports when Node loads the public API in tests.
registerHooks({
  load(url, context, nextLoad) {
    if (!url.startsWith("file:") || !url.endsWith(".glsl?raw"))
      return nextLoad(url, context);

    const text = readFileSync(new URL(url), "utf8");
    return {
      format: "module",
      shortCircuit: true,
      source: `export default ${JSON.stringify(text)};`,
    };
  },
});
