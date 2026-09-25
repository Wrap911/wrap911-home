/* WRAP 911 — video play fix
   Catalog lists many .mp4 paths that are stills-only (jpg on disk, no movie).
   Old player: create <video>, autoplay, error, tear down in <1s.
*/
(function () {
  function showMissing(host, btn) {
    if (!host) return;
    if (!host.querySelector(".video-play-error")) {
      var p = document.createElement("p");
      p.className = "muted video-play-error";
      p.textContent = "Still only. No movie on this card.";
      var links = host.querySelector(".video-links");
      if (links) host.insertBefore(p, links);
      else host.appendChild(p);
    }
    if (btn) btn.hidden = false;
  }

  function youtubeId(src) {
    src = String(src || "").trim();
    var patterns = [
      /[?&]v=([A-Za-z0-9_-]{11})/,
      /youtu\.be\/([A-Za-z0-9_-]{11})/,
      /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/,
      /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = src.match(patterns[i]);
      if (m) return m[1];
    }
    return "";
  }

  function playYoutube(host, id) {
    var list = document.getElementById("video-list");
    if (list) {
      var olds = list.querySelectorAll(".catalog-youtube");
      for (var i = 0; i < olds.length; i++) {
        if (olds[i].parentNode) olds[i].parentNode.removeChild(olds[i]);
      }
    }
    var card = host.closest(".video-card") || host;
    card.style.flexWrap = "wrap";
    var frame = document.createElement("iframe");
    frame.className = "catalog-clip catalog-youtube";
    frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?rel=0&modestbranding=1&playsinline=1";
    frame.title = "WRAP 911 shop video";
    frame.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    frame.setAttribute("allowfullscreen", "");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.style.cssText = "width:100%;flex:1 0 100%;aspect-ratio:16/9;border:0;border-radius:8px;background:#000;display:block;margin:0 0 8px";
    card.insertBefore(frame, card.firstChild);
  }

  function playSafe(btn) {
    var host = btn && btn.closest ? btn.closest(".video-player-host") : null;
    if (!host) return;
    var src = host.getAttribute("data-video-src") || "";
    var still = host.getAttribute("data-video-still") || "";
    var yid = youtubeId(src);
    if (yid) {
      btn.hidden = true;
      playYoutube(host, yid);
      return;
    }
    if (!src) {
      showMissing(host, btn);
      return;
    }
    btn.hidden = true;
    fetch(src, { method: "HEAD", cache: "no-store" }).then(function (res) {
      var type = (res.headers.get("content-type") || "").toLowerCase();
      if (!res.ok || type.indexOf("video") === -1) throw new Error("not-video");
      var card = host.closest(".video-card") || host;
      card.style.display = "block";
      var old = card.querySelector("video.catalog-clip");
      if (old && old.parentNode) old.parentNode.removeChild(old);
      var video = document.createElement("video");
      video.className = "catalog-clip";
      video.controls = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.preload = "metadata";
      if (still) video.poster = still;
      video.style.cssText = "width:100%;max-height:70vh;margin:0 0 8px;border-radius:8px;background:#000;display:block";
      video.addEventListener("error", function () { showMissing(host, btn); });
      video.src = src;
      card.insertBefore(video, card.firstChild);
      var playPromise = video.play();
      if (playPromise && playPromise.catch) playPromise.catch(function () {});
    }).catch(function () {
      showMissing(host, btn);
    });
  }


  var REAL = {
    "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-1.mp4": 1,
    "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-2.mp4": 1,
    "media/videos/architectural/architectural-wall-vinyl-panel-using-heat-to-remove-fingers.mp4": 1,
    "media/videos/architectural/architectural-wall-wrap-squeegee-sequence.mp4": 1,
    "media/videos/architectural/architectural-wall-wrap.mp4": 1,
    "media/videos/architectural/cabinet-done.mp4": 1,
    "media/videos/architectural/vinyl-cabinet-installed.mp4": 1,
    "media/videos/architectural/vinyl-oncabinet8.mp4": 1,
    "media/videos/fleet/graphic-installation-1.mp4": 1,
    "media/videos/fleet/pink-caddy-wrap3.mp4": 1,
    "media/videos/fleet/pink-caddy-wrap4.mp4": 1,
    "media/videos/fleet/pink-caddy-wrap5.mp4": 1,
    "media/videos/fleet/pink-wrap-caddy-1.mp4": 1,
    "media/videos/fleet/satin-wrap-cherokee.mp4": 1,
    "media/videos/prep/cutting-vinyl-4.mp4": 1,
    "media/videos/prep/cutting-vinyl-5.mp4": 1,
    "media/videos/prep/cutting-vinyl-6.mp4": 1,
    "media/videos/prep/cutting-vinyl3.mp4": 1,
    "media/videos/prep/dull-blade-cut.mp4": 1,
    "media/videos/prep/grey-overlay-peel-magenta-base-stack.mp4": 1,
    "media/videos/prep/squeegee-strokes.mp4": 1,
    "media/videos/prep/stroke-of-the-squeegee.mp4": 1,
    "media/videos/prep/torch-in-vinyl-3.mp4": 1,
    "media/videos/prep/torch-on-vinyl1.mp4": 1,
    "media/videos/prep/torch-on-vinyl2.mp4": 1,
    "media/videos/prep/translucent-vinyl.mp4": 1,
    "media/videos/prep/vinyl-cutting1.mp4": 1,
    "media/videos/prep/vinyl-removal.mp4": 1,
    "media/videos/prep/vinyl-squeegee-sequence.mp4": 1,
    "media/videos/qc/corngraphic.mp4": 1,
    "media/videos/trailer/trailer-rivets-and-marker-lights.mp4": 1,
    "media/videos/trailer/wrapping-around-trailer-marking-light.mp4": 1,
    "media/videos/van/rear-vehicle-gate-wrap.mp4": 1
  };
  var FIRST = [
    "media/videos/trailer/trailer-rivets-and-marker-lights.mp4",
    "media/videos/van/rear-vehicle-gate-wrap.mp4"
  ];

  function tidyVideos() {
    var list = document.getElementById("video-list");
    if (!list) return;
    var cards = list.querySelectorAll(".video-card, .card");
    var i, card, host, src;
    for (i = 0; i < cards.length; i++) {
      card = cards[i];
      if (card.classList.contains("teaser-paywall")) continue;
      host = card.querySelector("[data-video-src]");
      src = host ? (host.getAttribute("data-video-src") || "") : "";
      src = src.replace(/^\.\//, "");
      if (!src || !REAL[src]) card.remove();
    }
    for (i = FIRST.length - 1; i >= 0; i--) {
      host = list.querySelector('[data-video-src="' + FIRST[i] + '"]');
      card = host && (host.closest(".video-card") || host.closest(".card"));
      if (card && card.parentNode === list) list.insertBefore(card, list.firstChild);
    }
  }

  function bind() {
    var list = document.getElementById("video-list");
    if (!list) return;
    list.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".video-play-btn");
      if (!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      playSafe(btn);
    }, true);
  }

  function arm() {
    bind();
    tidyVideos();
    var n = 0;
    var timer = setInterval(function () {
      tidyVideos();
      if (++n > 20) clearInterval(timer);
    }, 300);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arm);
  } else {
    arm();
  }
})();
