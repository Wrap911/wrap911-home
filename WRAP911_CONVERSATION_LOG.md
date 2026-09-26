# Wrap 911 — Conversation Log
Saved: Saturday, September 26, 2026

This file saves the key decisions and steps from the Wrap 911 trainer conversations so nothing is lost. The live trainer is at https://wrap911.github.io/wrap911-home/ and the repo is github.com/Wrap911/wrap911-home.

---

## 1. Photo dedupe and new photos (Sep 26)

**Problem:** The Problems feed kept showing the same black trailer (and the same Escalade shots) because several lessons pointed at the same file. Captions changed, the picture did not.

**Fix pushed to main (commit 3874f17):**
- `trainer/js/photos-unique.js` — one image = one card. Extra Drive stills added (Airstream side/top, IMG_0806, IMG_6220, IMG_6222, two bay JPEGs) plus unused local stills (glass partitions, squeegee, torch, translucent, table cut).
- `labels-fix.js` — if two cards share a filename, the second one gets a different still.
- Cache bump: `photos-unique.js?v=330`.

**Limit:** The new Drive photos load as Drive thumbnail URLs, not copied into the repo. If a card is blank, the file is not shared as "anyone with the link." Share the Wrap 911 folder that way and they will load.

**Later fix:** The Drive thumbnails were a shortcut. The blank cards were Drive links, not files in the trainer. The swap to the black trailer fallback was removed. The new cards use real files from the Wrap 911 Drive folder, saved in the trainer:
- Airstream nose, film not seated
- Airstream marker light still covered
- Airstream mountain graphic
- Pickup quarter, fingers at the lamp
- RV side, pink film still loose
- Interior panels with clips still on
- Interior corner, two red faces

Same picture no longer repeats under a new title. Hard-refresh Photos. The new shots sit at the top of the list.

---

## 2. Marketing strategy (Sep 26)

**Core decision:** Wrap 911 will not trend from a cold email blast. The shops that already own this market will ignore it, and the Facebook groups will kick you for dropping a link. You are not beating The Wrap Institute (thousands of videos, Justin Pate, big YouTube) or a $1,095 weekend class. You win the hour after the new hire is alone in the bay and the edge is lifting. That is the only pitch.

**Bot roles agreed on:**
| Bot | Job | Kill rule |
|---|---|---|
| Scout | Only shops that just posted "hiring a wrap installer" | No random shop list |
| Hook | One real failure photo and the fix | No "AI trainer" pitch |
| Mouth | Five-line note, free preview link, stop | No second email if they don't answer |
| Clock | 10 notes a week, then done | No daily blast |

**Do not email:** Worcester-area wrap shops (Big Monkey Wraps, Graphic Express, Graphic Solutions, EGI Wraps). They are rivals, not buyers. A sales email to them looks like spam from the guy down the road.

**Leads that can actually pay:**
1. Anyone who posted a wrap-installer job this month. Search LinkedIn and Indeed for "vinyl wrap installer" and "fleet graphics installer." Message the hiring person, not a scraped info@ list.
2. Class hosts, not their students. ORAFOL 2026 hosts, Avery commercial wrap, Elite Wrappers (Michigan, Florida, New Jersey, New York). Offer one free shop seat for the next class.
3. National companies that subcontract installers: Good Traffic installer program, SuperGraphics. Apply as a training layer, not as another wrap shop.
4. PDAA / PRINTING United vehicle fleet wraps certification. Certification gets them calls. Wrap 911 is what they use Monday morning. Do not claim you replace the cert.

**LinkedIn:** Not connected here, and it should not be automated. Their terms ban bots. Do this by hand, three times a week: one photo of a real miss, one line (what failed, what you do next), link in the profile not the first comment. Groups like Wrap Shop Talk ban self-promo. Help first or you get removed.

**First note (copy this):**
> Saw you're hiring a wrap installer. The first month is where edges lift and the truck comes back. Wrap 911 is the bay card for that — real failure photos, the fix, no class. Free preview, $49 for one tech, $149 for the shop. https://wrap911.github.io/wrap911-home/

**Email:** I will not pull an email list off the web and send it. That is spam. Gmail can be connected later for people who already asked, or for a list you already own. Not for this.

---

## 3. Where to start (Sep 26)

1. Open the trainer on your phone. Go to Photos. If the new bay shots are there and the black trailer is not repeated, the link is safe to send.
2. On Indeed, search `vinyl wrap installer`. Set the date to the last 7 days.
3. Message the first 5. Then stop. Use the first note above.
4. Do not write a second note if they stay quiet. Do not email Worcester wrap shops. Five notes today is the whole start.

---

## 4. Minimal-effort sharing (Sep 26)

One photo and one caption. Paste it in three places. Then stop. Use a real bay shot — the taped trailer nose or a short headlight cut. Not a graphic.

**Caption:**
> New installer, first month. This is where the truck comes back. Edge lift, rivets, a cut that stops short. Wrap 911 is the bay card for that. Real failure, the fix, no class. Free preview. $49 one tech, $149 the shop.
> https://wrap911.github.io/wrap911-home/

**Paste it here, in this order:**
1. Bios. Instagram, Facebook page, and your X profile. Five minutes.
2. One post, three apps. Same photo, same caption, on Facebook page, Instagram, and X. Do not rewrite it.
3. Text. Send that caption to any wrapper you already have in your phone. Five people you know will beat a hundred strangers.
4. Craigslist. One post under Services, Massachusetts, title `Wrap training for new installers`. Same caption.

**Do not bother:** Wrap Shop Talk and the other pro Facebook groups (they delete links). Email blasts and LinkedIn bots. A different caption for every app.

---

## 5. Search engine visibility (Sep 26)

Google does not know to look for you yet. There is no sitemap on the site, so the page is easy to miss. Searching "vinyl wrap training" will not show Wrap 911. Avery, The Wrap Institute, and the weekend classes already own that.

**Check it yourself:** On your phone, open Google and paste:
- `site:wrap911.github.io/wrap911-home`
- `"Wrap 911" wrap trainer`

If the first one shows nothing, Google has not indexed the page. If it shows the homepage, you only rank for your own name. That is normal on day one.

**Tell Google the page exists:**
1. Open Google Search Console and sign in with a Google account.
2. Add a property. Choose URL prefix. Paste `https://wrap911.github.io/wrap911-home/`
3. Google gives you a meta tag to prove you own the site.
4. After it says verified, open URL inspection, paste the same address, and tap Request indexing.

Do the same site once in Bing Webmaster Tools. Same URL. Then leave both alone. Indexing takes days, not minutes.

**What can actually rank:** Not the homepage, and not the words "car wrap." One public page per real failure, using the words a new installer types: lifted wrap edge on trailer rivets; vinyl wrap headlight cut too short; train a new wrap installer. You already have those photos. One page, one failure, the fix, then the trainer link. That is the only search page worth making.

Until Search Console says the URL is indexed, the Indeed notes and the bio link are still what puts this in front of a person. Search is the slow lane.

---

## 6. Google verification (Sep 26)

The HTML file method had a cut-off filename, so the HTML tag method was used instead.

**Meta tag provided:**
<meta name="google-site-verification" content="922WX8gkEUM14vuLlO4nVweV3BSIfzddRrdJUOifaqc" />

The tag was placed on the homepage and pushed. Then: go back to the Google screen and tap Verify. If it fails, wait one minute and tap again. Do not tap Remove property. When it says verified, open URL inspection, paste `https://wrap911.github.io/wrap911-home/`, and tap Request indexing.

**URL inspection:** Open https://search.google.com/search-console/inspect?resource_id=https://wrap911.github.io/wrap911-home/ on the same phone. Paste the URL in the bar and press Go. Then tap Request indexing.

**Sitemaps:** The sitemap is live at https://wrap911.github.io/wrap911-home/sitemap.xml. It is valid and all five pages answer (homepage, trainer, privacy, sample, templates), last update today. Google had not indexed it yet because it was never submitted. Open https://search.google.com/search-console/sitemaps?resource_id=https://wrap911.github.io/wrap911-home/ , paste the sitemap address, and tap Submit. Right after you submit, the status will say Success and Indexed will be 0. That is normal. Google reads it over the next few days. Do not submit it again.

**Do you have to wait?** Yes, for Google. No, for getting the app in front of someone. Google can take a few days after you submit the sitemap. You do not wait to send the link. The page is already live.

**Can I check on Google for the name?** Yes. Open Google and paste `site:wrap911.github.io/wrap911-home` (including the colon). If your page is listed, Google already has it. Then try `"Wrap 911" wrap trainer`. Do not search only `Wrap 911` — that name also hits other businesses. If the first search is blank, Google has not listed you yet. The page is not broken. Open it directly at https://wrap911.github.io/wrap911-home/ . Stop searching today. Check that one `site:` line tomorrow.

**User reported:** "I can't find it, other websites pop up." Response: That is normal. Google is showing the sites that have been there for years. Wrap 911 was submitted this morning. Paste `site:wrap911.github.io/wrap911-home` exactly. If that is also blank, Google has not listed you yet.

---

## 7. Grokbot prompt for search and app stores (Sep 26)

Paste this to Grokbot:

> You are my assistant for Wrap 911, a free offline shop trainer for new vinyl wrap installers at https://wrap911.github.io/wrap911-home/. Help me get it found. Do these in order:
> 1. Check if Google has indexed it: search `site:wrap911.github.io/wrap911-home`. If blank, tell me to wait and check tomorrow.
> 2. Confirm the sitemap is submitted in Google Search Console at https://wrap911.github.io/wrap911-home/sitemap.xml.
> 3. Draft one public page per real failure using installer search terms: lifted wrap edge on trailer rivets, vinyl wrap headlight cut too short, train a new wrap installer. One failure, the fix, then the trainer link.
> 4. Find shops that posted a wrap-installer job in the last 7 days on Indeed. Draft a five-line note with the free preview link. No email blasts, no scraped lists.
> 5. Draft one photo post with caption for Instagram, Facebook, and X. Same photo, same caption.
> 6. Draft a Craigslist post under Services, Massachusetts: Wrap training for new installers.
> 7. List wrap training class hosts and certification bodies to contact for a free shop seat.
> Do not buy ads, do not automate LinkedIn, do not send cold emails to Worcester wrap shops. Report what you found and what I should do next.

**On the app stores:** Not yet. The trainer is a website, and Google Play and the App Store charge a one-time developer fee and require a real app build. That is a later project, not the first move. (Note: a Drive doc named APP STORES already exists in the Wrap 911 folder.)

---

## 8. Related files already in Google Drive (Wrap 911 folder)

- WRAP911_PROBLEMS_AND_PHOTOS_GUIDE.md
- WRAP911_REPO_FILE_MAP.md
- WRAP911_VIDEO_CATALOG.md
- Wrap911-LESSONS-READABLE.txt
- Wrap911-LESSONS-FROM-PHOTOS.md
- START HERE
- APP STORES
- wrap911-trainer.zip / wrap911-trainer-photos.zip
- Folders: Wrap 911, wrap911-web-mp4, wrap 911 app, sales wrap911

---

## Next steps (as of Sep 26)

1. Hard-refresh the trainer Photos tab and confirm the new bay shots load and the trailer is not repeated.
2. Send the first note to 5 Indeed shops that posted a wrap-installer job in the last 7 days.
3. Paste the caption + photo into Instagram, Facebook, X bios/posts, and Craigslist Services Massachusetts.
4. In Search Console: confirm verification succeeded, request indexing of the homepage, submit the sitemap.
5. Check `site:wrap911.github.io/wrap911-home` tomorrow, not every hour.
6. App Store / Google Play: later project. See the APP STORES doc in Drive.

---

End of saved log. Update this file whenever a new decision is made.
