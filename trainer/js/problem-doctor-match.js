/* Match Problem Doctor lesson_keywords to trainingLessons and VIDEO_CATALOG. */
(function (root) {
  "use strict";

  var STOP = {
    the: 1, and: 1, for: 1, with: 1, this: 1, that: 1, from: 1, your: 1,
    into: 1, over: 1, film: 1, vinyl: 1, wrap: 1, problem: 1
  };
  /* Short shop words show up in almost every note. They stay in a phrase ("edge lift") but do not score alone. */
  var NOISE = { edge: 1, heat: 1, post: 1, lift: 1, panel: 1, door: 1, side: 1, area: 1, head: 1, line: 1, tool: 1 };
  var EXTRA = {
    bubble: ["silvering", "air"],
    bubbles: ["silvering", "air"],
    tent: ["rivet", "bridge"],
    tenting: ["rivet", "bridge", "tent"],
    tents: ["rivet", "bridge"],
    lift: ["edge", "lifting"],
    lifting: ["edge", "lift"],
    lifted: ["edge", "lift"],
    wrinkle: ["recess", "finger"],
    wrinkles: ["recess", "finger"],
    seam: ["overlap"],
    gap: ["seam", "overlap"],
    gaps: ["seam", "overlap"],
    discolor: ["stretch"],
    discolored: ["stretch"],
    overstretched: ["stretch"],
    stretch: ["thin"],
    "post-heat": ["post heat", "memory"],
    postheat: ["post heat", "memory"],
    rivet: ["rivets"],
    rivets: ["rivet"]
  };

  function norm(s) {
    return String(s || "").toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  }

  function packKeys(keywords) {
    var phrases = [];
    var words = [];
    var extras = [];
    function add(list, value) {
      var w = norm(value);
      if (!w || STOP[w] || list.indexOf(w) !== -1) return;
      list.push(w);
    }
    var list = Array.isArray(keywords) ? keywords : [];
    var i, j, parts, extra, phrase;
    for (i = 0; i < list.length; i++) {
      phrase = norm(list[i]);
      if (!phrase) continue;
      add(phrases, phrase);
      parts = phrase.split(" ");
      for (j = 0; j < parts.length; j++) {
        if (parts[j].length > 2 && !NOISE[parts[j]]) add(words, parts[j]);
      }
    }
    for (i = 0; i < words.length; i++) {
      extra = EXTRA[words[i]] || [];
      for (j = 0; j < extra.length; j++) {
        phrase = norm(extra[j]);
        if (!phrase || NOISE[phrase] || words.indexOf(phrase) !== -1) continue;
        add(extras, phrase);
      }
    }
    return { phrases: phrases, words: words, extras: extras };
  }

  function hits(text, keys, pts) {
    var h = " " + norm(text) + " ";
    var n = 0;
    var i;
    for (i = 0; i < keys.length; i++) {
      if (h.indexOf(keys[i]) !== -1) n += pts;
    }
    return n;
  }

  function scoreParts(title, body, pack) {
    return hits(title, pack.phrases, 12) + hits(body, pack.phrases, 4) +
      hits(title, pack.words, 8) + hits(body, pack.words, 3) +
      hits(title, pack.extras, 5) + hits(body, pack.extras, 2);
  }

  function lessonBody(lesson) {
    return [
      lesson.goal, lesson.id,
      (lesson.keyTechniques || []).join(" "),
      (lesson.commonMistakes || []).join(" "),
      (lesson.steps || []).join(" ")
    ].join(" ");
  }

  function videoBody(v) {
    return [v.category, v.subcategory, v.note, v.id, v.recommendedModule, v.src].join(" ");
  }

  /* Rivet reads (tented or bridged film over rivet heads): the fix is rivet brush plus post-heat per TDS,
     so never point at tuck, slit, or relief-cut lessons, and rank rivet / post-heat lessons first. */
  var CUT_RE = /\b(tuck|tucks|tucked|tucking|slit|slits|slitting|relief cut|relief cuts)\b/;
  var RIVET_PREF_RE = /\b(rivet|rivets|rivet brush|post heat|postheat)\b/;
  function isRivetRead(pack) {
    var all = pack.phrases.concat(pack.words);
    var i;
    for (i = 0; i < all.length; i++) {
      if (/rivet|tent|bridg/.test(all[i])) return true;
    }
    return false;
  }
  function rivetAdjust(score, title, about) {
    if (CUT_RE.test(" " + norm(title) + " " + norm(about) + " ")) return 0;
    if (RIVET_PREF_RE.test(norm(title))) return score + 15;
    return score;
  }

  function top(items, limit) {
    items.sort(function (a, b) { return b.score - a.score || String(a.title).localeCompare(String(b.title)); });
    var out = [];
    var i;
    for (i = 0; i < items.length && out.length < limit; i++) {
      if (items[i].score >= 4) out.push(items[i]);
    }
    return out;
  }

  function matchCatalog(keywords, data, limit) {
    var pack = packKeys(keywords);
    var rivet = isRivetRead(pack);
    var cap = limit || 3;
    var lessons = [];
    var videos = [];
    var list = (data && data.trainingLessons) || [];
    var vids = (data && data.VIDEO_CATALOG) || [];
    var i, item, s;
    for (i = 0; i < list.length; i++) {
      item = list[i];
      if (!item || !item.id) continue;
      s = scoreParts(item.title, lessonBody(item), pack);
      if (s && rivet) s = rivetAdjust(s, item.title, [item.id, item.goal].join(" "));
      if (s) lessons.push({ id: item.id, title: item.title || item.id, score: s, kind: "lesson" });
    }
    var lessonIds = {};
    var rankedLessons = top(lessons, cap);
    for (i = 0; i < rankedLessons.length; i++) lessonIds[rankedLessons[i].id] = 1;
    for (i = 0; i < vids.length; i++) {
      item = vids[i];
      if (!item || !item.id) continue;
      s = scoreParts(item.title, videoBody(item), pack);
      if (item.recommendedModule && lessonIds[item.recommendedModule]) s += 6;
      if (s && rivet) s = rivetAdjust(s, item.title, [item.id, item.subcategory, item.note].join(" "));
      if (s) videos.push({
        id: item.id,
        title: item.title || item.id,
        score: s,
        kind: "video",
        src: item.src || "",
        access: item.access || ""
      });
    }
    return { lessons: rankedLessons, videos: top(videos, cap) };
  }

  root.WRAP911_DOCTOR_MATCH = { matchCatalog: matchCatalog, packKeys: packKeys, isRivetRead: isRivetRead };
})(typeof globalThis !== "undefined" ? globalThis : this);
