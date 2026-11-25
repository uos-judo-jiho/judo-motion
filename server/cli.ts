/** npm run export -- --format gif --size 256 [--technique seoi-nage] [--fps 25] [--mat] [--tori bear --uke cat --toriGi black --ukeGi red] */
import { parseArgs } from 'node:util';
import { TECHNIQUES, variantsOf } from '../src/techniques/index.ts';
import { exportJob, parseJob } from './exporter.ts';

/** A base id exports every variant of it. */
const variantIds = (id: string) => { const all = variantsOf(id).map((t) => t.id); return all.length ? all : [id]; };
const { values } = parseArgs({ options: {
  technique: { type: 'string', short: 't' }, format: { type: 'string', default: 'gif' },
  size: { type: 'string', default: '256' }, fps: { type: 'string', default: '25' }, mat: { type: 'boolean', default: false },
  tori: { type: 'string' }, uke: { type: 'string' }, toriGi: { type: 'string' }, ukeGi: { type: 'string' },
} });
try {
  const jobs = (values.technique ? variantIds(values.technique) : TECHNIQUES.map((t) => t.id)).map((technique) => parseJob({ ...values, technique }));
  for (const r of await Promise.all(jobs.map(exportJob))) console.log(`${r.path}  ${(r.bytes / 1024).toFixed(1)}KB  ${r.ms}ms`);
} catch (e) { console.error(e instanceof Error ? e.message : e); process.exit(1); }
