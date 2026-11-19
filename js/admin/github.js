/* GitHub publishing via the Contents API. The token lives in memory only (never localStorage, never committed). */
(function () {
  "use strict";
  var AS = window.AS;
  var G = AS.gh = { token: null, user: null, repoInfo: null };

  function b64(str) { return btoa(unescape(encodeURIComponent(str))); }
  function blobB64(blob) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(",")[1]); }; r.onerror = rej; r.readAsDataURL(blob); }); }
  function dec(b) { return decodeURIComponent(escape(atob(String(b).replace(/\n/g, "")))); }

  function GHError(status, message, extra) { var e = new Error(message); e.status = status; e.extra = extra; return e; }
  function explain(status, body, res) {
    var m = (body && body.message) || "";
    if (status === 401) return "GitHub rejected the token (401). It is invalid, revoked or expired. Create a new fine-grained token and reconnect.";
    if (status === 403) {
      if (res && res.headers.get("x-ratelimit-remaining") === "0") return "GitHub rate limit reached. Wait a few minutes and try again.";
      return "Permission denied (403). The token needs 'Contents: Read and write' on this repository. " + m;
    }
    if (status === 404) return "Not found (404). Check the owner, repository and branch names, and that the token has access to this repository.";
    if (status === 409) return "Conflict (409): the file changed on GitHub while publishing. " + m;
    if (status === 422) return "GitHub refused the request (422): " + m;
    return "GitHub error " + status + ": " + m;
  }
  G.api = function (path, opt) {
    if (!G.token) return Promise.reject(GHError(0, "Not connected. Enter your token first."));
    opt = opt || {};
    return fetch("https://api.github.com" + path, {
      method: opt.method || "GET", cache: "no-store",
      headers: { "Authorization": "Bearer " + G.token, "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
      body: opt.body ? JSON.stringify(opt.body) : undefined
    }).then(function (res) {
      return res.text().then(function (t) {
        var body = null; try { body = t ? JSON.parse(t) : null; } catch (e) { /* ignore */ }
        if (!res.ok) throw GHError(res.status, explain(res.status, body, res), body);
        return body;
      });
    }, function () { throw GHError(0, "Network error: could not reach api.github.com. Check your internet connection."); });
  };

  function repoPath(cfg) { return "/repos/" + encodeURIComponent(cfg.owner) + "/" + encodeURIComponent(cfg.repo); }
  function cpath(cfg, file) { return repoPath(cfg) + "/contents/" + file.split("/").map(encodeURIComponent).join("/"); }

  G.connect = function (cfg, token) {
    G.token = token.trim(); G.user = null;
    return G.api(repoPath(cfg)).then(function (info) {
      G.repoInfo = info;
      if (info.permissions && info.permissions.push === false) throw GHError(403, "This token can read the repository but cannot write to it. Grant 'Contents: Read and write'.");
      return G.api(repoPath(cfg) + "/branches/" + encodeURIComponent(cfg.branch)).then(function () { AS.setConfig(cfg); return info; });
    }).catch(function (e) { G.token = null; G.repoInfo = null; throw e; });
  };
  G.disconnect = function () { G.token = null; G.repoInfo = null; };

  G.getFile = function (cfg, file) {
    return G.api(cpath(cfg, file) + "?ref=" + encodeURIComponent(cfg.branch)).then(function (r) { return { sha: r.sha, text: r.content ? dec(r.content) : "" }; })
      .catch(function (e) { if (e.status === 404) return null; throw e; });
  };
  G.putFile = function (cfg, file, b64content, message, retry) {
    return G.getFile(cfg, file).then(function (cur) {
      var body = { message: message, content: b64content, branch: cfg.branch }; if (cur) body.sha = cur.sha;
      return G.api(cpath(cfg, file), { method: "PUT", body: body }).catch(function (e) {
        if ((e.status === 409 || e.status === 422) && !retry) return G.putFile(cfg, file, b64content, message, true);   // SHA conflict: refetch sha and retry once
        throw e;
      });
    });
  };
  G.deleteFile = function (cfg, file, message) {
    return G.getFile(cfg, file).then(function (cur) {
      if (!cur) return null;
      return G.api(cpath(cfg, file), { method: "DELETE", body: { message: message, sha: cur.sha, branch: cfg.branch } });
    });
  };

  /* Compares remote JSON with the snapshot we started from; returns the names that diverged. */
  G.findConflicts = function (cfg, payload, changed) {
    return Promise.all(changed.map(function (k) {
      return G.getFile(cfg, "data/" + AS.FILES[k] + ".json").then(function (r) {
        if (!r) return null;
        try { if (JSON.stringify(JSON.parse(r.text)) !== JSON.stringify(AS.original[k])) return k; } catch (e) { return k; }
        return null;
      });
    })).then(function (a) { return a.filter(Boolean); });
  };

  /* Publish. onStep(label, state) with state in 'run'|'ok'|'fail'. Resolves {ok, steps, commits} or rejects with partial info. */
  G.publish = function (cfg, onStep) {
    var payload = AS.publishPayload(), steps = [], commits = [];
    var changed = Object.keys(AS.FILES).filter(function (k) { return JSON.stringify(payload.files[k]) !== JSON.stringify(AS.original[k]); });
    function step(label, fn) {
      onStep && onStep(label, "run");
      return fn().then(function (r) { steps.push({ label: label, ok: true }); onStep && onStep(label, "ok"); return r; },
        function (e) { steps.push({ label: label, ok: false, error: e.message }); onStep && onStep(label, "fail", e.message); e.steps = steps; throw e; });
    }
    var msgFiles = changed.map(function (k) { return AS.FILES[k] + ".json"; }).join(", ") || "assets";
    var chain = Promise.resolve();
    payload.uploads.forEach(function (id) {
      chain = chain.then(function () {
        return step("Upload image " + id + ".webp", function () {
          return AS.idbGet(id).then(function (v) {
            if (!v || !v.blob) throw new Error("The image data for '" + id + "' is no longer stored in this browser. Re-upload the image and try again.");
            return blobB64(v.blob).then(function (c) { return G.putFile(cfg, "assets/uploads/" + id + ".webp", c, "CMS: add image " + id); });
          });
        });
      });
    });
    changed.forEach(function (k) {
      chain = chain.then(function () {
        return step("Commit data/" + AS.FILES[k] + ".json", function () {
          return G.putFile(cfg, "data/" + AS.FILES[k] + ".json", b64(JSON.stringify(payload.files[k], null, 2) + "\n"), "CMS: update " + AS.FILES[k] + ".json via Smart Start admin")
            .then(function (r) { if (r && r.commit) commits.push({ file: AS.FILES[k] + ".json", sha: r.commit.sha, url: r.commit.html_url }); });
        });
      });
    });
    AS.deleted.slice().forEach(function (path) {
      chain = chain.then(function () { return step("Delete " + path, function () { return G.deleteFile(cfg, path, "CMS: remove " + path); }); });
    });
    return chain.then(function () {
      AS.applyPublished(payload);
      var rec = { at: new Date().toISOString(), files: changed.map(function (k) { return AS.FILES[k] + ".json"; }), commits: commits, repo: cfg.owner + "/" + cfg.repo, branch: cfg.branch };
      AS.setLastPublish(rec);
      return { ok: true, steps: steps, commits: commits, record: rec, summary: msgFiles };
    });
  };
})();
