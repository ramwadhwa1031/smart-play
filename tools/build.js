#!/usr/bin/env node
/* Static regeneration: reads data/*.json and writes the public HTML pages, sitemap.xml and robots.txt.
 * Run locally:  node tools/build.js          (GitHub Actions runs it on every change to data/)
 * Verify only:  node tools/build.js --check  (no files written; reports problems and exits 1 on errors) */
const fs = require("fs");
const path = require("path");
const R = require("../js/render.js");

const root = path.join(__dirname, "..");
const check = process.argv.includes("--check");
const ADMIN_PAGES = {
  "index.html": ["dashboard", "Smart Start Admin CMS"],
  "dashboard.html": ["dashboard", "Dashboard | Smart Start Admin"],
  "content.html": ["content", "Website Content Manager | Smart Start Admin"],
  "updates.html": ["updates", "Announcements Manager | Smart Start Admin"],
  "gallery.html": ["gallery", "Gallery Manager | Smart Start Admin"],
  "programmes.html": ["programmes", "Programme Manager | Smart Start Admin"],
  "media.html": ["media", "Media Library | Smart Start Admin"],
  "seo.html": ["seo", "SEO Manager | Smart Start Admin"],
  "settings.html": ["settings", "Website Settings | Smart Start Admin"]
};
function adminHtml(defaultView, title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>${title}</title>
  <link rel="icon" href="../assets/logos/favicon-32.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap">
  <link rel="stylesheet" href="../css/admin.css">
</head>
<body data-default-view="${defaultView}">
  <div class="admin-shell">
    <aside class="sidebar" aria-label="Admin navigation">
      <a class="side-brand" href="#/dashboard">
        <img src="../assets/logos/smart-start-logo-200.webp" alt="Smart Start logo" width="44" height="44">
        <div><b>Smart Start</b><small>Admin CMS</small></div>
      </a>
      <nav class="side-nav">
        <a href="#/dashboard" data-nav="dashboard">Dashboard</a>
        <a href="#/content" data-nav="content">Website Content</a>
        <a href="#/updates" data-nav="updates">Announcements</a>
        <a href="#/gallery" data-nav="gallery">Gallery Manager</a>
        <a href="#/programmes" data-nav="programmes">Programmes</a>
        <a href="#/people" data-nav="people">Principal &amp; Staff</a>
        <a href="#/testimonials" data-nav="testimonials">Testimonials</a>
        <a href="#/centres" data-nav="centres">Our Centres</a>
        <a href="#/seo" data-nav="seo">SEO Manager</a>
        <a href="#/media" data-nav="media">Media Library</a>
        <a href="#/settings" data-nav="settings">Website Settings</a>
        <a href="#/publish" data-nav="publish">Publish &amp; Backup</a>
      </nav>
      <div class="side-foot">
        <a href="../index.html" target="_blank" rel="noopener">View public website ↗</a>
        <span>Pocket 27, Sector 24, Rohini</span>
      </div>
    </aside>
    <div class="main-col">
      <header class="topbar">
        <div class="topbar__l">
          <button class="side-toggle" id="side-toggle" type="button" aria-label="Toggle menu">☰ Menu</button>
          <span class="badge badge--ok" id="draft-pill">All changes synced</span>
        </div>
        <div class="topbar__r">
          <button class="btn btn--sm" id="btn-preview" type="button">Preview Draft</button>
          <a class="btn btn--sm btn--primary" href="#/publish">Publish to GitHub</a>
        </div>
      </header>
      <main class="view" id="view" tabindex="-1">
        <p class="muted">Loading Smart Start CMS…</p>
      </main>
    </div>
  </div>
  <div class="toasts" id="toasts" aria-live="polite"></div>
  <script src="../js/seed-data.js"></script>
  <script src="../js/admin/store.js"></script>
  <script src="../js/admin/ui.js"></script>
  <script src="../js/admin/github.js"></script>
  <script src="../js/admin/views.js"></script>
  <script src="../js/admin.js"></script>
</body>
</html>
`;
}
if (!check) {
  fs.mkdirSync(path.join(root, "admin"), { recursive: true });
  for (const [f, [v, t]] of Object.entries(ADMIN_PAGES)) {
    fs.writeFileSync(path.join(root, "admin", f), adminHtml(v, t));
  }
}
const names = { settings: "site-settings", homepage: "homepage", about: "about", philosophy: "philosophy", programmes: "programmes",
  gallery: "gallery", updates: "updates", centres: "centres", testimonials: "testimonials", seo: "seo", media: "media" };
const data = {}, seedByFile = {};
for (const k in names) {
  data[k] = JSON.parse(fs.readFileSync(path.join(root, "data", names[k] + ".json"), "utf8"));
  seedByFile[names[k]] = data[k];
}
if (!check) {
  fs.writeFileSync(path.join(root, "js", "seed-data.js"), "/* Auto-generated fallback data for file:// protocol */\nwindow.SS_SEED_DATA = " + JSON.stringify(seedByFile) + ";\n");
}

let base = (data.settings.siteUrl || "").trim();
if (!base && process.env.GITHUB_REPOSITORY) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  base = repo.toLowerCase() === owner.toLowerCase() + ".github.io" ? `https://${owner}.github.io/` : `https://${owner}.github.io/${repo}/`;
}
if (!base) console.warn("WARN: no siteUrl (set it in Admin > Settings). Canonical/OG URLs and sitemap.xml are omitted until it is known.");

const errors = [], warns = [];
const titles = new Map(), descs = new Map();
for (const pid of Object.keys(R.FILES)) {
  const html = R.renderPage(data, pid, { siteUrl: base });
  const file = path.join(root, R.FILES[pid]);
  if (!check) fs.writeFileSync(file, html);
  // --- checks ---
  const t = (html.match(/<title>(.*?)<\/title>/) || [])[1] || "", d = (html.match(/<meta name="description" content="(.*?)">/) || [])[1] || "";
  if (!t) errors.push(`${pid}: missing title`); if (!d) errors.push(`${pid}: missing description`);
  if (titles.has(t)) errors.push(`${pid}: duplicate title with ${titles.get(t)}`); titles.set(t, pid);
  if (descs.has(d)) errors.push(`${pid}: duplicate description with ${descs.get(d)}`); descs.set(d, pid);
  if (t.length > 70) warns.push(`${pid}: title ${t.length} chars (>70)`);
  if (d.length > 170) warns.push(`${pid}: description ${d.length} chars (>170)`);
  const h1 = (html.match(/<h1[\s>]/g) || []).length; if (h1 !== 1) errors.push(`${pid}: ${h1} <h1> tags`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/ alt="[^"]/.test(m[0]) && !/ alt=""/.test(m[0])) errors.push(`${pid}: img without alt`);
    if (!/ width="\d+"/.test(m[0]) || !/ height="\d+"/.test(m[0])) errors.push(`${pid}: img without dimensions: ${m[0].slice(0, 80)}`);
  }
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)) refs.add(m[1]);
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) m[1].split(",").forEach(s => refs.add(s.trim().split(" ")[0]));
  for (const r of refs) {
    if (/^(https?:|mailto:|tel:|data:)/.test(r)) continue;
    if (!fs.existsSync(path.join(root, r))) errors.push(`${pid}: missing file ${r}`);
  }
  for (const m of html.matchAll(/href="([a-z]+\.html)#([^"]+)"/g)) {
    const target = path.join(root, m[1]);
    if (fs.existsSync(target) || !check) {
      const th = m[1] === R.FILES[pid] ? html : (fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "");
      if (th && !th.includes(`id="${m[2]}"`)) warns.push(`${pid}: anchor ${m[1]}#${m[2]} not found`);
    }
  }
}
if (!check) {
  const sm = R.sitemap(data, base);
  if (sm) fs.writeFileSync(path.join(root, "sitemap.xml"), sm); else if (fs.existsSync(path.join(root, "sitemap.xml"))) fs.unlinkSync(path.join(root, "sitemap.xml"));
  fs.writeFileSync(path.join(root, "robots.txt"), "User-agent: *\nAllow: /\nDisallow: /admin/\n" + (base ? `\nSitemap: ${base}sitemap.xml\n` : ""));
  fs.writeFileSync(path.join(root, ".nojekyll"), "");
}
// Data checks: every image referenced in JSON exists
const text = Object.values(data).map(v => JSON.stringify(v)).join(" ");
for (const m of text.matchAll(/assets\/[A-Za-z0-9_\-\/\.]+\.(?:webp|png|jpg|jpeg|svg|ico)/g)) {
  if (!fs.existsSync(path.join(root, m[0]))) errors.push(`data: missing asset ${m[0]}`);
}
warns.forEach(w => console.warn("WARN:", w));
errors.forEach(e => console.error("ERROR:", e));
console.log(check ? "Checked" : "Built", Object.keys(R.FILES).length, "pages;", errors.length, "errors,", warns.length, "warnings");
process.exit(errors.length ? 1 : 0);

