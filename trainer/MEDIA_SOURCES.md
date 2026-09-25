# WRAP 911 — Media sources

Local shop photos and video stills only. Fake illustrations and old root mockup JPGs were removed in v2.6.3-all-shop-stills.

## Video stills (`trainer/media/videos/<category>/`)
Extracted from shop Drive MOVs / local captures. Lesson covers, drills, practice scenarios, and VIDEO_CATALOG stills all point here (e.g. `architectural/`, `fleet/`, `trailer/`, `van/`, `prep/`, `qc/`, `rv-bus/`, `box-truck/`).

## Stock (`trainer/media/stock/`)
| File | Source | License / notes | Used for |
|------|--------|-----------------|----------|
| `multipane_office_glass_partitions.jpg` | Unsplash — modern office glass partitions (`photo-1497366216548-37526070297c`) | Unsplash License (free to use) | Optional glass-partition reference only; multipane lesson uses shop still |

## Removed (do not restore)
- `trainer/media/illustrations/` (WINDOW GRAPHICS / OPEN LATE / WRAP911 panel mockups)
- Orphaned root stills: `box_rear_pink_panel.jpg`, `teal_girard_prep.jpg`, `pickup_leer_bottle_pattern.jpg`, `f150_side_panels_torch.jpg`, `rv_pink_side_ladders.jpg`, `architectural_conference_room.jpg`, `architectural_removal_torch.jpg`, `architectural_kiosk_cutouts.jpg`, `trailer_rivets_hinge_graphic.jpg`, `headlight_edge_cutting.jpg`

All lesson JPEGs are baked upright (EXIF Orientation stripped). CSS keeps `image-orientation: from-image`.

## Field app copies
Matching stills are copied under `solutions-hub/media/` for the Field host (`:8766`). Paths in Field data are relative to that app root.
