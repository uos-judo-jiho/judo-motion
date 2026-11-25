import { defineConfig } from 'vite';
import { exportApi } from './server/vite-plugin.ts';

export default defineConfig({ plugins: [exportApi()], server: { port: 5180 }, preview: { port: 5180 } });
