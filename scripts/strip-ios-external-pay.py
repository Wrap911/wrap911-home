#!/usr/bin/env python3
"""Remove website checkout URLs from the Capacitor www bundle.

Source files keep the wrap911.com Payment Links for the website. The iOS
binary is built from www/, so those hosts must not ship inside the app.
"""
import os
import re
import sys

root = sys.argv[1] if len(sys.argv) > 1 else "www"
pay = re.compile(r"https://buy\.stripe\.com/[A-Za-z0-9]+")

# Tests and coach notes are not part of the app. They quote the website Payment Link host.
for dirpath, dirs, files in os.walk(root):
    for name in files:
        path = os.path.join(dirpath, name)
        if name.endswith(".test.js") or name.endswith(".md"):
            os.remove(path)
text_ext = {".js", ".html", ".css", ".json", ".md", ".webmanifest"}
changed = 0
for dirpath, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d != "node_modules"]
    for name in files:
        path = os.path.join(dirpath, name)
        if os.path.splitext(name)[1] not in text_ext:
            continue
        try:
            raw = open(path, encoding="utf-8").read()
        except (UnicodeError, OSError):
            continue
        nxt = pay.sub("", raw)
        nxt = nxt.replace('id="unlock-code"', 'id="removed-code-field" hidden')
        if name.endswith(".html"):
            nxt = nxt.replace('href="trainer/?buy=pack"', 'href="trainer/index.html"')
            nxt = nxt.replace('href="trainer/?buy=seat"', 'href="trainer/index.html"')
            nxt = nxt.replace(">Buy shop pack<", ">Open the trainer<")
            nxt = nxt.replace(">Buy 1 seat<", ">Open the trainer<")
        if nxt != raw:
            open(path, "w", encoding="utf-8").write(nxt)
            changed += 1

left = []
for dirpath, dirs, files in os.walk(root):
    for name in files:
        path = os.path.join(dirpath, name)
        if os.path.splitext(name)[1] not in text_ext:
            continue
        try:
            raw = open(path, encoding="utf-8").read()
        except (UnicodeError, OSError):
            continue
        if "buy.stripe.com" in raw or 'id="unlock-code"' in raw:
            left.append(path)
if left:
    sys.stderr.write("payment links still in the app bundle:\n" + "\n".join(left) + "\n")
    sys.exit(1)
print("stripped external pay from", changed, "files under", root)
