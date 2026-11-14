/* iOS bundle: trainer, assets, and fonts only.
   Marketing pages and Stripe Payment Links stay on the website and out of the app. */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const www = path.join(root, "www");
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www);
for (const name of ["trainer", "assets", "fonts"]) {
  fs.cpSync(path.join(root, name), path.join(www, name), { recursive: true });
}
fs.writeFileSync(
  path.join(www, "index.html"),
  '<!doctype html><meta http-equiv="refresh" content="0;url=trainer/index.html">\n'
);

const textExt = new Set([".js", ".html", ".css", ".json", ".md", ".webmanifest", ".txt"]);

function walk(dir, fn) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, fn);
    else if (textExt.has(path.extname(name))) fn(p);
  }
}

walk(www, function (p) {
  const text = fs.readFileSync(p, "utf8");
  if (!text.includes("buy.stripe.com")) return;
  const next = text
    .replace(/https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+/g, "")
    .replace(/buy\.stripe\.com/g, "");
  fs.writeFileSync(p, next);
});

const dropped = ["home.html", "trainer.html", "sample.html", "privacy.html", "templates.html", "templates.js", "config.js"];
for (const name of dropped) {
  if (fs.existsSync(path.join(www, name))) {
    console.error("bundle still has " + name);
    process.exit(1);
  }
}
const stripeHits = [];
walk(www, function (p) {
  if (fs.readFileSync(p, "utf8").includes("buy.stripe.com")) stripeHits.push(path.relative(www, p));
});
if (stripeHits.length) {
  console.error("buy.stripe.com still in the bundle:\n" + stripeHits.join("\n"));
  process.exit(1);
}
if (!fs.existsSync(path.join(www, "trainer", "index.html"))) {
  console.error("trainer/index.html missing from the bundle");
  process.exit(1);
}
console.log("www ready: trainer, assets, fonts");
