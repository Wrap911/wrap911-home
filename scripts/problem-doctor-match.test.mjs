import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

function load() {
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(fileURLToPath(new URL("../trainer/js/data_extra.js", import.meta.url)), "utf8"), sandbox);
  vm.runInContext(readFileSync(fileURLToPath(new URL("../trainer/js/problem-doctor-match.js", import.meta.url)), "utf8"), sandbox);
  return sandbox;
}

test("rivet and tenting keywords match trainer lessons and videos", () => {
  const sandbox = load();
  const hit = sandbox.WRAP911_DOCTOR_MATCH.matchCatalog(
    ["tenting", "rivet", "edge lift", "post-heat"],
    sandbox.WRAP911_DATA,
    3
  );
  assert.ok(hit.lessons.some((item) => item.id === "bt-rivet-mastery"), JSON.stringify(hit.lessons));
  assert.ok(hit.videos.some((item) => /rivet/i.test(item.title + " " + item.src)), JSON.stringify(hit.videos));
  assert.ok(hit.lessons.length <= 3);
  assert.ok(hit.videos.length <= 3);
});

test("an unrelated keyword does not invent a lesson", () => {
  const sandbox = load();
  const hit = sandbox.WRAP911_DOCTOR_MATCH.matchCatalog(["zzzzquantum"], sandbox.WRAP911_DATA, 3);
  assert.equal(hit.lessons.length, 0);
  assert.equal(hit.videos.length, 0);
});

test("recess wrinkles point at the van recess lesson", () => {
  const sandbox = load();
  const hit = sandbox.WRAP911_DOCTOR_MATCH.matchCatalog(["wrinkles", "recess"], sandbox.WRAP911_DATA, 3);
  assert.ok(hit.lessons.some((item) => item.id === "van-deep-recess"), JSON.stringify(hit.lessons));
});

test("rivet reads never suggest tuck, slit, or relief-cut lessons and rank rivet lessons first", () => {
  const sandbox = load();
  const data = {
    trainingLessons: sandbox.WRAP911_DATA.trainingLessons,
    VIDEO_CATALOG: (sandbox.WRAP911_DATA.VIDEO_CATALOG || []).concat([
      { id: "v-test-tuck", title: "Fleet van seam tuck", subcategory: "Seams", note: "Tuck a stripe into the body line. Seam tuck on a trailer rivet seam.", src: "" },
      { id: "v-test-slit", title: "Slit at a rivet", subcategory: "Rivets", note: "Relief cut at rivet heads.", src: "" },
    ]),
  };
  const kw = ["rivet", "tenting", "seam", "rivet brush", "post-heat", "trailer"];
  const hit = sandbox.WRAP911_DOCTOR_MATCH.matchCatalog(kw, data, 3);
  const all = hit.lessons.concat(hit.videos);
  for (const item of all) assert.doesNotMatch(item.title, /tuck|slit|relief cut/i, JSON.stringify(all));
  assert.match(hit.lessons[0].title, /rivet/i);
  assert.ok(hit.lessons.some((item) => item.id === "bt-rivet-mastery"), JSON.stringify(hit.lessons));
  assert.match(hit.videos[0].title, /rivet/i);
});

test("non-rivet reads can still match tuck lessons", () => {
  const sandbox = load();
  const data = {
    trainingLessons: sandbox.WRAP911_DATA.trainingLessons,
    VIDEO_CATALOG: [{ id: "v-test-tuck", title: "Fleet van seam tuck", subcategory: "Seams", note: "Seam tuck.", src: "" }],
  };
  const hit = sandbox.WRAP911_DOCTOR_MATCH.matchCatalog(["seam", "tuck"], data, 3);
  assert.ok(hit.videos.some((item) => item.id === "v-test-tuck"), JSON.stringify(hit.videos));
});
