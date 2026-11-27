/** npm run export -- --format gif --size 256 [--technique seoi-nage] [--view side] [--fps 25] [--mat] [--tori bear --uke cat --toriGi black --ukeGi red] */
import { parseArgs } from "node:util";
import { definitionFor } from "../src/techniques/definitions";
import { TECHNIQUE_CATEGORIES } from "../src/techniques/categories";
import { TECHNIQUES, findTechnique, variantsOf } from "../src/techniques/index";
import { exportJob, parseJob } from "./exporter";

/** A base id exports every variant of it. */
const variantIds = (id: string) => {
  const all = variantsOf(id).map((t) => t.id);
  return all.length ? all : [id];
};
const { values } = parseArgs({
  options: {
    technique: { type: "string", short: "t" },
    category: { type: "string" },
    format: { type: "string", default: "gif" },
    size: { type: "string", default: "256" },
    fps: { type: "string", default: "25" },
    view: { type: "string", default: "front" },
    mat: { type: "boolean", default: false },
    tori: { type: "string" },
    uke: { type: "string" },
    toriGi: { type: "string" },
    ukeGi: { type: "string" },
  },
});
try {
  let ids = values.technique
    ? variantIds(values.technique)
    : TECHNIQUES.map((t) => t.id);
  if (values.category !== undefined) {
    const matches = Object.values(TECHNIQUE_CATEGORIES).filter(
      ({ id, group, subgroup }) =>
        values.category === id ||
        values.category === group ||
        values.category === subgroup,
    );
    if (!matches.length) throw new Error(`알 수 없는 분류: ${values.category}`);
    ids = ids.filter((id) => {
      const technique = findTechnique(id);
      if (!technique) throw new Error(`알 수 없는 기술: ${id}`);
      const { category } = definitionFor(technique.canonicalId);
      return matches.some(({ id }) => id === category);
    });
    if (!ids.length)
      throw new Error(`내보낼 기술이 없는 분류: ${values.category}`);
  }
  const jobs = ids.map((technique) => parseJob({ ...values, technique }));
  for (const r of await Promise.all(jobs.map(exportJob)))
    console.log(`${r.path}  ${(r.bytes / 1024).toFixed(1)}KB  ${r.ms}ms`);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
