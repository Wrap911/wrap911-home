# Field background sources (mock)

All stills are Gerardo's shop photos or shop video stills already on the box. No stock was used. No customer names, readable job-site signage, license plates, or Dunkin appear in the crops. Manufacturer badges that were in a source still were cropped out.

| Screen | File | Source | License | Notes |
|--------|------|--------|---------|-------|
| Home, rules, default | `media/bg/home.webp` | `/workspace/wrap911/media/images/59327138079__802A02AC-3D67-4A84-8824-4E7221458063.JPG` | Gerardo / WRAP 911 shop photo | Pink/red film hang on an RV in the bay, ladder in frame. A small Werner mark is on the ladder; it is not readable under the overlay. |
| Box Truck module / lessons | `media/bg/box-truck.webp` | `trainer/media/videos/box-truck/blue-panel-hang-ford-e-450-cab-door.jpg` | Shop video still | Cropped to drop the Ford E-450 door badge. |
| Van module / lessons | `media/bg/van.webp` | `trainer/media/videos/van/rear-vehicle-gate-wrap.jpg` | Shop video still | Rear hatch hang. No plate in the crop. |
| Trailer module / lessons | `media/bg/trailer.webp` | `/workspace/wrap911/media/images/IMG_1714.jpg` (same job as `media/photos/gallery/trailer-spot-graphics.jpg`) | Gerardo / WRAP 911 shop photo | Black enclosed trailer, abstract graphic, dual axle. No text or plate. |
| Storefront / architectural | `media/bg/storefront.webp` | `trainer/media/photos/gallery/practice-wall-color-and-brick-panels.jpg` | Shop photo | Color brick and black brick wall-film corner. No clean shop window-film still without logos was available; Unsplash glass-partition stock was not used. |
| Fleet module / lessons | `media/bg/fleet.webp` | `trainer/media/videos/fleet/pink-caddy-wrap3.jpg` | Shop video still | Gloss side panel. No emblem or plate. |
| RV/Bus module / lessons | `media/bg/rv-bus.webp` | `/workspace/wrap911/media/images/59337916394__4F10578A-ED68-4F5D-A73A-84E6741428B3.JPG` | Gerardo / WRAP 911 shop photo | Rear of the same RV job as Home. Plate mount cropped out. |
| Problem Doctor | `media/bg/doctor.webp` | `trainer/media/photos/gallery/pink-film-deep-recess-fingers.jpg` | Shop photo | Fingers / wrinkles in a recess. |
| Practice, practice hub, drills | `media/bg/practice.webp` | `trainer/media/videos/architectural/architectural-wall-wrap-squeegee-sequence.jpg` | Shop video still | Felt squeegee on wood-grain wall film. |
| Pricing / About (NOT SHIPPED: lime-green film breaks the no-green-vinyl rule; Pricing and About use `fleet.webp`) | `media/bg/pricing.webp` | `/workspace/wrap911/media/images/58445548627__C26FE9CA-92A5-4BD6-AE95-9A891B713211.JPG` | Gerardo / WRAP 911 shop photo | Lime film on a hood, knifeless / soft tools in frame. |

Skipped (not used): GMC tailgate emblem, Girard awning badge, LEER cap badge, Airstream wordmark, VW logo behind the kiosk, orange trailer side with a readable "H", "Zest Life" peel still, social graphic with "VINYL" text, Unsplash `multipane_office_glass_partitions.jpg`.

## Processing (bg-mock lighten pass)

All ten WebPs were re-exported from the same crops, then lifted with Pillow `Brightness(1.18)` and `Contrast(1.04)` so the field photos read under a lighter overlay. Same licenses as above. No stock added.

Overlay values (after Gerardo said the first mock was too dark):
- Full-screen wash: `rgba(9, 7, 13, 0.25)` (was ~0.72–0.90 plus a side vignette)
- Opening-type gradient on most screens: 0.30 at the top, 0.18 at 7.5rem, 0 at 16rem
- Pricing / Problem Doctor / About / Contact: 0.30 → 0.22 at 24% → 0.16 at the bottom
- Local scrims behind free-standing body copy: 0.45–0.70, plus opaque cards and passion-note panels at 0.92
