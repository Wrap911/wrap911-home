import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import worker, { __resetDoctorLimitsForTests } from "./worker.js";
import { selectKbEntries, buildKbText, doctorSystemFor, isPpfNote, DOCTOR_SYSTEM } from "./doctor.js";
import { DOCTOR_KB } from "./doctor-kb.js";

const SAMPLE = readFileSync(fileURLToPath(new URL("./magenta-rivet-field-tented-heads.jpg", import.meta.url)));
const SAMPLE_URL = "data:image/jpeg;base64," + SAMPLE.toString("base64");
const ENV = { LLM_API_KEY: "test-key-not-for-clients", LLM_BASE_URL: "https://api.x.ai/v1", LLM_VISION_MODEL: "grok-4.7", DOCTOR_TEST_IP: "1", DOCTOR_RATE_PER_HOUR: "50", DOCTOR_TIMEOUT_MS: "5000" };

async function doctor(note, reply, ip) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, opts) => { calls.push(JSON.parse(opts.body)); return new Response(JSON.stringify({ output_text: JSON.stringify(reply) }), { status: 200 }); };
  try {
    const res = await worker.fetch(new Request("https://worker.test/coach/doctor", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://wrap911.com", "x-test-ip": ip },
      body: JSON.stringify({ consent: true, images: [SAMPLE_URL], note: note }),
    }), ENV);
    return { res, body: await res.json(), calls };
  } finally { globalThis.fetch = original; }
}

test("kb: bumper note pulls the bumper entry first; rivet note pulls rivets; no note pulls none", () => {
  assert.equal(selectKbEntries("Options on how to wrap this rear corvette bumper efficiently")[0].id, "bumper-deep-pockets");
  assert.equal(selectKbEntries("rivets tented on the box truck")[0].id, "rivets");
  assert.equal(selectKbEntries("bubbles in the storefront window film")[0].id, "storefront-glass");
  assert.equal(selectKbEntries("").length, 0);
});

test("kb: prompt text has every short rule, stays in budget, and has no temps, other brands, or cert words", () => {
  const full = doctorSystemFor("rear corvette bumper with deep taillight pockets and exhaust, seam?");
  for (const e of DOCTOR_KB) assert.ok(full.includes(e.digest), e.id);
  assert.ok(buildKbText("bumper seam inlay").length <= 14000);
  assert.ok(full.length < 26000, "system prompt length " + full.length);
  assert.doesNotMatch(full, /\d+\s*(°|degrees|F\b|C\b)/);
  assert.doesNotMatch(buildKbText("bumper seam rivet window wall cabinet"), /\b(arlon|oracal|orafol|hexis|vvivid|inozetek|kpmf|teckwrap)\b/i);
  assert.doesNotMatch(buildKbText("bumper"), /certif/i);
});

test("doctor: options flatten into fix_steps for shipped clients and come back raw too", async () => {
  __resetDoctorLimitsForTests();
  const { res, body, calls } = await doctor("Options on how to wrap this rear corvette bumper efficiently", {
    observations: "Corvette rear bumper cover, off the car, with four deep round taillight pockets.",
    likely_causes: ["One sheet stretched into four pockets will lift."],
    options: [
      { name: "Inlays in the pockets", when: "Customer car.", steps: ["Wrap each pocket first.", "Lay knifeless at each lip.", "Lay the main sheet and cut on the tape.", "Post-heat at 200 F."] },
      { name: "Split by planes", when: "Two faces.", steps: ["Wrap the halo.", "Seam on the body line."] },
    ],
    tools: ["3M Knifeless Tape", "Heat gun"],
    film: ["3M 2080 or Avery Dennison SW900."],
    prevention: ["Do not bridge the pocket."],
    lesson_keywords: ["bumper", "inlay", "knifeless"],
    confidence: "high",
  }, "203.0.113.201");
  assert.equal(res.status, 200);
  assert.match(calls[0].input[0].content, /INSTALL PLAYBOOK/);
  assert.match(calls[0].input[0].content, /Car bumper with deep pockets/);
  assert.match(body.fix_steps[0], /^Best option: Inlays in the pockets/);
  assert.equal(body.fix_steps[1], "Wrap each pocket first.");
  assert.doesNotMatch(body.fix_steps.join(" "), /200 F/);
  assert.ok(body.fix_steps.some((s) => /^Option 2: Split by planes/.test(s)));
  assert.ok(body.fix_steps.some((s) => /^Tools: 3M Knifeless Tape; Heat gun/.test(s)));
  assert.ok(body.fix_steps.some((s) => /^Film: 3M 2080/.test(s)));
  assert.equal(body.options.length, 2);
  assert.deepEqual(body.tools, ["3M Knifeless Tape", "Heat gun"]);
});

test("doctor: rivet read with options still leads with the rivet brush and post-heat per TDS", async () => {
  __resetDoctorLimitsForTests();
  const { body } = await doctor("trailer rivets", {
    observations: "Film is tented over a rivet row on a trailer.",
    likely_causes: ["Bridged rivets."],
    options: [{ name: "Fix", when: "Now.", steps: ["Slit each rivet and tuck it.", "Post-heat the area."] }],
    tools: ["Rivet brush"], film: [], prevention: [], lesson_keywords: ["rivet", "tenting"], confidence: "high",
  }, "203.0.113.202");
  assert.match(body.fix_steps[0], /rivet brush/i);
  assert.match(body.fix_steps[1], /post-heat/i);
  assert.match(body.fix_steps[1], /TDS/);
  assert.doesNotMatch(body.fix_steps.join(" "), /\bslit\b/i);
  assert.deepEqual(body.options, []);
});

test("doctor: low-confidence closer-photo read empties options, tools and film", async () => {
  __resetDoctorLimitsForTests();
  const { body } = await doctor("", {
    observations: "Too dark to read. Send a closer photo.", likely_causes: ["x"],
    options: [{ name: "Guess", when: "x", steps: ["Do a thing."] }], tools: ["x"], film: ["x"], prevention: ["x"], lesson_keywords: [], confidence: "low",
  }, "203.0.113.203");
  assert.deepEqual(body.fix_steps, []);
  assert.deepEqual(body.options, []);
  assert.deepEqual(body.tools, []);
  assert.deepEqual(body.film, []);
});

test("ppf: PPF notes pick PPF entries and the PPF directive; vinyl notes do not", () => {
  const note = "How do you wrap these rear bumpers? Doing color change PPF";
  assert.ok(isPpfNote(note));
  assert.ok(isPpfNote("clear bra on the hood"));
  assert.ok(isPpfNote("paint protection film silvering"));
  assert.ok(!isPpfNote("Options on how to wrap this rear corvette bumper efficiently"));
  const picked = selectKbEntries(note).map((e) => e.id);
  assert.equal(picked[0], "ppf-method");
  assert.ok(picked.includes("ppf-bumper"));
  const ppfText = buildKbText(note);
  assert.match(ppfText, /PPF JOB/);
  assert.match(ppfText, /PPF on a rear bumper/);
  assert.ok(ppfText.length <= 14000);
  const vinyl = selectKbEntries("rear corvette bumper with deep taillight pockets").map((e) => e.id);
  assert.ok(!vinyl.some((id) => id.startsWith("ppf-")), vinyl.join());
  assert.doesNotMatch(buildKbText("rear corvette bumper"), /PPF JOB/);
  const full = doctorSystemFor(note);
  assert.match(full, /PPF vs vinyl/);
  assert.match(full, /BriteLine makes no PPF/);
  assert.doesNotMatch(full, /\d+\s*(°|degrees|F\b|C\b)/);
  assert.doesNotMatch(full, /\b(xpel|stek|suntek|llumar)\b/i);
});

test("prompt: only say on or off the car when visible, and cover the on-car case", () => {
  assert.match(DOCTOR_SYSTEM, /Say a part is on the car only when you can see it mounted/);
  assert.match(DOCTOR_SYSTEM, /If you cannot tell, say neither/);
  assert.match(DOCTOR_SYSTEM, /pull the taillights, plate and exhaust tips if you can, or work it on the car/);
});

test("doctor: other options are a header line plus short separate steps; keywords lead with the surface", async () => {
  __resetDoctorLimitsForTests();
  const long = "Float the second piece in and slide it to the edge. Butt it tight to the first piece. Then go back and re-squeegee every edge twice. Then dry it off.";
  const { body } = await doctor("How do you wrap these rear bumpers? Doing color change PPF", {
    observations: "C6 Corvette rear bumper on the car, gray paint, round taillight pockets.",
    likely_causes: ["Forcing film into the pockets turns it white."],
    options: [
      { name: "Bulk with inlays", when: "Deep pockets.", steps: ["Mask and pull the taillights.", "Anchor top center with tack."] },
      { name: "Split on the body line", when: "Roll too narrow.", steps: ["Plan the join on the lower crease.", long] },
      { name: "Relief cuts", when: "Shallow pockets.", steps: ["Relief cut inside each pocket."] },
    ],
    tools: ["PPF squeegee"], film: ["Avery Dennison Spectrix."], prevention: ["Do not force the pockets."],
    lesson_keywords: ["post-heat", "seam", "knifeless", "PPF", "inlay", "bumper", "pocket", "corvette"],
    confidence: "high",
  }, "203.0.113.204");
  const fs = body.fix_steps;
  const h2 = fs.findIndex((s) => /^Option 2: Split on the body line\. Pick it when: Roll too narrow\.$/.test(s));
  assert.ok(h2 > 0, fs.join(" | "));
  assert.equal(fs[h2 + 1], "Plan the join on the lower crease.");
  assert.equal(fs[h2 + 2], "Float the second piece in and slide it to the edge. Butt it tight to the first piece.");
  assert.match(fs[h2 + 3], /^Option 3: Relief cuts/);
  for (const s of fs) assert.ok(s.length <= 240, s);
  assert.deepEqual(body.lesson_keywords, ["bumper", "pocket", "recess", "inlay", "corvette"]);
  assert.match(body.disclaimer, /3M or Avery Dennison PPF/);
  assert.doesNotMatch(body.disclaimer, /BriteLine/);
});
