/* Playback policy for trainer/js/video-fix.js.
   Web HEAD 404 / non-video stays "missing". Capacitor status 0 and the native shell play. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function headers(type) {
  return { get: function (name) { return String(name).toLowerCase() === "content-type" ? type : null; } };
}

function makeDocument() {
  const nodes = [];
  function matches(node, sel) {
    if (sel === "video") return node.tag === "video";
    if (sel === "video.catalog-clip") return node.tag === "video" && node.className.indexOf("catalog-clip") >= 0;
    if (sel === ".video-still") return node.className.indexOf("video-still") >= 0;
    if (sel === ".video-play-error") return node.className.indexOf("video-play-error") >= 0;
    if (sel === ".video-links") return node.className.indexOf("video-links") >= 0;
    if (sel === ".video-play-btn") return node.className.indexOf("video-play-btn") >= 0;
    if (sel === ".video-player-host") return node.className.indexOf("video-player-host") >= 0;
    if (sel === ".video-card") return node.className.indexOf("video-card") >= 0;
    if (sel === "#video-list video") return node.id === "video-list" ? false : node.tag === "video";
    if (sel === "#video-list") return node.id === "video-list";
    if (sel === ".app-header") return node.className.indexOf("app-header") >= 0;
    return false;
  }
  function walk(node, sel, out) {
    if (matches(node, sel)) out.push(node);
    (node.children || []).forEach(function (child) { walk(child, sel, out); });
  }
  function el(tag) {
    const node = {
      tag: tag,
      id: "",
      className: "",
      hidden: false,
      textContent: "",
      attrs: {},
      children: [],
      parentNode: null,
      style: {},
      listeners: {},
      setAttribute: function (k, v) {
        this.attrs[k] = v;
        if (k === "id") this.id = v;
        if (k === "class") this.className = v;
      },
      getAttribute: function (k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
      appendChild: function (child) { child.parentNode = this; this.children.push(child); return child; },
      insertBefore: function (child, ref) {
        child.parentNode = this;
        const i = ref ? this.children.indexOf(ref) : 0;
        this.children.splice(i < 0 ? this.children.length : i, 0, child);
        return child;
      },
      removeChild: function (child) {
        const i = this.children.indexOf(child);
        if (i >= 0) this.children.splice(i, 1);
        child.parentNode = null;
      },
      addEventListener: function (type, fn) {
        (this.listeners[type] = this.listeners[type] || []).push(fn);
      },
      querySelector: function (sel) {
        const out = [];
        walk(this, sel, out);
        return out[0] || null;
      },
      querySelectorAll: function (sel) {
        const out = [];
        walk(this, sel, out);
        return out;
      },
      closest: function (sel) {
        let n = this;
        while (n) {
          if (matches(n, sel)) return n;
          n = n.parentNode;
        }
        return null;
      },
      play: function () { return Promise.resolve(); },
      pause: function () {}
    };
    nodes.push(node);
    return node;
  }
  const document = {
    readyState: "complete",
    body: null,
    addEventListener: function () {},
    createElement: function (tag) { return el(tag); },
    getElementById: function (id) {
      for (let i = 0; i < nodes.length; i++) if (nodes[i].id === id) return nodes[i];
      return null;
    },
    querySelector: function (sel) {
      for (let i = 0; i < nodes.length; i++) {
        const out = [];
        walk(nodes[i], sel, out);
        if (out[0]) return out[0];
      }
      return null;
    },
    querySelectorAll: function (sel) {
      const out = [];
      nodes.forEach(function (n) { walk(n, sel, out); });
      return out;
    }
  };
  const list = el("div");
  list.id = "video-list";
  const card = el("article");
  card.className = "card video-card";
  const host = el("div");
  host.className = "video-player-host";
  host.setAttribute("data-video-src", "media/videos/van/rear-vehicle-gate-wrap.mp4");
  host.setAttribute("data-video-still", "media/videos/van/rear-vehicle-gate-wrap.jpg");
  const still = el("img");
  still.className = "video-still";
  const btn = el("button");
  btn.className = "video-play-btn";
  host.appendChild(still);
  host.appendChild(btn);
  card.appendChild(host);
  list.appendChild(card);
  return { document: document, list: list, host: host, btn: btn, still: still, card: card };
}

function load(dom, protocol) {
  const windowObj = {};
  const sandbox = {
    window: windowObj,
    document: dom.document,
    location: { protocol: protocol || "https:" },
    console: console,
    fetch: function () { throw new Error("fetch not stubbed"); }
  };
  sandbox.global = sandbox;
  vm.createContext(sandbox);
  const src = fs.readFileSync(path.join(__dirname, "../trainer/js/video-fix.js"), "utf8");
  vm.runInContext(src, sandbox, { filename: "video-fix.js" });
  return sandbox;
}

function clickPlay(dom) {
  const handlers = (dom.list.listeners.click || []).slice();
  if (!handlers.length) throw new Error("play click was not bound");
  handlers.forEach(function (fn) {
    fn({
      target: dom.btn,
      preventDefault: function () {},
      stopPropagation: function () {}
    });
  });
}

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exitCode = 1;
  }
}

const decisions = [
  [null, "inconclusive"],
  [{ status: 0, ok: false, type: "basic", headers: headers("") }, "inconclusive"],
  [{ status: 0, ok: false, type: "cors", headers: headers("video/mp4") }, "inconclusive"],
  [{ status: 200, ok: true, type: "opaque", headers: headers("video/mp4") }, "inconclusive"],
  [{ status: 404, ok: false, type: "basic", headers: headers("text/html") }, "missing"],
  [{ status: 200, ok: true, type: "basic", headers: headers("image/jpeg") }, "missing"],
  [{ status: 200, ok: true, type: "basic", headers: headers("text/html; charset=utf-8") }, "missing"],
  [{ status: 200, ok: true, type: "basic", headers: headers("video/mp4") }, "play"],
  [{ status: 200, ok: true, type: "basic", headers: headers("video/mp4; charset=binary") }, "play"],
  [{ status: 206, ok: true, type: "basic", headers: headers("video/mp4") }, "play"]
];

const probeDom = makeDocument();
const probe = load(probeDom, "https:");
const policy = probe.window.WRAP911_VIDEO_PLAYBACK;
assert(policy && typeof policy.headDecision === "function", "policy exported");
decisions.forEach(function (row) {
  const got = policy.headDecision(row[0]);
  assert(got === row[1], "headDecision " + JSON.stringify(row[0] && { status: row[0].status, ok: row[0].ok, type: row[0].type }) + " => " + got + " expected " + row[1]);
});
assert(policy.inNativeWebView() === false, "https page is not native");

const schemeDom = makeDocument();
const scheme = load(schemeDom, "wrap911:");
assert(scheme.window.WRAP911_VIDEO_PLAYBACK.inNativeWebView() === true, "wrap911: scheme is native");

function flush() { return new Promise(function (r) { setImmediate(r); }); }

(async function () {
  const web = makeDocument();
  let headCalls = 0;
  const webSandbox = load(web, "https:");
  webSandbox.fetch = function (url, opts) {
    headCalls++;
    assert(opts && opts.method === "HEAD", "web uses HEAD");
    assert(url.indexOf("rear-vehicle-gate-wrap.mp4") >= 0, "web heads the clip url");
    return Promise.resolve({ status: 404, ok: false, type: "basic", headers: headers("text/plain") });
  };
  clickPlay(web);
  await flush();
  assert(headCalls === 1, "web missing file issues one HEAD");
  assert(web.host.querySelector(".video-play-error"), "web missing file shows still-only message");
  assert(web.host.querySelector(".video-play-error").textContent === "Still only. No movie on this card.", "web missing copy");
  assert(!web.card.querySelector("video"), "web missing file does not mount a video");
  assert(web.still.hidden === false, "web missing file shows the still again");
  assert(web.btn.hidden === false, "web missing file shows Play again");

  const webOk = makeDocument();
  const webOkSandbox = load(webOk, "https:");
  webOkSandbox.fetch = function () {
    return Promise.resolve({ status: 200, ok: true, type: "basic", headers: headers("video/mp4") });
  };
  clickPlay(webOk);
  await flush();
  const okVideo = webOk.card.querySelector("video.catalog-clip");
  assert(!!okVideo, "web video/mp4 mounts a clip");
  assert(okVideo && okVideo.playsInline === true, "clip is inline");
  assert(okVideo && okVideo.getAttribute("playsinline") === "", "playsinline attribute set");
  assert(!webOk.host.querySelector(".video-play-error"), "web video does not show missing");

  const webJpeg = makeDocument();
  const webJpegSandbox = load(webJpeg, "https:");
  webJpegSandbox.fetch = function () {
    return Promise.resolve({ status: 200, ok: true, type: "basic", headers: headers("image/jpeg") });
  };
  clickPlay(webJpeg);
  await flush();
  assert(webJpeg.host.querySelector(".video-play-error"), "web jpeg at mp4 path is refused");
  assert(!webJpeg.card.querySelector("video"), "web jpeg does not mount a video");

  const status0 = makeDocument();
  const status0Sandbox = load(status0, "https:");
  status0Sandbox.fetch = function () {
    return Promise.resolve({ status: 0, ok: false, type: "basic", headers: headers("") });
  };
  clickPlay(status0);
  await flush();
  assert(!!status0.card.querySelector("video.catalog-clip"), "status 0 HEAD still mounts the clip");
  assert(!status0.host.querySelector(".video-play-error"), "status 0 is not treated as missing");

  const native = makeDocument();
  let nativeFetches = 0;
  const nativeSandbox = load(native, "https:");
  nativeSandbox.window.Capacitor = { isNativePlatform: function () { return true; } };
  nativeSandbox.fetch = function () { nativeFetches++; return Promise.resolve({ status: 0, ok: false }); };
  clickPlay(native);
  await flush();
  assert(nativeFetches === 0, "Capacitor play does not call HEAD");
  const nativeVideo = native.card.querySelector("video.catalog-clip");
  assert(!!nativeVideo, "Capacitor mounts the clip");
  assert(nativeVideo.src.indexOf("rear-vehicle-gate-wrap.mp4") >= 0, "Capacitor sets the mp4 src");
  assert(!native.host.querySelector(".video-play-error"), "Capacitor does not show still-only before an error");

  nativeVideo.listeners.error.forEach(function (fn) { fn(); });
  assert(native.host.querySelector(".video-play-error"), "a real media error still shows still-only");

  if (process.exitCode) process.exit(process.exitCode);
  console.log("video playback policy: ok");
})().catch(function (err) {
  console.error(err);
  process.exit(1);
});
