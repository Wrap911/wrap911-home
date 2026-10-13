// Build committed .min.js / .min.css next to each source file. Sources stay the editable copy.
// Run: npm i --no-save terser csso && node scripts/build-min.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { minify } from "terser";
import { minify as cssMin } from "csso";
const root = new URL("..", import.meta.url).pathname;
const jsFiles = [
  ...readdirSync(join(root, "trainer/js")).filter((f) => f.endsWith(".js") && !f.endsWith(".min.js")).map((f) => "trainer/js/" + f),
  "assets/share.js",
  "templates.js",
];
const cssFiles = ["trainer/css/style.css", "trainer/css/theme-dark.css", "assets/shop-face.css"];
let before = 0, after = 0;
for (const f of jsFiles) {
  const src = readFileSync(join(root, f), "utf8");
  const out = await minify(src, { compress: { passes: 2 }, mangle: true, format: { comments: false } });
  writeFileSync(join(root, f.replace(/\.js$/, ".min.js")), out.code + "\n");
  before += src.length; after += out.code.length;
}
for (const f of cssFiles) {
  const src = readFileSync(join(root, f), "utf8");
  const out = cssMin(src, { restructure: false }).css;
  writeFileSync(join(root, f.replace(/\.css$/, ".min.css")), out + "\n");
  before += src.length; after += out.length;
}
console.log(`minified ${jsFiles.length} js + ${cssFiles.length} css: ${before} -> ${after} bytes`);
