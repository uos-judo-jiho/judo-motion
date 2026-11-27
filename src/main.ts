import "./style.css";
import "./gpu/element";
import { CHARACTERS, DEFAULT_IDS, GIS, resolveCast } from "./characters/index";
import { portrait } from "./characters/portrait";
import type { JudoMotionElement } from "./gpu/element";
import { definitionFor } from "./techniques/definitions";
import { TECHNIQUE_CATEGORIES } from "./techniques/categories";
import { engine, stats } from "./gpu/engine";
import {
  TECHNIQUES,
  baseId,
  findTechnique,
  variantsOf,
} from "./techniques/index";

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const hero = $<JudoMotionElement>("hero"),
  seek = $<HTMLInputElement>("seek"),
  play = $<HTMLButtonElement>("play");
const phases = $("phases"),
  result = $<HTMLOutputElement>("result");

function setPlaying(on: boolean) {
  hero.toggleAttribute("paused", !on);
  play.textContent = on ? "멈춤" : "재생";
}

function select(id: string) {
  const t = findTechnique(id) ?? TECHNIQUES[0];
  hero.setAttribute("technique", t.id);
  $("ko").textContent = t.ko;
  $("ja").textContent = t.ja;
  $("meta").textContent =
    `${t.romaji} / ${TECHNIQUE_CATEGORIES[definitionFor(t.canonicalId).category].nameKo}`;
  $("note").textContent = t.note;
  phases.replaceChildren(
    ...t.phases.map((p, i) => {
      const li = document.createElement("li"),
        b = document.createElement("button");
      li.style.flexGrow = String((t.phases[i + 1]?.t ?? t.duration) - p.t);
      b.textContent = p.name;
      b.onclick = () => {
        setPlaying(false);
        hero.currentTime = p.t;
      };
      li.append(b);
      return li;
    }),
  );
  document
    .querySelectorAll<HTMLElement>("#cards button")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.id === baseId(t))),
    );
  document
    .querySelectorAll("#sizes judo-motion")
    .forEach((m) => m.setAttribute("technique", t.id));
  const variants = variantsOf(baseId(t)),
    box = $<HTMLFieldSetElement>("variant");
  box.hidden = variants.length < 2;
  box.querySelectorAll("label").forEach((l) => l.remove());
  if (variants.length > 1)
    choices(
      "variant",
      variants.map((v) => [v.id, v.variant!.label]),
      t.id,
      select,
    );
  result.textContent = "";
  if (location.hash.slice(1) !== t.id)
    history.replaceState(null, "", `#${t.id}`);
}

const bases = [...new Set(TECHNIQUES.map(baseId))].map((id) =>
  findTechnique(id)!,
);
$("cards").replaceChildren(
  ...bases.map((t) => {
    const li = document.createElement("li"),
      b = document.createElement("button"),
      m = document.createElement("judo-motion"),
      s = document.createElement("span");
    b.dataset.id = baseId(t);
    m.setAttribute("technique", t.id);
    s.textContent = t.ko;
    b.append(m, s);
    b.onclick = () =>
      select(baseId(hero.info) === baseId(t) ? hero.technique : t.id);
    li.append(b);
    return li;
  }),
);

$("sizes").replaceChildren(
  ...["light", "dark"].map((theme) => {
    const row = document.createElement("div");
    row.className = theme;
    for (const [px, grid] of [
      [128, 128],
      [96, 96],
      [64, 64],
      [32, 64],
    ]) {
      const m = document.createElement("judo-motion");
      m.setAttribute("grid", String(grid));
      m.style.width = `${px}px`;
      m.title = `${px}px`;
      row.append(m);
    }
    return row;
  }),
);

function choices(
  id: string,
  options: [string, string][],
  initial: string,
  apply: (v: string) => void,
) {
  for (const [value, text] of options) {
    const label = document.createElement("label"),
      input = document.createElement("input");
    input.type = "radio";
    input.name = id;
    input.value = value;
    input.checked = value === initial;
    input.onchange = () => apply(value);
    label.append(input, text);
    $(id).append(label);
  }
}
choices(
  "speed",
  [
    ["0.25", "¼"],
    ["0.5", "½"],
    ["1", "1배"],
  ],
  "1",
  (v) => hero.setAttribute("speed", v),
);
choices(
  "fps",
  [
    ["12", "12"],
    ["24", "24"],
    ["0", "최대"],
  ],
  "0",
  (v) => hero.setAttribute("fps", v),
);
choices(
  "grid",
  [
    ["64", "굵게"],
    ["96", "보통"],
    ["128", "곱게"],
  ],
  "96",
  (v) => hero.setAttribute("grid", v),
);

choices(
  "mat",
  [
    ["on", "깔기"],
    ["off", "빼기"],
  ],
  "on",
  (v) => {
    hero.toggleAttribute("mat", v === "on");
    if (v === "on") hero.setAttribute("mat", "wide");
  },
);
choices(
  "view",
  [
    ["front", "정면"],
    ["three-quarter", "사선"],
    ["side", "측면"],
  ],
  "front",
  (v) => hero.setAttribute("view", v),
);

// Characters: the same look is applied to every animation on the page.
type CastKey = keyof typeof DEFAULT_IDS;
const KEYS = Object.keys(DEFAULT_IDS) as CastKey[];
let cast: Record<CastKey, string> = { ...DEFAULT_IDS };
try {
  const saved = JSON.parse(localStorage.getItem("cast") ?? "{}");
  const merged = Object.fromEntries(
    KEYS.map((k) => [k, String(saved[k] ?? DEFAULT_IDS[k])]),
  ) as typeof cast;
  resolveCast(merged);
  cast = merged;
} catch {
  /* first visit, storage blocked, or a character that no longer exists */
}

for (const role of ["tori", "uke"] as const) {
  for (const c of CHARACTERS) {
    const label = document.createElement("label"),
      input = document.createElement("input"),
      pic = portrait(c.id, role);
    input.type = "radio";
    input.name = role;
    input.value = c.id;
    input.setAttribute("aria-label", c.ko);
    input.onchange = () => setCast({ [role]: c.id });
    label.title = c.ko;
    label.append(input, pic);
    $(role).append(label);
  }
  choices(
    `${role}Gi`,
    GIS.map((g) => [g.id, g.ko]),
    "",
    (v) => setCast({ [`${role}Gi`]: v }),
  );
}

function setCast(change: Partial<typeof cast>) {
  cast = { ...cast, ...change };
  const attr = {
    tori: "tori",
    uke: "uke",
    toriGi: "tori-gi",
    ukeGi: "uke-gi",
  } as const;
  for (const m of document.querySelectorAll("judo-motion"))
    for (const k of KEYS) m.setAttribute(attr[k], cast[k]);
  for (const k of KEYS)
    document.querySelector<HTMLInputElement>(
      `#${k} input[value="${cast[k]}"]`,
    )!.checked = true;
  try {
    localStorage.setItem("cast", JSON.stringify(cast));
  } catch {
    /* storage blocked */
  }
}
$("swap").onclick = () => setCast({ tori: cast.uke, uke: cast.tori });
$("reset").onclick = () => setCast({ ...DEFAULT_IDS });
$("shuffle").onclick = () => {
  const [a, b] = CHARACTERS.map((c) => c.id).sort(() => Math.random() - 0.5);
  setCast({ tori: a, uke: b });
};
setCast({});

play.onclick = () => setPlaying(hero.paused);
seek.oninput = () => {
  setPlaying(false);
  hero.currentTime = Math.min(Number(seek.value), 0.9999) * hero.info.duration;
};
hero.onFrame = (time) => {
  const t = hero.info;
  seek.value = String(time / t.duration);
  const now = t.phases.findLastIndex((p) => time >= p.t);
  for (let i = 0; i < phases.children.length; i++)
    phases.children[i].classList.toggle("on", i === now);
};

async function post(url: string, data: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({
    error: "로컬 서버에 연결할 수 없습니다. pnpm dev로 실행해 주세요.",
  }));
  if (!res.ok) throw new Error(json.error);
  return json;
}
$<HTMLFormElement>("export").onsubmit = async (e) => {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement,
    btn = (e as SubmitEvent).submitter as HTMLButtonElement;
  btn.disabled = true;
  result.textContent = "ffmpeg로 만드는 중";
  try {
    const r = await post("/api/export", {
      technique: hero.technique,
      view: hero.view,
      ...cast,
      ...Object.fromEntries(new FormData(form)),
    });
    result.textContent = `exports/${r.file} 저장됨 (${(r.bytes / 1024).toFixed(1)}KB, ${(r.ms / 1000).toFixed(1)}초)`;
  } catch (err) {
    result.textContent = `실패: ${(err as Error).message}`;
  }
  btn.disabled = false;
};
$("reveal").onclick = () =>
  post("/api/reveal", {}).catch(
    (err: Error) => (result.textContent = `실패: ${err.message}`),
  );

addEventListener("hashchange", () => select(location.hash.slice(1)));
setPlaying(!matchMedia("(prefers-reduced-motion: reduce)").matches);
select(location.hash.slice(1));
engine().wake();
const gpuName = () =>
  /ANGLE \([^,]*,\s*(?:ANGLE Metal Renderer:\s*)?([^,]+)/
    .exec(stats.backend)?.[1]
    .trim() ?? stats.backend;
setInterval(() => {
  $("gpu").textContent =
    `${gpuName()}, ${Math.round(stats.fps)}fps, 프레임당 CPU ${stats.cpuMs.toFixed(2)}ms`;
}, 500);
