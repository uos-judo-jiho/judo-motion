import { copyFileSync } from 'node:fs';
import { defineConfig } from 'vite';

/** One dependency-free ES module plus its types, for use in other projects. */
export default defineConfig({
  publicDir: false,
  build: { outDir: 'lib', lib: { entry: 'src/lib.ts', formats: ['es'], fileName: () => 'judo-motion.js' }, minify: true, target: 'es2022' },
  plugins: [{ name: 'types', closeBundle() { for (const f of ['index.d.ts', 'react.d.ts']) copyFileSync(`types/${f}`, `lib/${f}`); } }],
});
