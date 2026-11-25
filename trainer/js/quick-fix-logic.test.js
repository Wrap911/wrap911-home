var assert = require("assert");
var Q = require("./quick-fix-logic.js");

function top(q) {
  var r = Q.lookup(q);
  assert.ok(r.top, "expected a match for: " + q);
  return r.top.id;
}

assert.strictEqual(top("bubbles won't go away"), "bubbles");
assert.strictEqual(top("bubbles will not go away"), "bubbles");
assert.strictEqual(top("it won't stick by the edge"), "edge");
assert.strictEqual(top("film lifting around rivets"), "rivets");
assert.strictEqual(top("wrinkles in a recess"), "recess");
assert.strictEqual(top("how do I clean before I wrap"), "prep");
assert.strictEqual(top("film tore at the corner"), "tear");
assert.strictEqual(top("when do I stop and redo"), "redo");
assert.strictEqual(top("I overstretched the film"), "overstretch");
assert.strictEqual(top("dirt under the film"), "dirt");
assert.strictEqual(top("silvering"), "silvering");
assert.strictEqual(top("water bubbles"), "wet");

var blob = JSON.stringify(Q.CARDS);
assert.strictEqual(/Arlon/i.test(blob), false);
assert.strictEqual(/\$29/.test(blob), false);
assert.strictEqual(/buy\.stripe|Stripe/i.test(blob), false);
assert.strictEqual(/\d+\s*°/.test(blob), false);
assert.ok(/follow that film's TDS/i.test(blob) || /film's TDS/i.test(blob));
assert.ok(blob.indexOf("3M") !== -1 && blob.indexOf("Avery Dennison") !== -1 && blob.indexOf("BriteLine") !== -1);
Q.CARDS.forEach(function (c) {
  assert.ok(c.steps.length >= 4, c.id + " has steps");
  assert.ok(c.stop, c.id + " says when to stop");
  c.steps.forEach(function (s) {
    assert.ok(!/\b(40|50|60|70|80|90|100|120|140|160|180|200)\s*°/.test(s), "no temperatures in " + c.id);
  });
});
assert.ok(!Q.lookup("zzzz not a wrap problem").top);
console.log("quick-fix-logic.test.js ok");
