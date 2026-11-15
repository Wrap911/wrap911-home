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
