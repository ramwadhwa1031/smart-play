#!/usr/bin/env node
/* Dynamically syncs the latest Reels directly from @smart_start_the_premium_school on Instagram
 * (via Instagram's official public profile embed endpoint, no API token required),
 * sorted strictly by latest uploaded Reel first, with zero local static covers. */
const fs = require("fs");
const path = require("path");
const https = require("https");

const root = path.join(__dirname, "..");
const USERNAME = "smart_start_the_premium_school";
const EMBED_URL = `https://www.instagram.com/${USERNAME}/embed/`;

function fetchBuffer(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://sstps.in/",
        "Sec-Fetch-Dest": "iframe",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        ...headers
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchBuffer(res.headers.location, headers));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
  });
}

async function run() {
  console.log(`Fetching latest Reels from Instagram @${USERNAME}...`);
  const html = (await fetchBuffer(EMBED_URL)).toString("utf8");
  const m = html.match(/"contextJSON":("(?:\\.|[^"\\])*")/);
  if (!m) throw new Error("Could not find contextJSON in Instagram embed response");
  const ctx = JSON.parse(JSON.parse(m[1])).context;
  const mediaList = ((ctx && ctx.graphql_media) || [])
    .map((x) => x && x.shortcode_media)
    .filter((sm) => sm && sm.shortcode && sm.is_video)
    .sort((a, b) => (b.taken_at_timestamp || 0) - (a.taken_at_timestamp || 0))
    .slice(0, 4);

  if (!mediaList.length) throw new Error("No video Reels returned from Instagram");

  const hpPath = path.join(root, "data", "homepage.json");
  const mediaPath = path.join(root, "data", "media.json");
  const hp = JSON.parse(fs.readFileSync(hpPath, "utf8"));
  const media = JSON.parse(fs.readFileSync(mediaPath, "utf8"));
  media.items = media.items.filter((x) => !/^ig-live-/.test(x.id || "") && !/^reel-parent-/.test(x.id || ""));

  const liveReels = mediaList.map((sm, i) => {
    const code = sm.shortcode;
    const takenAt = sm.taken_at_timestamp ? new Date(sm.taken_at_timestamp * 1000).toISOString() : "";
    console.log(`#${i + 1} Latest Reel: ${code} (uploaded ${takenAt})`);
    return {
      shortcode: code,
      isVideo: true,
      takenAt,
      url: `https://www.instagram.com/reel/${code}/`,
      embedUrl: `https://www.instagram.com/reel/${code}/embed/`
    };
  });

  hp.reels = {
    eyebrow: `Instagram Reels · @${USERNAME}`,
    title: "Watch the Magic Unfold [[Daily on Reels]]",
    text: "Our latest Reels streamed directly from our official Instagram page.",
    profileUrl: `https://www.instagram.com/${USERNAME}/reels/`,
    handle: `@${USERNAME}`,
    buttonLabel: "Watch All Reels on Instagram",
    username: USERNAME,
    fullName: ctx.full_name || "Smart Start – The Premium School",
    followersCount: ctx.followers_count || 0,
    postsCount: ctx.posts_count || 0,
    lastSyncedAt: new Date().toISOString(),
    items: liveReels
  };

  fs.writeFileSync(hpPath, JSON.stringify(hp, null, 2) + "\n");
  fs.writeFileSync(mediaPath, JSON.stringify(media, null, 2) + "\n");
  console.log(`Done! Synced ${liveReels.length} latest Instagram Reels (newest first, no static covers).`);
}

run().catch((e) => {
  console.warn("Instagram live sync warning:", e.message);
  process.exit(0);
});
