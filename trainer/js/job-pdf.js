/* Small PDF for a finished job: checklist, notes, and photos. No network. */
(function (root) {
  "use strict";

  function ascii(s) {
    var out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 255;
    return out;
  }

  function concat(parts) {
    var n = 0;
    var i;
    for (i = 0; i < parts.length; i++) n += parts[i].length;
    var out = new Uint8Array(n);
    var o = 0;
    for (i = 0; i < parts.length; i++) {
      out.set(parts[i], o);
      o += parts[i].length;
    }
    return out;
  }

  function pdfText(s) {
    return String(s || "")
      .replace(/\u2014/g, ", ")
      .replace(/\u2013/g, "-")
      .replace(/[^\x20-\x7E]/g, " ")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  function wrapLine(text, width) {
    var words = String(text || "").split(/\s+/);
    var lines = [];
    var cur = "";
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      if (!word) continue;
      if (word.length > width) word = word.slice(0, width);
      var next = cur ? cur + " " + word : word;
      if (next.length > width && cur) {
        lines.push(cur);
        cur = word;
      } else {
        cur = next;
      }
    }
    if (cur) lines.push(cur);
    if (!lines.length) lines.push("");
    return lines;
  }

  function jpegSize(bytes) {
    if (!bytes || bytes.length < 10) return { w: 320, h: 240 };
    var i = 2;
    while (i < bytes.length - 9) {
      if (bytes[i] !== 0xff) { i++; continue; }
      var marker = bytes[i + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return { w: (bytes[i + 7] << 8) + bytes[i + 8], h: (bytes[i + 5] << 8) + bytes[i + 6] };
      }
      if (marker === 0xd8 || marker === 0xd9) { i += 2; continue; }
      var len = (bytes[i + 2] << 8) + bytes[i + 3];
      if (len < 2) break;
      i += 2 + len;
    }
    return { w: 320, h: 240 };
  }

  function textCommands(lines) {
    var cmds = ["BT", "/F1 12 Tf", "50 750 Td"];
    for (var i = 0; i < lines.length; i++) {
      if (i) cmds.push("0 -16 Td");
      cmds.push("(" + pdfText(lines[i]) + ") Tj");
    }
    cmds.push("ET");
    return cmds.join("\n");
  }

  function chunk(lines, size) {
    var pages = [];
    for (var i = 0; i < lines.length; i += size) pages.push(lines.slice(i, i + size));
    if (!pages.length) pages.push([""]);
    return pages;
  }

  function buildJobPdf(doc) {
    doc = doc || {};
    var lines = [];
    function add(line) {
      var wrapped = wrapLine(line, 88);
      for (var i = 0; i < wrapped.length; i++) lines.push(wrapped[i]);
    }
    add("WRAP 911 job record");
    add(doc.finished ? "Finished job" : "Job still in progress");
    add("Type: " + (doc.jobType || ""));
    add("Coverage: " + (doc.coverage || ""));
    add("Film: " + [doc.brand, doc.filmLine, doc.filmLot ? "lot " + doc.filmLot : ""].filter(Boolean).join(", "));
    add(doc.hoursLabel || "Time estimate. This is an estimate, not a quote.");
    var material = Array.isArray(doc.materialLines) ? doc.materialLines : [];
    for (var m = 0; m < material.length; m++) add(material[m]);
    add("Checklist");
    var steps = Array.isArray(doc.steps) ? doc.steps : [];
    if (!steps.length) add("No workflow steps.");
    for (var s = 0; s < steps.length; s++) {
      var step = steps[s];
      var times = (step.times || []).join(", ");
      add((step.done ? "[x] " : "[ ] ") + (step.title || "Step") + (times ? "  times " + times : ""));
    }
    add("Notes");
    add(doc.notes || "No notes.");
    add("This is an estimate, not a quote. Follow the film TDS.");

    var pageBodies = chunk(lines, 40).map(function (group) {
      return { commands: textCommands(group), image: null };
    });
    var photos = Array.isArray(doc.photos) ? doc.photos : [];
    for (var p = 0; p < photos.length; p++) {
      var photo = photos[p];
      if (!photo || !photo.bytes || !photo.bytes.length) continue;
      var size = photo.w && photo.h ? { w: photo.w, h: photo.h } : jpegSize(photo.bytes);
      var name = "Im" + p;
      var caption = (photo.slot || "Photo") + (photo.caption ? ": " + photo.caption : "");
      pageBodies.push({
        commands: textCommands([caption]) + "\nq 360 0 0 240 126 480 cm /" + name + " Do Q",
        image: { name: name, bytes: photo.bytes, w: size.w || 320, h: size.h || 240 }
      });
    }

    var objects = [];
    function pushObj(str, tail) {
      objects.push({ str: str, tail: tail || null });
      return objects.length;
    }

    var fontId = pushObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    var contentIds = [];
    var imageIds = {};
    var i;
    for (i = 0; i < pageBodies.length; i++) {
      var body = pageBodies[i];
      var stream = ascii(body.commands);
      contentIds.push(pushObj("<< /Length " + stream.length + " >>\nstream\n", { bytes: stream, end: "\nendstream\nendobj\n" }));
      if (body.image) {
        imageIds[body.image.name] = pushObj(
          "<< /Type /XObject /Subtype /Image /Width " + body.image.w + " /Height " + body.image.h +
          " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + body.image.bytes.length + " >>\nstream\n",
          { bytes: body.image.bytes, end: "\nendstream\nendobj\n" }
        );
      }
    }
    var pageIds = [];
    for (i = 0; i < pageBodies.length; i++) {
      var resources = "<< /Font << /F1 " + fontId + " 0 R >>";
      if (pageBodies[i].image) {
        resources += " /XObject << /" + pageBodies[i].image.name + " " + imageIds[pageBodies[i].image.name] + " 0 R >>";
      }
      resources += " >>";
      pageIds.push(pushObj(
        "<< /Type /Page /Parent PAGES 0 R /MediaBox [0 0 612 792] /Contents " + contentIds[i] + " 0 R /Resources " + resources + " >>"
      ));
    }
    var kids = pageIds.map(function (id) { return id + " 0 R"; }).join(" ");
    var pagesId = pushObj("<< /Type /Pages /Kids [" + kids + "] /Count " + pageIds.length + " >>");
    var catalogId = pushObj("<< /Type /Catalog /Pages " + pagesId + " 0 R >>");
    for (i = 0; i < objects.length; i++) objects[i].str = objects[i].str.replace("PAGES 0 R", pagesId + " 0 R");

    var chunks = [ascii("%PDF-1.4\n")];
    var cursor = chunks[0].length;
    var offsets = [0];
    for (i = 0; i < objects.length; i++) {
      offsets.push(cursor);
      var head = ascii((i + 1) + " 0 obj\n" + objects[i].str);
      chunks.push(head);
      cursor += head.length;
      if (objects[i].tail) {
        chunks.push(objects[i].tail.bytes);
        cursor += objects[i].tail.bytes.length;
        var end = ascii(objects[i].tail.end);
        chunks.push(end);
        cursor += end.length;
      } else {
        var endObj = ascii("\nendobj\n");
        chunks.push(endObj);
        cursor += endObj.length;
      }
    }
    var xref = "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
    for (i = 1; i < offsets.length; i++) {
      var off = String(offsets[i]);
      xref += "0000000000".slice(off.length) + off + " 00000 n \n";
    }
    xref += "trailer\n<< /Size " + (objects.length + 1) + " /Root " + catalogId + " 0 R >>\nstartxref\n" + cursor + "\n%%EOF\n";
    chunks.push(ascii(xref));
    return concat(chunks);
  }

  var api = { buildJobPdf: buildJobPdf, jpegSize: jpegSize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.WRAP911_JOB_PDF = api;
})(typeof window !== "undefined" ? window : globalThis);
