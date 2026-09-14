const T = [
  { id:"transit-lr", cat:"van", name:"Cargo van — low roof, std wheelbase", aka:"Transit 130–148 LR · Express / Savana std · NV200 class", sqft:[280,380], hours:[6,9], views:"L / R / front / rear", pkgs:["Doors + hood lettering","50% sides","75% partial","Full color change"], noPrint:["Door gap","Handle pocket","Fuel door","Mirror sail","Sensor dots on bumper"], notes:"Biggest commercial volume. Keep phone number on the sliding door field, not across the gap." },
  { id:"transit-hr-ext", cat:"van", name:"Cargo van — high roof, extended", aka:"Transit 148 EXT HR · similar jumbo cargo", sqft:[480,625], hours:[10,16], views:"L / R / front / rear / roof", pkgs:["Sides only","Sides + rear doors","Full + roof"], noPrint:["Roof AC / fan","High-roof rain gutter","Rear camera wing"], notes:"Roof is extra labor and extra heat. Quote roof as its own line." },
  { id:"promaster", cat:"van", name:"ProMaster class — wide box van", aka:"Ram ProMaster 1500–3500", sqft:[360,520], hours:[8,14], views:"L / R / front / rear", pkgs:["Flat-side fleet","Partial + rear","Full"], noPrint:["Near-vertical A-pillar","Front sensor bar","Wide rear doors hinge"], notes:"Sides are flatter than Transit. Do not treat the snub nose like a car hood." },
  { id:"sprinter-144", cat:"sprinter", name:"Sprinter class — 144 WB, std/high roof", aka:"Sprinter 1500/2500 144", sqft:[400,520], hours:[8,13], views:"L / R / front / rear", pkgs:["Lettering package","50%","Full"], noPrint:["Fender flare return","Sliding door track cover","Rear step bumper sensors"], notes:"Fender curves eat film. Budget extra for the nose." },
  { id:"sprinter-170", cat:"sprinter", name:"Sprinter class — 170 / 170 EXT high roof", aka:"Sprinter 2500/3500 170 EXT", sqft:[520,650], hours:[12,18], views:"L / R / front / rear / roof", pkgs:["Sides + rear","Full no roof","Full + roof"], noPrint:["Roof fans","Rear wing camera","Dually fender if 3500"], notes:"Two-tech job. Do not let a new hire solo the roof." },
  { id:"box-16", cat:"box", name:"Box truck — 14–16 ft", aka:"Isuzu / Hino / F-650 14–16 box", sqft:[550,700], hours:[10,16], views:"L / R / front box / rear doors / cab optional", pkgs:["Box sides only","Box + rear","Box + cab"], noPrint:["Rivet rows if dry freight","Roll-up door slats","Corner castings","Marker lights"], notes:"Quote riveted dry freight different from smooth FRP. Rivets double time." },
  { id:"box-24", cat:"box", name:"Box truck — 20–26 ft", aka:"26 ft dry van box", sqft:[850,1100], hours:[16,28], views:"L / R / rear / front box", pkgs:["One side + rear","Both sides + rear","Full box + cab"], noPrint:["Seam joints","Dock bumpers","ICC bumper","Light boxes"], notes:"Seam plan first. Never run a phone number across a panel joint." },
  { id:"trl-7x16", cat:"trailer", name:"Enclosed trailer — 7x14 / 7x16", aka:"Common contractor trailer", sqft:[280,420], hours:[6,11], views:"L / R / rear doors", pkgs:["One side","Both sides + rear","Full including stone guard"], noPrint:["Continuous hinge","Latch cams","Fender flares","Stone chip zone on lower 8 in"], notes:"Hinge and latch destroy edges. Finish doors open. Slam-test before you leave." },
  { id:"trl-8x20", cat:"trailer", name:"Enclosed trailer — 8x20 / 8x24", aka:"Car hauler / large cargo trailer", sqft:[450,700], hours:[10,18], views:"L / R / rear / front wall", pkgs:["Sides only","Sides + rear","Full"], noPrint:["Ramp door seams","D-ring patches","Roof vents"], notes:"Rear ramp is a different card than swing doors." },
  { id:"f250", cat:"pickup", name:"3/4–1 ton crew cab work truck", aka:"F-250/350 · Silverado 2500 · Ram 2500 crew", sqft:[220,320], hours:[6,10], views:"L / R / tailgate / hood", pkgs:["Doors + tailgate","Bed sides + tailgate","Full including bumpers"], noPrint:["Door handle","Mirror sail","Bed-stake pockets","Backup sensors"], notes:"Tailgate is the failure magnet. Post-heat and photo it." }
];
const list = document.getElementById("list");
const detail = document.getElementById("detail");
let cat = "all";
function svgFor(t) {
  const isBox = t.cat === "box" || t.cat === "trailer";
  if (isBox) {
    return `<svg viewBox="0 0 640 220" role="img" aria-label="${t.name}"><rect x="40" y="50" width="520" height="120" fill="#1d2430" stroke="#6b7c93"/><rect x="40" y="50" width="70" height="120" fill="#243044" stroke="#6b7c93"/><rect x="520" y="70" width="40" height="100" fill="#243044" stroke="#6b7c93"/><circle cx="120" cy="175" r="22" fill="#0b0d10" stroke="#93a0b3"/><circle cx="470" cy="175" r="22" fill="#0b0d10" stroke="#93a0b3"/><text x="280" y="118" fill="#93a0b3" font-size="14" text-anchor="middle">SIDE FIELD</text></svg>`;
  }
  return `<svg viewBox="0 0 640 220" role="img" aria-label="${t.name}"><path d="M80 150 L110 90 L250 80 L520 90 L560 140 L560 170 L80 170 Z" fill="#1d2430" stroke="#6b7c93"/><rect x="210" y="88" width="110" height="82" fill="#243044" stroke="#6b7c93"/><rect x="330" y="88" width="150" height="82" fill="#1b3348" stroke="#3b82f6"/><circle cx="160" cy="170" r="24" fill="#0b0d10" stroke="#93a0b3"/><circle cx="470" cy="170" r="24" fill="#0b0d10" stroke="#93a0b3"/><text x="405" y="135" fill="#93a0b3" font-size="12" text-anchor="middle">SLIDE / CARGO</text></svg>`;
}
function renderList() {
  list.innerHTML = "";
  T.filter(t => cat === "all" || t.cat === cat).forEach(t => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `<h3>${t.name}</h3><div class="meta">${t.aka}</div>${svgFor(t)}<div class="meta">${t.sqft[0]}–${t.sqft[1]} sq ft · ${t.hours[0]}–${t.hours[1]} hrs</div><div class="pkg">${t.pkgs.map(p => `<span>${p}</span>`).join("")}</div><button class="go" data-open="${t.id}">Open template</button>`;
    list.appendChild(el);
  });
  list.querySelectorAll("[data-open]").forEach(b => b.onclick = () => openT(b.dataset.open));
}
function openT(id) {
  const t = T.find(x => x.id === id);
  const payload = { id:t.id, name:t.name, class:t.cat, aka:t.aka, coverage_sqft:t.sqft, shop_hours:t.hours, views:t.views, packages:t.pkgs, no_print_zones:t.noPrint, notes:t.notes, scale_note:"Schematic only. Measure the unit. RIP from a licensed outline.", app:"WRAP911" };
  detail.className = "detail card open";
  detail.innerHTML = `<h2>${t.name}</h2><p class="meta">${t.aka}</p>${svgFor(t)}<table><tr><th>Coverage</th><td>${t.sqft[0]}–${t.sqft[1]} sq ft</td></tr><tr><th>Labor</th><td>${t.hours[0]}–${t.hours[1]} hours</td></tr><tr><th>Views</th><td>${t.views}</td></tr><tr><th>Packages</th><td>${t.pkgs.join(" · ")}</td></tr></table><p><strong>No-print zones</strong></p><ul>${t.noPrint.map(z => `<li>${z}</li>`).join("")}</ul><p>${t.notes}</p><textarea readonly>${JSON.stringify(payload, null, 2)}</textarea><p><a class="go" href="trainer.html">Open lesson cards</a></p>`;
  detail.scrollIntoView({behavior:"smooth"});
}
document.querySelectorAll("#filters button").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll("#filters button").forEach(x => x.classList.toggle("on", x===b));
    cat = b.dataset.cat;
    detail.className = "detail card";
    renderList();
  };
});
renderList();
