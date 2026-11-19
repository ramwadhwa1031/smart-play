# Smart Start – Admin CMS Guide

The Smart Start Admin Panel (`admin/index.html`) lets school administrators manage almost every part of the website without editing HTML, CSS or JavaScript.

## 1. Opening the Admin Panel

- **On the live website (GitHub Pages)**: open `https://<your-domain>/admin/` (or click **Admin login** in the website footer).
- **On a local computer**: start a local static server inside the `smart-start` folder (for example `python -m http.server 8080`) and open `http://localhost:8080/admin/`.

## 2. How Saving & Publishing Works (Two Modes)

Because the website is hosted on **GitHub Pages** with **no backend database**, the Admin CMS works in two modes:

### Mode 1 – Local Draft (Instant & Offline-capable)
1. Every change you make in any tab (text, photos, updates, gallery, programmes, SEO, settings) is saved automatically to your browser's `localStorage` (and uploaded images are compressed to WebP in `IndexedDB`).
2. Click **Preview Draft** in the top bar at any time to open the public website with your unpublished changes applied.
3. In **Publish & Backup**, you can **Export full backup (`.json`)** (including any locally uploaded photos) or import a backup file.

### Mode 2 – Publish to GitHub (Live Website)
1. Create a **Fine-Grained Personal Access Token** on GitHub:
   - Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - Under **Repository access**, choose **Only select repositories** and pick your website repository.
   - Under **Permissions → Repository permissions**, set **Contents** to **Read and write** (leave all other permissions off).
2. Open **Publish & Backup** in the Admin Panel.
3. Enter your GitHub **Owner**, **Repository**, **Branch** (usually `main`), and paste the **Token**, then click **Connect**.
4. Click **Publish changes to GitHub**.
   - New images are uploaded as optimised `.webp` files under `assets/uploads/`.
   - Modified JSON files under `data/` are committed via the GitHub Contents API.
   - If `.github/workflows/regenerate-static.yml` is enabled in the repository, GitHub Actions automatically runs `node tools/build.js` to regenerate the static SEO HTML pages and `sitemap.xml`.

### Security Rules
- The GitHub token is **never** saved in `localStorage`, cookies, or committed files; it is kept in browser tab memory for the current session only and cleared as soon as the tab is closed or refreshed.
- Always use a fine-grained token restricted to the single website repository with least-privilege (`Contents: Read and write`) and a short expiration date.

## 3. Admin Modules Overview

- **Dashboard**: Overview of published updates, gallery photos, programmes, testimonials, sync status, last publish timestamp, and quick actions.
- **Website Content**:
  - Show, hide, or reorder homepage sections.
  - Edit headings, highlighted words (`[[like this]]`), descriptions, button labels, button links, hero photos, marquee items, About Us story/vision/values, and the 8 Multiple Intelligences.
- **Latest Updates**: Full CRUD for school news, celebrations, events, and notices. Supports multiple photos per update, featured cover selection, category management, ordering, and publish/unpublish toggles.
- **Gallery Manager**: Bulk drag-and-drop image upload, category filtering, category editor, captions, alt text, featured badges, visibility toggles, and batch operations.
- **Programmes**: Add, edit, reorder, or hide age programmes (Toddlers through UKG), including age ranges, learning objectives, activities, development areas, and photos.
- **Principal & Staff**: Update Dr. Parvinder Kaur's photograph, designation, biography, and full message to parents, or add staff profiles.
- **Testimonials**: Add and publish genuine parent testimonials (the public section stays hidden when zero testimonials are published).
- **Our Centres**: Edit centre name, confirmed address (`Pocket 27, Sector 24, Rohini, Delhi – 110085`), phone numbers, Google Maps link, and photographs.
- **SEO Manager**: Per-page SEO title, meta description (with live character counters), canonical URL, Open Graph title/description/image, robots directive, and Schema.org structured data.
- **Media Library**: Central library of all website images showing dimensions, file size, category, and exact sections where each image is used, plus one-click **Replace everywhere**.
- **Website Settings**: School name, logo, favicon, brand colour palette, phone numbers, email, WhatsApp number, social links, working hours, and footer text.

