# Smart Start – Design System

Brand promise: **"Where Childhood Blossoms & Futures Begin."** A premium second home for children, built on Multiple Intelligence learning. Tagline from the school's own banner: **Play · Prepare · Pride**.

## Reference analysis (thewillowtree.in – structure only, nothing copied)
| Observed | Our response |
|---|---|
| Tagline hero, then straight to centres | Hero with floating illustrations + two CTAs, then trust strip |
| Centre cards with address blocks | Centres page with photo, contact, Google Maps CTA (addresses stay editable, none invented) |
| Programme listing, timings, admission highlight band | Programme "ladder" (age-stepped), editable hours, enquiry CTA band |
| Image carousels with plain frames | Photographs in organic masks, tilted collage, masonry gallery, marquee |
| Handwriting accent font + bright palette | Handwritten accents (Caveat), Fredoka headings, brand palette used by role |

## Colour (by role – never random)
| Token | Hex | Role |
|---|---|---|
| `--purple` | `#6D2FA0` | Creativity, headings accents, nav active |
| `--magenta` | `#C2307E` | Brand highlight, primary CTA (from logo hands) |
| `--coral` | `#E8483F` | Logo lettering, small accents |
| `--sky` | `#DFF3FF` / `#54B9F2` | Learning sections, backgrounds |
| `--yellow` | `#FFC83D` | Joy, stickers, secondary CTA |
| `--green` | `#2FA66A` | Growth / nature (Naturalistic), success |
| `--navy` | `#1E2250` | Body text, dark sections |
| `--cream` | `#FFF9EE` | Warm page base |
All colour tokens are CSS variables and are overridable from Admin → Settings → Colours.

## Typography
- Display: **Fredoka** 600/700 (rounded, friendly) – fluid `clamp()` sizes up to 5rem.
- Body: **Nunito** 400-800, 1.0625rem / 1.7.
- Accent: **Caveat** for handwritten annotations (arrows, "hello!" notes).

## Layout rules
- 12-col fluid container (max 1240px), 8-pt spacing scale.
- Every section has a distinct backdrop: cream+doodles (hero), white + blobs (intro), sky + clouds (MI), navy + stars (philosophy band), yellow wave (updates), lilac (principal), magenta gradient (CTA).
- Section dividers are SVG waves/scallops/clouds, never straight lines.
- Images: never stretched; `object-fit:cover` only inside masks with explicit width/height; logo always uses its intrinsic ratio (1:1).
- Asymmetry: tilted frames (±2-3°), overlapped stickers, staggered grid offsets.
- Mobile first: single column, drawers, 44px touch targets.

## Components
Header (sticky, logo + name, dropdown, drawer) · Hero (headline, blob photo collage, floating SVGs) · Marquee (CSS only, duplicated track, pause on hover) · Blob image mask · MI "orbit cards" (flip/expand) · Programme "ladder" cards · Update cards (cover, date, category) · Masonry gallery + lightbox · Principal letter card · Testimonial bubbles (only when real ones exist) · CTA band · Footer · Floating WhatsApp button.

## Motion
- CSS transitions/keyframes first; JS only for IntersectionObserver reveals, counters, parallax (transform only, rAF), lightbox, filters.
- Reveal: fade/slide-up, staggered by `--i`. Image reveal: clip-path wipe.
- Marquee: `translateX(-50%)` on doubled content → seamless; 40-60 s mobile friendly; pauses on hover/focus.
- `prefers-reduced-motion`: all keyframes disabled, content shown immediately. Content never hidden if JS fails (`.js` class gate).

## Accessibility & SEO
Semantic landmarks, one `h1` per page, alt text on every image, visible focus rings, ≥4.5:1 contrast for text, skip link, breadcrumbs, JSON-LD (EducationalOrganization/Preschool, WebSite, WebPage, BreadcrumbList, Event only for dated events).

## Content integrity
Only real content from the uploaded documents/photos is used. Unknown facts (address, hours, reviews, ratings, achievements) are left empty and editable, and public sections hide when empty.

