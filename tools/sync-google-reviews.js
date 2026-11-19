#!/usr/bin/env node
/* Syncs live Google Reviews for Smart Start The Premium School into data/testimonials.json.
 * Supports two sanctioned sources (no scraping / no CAPTCHA bypass):
 *   1) Official Google Places API: set env GOOGLE_PLACES_API_KEY (and optional GOOGLE_PLACE_ID).
 *   2) A public JSON reviews feed (e.g. Featurable widget JSON): set liveFeedUrl in data/testimonials.json
 *      or env GOOGLE_REVIEWS_FEED_URL. */
const fs = require("fs");
const path = require("path");
const https = require("https");

const root = path.join(__dirname, "..");
const testPath = path.join(root, "data", "testimonials.json");

function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(getJson(res.headers.location, headers));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function fetchFromPlacesApi(apiKey, placeId) {
  let pid = placeId;
  if (!pid) {
    const q = encodeURIComponent("Smart Start The Premium School Pocket 27 Sector 24 Rohini Delhi");
    const find = await getJson(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${q}&inputtype=textquery&fields=place_id&key=${encodeURIComponent(apiKey)}`);
    pid = find && find.candidates && find.candidates[0] && find.candidates[0].place_id;
  }
  if (!pid) throw new Error("Could not resolve Google Place ID");
  const det = await getJson(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(pid)}&fields=name,rating,user_ratings_total,url,reviews&reviews_sort=newest&key=${encodeURIComponent(apiKey)}`);
  const r = det && det.result;
  if (!r) throw new Error("Empty Places API result");
  return {
    rating: r.rating,
    totalReviews: r.user_ratings_total,
    googleReviewsUrl: r.url,
    items: (r.reviews || []).filter((x) => x && (x.rating || 5) >= 4 && x.text).map((x) => ({
      name: x.author_name || "Parent",
      relation: x.relative_time_description ? `Google Review · ${x.relative_time_description}` : "Verified Google Review",
      rating: x.rating || 5,
      text: String(x.text || "").trim(),
      avatar: x.profile_photo_url || "",
      source: "google",
      published: true
    }))
  };
}

async function fetchFromFeed(feedUrl) {
  const data = await getJson(feedUrl);
  const raw = Array.isArray(data) ? data : (data.reviews || (data.widget && data.widget.reviews) || data.items || []);
  return {
    rating: data.averageRating || data.rating || (data.widget && data.widget.averageRating),
    totalReviews: data.totalReviewCount || data.user_ratings_total || (data.widget && data.widget.totalReviewCount),
    items: raw.filter((x) => x && (x.comment || x.text) && (x.starRating || x.rating || 5) >= 4).map((x) => ({
      name: (x.reviewer && x.reviewer.displayName) || x.author_name || x.name || "Parent",
      relation: x.relative_time_description ? `Google Review · ${x.relative_time_description}` : "Verified Google Review",
      rating: Number(x.starRating || x.rating || 5) || 5,
      text: String(x.comment || x.text || "").trim(),
      avatar: (x.reviewer && x.reviewer.profilePhotoUrl) || x.profile_photo_url || "",
      source: "google",
      published: true
    }))
  };
}

async function run() {
  const cur = JSON.parse(fs.readFileSync(testPath, "utf8"));
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  const featId = process.env.FEATURABLE_WIDGET_ID || cur.featurableWidgetId || "";
  const feedUrl = process.env.GOOGLE_REVIEWS_FEED_URL || cur.liveFeedUrl || (featId ? `https://featurable.com/api/v1/widgets/${encodeURIComponent(featId)}` : "");

  if (!apiKey && !feedUrl) {
    console.log("Google Reviews sync skipped (set GOOGLE_PLACES_API_KEY, featurableWidgetId, or liveFeedUrl in data/testimonials.json to enable automated sync).");
    return;
  }
  const res = apiKey ? await fetchFromPlacesApi(apiKey, process.env.GOOGLE_PLACE_ID || "") : await fetchFromFeed(feedUrl);
  if (res.rating) cur.rating = res.rating;
  if (res.totalReviews) { cur.reviewCount = res.totalReviews; cur.totalReviews = res.totalReviews; }
  if (res.googleReviewsUrl) cur.googleReviewsUrl = res.googleReviewsUrl;
  if (res.items && res.items.length) {
    const manual = (cur.items || []).filter((x) => x.source !== "google");
    cur.items = res.items.concat(manual);
  }
  cur.lastSyncedAt = new Date().toISOString();
  fs.writeFileSync(testPath, JSON.stringify(cur, null, 2) + "\n");
  console.log(`Synced ${res.items ? res.items.length : 0} live Google reviews.`);
}

run().catch((e) => {
  console.warn("Google Reviews sync warning:", e.message);
  process.exit(0);
});

