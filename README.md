# Smart Start – The Premium School Website + Static Admin CMS

A creative, responsive, multi-page preschool website and backend-free JavaScript Admin CMS built for **Smart Start – The Premium School** (Pocket 27, Sector 24, Rohini, Delhi – 110085), based on the **Multiple Intelligence** educational approach.

## Pages Included

### Public Website (8 independent static HTML pages)
- `index.html` – Creative Hero, Marquee bands, School Introduction, Interactive Multiple Intelligence Explorer, 4 Pillars (*Why Smart Start?*), Learning Philosophy quote band, Programme Ladder, Learning Environment Mosaic, Latest Updates, Gallery Preview, Principal's Introduction, Enquiry CTA & Contact cards.
- `about.html` – Our Story, Official Vision, Two Promises to Parents, Learning Approach, Values, Principal Dr. Parvinder Kaur's full letter to parents, and Why Choose Smart Start.
- `philosophy.html` – Interactive 8-Intelligence explorer and dedicated illustrated sections for Linguistic, Logical-Mathematical, Spatial, Bodily-Kinesthetic, Musical, Interpersonal, Intrapersonal, and Naturalistic intelligences.
- `programmes.html` – Detailed age-stepped programmes for **Toddlers (1.5–2 yrs)**, **Playgroup (2–2.5/3 yrs)**, **Pre-Nursery (2.5–3 yrs)**, **Nursery (3–4 yrs)**, **LKG (4–5 yrs)**, and **UKG (5–6 yrs)** with objectives, activities, development areas, and direct enquiry links.
- `gallery.html` – Masonry photo gallery of 57 optimised school photographs across 6 editable categories with category filtering, photo counter, and keyboard/touch lightbox.
- `updates.html` – School news, festival celebrations, and events with multi-photo lightbox galleries and category filtering.
- `centres.html` – Campus showcase for **Pocket 27, Sector 24, Rohini, Delhi – 110085** with school photographs, phone numbers, email, and Google Maps directions.
- `contact.html` – Direct call, WhatsApp, and email cards, visiting hours, Google Maps card, and a client-side enquiry form that opens a prefilled WhatsApp message or email (no fake server submission).

### Admin CMS (`admin/index.html` + deep-link pages)
- Pure HTML5 / CSS3 / Vanilla JavaScript CMS managing `data/*.json`.
- **Mode 1 (Local Draft)**: Automatic draft saving in `localStorage` + client-side WebP compression in `IndexedDB`, live site draft preview (`?preview=1`), and JSON backup export/import.
- **Mode 2 (Publish to GitHub)**: Fine-grained GitHub Personal Access Token authentication (kept in session memory only, never persisted) that commits updated JSON and uploaded WebP images via the GitHub Contents API.

## Running Locally

```bash
# Serve the smart-start folder over HTTP:
python -m http.server 8080 --directory smart-start
```

- Public website: `http://localhost:8080/`
- Admin CMS: `http://localhost:8080/admin/`

## Regenerating Static HTML for SEO

Every public HTML page has full semantic HTML, headings, metadata, and Schema.org JSON-LD baked in at build time. When `data/*.json` is edited locally or via GitHub:

```bash
cd smart-start
node tools/build.js
```

On GitHub, `.github/workflows/regenerate-static.yml` automatically runs `node tools/build.js` whenever `data/**` is updated and commits the regenerated HTML pages and `sitemap.xml`.

## Documentation

- [`docs/design.md`](docs/design.md) – Complete design system, colour tokens, typography, layout rules, and motion guidelines.
- [`docs/ASSET_INVENTORY.md`](docs/ASSET_INVENTORY.md) – Full inventory of all 67 inspected images, 10 videos, and 3 DOCX documents.
- [`docs/IMAGE_MAPPING.md`](docs/IMAGE_MAPPING.md) – Mapping of every optimised image to its website page and section.
- [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md) – Administrator guide for editing content and publishing to GitHub Pages.

