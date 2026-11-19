# IMAGE MAPPING – Smart Start Website

Complete mapping of every optimised photograph and brand asset to the website pages and sections where it is used.
No school facilities, awards, or unrelated stock images were invented; every image comes from the actual uploaded school files.

## 1. Branding & Logos (`assets/logos/`)

| Asset | Source File | Website Section | Purpose | Display Format |
|---|---|---|---|---|
| `assets/logos/smart-start-logo.webp` (`636×636`) | `WhatsApp Image 2026-11-18 at 11.34.54.jpeg` | Header (all pages), Hero rotating badge, Footer (all pages), JSON-LD Organization logo | Official school branding | Transparent circular WebP/PNG (`1:1`), never stretched |
| `assets/logos/smart-start-logo-200.webp` (`200×200`) | `WhatsApp Image 2026-11-18 at 11.34.54.jpeg` | Admin CMS sidebar | Compact official branding | Transparent circular WebP (`1:1`) |
| `assets/logos/favicon-32.png`, `favicon-180.png`, `favicon-192.png`, `favicon.ico` | `WhatsApp Image 2026-11-18 at 11.34.54.jpeg` | Browser tab icon & Apple touch icon on all public and admin pages | Favicon & home-screen icon | PNG / ICO |
| `assets/images/smart-start-signboard.webp` (`533×256`) | `WhatsApp Image 2026-11-18 at 11.36.10.jpeg` | Contact Us Open Graph image, Media Library (`branding`) | Official signboard showing tagline *Play · Prepare · Pride* | Natural `2.08:1` ratio, never upscaled |

## 2. Principal Portrait

| Asset | Source File | Website Section | Purpose |
|---|---|---|---|
| `assets/images/principal-dr-parvinder-kaur.webp` (`900×1200`) | Embedded image in `Dear Parents by Prinicipal.docx` & `IMG-20240824-WA0258.jpg.jpeg` | **Home** (`#principal-intro`), **About Us** (`#principal`), About Open Graph image | Official portrait of Principal Dr. Parvinder Kaur |

## 3. Homepage (`index.html`) Section-by-Section Mapping

| Website Section | Asset Path(s) | Purpose |
|---|---|---|
| **Hero collage** (`#top`) | `assets/images/krishna-radha-portrait.webp`, `assets/images/ball-pit-adventure.webp`, `assets/images/finger-painting.webp` | Joyful celebrations, active play infrastructure, and hands-on creative learning |
| **School Introduction** (`#about-us`) | `assets/images/classroom-group-circle.webp`, `assets/images/toddler-ring-stacking.webp` | Warm teacher-student classroom bond and early toddler play |
| **Multiple Intelligence Interactive Explorer** (`#multiple-intelligence`) | 8 intelligence photos (see Section 5 below) | Interactive preview of all 8 intelligences |
| **Our Programmes Ladder** (`#programmes`) | 6 programme photos (see Section 6 below) | Visual age-progression cards from Toddlers to UKG |
| **Learning Environment Mosaic** (`#learning-environment`) | `assets/images/ball-pit-slide.webp`, `assets/images/climbing-net-smile.webp`, `assets/images/jungle-nature-corner.webp`, `assets/images/fashion-show-ramp.webp` | Actual indoor play area, climbing net, themed nature corner, and activity hall |
| **Latest Updates Preview** (`#latest-updates`) | Latest 6 published update cover images from `data/updates.json` | Automatic feed of recent school celebrations and events |
| **Gallery Preview Strip** (`#gallery-preview`) | 8 featured images from `data/gallery.json` (`janmashtami-tableau`, `annual-day-play`, `krishna-radha-portrait`, `ball-pit-adventure`, `graduation-day`, `little-santas`, `finger-painting`, `classroom-group-circle`) | Asymmetric preview with lightbox |
| **Principal's Introduction** (`#principal-intro`) | `assets/images/principal-dr-parvinder-kaur.webp` | Personal welcome from Dr. Parvinder Kaur |

## 4. About Us (`about.html`)

| Website Section | Asset Path | Purpose |
|---|---|---|
| **Our Story** (`#story`) | `assets/images/annual-day-play.webp` | Teachers and children performing together on stage |
| **Principal's Message** (`#principal`) | `assets/images/principal-dr-parvinder-kaur.webp` | Portrait alongside the full letter from `Dear Parents by Prinicipal.docx` |

## 5. Multiple Intelligence (`philosophy.html`)

| Intelligence Area | Asset Path | Source File | Why Chosen |
|---|---|---|---|
| **1. Linguistic** (*Word Wizards*) | `assets/images/learning-with-sound-book.webp` | `IMG-20260421-WA0095.jpg.jpeg` | Child interacting with an alphabet and sound learning book |
| **2. Logical-Mathematical** (*Little Problem Solvers*) | `assets/images/toddler-ring-stacking.webp` | `IMG-20260421-WA0104.jpg.jpeg` | Toddler sorting and stacking rings by size and colour |
| **3. Spatial** (*Picture Thinkers*) | `assets/images/finger-painting.webp` | `IMG-20261117-WA0044.jpg.jpeg` | Child finger-painting grapes on an activity worksheet |
| **4. Bodily-Kinesthetic** (*Moving Mountains*) | `assets/images/climbing-net-smile.webp` | `IMG-20260806-WA0014.jpg.jpeg` | Child climbing the indoor rope net on the mountain wall |
| **5. Musical** (*Rhythm Makers*) | `assets/images/folk-dhol-celebration.webp` | `1768202178245.jpg.jpeg` | Children celebrating with a traditional dhol |
| **6. Interpersonal** (*Friendship Builders*) | `assets/images/classroom-group-circle.webp` | `IMG-20260730-WA0058.jpg.jpeg` | Group of children in uniform seated together with their teacher |
| **7. Intrapersonal** (*Inner Stars*) | `assets/images/independence-worksheet.webp` | `IMG-20260814-WA0242.jpg.jpeg` | Focused individual worksheet activity |
| **8. Naturalistic** (*Nature Explorers*) | `assets/images/jungle-nature-corner.webp` | `1768374386744.jpg.jpeg` | Children exploring a jungle-themed corner with a live potted plant |

## 6. Programmes (`programmes.html`)

| Programme | Age Group | Asset Path | Source File |
|---|---|---|---|
| **Toddlers** | 1.5–2 years | `assets/images/toddler-ring-stacking.webp` | `IMG-20260421-WA0104.jpg.jpeg` |
| **Playgroup** | 2–2.5/3 years | `assets/images/toddler-cups-outdoors.webp` | `IMG-20261117-WA0037.jpg.jpeg` |
| **Pre-Nursery** | 2.5–3 years | `assets/images/finger-painting.webp` | `IMG-20261117-WA0044.jpg.jpeg` |
| **Nursery** | 3–4 years | `assets/images/learning-with-sound-book.webp` | `IMG-20260421-WA0095.jpg.jpeg` |
| **LKG** | 4–5 years | `assets/images/independence-worksheet.webp` | `IMG-20260814-WA0242.jpg.jpeg` |
| **UKG** | 5–6 years | `assets/images/graduation-day.webp` | `IMG-20260328-WA0140.jpg.jpeg` |

## 7. Our Centres (`centres.html`)

| Centre | Address | Asset Paths | Purpose |
|---|---|---|---|
| **Smart Start – The Premium School** | Pocket 27, Sector 24, Rohini, Delhi – 110085 | `assets/images/halloween-entrance.webp`, `assets/images/ball-pit-adventure.webp`, `assets/images/classroom-group-circle.webp` | Actual school gate/entrance arch, indoor play area, and classroom |

## 8. Latest Updates (`updates.html`) & Interactive Gallery (`gallery.html`)

All 57 curated photographs are mapped into the 6 editable gallery categories (`Classroom Activities`, `Events`, `Celebrations`, `Creative Learning`, `Outdoor Activities`, `School Infrastructure`) in `data/gallery.json` and grouped into 10 multi-photo stories in `data/updates.json`:

- **Classroom Activities (3)**: `learning-with-sound-book`, `toddler-ring-stacking`, `classroom-group-circle`
- **Creative Learning (4)**: `jungle-nature-corner`, `mango-cart-roleplay`, `independence-worksheet`, `finger-painting`
- **Outdoor Activities (3)**: `swing-play-outdoors`, `outdoor-hoop-game`, `toddler-cups-outdoors`
- **School Infrastructure (3)**: `ball-pit-adventure`, `climbing-net-smile`, `ball-pit-slide`
- **Celebrations (24)**: `christmas-decor`, `ganesh-chaturthi-shrine`, `independence-day-salute`, `folk-dhol-celebration`, `costume-day-with-teacher`, `festival-costume-swing`, `janmashtami-tableau`, `little-santas`, `krishna-costume-girl`, `lohri-celebration`, `independence-day-flag`, `mehndi-corner`, `hariyali-teej-swing`, `india-day-group`, `india-day-costumes`, `raksha-bandhan-pair`, `rakhi-tying`, `krishna-radha-portrait`, `janmashtami-prison-set`, `krishna-flute`, `dandiya-pair`, `birthday-cake`, `halloween-entrance`
- **Events (20)**: `admissions-desk-event`, `graduation-with-family`, `graduation-day`, `summer-camp-welcome`, `annual-day-play`, `annual-day-dance`, `annual-day-felicitation`, `martial-arts-line-up`, `annual-day-audience`, `fashion-show-ramp`, `fashion-show-walk`, `play-prepare-pride-stage`, `felicitation-family`, `stage-costume-trio`, `stage-costume-group`, `stage-bunny-ears`, `stage-teachers-and-kids`, `stage-blue-curtain-guests`, `stage-speaker`, `stage-guest-lineup`, `stage-waiting-turn`

