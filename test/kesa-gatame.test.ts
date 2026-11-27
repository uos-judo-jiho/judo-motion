import assert from "node:assert/strict";
import test from "node:test";
import { parseJob } from "../server/exporter.ts";
import { CAMERA_VIEWS } from "../src/core/camera.ts";
import { capsules, closest, overlap, solve } from "../src/core/physics.ts";
import { ANKLE, SIDES, dot, length, sub, unit } from "../src/core/rig.ts";
import { buildScene, createScene } from "../src/core/scene.ts";
import { TECHNIQUES, isTechnique } from "../src/index.ts";
import { kesaGatame } from "../src/techniques/kesa-gatame.ts";

test("kesa-gatame is listed as osaekomi and uses the shared camera presets", () => {
  const { id, poster } = kesaGatame;
  assert.ok(isTechnique(id));
  assert.equal(TECHNIQUES.find((tech) => tech.id === id)?.kind, "osaekomi");

  const solved = solve(kesaGatame, poster);
  const frames = CAMERA_VIEWS.map((view) => {
    assert.equal(parseJob({ technique: id, view }).view, view);
    const frame = buildScene(
      kesaGatame,
      poster,
      createScene(),
      undefined,
      view,
    );
    assert.deepEqual(solve(kesaGatame, poster).tori.pelvis, solved.tori.pelvis);
    assert.equal(frame.dissolve, 0);
    return frame.data;
  });
  assert.notDeepEqual(frames[0], frames[1]);
  assert.notDeepEqual(frames[1], frames[2]);
});

test("kesa-gatame keeps mat support and grips through the bridge and ends on the mat", () => {
  const [entry, formation, hold, escape, finish] = kesaGatame.phases;
  assert.deepEqual(
    [entry, formation, hold, escape, finish].map(({ name }) => name),
    ["준비·진입", "누르기 자세", "누르기 유지", "탈출 시도·대응", "종료"],
  );

  const initial = solve(kesaGatame, entry.t);
  const settled = solve(kesaGatame, hold.t + 0.5);
  const bridged = solve(kesaGatame, escape.t + 0.55);
  const end = solve(kesaGatame, kesaGatame.duration);

  assert.ok(bridged.uke.pelvis[1] - settled.uke.pelvis[1] > 3);
  assert.ok(initial.tori.pelvis[1] - settled.tori.pelvis[1] > 5);
  assert.ok(length(sub(end.tori.pelvis, settled.tori.pelvis)) < 0.5);

  let previous = initial;
  for (let frame = 1; frame < kesaGatame.duration * 144; frame++) {
    const t = frame / 144;
    const state = solve(kesaGatame, t);

    for (const arms of ["toriArms", "ukeArms"] as const)
      for (const side of SIDES)
        for (const joint of ["b", "c"] as const)
          assert.ok(
            length(sub(state[arms][side][joint], previous[arms][side][joint])) <
              1,
            `${arms} ${side} ${joint} at ${t}`,
          );
    previous = state;
    const [toriTorso] = capsules(state.tori, state.toriArms);
    for (const side of SIDES) {
      const arm = state.ukeArms[side];
      const upper = { ...toriTorso, a: arm.a, b: arm.b };
      const forearm = { ...toriTorso, a: arm.b, b: arm.c };
      assert.ok(
        closest(toriTorso, upper).dist > toriTorso.r,
        `uke ${side} upper arm at ${t}`,
      );
      assert.ok(
        closest(toriTorso, forearm).dist > toriTorso.r,
        `uke ${side} forearm at ${t}`,
      );
    }
    if (t < hold.t) continue;

    const rightArm = state.toriArms.r;
    const elbow = sub(rightArm.b, state.uke.neck);
    const wrist = sub(rightArm.c, state.uke.neck);
    assert.ok(
      dot(sub(rightArm.b, state.uke.shoulders.l), state.uke.U) > 4,
      `elbow reaches above the left shoulder at ${t}`,
    );
    assert.ok(
      dot(elbow, state.uke.R) < -2 && dot(wrist, state.uke.R) > 2,
      `forearm wraps across the neck at ${t}`,
    );
    assert.ok(
      dot(wrist, state.uke.F) < 0,
      `wrist stays behind the neck at ${t}`,
    );
    const elbowAngle = dot(
      unit(sub(rightArm.a, rightArm.b)),
      unit(sub(rightArm.c, rightArm.b)),
    );
    assert.ok(
      elbowAngle < Math.cos((Math.PI * 55) / 180),
      `right elbow avoids an acute fold at ${t}`,
    );
    const leftArm = state.toriArms.l;
    assert.ok(
      length(sub(leftArm.c, state.ukeArms.r.b)) < 2,
      `left hand cups uke's right elbow at ${t}`,
    );
    assert.ok(
      dot(sub(leftArm.b, leftArm.c), state.uke.F) > 3,
      `left forearm presses down toward the elbow at ${t}`,
    );
    const [ukeTorso] = capsules(state.uke, state.ukeArms);
    assert.ok(
      Math.abs(overlap(toriTorso, ukeTorso)) < 0.5,
      `chest contact at ${t}`,
    );
    assert.ok(state.uke.neck[1] < 5, `uke's upper back stays down at ${t}`);
    for (const side of SIDES) {
      assert.ok(Math.abs(state.tori.legs[side].c[1] - ANKLE) < 0.15);
      assert.ok(
        length(sub(state.tori.legs[side].c, settled.tori.legs[side].c)) < 0.15,
      );
      assert.ok(
        length(sub(state.toriArms[side].c, state.toriTargets[side])) < 0.15,
      );
    }
  }
});
