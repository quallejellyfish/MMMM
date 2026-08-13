const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { timeStamp } = require("console");
const jwt = require("jsonwebtoken");
const http = require("http");
const { WebSocketServer } = require("ws");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const { resolveSoa } = require("dns");
const guestKeys = {};
const guestSSEClients = {};
const GUEST_KEY_EXPIRY = 5 * 60 * 1000; // 5 minutes

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH;
const API_KEY = process.env.API_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_SECRET = process.env.COOKIE_SECRET;

const CATEGORIES = [
  { id: 999, name: "🇺🇸-----English Songs-----" },
  { id: 999, name: "🇩🇪-----German Songs-----" },
  { id: 999, name: "🇨🇳-----Chinese Songs-----" },
  { id: 999, name: "💥-----Pulary Songs-----" },
  { id: 999, name: "🌍-----other language Songs-----" },
  { id: 999, name: "🦊----- Krimsonthefox Music-----" },
  { id: 999, name: "❓-----Not My Songs-----" },
];

// DISCORD EMBEDS
async function sendDiscordAddition(song, categoryName, lyricCount) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log("Discord webhook not configured, skipping notification.");
    return;
  }
  try {
    const embed = {
      title: "🎵 New Song Added",
      color: 0x00ff88,
      fields: [
        { name: "Name", value: song.name, inline: true },
        { name: "ID", value: String(song.id), inline: true },
        {
          name: "Category",
          value: categoryName || "Uncategorized",
          inline: true,
        },
        { name: "Lyrics Lines", value: String(lyricCount), inline: true },
        { name: "Audio URL", value: `[Link](${song.url})`, inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Song Manager API" },
    };

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!response.ok)
      console.error("Discord delete webhook failed:", response.status);
  } catch (err) {
    console.error("Discord delete notification error:", err);
  }
}

async function sendDiscordDeletion(song) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    const embed = {
      title: "🗑️ Song Deleted",
      color: 0xff5555,
      fields: [
        { name: "Name", value: song.name, inline: true },
        { name: "ID", value: String(song.id), inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Song Manager API" },
    };
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!response.ok)
      console.error("Discord delete webhook failed:", response.status);
  } catch (err) {
    console.error("Discord delete notification error:", err);
  }
}

async function sendDiscordEditNotification(
  oldSong,
  newSong,
  changes,
  lyricsOldCount,
  lyricsNewCount,
) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    let fields = [];

    // Always show the song name
    fields.push({ name: "Song", value: newSong.name, inline: true });

    // name change
    if (changes.name) {
      fields.push({
        name: "Name Change",
        value: `~~${oldSong.name}~~ → ${newSong.name}`,
        inline: true,
      });
    }

    // URL change
    if (changes.url) {
      fields.push({
        name: "URL",
        value: `[old](${oldSong.url}) → [new](${newSong.url})`,
        inline: false,
      });
    }

    // Category change
    if (changes.category) {
      fields.push({
        name: "Category",
        value: `~~${oldSong.category}~~ → ${newSong.category}`,
        inline: true,
      });
    }

    // Public change
    if (changes.public === true) {
      const oldPublic = oldSong.public ? "Public" : "Private";
      const newPublic = newSong.public ? "Public" : "Private";
      fields.push({
        name: "Visibility",
        value: `${oldPublic} → ${newPublic}`,
        inline: true,
      });
    }

    // Lyrics count change
    if (
      lyricsOldCount !== undefined &&
      lyricsNewCount !== undefined &&
      lyricsOldCount !== lyricsNewCount
    ) {
      fields.push({
        name: "Lyrics Lines",
        value: `${lyricsOldCount} → ${lyricsNewCount}`,
        inline: true,
      });
    }

    if (fields.length === 0) return;

    const embed = {
      title: "📝 Song Updated",
      color: 0xffaa00,
      fields: fields,
      timestamp: new Date().toISOString(),
      footer: { text: `ID: ${oldSong.id}` },
    };
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!response.ok)
      console.error("Discord edit webhook failed:", response.status);
  } catch (err) {
    console.error("Discord edit notification error:", err);
  }
}

async function sendGitHubSyncNotification(success, message, details = "") {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    const embed = {
      title: "🔗 GitHub Sync",
      color: success ? 0x3498db : 0xe74c3c, // blue for success, red for failure
      description: success
        ? "✅ Sync completed successfully"
        : "❌ Sync failed",
      fields: [
        {
          name: "Repository",
          value: GITHUB_REPO || "Not configured",
          inline: true,
        },
        { name: "Branch", value: GITHUB_BRANCH || "main", inline: true },
        { name: "Message", value: message, inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Song Manager API" },
    };
    if (details) {
      embed.fields.push({ name: "Details", value: details, inline: false });
    }
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!response.ok)
      console.error("GitHub sync Discord webhook failed:", response.status);
  } catch (err) {
    console.error("Error sending GitHub sync Discord notification:", err);
  }
}

function requireApiKey(req, res, next) {
  if (req.signedCookies.auth === "true") {
    return next();
  }
  const key = req.headers["x-api-key"];
  if (key === API_KEY) {
    return next();
  }
  console.log("Unauthorized access attempt");
  return res.status(401).json({ error: "Unauthorized" });
}

function generateGuestKey() {
  const token = crypto.randomBytes(16).toString("hex");
  const now = Date.now();
  guestKeys[token] = {
    createdAt: now,
    expiresAt: now + GUEST_KEY_EXPIRY,
  };
  return token;
}

function verifyGuestKey(token) {
  const entry = guestKeys[token];
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    delete guestKeys[token];
    return false;
  }
  return true;
}

function verifyGuestToken(req, res, next) {
  let token = req.headers["x-guest-token"] || req.query.guest_token;
  if (!token) return next();
  if (verifyGuestKey(token)) {
    req.isGuest = true;
    req.guestToken = token;
  }
  next();
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      // Allow any origin (for now)
      callback(null, origin);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser(COOKIE_SECRET));

app.use((req, res, next) => {
  const path = req.path;
  const auth = req.signedCookies.auth;

  if (path === "/manager.html") {
    const guestToken = req.query.guest_token;
    if (auth === "true" || (guestToken && verifyGuestKey(guestToken))) {
      return next();
    }
    return res.redirect("/session-expired");
  }

  if (path === "/generate.html") {
    if (auth === "true") {
      return next();
    }
    return res.redirect("/");
  }

  next();
});

app.post("/auth", (req, res) => {
  const { apiKey } = req.body;
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  const token = jwt.sign({ type: "sse" }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

app.get("/api-key", (req, res) => {
  const isAuthenticated =
    req.signedCookies.auth === "true" || req.headers["x-api-key"] === API_KEY;
  if (!isAuthenticated) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ key: API_KEY });
});

app.post("/verify-key", express.json(), (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ valid: false, error: "Missing API key" });
  }
  const isValid = apiKey === API_KEY;
  res.json({ valid: isValid });
});

app.get("/guest-events/:token", (req, res) => {
  const token = req.params.token;
  if (!verifyGuestKey(token)) {
    return res.status(401).send("Invalid token");
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  res.write("retry: 10000\n\n");

  guestSSEClients[token] = res;

  req.on("close", () => {
    delete guestSSEClients[token];
  });
});

app.post("/revoke-guest", requireApiKey, (req, res) => {
  const { token } = req.body;
  if (!token || !guestKeys[token]) {
    return res.status(404).json({ error: "Key not found" });
  }
  delete guestKeys[token];

  const clientRes = guestSSEClients[token];
  if (clientRes) {
    try {
      clientRes.write(`event: revoked\ndata: {"message":"Key revoked"}\n\n`);
      clientRes.end();
    } catch (e) {
      // ignore
    }
    delete guestSSEClients[token];
  }

  res.json({ message: "Key revoked" });
});

app.post("/login", express.json(), (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ success: false, message: "Missing API key" });
  }
  if (apiKey === API_KEY) {
    res.cookie("auth", "true", {
      httpOnly: true,
      signed: true,
      maxAge: 3600000, // 1 hour
      sameSite: "none",
      secure: true,
    });
    return res.json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: "Invalid API key" });
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("auth");
  res.redirect("/");
});

app.get("/mod-script", (req, res) => {
  if (req.signedCookies.auth !== "true") {
    return res.status(401).send("Unauthorized");
  }
  try {
    const script = fs.readFileSync("./mmm-mod.js", "utf8");
    res.set("Content-Type", "application/javascript");
    res.send(script);
  } catch (err) {
    console.error("Error serving mod script:", err);
    res.status(500).send("Internal server error");
  }
});

app.get("/public-mod-script", (req, res) => {
  try {
    const script = fs.readFileSync("./mmm-mod-public.js", "utf8");
    res.set("Content-Type", "application/javascript");
    res.send(script);
  } catch (err) {
    console.error("Error serving public mod script:", err);
    res.status(500).send("Internal server error");
  }
});
// ROOT
app.get("/", (req, res) => {
  const isAuthenticated = req.signedCookies.auth === "true";

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="MMMM is a multi-page site created by wolfi and made for the userscript part MMM to have a easier way to manage and store songs and their lyrics"
        />
        <meta
          name="keywords"
          content="MMMM, MMM, MusicMenuModManager, MusicModMenu"
        />
        <meta name="author" content="wolfi" />
        <title>MMMM - Music Menu Mod Manager</title>
        <style>
          * { box-sizing: border-box; }
          body {
            background: #1e1e2f;
            color: #eee;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .container {
            background: #2d2d3a;
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          }
          h1 { margin-top: 0; font-size: 2.2rem; }
          input {
            width: 100%;
            padding: 14px;
            margin: 12px 0;
            background: #3a3a4a;
            border: 1px solid #555;
            border-radius: 8px;
            color: #fff;
            font-size: 1rem;
          }
          button {
            background: #ff79c6;
            border: none;
            padding: 14px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 1.1rem;
            transition: background 0.2s;
            width: 100%;
          }
          button:hover { background: #ba4085; }
          .message { margin: 12px 0; font-size: 0.95rem; color: #aaa; }
          .links {
            margin-top: 24px;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .link-btn {
            display: block;
            background: #3a3a4a;
            padding: 16px;
            border-radius: 12px;
            text-decoration: none;
            color: #ff79c6;
            font-weight: bold;
            font-size: 1.3rem;
            transition: background 0.2s, transform 0.1s;
            border: 1px solid #555;
          }
          .link-btn:hover {
            background: #4a4a5a;
            transform: scale(1.02);
          }
          .link-btn.public {
            color: #8be9fd;
            border-color: #8be9fd;
          }
          .link-btn.private {
            color: #ffb347;
            border-color: #ffb347;
          }
          .link-btn.generate {
            color: #2ecc71;
            border-color: #2ecc71;
          }
          .logout-btn {
            background: #e74c3c;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            color: white;
            font-weight: bold;
            margin-top: 12px;
          }
          .logout-btn:hover { background: #c0392b; }
          .guest-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin: 10px 0;
          }
          .guest-row input {
            flex: 1;
            padding: 10px;
            margin: 0;
            background: #3a3a4a;
            border: 1px solid #555;
            border-radius: 8px;
            color: #fff;
            min-width: 120px;
          }
          .guest-row button {
            flex: 0 0 auto;
            background: #ffb347;
            padding: 10px 20px;
            width: auto;
          }
          .guest-row button:hover { background: #e6a030; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>MMMM</h1>
          <p>Music Menu Mod Manager</p>
          <div class="message" id="statusMsg">
            ${isAuthenticated ? "You are authenticated." : "Enter your API key to access private manager."}
          </div>

          ${
            !isAuthenticated
              ? `
            <input type="password" id="apiKeyInput" placeholder="API Key" aria-label="API Key">
            <button id="saveKeyBtn">Save Key &amp; Unlock Private</button>
          `
              : `
            <div style="margin: 12px 0;">
              <span style="color: #8be9fd;">Private manager is unlocked.</span>
            </div>
            <a href="/logout" class="logout-btn">Logout</a>
          `
          }

          <div class="links">
            <a href="/public.html" class="link-btn public">Public Songs</a>

            ${
              !isAuthenticated
                ? `
              <div class="guest-row">
                <input type="text" id="guestTokenInput" placeholder="Paste guest token" aria-label="Guest token">
                <button id="guestAccessBtn">Guest Access</button>
              </div>
            `
                : `
              <a href="/generate" class="link-btn generate">Generate Guest Keys</a>
            `
            }

            ${isAuthenticated ? `<a href="/manager.html" class="link-btn private">Private Manager</a>` : ""}
          </div>
        </div>

        <script>
          ${
            !isAuthenticated
              ? `
            document.getElementById('saveKeyBtn').addEventListener('click', async () => {
              const key = document.getElementById('apiKeyInput').value.trim();
              const statusMsg = document.getElementById('statusMsg');
              if (!key) {
                statusMsg.textContent = 'Please enter a key.';
                return;
              }
              try {
                const res = await fetch('/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ apiKey: key })
                });
                const data = await res.json();
                if (data.success) {
                  statusMsg.textContent = 'Key accepted. Refreshing...';
                  setTimeout(() => location.reload(), 500);
                } else {
                  statusMsg.textContent = 'Invalid API key.';
                }
              } catch (e) {
                statusMsg.textContent = 'Error connecting to server.';
              }
            });

            document.getElementById('guestAccessBtn').addEventListener('click', () => {
              const token = document.getElementById('guestTokenInput').value.trim();
              if (!token) {
                document.getElementById('statusMsg').textContent = 'Please enter a guest token.';
                return;
              }
              window.location.href = "/manager.html?guest_token=" + encodeURIComponent(token);
            });
          `
              : ""
          }
        </script>
      </body>
      </html>
  `);
});

app.get("/session-expired", (req, res) => {
  res.sendFile(__dirname + "/session-expired.html");
});

app.get("/manager.html", (req, res) => {
  if (req.signedCookies.auth === "true") {
    return res.sendFile(__dirname + "/manager.html");
  }
  const guestToken = req.query.guest_token;
  if (guestToken && verifyGuestKey(guestToken)) {
    return res.sendFile(__dirname + "/manager.html");
  }
  res.redirect("/session-expired");
});

const fsPromises = fs.promises;

// in-memory caches
let songsCache = null;
let lyricsCache = null;
let publicSongsCache = null;
let publicLyricsCache = null;

let isWriting = false;
const writeQueue = [];

async function writeFileAtomic(filePath, data) {
  return new Promise((resolve, reject) => {
    writeQueue.push({ filePath, data, resolve, reject });
    processWriteQueue();
  });
}

async function processWriteQueue() {
  if (isWriting || writeQueue.length === 0) return;
  isWriting = true;

  const { filePath, data, resolve, reject } = writeQueue.shift();
  const tempPath = filePath + ".tmp";

  try {
    const json = JSON.stringify(data, null, 2);
    await fsPromises.writeFile(tempPath, json, "utf8");
    await fsPromises.rename(tempPath, filePath);
    resolve();
  } catch (err) {
    try {
      await fsPromises.unlink(tempPath);
    } catch (_) {}
    reject(err);
  } finally {
    isWriting = false;
    processWriteQueue();
  }
}

const PUBLIC_SONGS_FILE = "./public_songs.json";
const PUBLIC_LYRICS_FILE = "./public_lyrics.json";

const SONGS_FILE = "./songs.json";
const LYRICS_FILE = "./lyrics.json";
const STATS_FOLDER = "stats";

async function syncPublicFiles() {
  const songs = readSongs();
  const lyrics = readLyrics();
  const publicSongs = songs
    .filter((s) => s.public === true && s.id !== 999)
    .map((s) => ({ ...s, lyricsCount: (lyrics[s.id] || []).length }));
  const publicLyrics = {};
  publicSongs.forEach((s) => {
    publicLyrics[s.id] = lyrics[s.id] || [];
  });

  publicSongsCache = publicSongs;
  publicLyricsCache = publicLyrics;

  await Promise.all([
    writeFileAtomic(PUBLIC_SONGS_FILE, publicSongs),
    writeFileAtomic(PUBLIC_LYRICS_FILE, publicLyrics),
  ]);
}
function readSongs() {
  if (songsCache !== null) return songsCache;
  if (!fs.existsSync(SONGS_FILE)) {
    const init = CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      url: "",
      public: false,
    }));
    songsCache = init;
    writeFileAtomic(SONGS_FILE, init).catch(console.error);
    return init;
  }
  const data = fs.readFileSync(SONGS_FILE, "utf8");
  songsCache = JSON.parse(data);
  return songsCache;
}
function readLyrics() {
  if (lyricsCache !== null) return lyricsCache;
  if (!fs.existsSync(LYRICS_FILE)) {
    lyricsCache = {};
    return lyricsCache;
  }
  const data = fs.readFileSync(LYRICS_FILE, "utf8");
  lyricsCache = JSON.parse(data);
  return lyricsCache;
}
async function writeSongs(songs) {
  songsCache = songs;
  await writeFileAtomic(SONGS_FILE, songs);
}
async function writeLyrics(lyrics) {
  lyricsCache = lyrics;
  await writeFileAtomic(LYRICS_FILE, lyrics);
}
async function getStatsFile(key) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${STATS_FOLDER}/${key}.json`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf8");
    return JSON.parse(content);
  } catch (err) {
    if (err.message.includes("404")) return null;
    throw err;
  }
}
async function writeStatsFile(key, stats) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${STATS_FOLDER}/${key}.json`;
  const content = JSON.stringify(stats, null, 2);
  const base64Content = Buffer.from(content, "utf8").toString("base64");

  let sha = null;
  try {
    const getRes = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }
  } catch (e) {}

  const body = {
    message: `Update stats for ${key}`,
    content: base64Content,
    branch: GITHUB_BRANCH || "main",
  };
  if (sha) body.sha = sha;

  let putRes = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (putRes.status === 409) {
    console.log(`Conflict for ${key}, retrying with latest SHA...`);
    const getRes = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (getRes.ok) {
      const data = await getRes.json();
      body.sha = data.sha;
      putRes = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }
  }

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub API error: ${putRes.status} ${errText}`);
  }
  return putRes.json();
}

app.get("/public/songs", (req, res) => {
  if (!fs.existsSync(PUBLIC_SONGS_FILE)) return res.json([]);
  const data = fs.readFileSync(PUBLIC_SONGS_FILE, "utf8");
  res.json(JSON.parse(data));
});

app.get("/public/lyrics/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (!fs.existsSync(PUBLIC_LYRICS_FILE)) return res.json({});
  const data = JSON.parse(fs.readFileSync(PUBLIC_LYRICS_FILE, "utf8"));
  res.json(data[id] || []);
});

app.post("/public/stats/upload", express.json(), async (req, res) => {
  const { key, stats } = req.body;
  if (!key || typeof key !== "string") {
    return res.status(400).json({ error: "key is required" });
  }
  if (!stats || typeof stats !== "object") {
    return res.status(400).json({ error: "stats must be an object" });
  }
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return res
      .status(500)
      .json({ error: "GitHub credentials not configured." });
  }
  try {
    await writeStatsFile(key, stats);
    res.json({ message: `Stats for "${key}" saved successfully` });
  } catch (err) {
    console.error("Public stats upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/public.html", (req, res) => res.sendFile(__dirname + "/public.html"));

// SYNC
let syncSSEClients = {};
const syncRooms = new Map();

app.post("/sync/heartbeat", express.json(), (req, res) => {
  const { roomCode, name } = req.body;
  if (!roomCode || !name) {
    return res.status(400).json({ error: "Missing roomCode or name" });
  }
  const room = syncRooms.get(roomCode);
  if (!room) {
    console.log(`[Heartbeat] Room ${roomCode} not found for ${name}`);
    return res.status(404).json({ error: "Room not found" });
  }
  if (!room.memberLastSeen) room.memberLastSeen = {};
  if (room.members.includes(name)) {
    room.memberLastSeen[name] = Date.now();
    console.log(`[Heartbeat] ${name} in ${roomCode} updated`);
  } else {
    room.members.push(name);
    room.memberLastSeen[name] = Date.now();
    broadcastSyncUpdate(roomCode);
    console.log(`[Heartbeat] ${name} re-joined ${roomCode}`);
  }
  res.json({ ok: true });
});

setInterval(() => {
  const now = Date.now();
  for (const [roomCode, room] of syncRooms) {
    if (!room.memberLastSeen) {
      room.memberLastSeen = {};
      continue;
    }
    const stale = room.members.filter(
      (name) => now - (room.memberLastSeen[name] || 0) > 120000,
    );
    if (stale.length) {
      console.log(`[Cleanup] Removing stale members from ${roomCode}:`, stale);
      room.members = room.members.filter((name) => !stale.includes(name));
      stale.forEach((name) => delete room.memberLastSeen[name]);
      if (room.members.length === 0) {
        if (syncSSEClients[roomCode]) {
          for (const client of syncSSEClients[roomCode]) {
            try {
              client.end();
            } catch (e) {}
          }
          delete syncSSEClients[roomCode];
        }
        syncRooms.delete(roomCode);
        console.log(`[Cleanup] Deleted empty room ${roomCode}`);
        continue;
      }
      broadcastSyncUpdate(roomCode);
    }
  }
}, 30000);

function broadcastSyncUpdate(roomCode) {
  const room = syncRooms.get(roomCode);
  if (!room) return;
  const clients = syncSSEClients[roomCode] || [];
  const payload = JSON.stringify({
    type: "room_state",
    leader: room.leader,
    members: room.members,
    currentSong: room.currentSong,
    partnerSongId: room.partnerSongId,
    paused: room.paused || false,
    currentTime: room.currentTime || 0,
    timestamp: room.playTimestamp || Date.now(),
    loop: room.loop || false,
  });
  for (const client of clients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (e) {}
  }
}

app.get("/sync/events/:roomCode", (req, res) => {
  const { roomCode } = req.params;
  const room = syncRooms.get(roomCode);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  res.write("retry: 10000\n\n");

  if (!syncSSEClients[roomCode]) {
    syncSSEClients[roomCode] = [];
  }
  syncSSEClients[roomCode].push(res);

  const payload = JSON.stringify({
    type: "room_state",
    leader: room.leader,
    members: room.members,
    currentSong: room.currentSong,
    paused: room.paused || false,
    currentTime: room.currentTime || 0,
  });
  res.write(`data: ${payload}\n\n`);

  req.on("close", () => {
    if (syncSSEClients[roomCode]) {
      syncSSEClients[roomCode] = syncSSEClients[roomCode].filter(
        (c) => c !== res,
      );
      if (syncSSEClients[roomCode].length === 0) {
        delete syncSSEClients[roomCode];
      }
    }
  });
});

app.post("/sync/join", express.json(), (req, res) => {
  const { roomCode, name, originalLeader } = req.body;
  if (!roomCode || !name) {
    return res.status(400).json({ error: "Missing roomCode or name" });
  }

  let room = syncRooms.get(roomCode);
  let isNewRoom = false;

  if (!room) {
    const leader = originalLeader || name;
    room = {
      leader: leader,
      members: [],
      memberLastSeen: {},
      currentSong: null,
      paused: false,
      currentTime: 0,
      loop: false,
      partnerSongId: null,
      lastUpdate: Date.now(),
    };
    syncRooms.set(roomCode, room);
    isNewRoom = true;
    console.log(
      `[Join] New room ${roomCode} created by ${name} with leader ${leader}`,
    );
  } else {
    if (room.members.length === 0) {
      if (syncSSEClients[roomCode]) {
        for (const client of syncSSEClients[roomCode]) {
          try {
            client.end();
          } catch (e) {}
        }
        delete syncSSEClients[roomCode];
      }
      syncRooms.delete(roomCode);
      const leader = originalLeader || name;
      room = {
        leader: leader,
        members: [],
        memberLastSeen: {},
        currentSong: null,
        paused: false,
        currentTime: 0,
        lastUpdate: Date.now(),
      };
      syncRooms.set(roomCode, room);
      isNewRoom = true;
      console.log(
        `[Join] Recreated empty room ${roomCode} with leader ${leader}`,
      );
    } else {
      console.log(
        `[Join] ${name} joining existing room ${roomCode} with ${room.members.length} members`,
      );
    }
  }

  if (!room.memberLastSeen) room.memberLastSeen = {};

  if (!room.members.includes(name)) {
    room.members.push(name);
  }
  room.memberLastSeen[name] = Date.now();
  if (!room.leader) room.leader = name;

  room.lastUpdate = Date.now();
  broadcastSyncUpdate(roomCode);

  res.json({
    leader: room.leader,
    members: room.members,
    currentSong: room.currentSong,
    paused: room.paused || false,
    currentTime: room.currentTime || 0,
    isNewRoom: isNewRoom,
  });
});

app.post("/sync/leave", express.json(), (req, res) => {
  const { roomCode, name } = req.body;
  if (!roomCode || !name) {
    return res.status(400).json({ error: "Missing roomCode or name" });
  }
  const room = syncRooms.get(roomCode);
  if (!room) return res.status(404).json({ error: "Room not found" });

  room.members = room.members.filter((m) => m !== name);
  if (room.memberLastSeen) delete room.memberLastSeen[name];
  room.lastUpdate = Date.now();

  if (room.members.length === 0) {
    if (syncSSEClients[roomCode]) {
      for (const client of syncSSEClients[roomCode]) {
        try {
          client.end();
        } catch (e) {}
      }
      delete syncSSEClients[roomCode];
    }
    syncRooms.delete(roomCode);
    console.log(`[Leave] Room ${roomCode} deleted (empty)`);
  } else if (room.leader === name) {
    room.leader = room.members[0];
    console.log(`[Leave] New leader: ${room.leader}`);
  }

  broadcastSyncUpdate(roomCode);
  res.json({ message: "Left" });
});

app.post("/sync/play", express.json(), (req, res) => {
  const { roomCode, name, songId, currentTime, timestamp, partnerSongId } =
    req.body;
  if (!roomCode || !name || songId === undefined) {
    return res.status(400).json({ error: "Missing roomCode, name, or songId" });
  }
  const room = syncRooms.get(roomCode);
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.leader !== name) {
    return res.status(403).json({ error: "Only the leader can play a song" });
  }
  room.currentSong = songId;
  room.partnerSongId = partnerSongId || null;
  room.paused = false;
  room.currentTime = currentTime || 0;
  room.playTimestamp = timestamp || Date.now();
  room.lastUpdate = Date.now();
  broadcastSyncUpdate(roomCode);
  res.json({ message: "Song set" });
});

app.post("/sync/pause", express.json(), (req, res) => {
  const { roomCode, name, paused, currentTime } = req.body;
  if (!roomCode || !name) {
    return res.status(400).json({ error: "Missing roomCode or name" });
  }
  const room = syncRooms.get(roomCode);
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.leader !== name) {
    return res.status(403).json({ error: "Only the leader can pause" });
  }
  room.paused = paused;
  if (currentTime !== undefined) room.currentTime = currentTime;
  room.lastUpdate = Date.now();
  broadcastSyncUpdate(roomCode);
  res.json({ message: "Pause state updated" });
});

app.post("/sync/set_loop", express.json(), (req, res) => {
  const { roomCode, name, loop } = req.body;
  if (!roomCode || !name) {
    return res.status(400).json({ error: "Missing roomCode or name" });
  }
  const room = syncRooms.get(roomCode);
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.leader !== name) {
    return res.status(403).json({ error: "Only the leader can change loop" });
  }
  room.loop = loop;
  room.lastUpdate = Date.now();
  broadcastSyncUpdate(roomCode);
  res.json({ message: "Loop state updated" });
});

app.post("/sync/stop", express.json(), (req, res) => {
  const { roomCode, name } = req.body;
  if (!roomCode || !name) {
    return res.status(400).json({ error: "Missing roomCode or name" });
  }
  const room = syncRooms.get(roomCode);
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.leader !== name) {
    return res.status(403).json({ error: "Only the leader can stop" });
  }
  room.currentSong = null;
  room.partnerSongId = null;
  room.paused = true;
  room.currentTime = 0;
  room.lastUpdate = Date.now();
  broadcastSyncUpdate(roomCode);
  res.json({ message: "Stopped" });
});

app.post("/sync/make_leader", express.json(), (req, res) => {
  const { roomCode, name, targetName } = req.body;
  if (!roomCode || !name || !targetName) {
    return res
      .status(400)
      .json({ error: "Missing roomCode, name, or targetName" });
  }
  const room = syncRooms.get(roomCode);
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.leader !== name) {
    return res
      .status(403)
      .json({ error: "Only the leader can make a new leader" });
  }
  const target = room.members.find(
    (m) => m.toLowerCase() === targetName.toLowerCase(),
  );
  if (!target) {
    return res.status(404).json({ error: "Target not in room" });
  }
  room.leader = target;
  room.lastUpdate = Date.now();
  broadcastSyncUpdate(roomCode);
  res.json({ message: `Leader changed to ${target}` });
});

// PROTECTED
app.get("/songs", verifyGuestToken, (req, res) => {
  const isAdmin = req.signedCookies.auth === "true";
  const isGuest = req.isGuest === true;
  const isApiKey = req.headers["x-api-key"] === API_KEY;
  if (!isAdmin && !isGuest && !isApiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const songs = readSongs();
  const lyrics = readLyrics();
  const enhanced = songs.map((song) => {
    const count = lyrics[song.id] ? lyrics[song.id].length : 0;
    return { ...song, lyricsCount: count };
  });
  res.json(enhanced);
});

app.get("/songs/:id/lyrics", verifyGuestToken, (req, res) => {
  const isAdmin = req.signedCookies.auth === "true";
  const isGuest = req.isGuest === true;
  const isApiKey = req.headers["x-api-key"] === API_KEY;
  if (!isAdmin && !isGuest && !isApiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const id = parseInt(req.params.id);
  const lyrics = readLyrics();
  res.json(lyrics[id] || []);
});

app.put("/songs/reorder", requireApiKey, async (req, res) => {
  try {
    const { songs: newSongs } = req.body;
    if (!Array.isArray(newSongs)) {
      return res.status(400).json({ error: "songs must be an array" });
    }
    for (let s of newSongs) {
      if (typeof s.id !== "number" || typeof s.name !== "string") {
        return res
          .status(400)
          .json({ error: "each song must have id and name" });
      }
    }
    writeSongs(newSongs);
    broadcastEvent("song-changed", { action: "reorder" });
    res.json({ message: "Order updated!" });
  } catch (err) {
    console.error("Error in /songs/reorder:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.post("/songs", requireApiKey, async (req, res) => {
  const {
    name,
    url,
    lyrics: lyricArray,
    categoryIndex,
    public: isPublic,
  } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: "name and url are required" });
  }
  const songs = readSongs();
  const maxId = songs.reduce(
    (max, s) => (s.id !== 999 && s.id > max ? s.id : max),
    -1,
  );
  const newId = maxId + 1;

  let insertIndex = songs.length;
  let categoryName = "Uncategorized";
  if (
    categoryIndex !== undefined &&
    categoryIndex >= 0 &&
    categoryIndex < CATEGORIES.length
  ) {
    categoryName = CATEGORIES[categoryIndex].name;
    const foundIndex = songs.findIndex(
      (s) => s.id === 999 && s.name === categoryName,
    );
    if (foundIndex !== -1) {
      insertIndex = foundIndex + 1;
    }
  }

  const newSong = { id: newId, name, url, public: isPublic || false };
  songs.splice(insertIndex, 0, newSong);
  await writeSongs(songs);

  const lyricCount =
    lyricArray && Array.isArray(lyricArray) ? lyricArray.length : 0;
  if (lyricArray && Array.isArray(lyricArray)) {
    const lyrics = readLyrics();
    lyrics[newId] = lyricArray;
    await writeLyrics(lyrics);
  }

  sendDiscordAddition(newSong, categoryName, lyricCount);
  broadcastEvent("song-changed", { action: "add", songId: newId });
  await syncPublicFiles();

  res.status(201).json(newSong);
});

app.put("/songs/:id", requireApiKey, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, url, categoryIndex, public: isPublic } = req.body;
  try {
    const songs = readSongs();
    const index = songs.findIndex((s) => s.id === id);
    if (index === -1) return res.status(404).json({ error: "Song not found" });

    const oldSong = { ...songs[index] };
    const changes = { name: false, url: false, category: false, public: false };

    let oldCategoryName = "Uncategorized";
    let lastCategory = "Uncategorized";
    const songId = songs[index].id;
    for (let i = 0; i < songs.length; i++) {
      if (songs[i].id === 999) {
        lastCategory = songs[i].name;
      }
      if (songs[i].id === songId) {
        oldCategoryName = lastCategory;
        break;
      }
    }

    if (name && name !== oldSong.name) {
      songs[index].name = name;
      changes.name = true;
    }
    if (url && url !== oldSong.url) {
      songs[index].url = url;
      changes.url = true;
    }

    const newPublic = isPublic !== undefined ? isPublic : false;
    const oldPublic = oldSong.public !== undefined ? oldSong.public : false;
    if (newPublic !== oldPublic) {
      songs[index].public = newPublic;
      changes.public = true;
    }

    const newSong = { ...songs.find((s) => s.id === id) };
    if (!changes.public) {
      oldSong.public = newSong.public;
    }

    if (
      categoryIndex !== undefined &&
      categoryIndex >= 0 &&
      categoryIndex < CATEGORIES.length
    ) {
      const newCategoryName = CATEGORIES[categoryIndex].name;
      if (newCategoryName !== oldCategoryName) {
        const songToMove = songs.splice(index, 1)[0];
        let insertIndex = songs.length;
        const foundIndex = songs.findIndex(
          (s) => s.id === 999 && s.name === newCategoryName,
        );
        if (foundIndex !== -1) {
          insertIndex = foundIndex + 1;
        }
        songs.splice(insertIndex, 0, songToMove);
        changes.category = true;
        oldSong.category = oldCategoryName;
      }
    }

    await writeSongs(songs);
    broadcastEvent("song-changed", { action: "edit", songId: id });
    await syncPublicFiles();

    if (changes.name || changes.url || changes.category || changes.public) {
      const newSong = { ...songs.find((s) => s.id === id) };
      if (changes.category) {
        let newCategoryName = "Uncategorized";
        let lastCat = "Uncategorized";
        for (let i = 0; i < songs.length; i++) {
          if (songs[i].id === 999) {
            lastCat = songs[i].name;
          }
          if (songs[i].id === id) {
            newCategoryName = lastCat;
            break;
          }
        }
        newSong.category = newCategoryName;
        oldSong.category = oldCategoryName;
      } else {
        newSong.category = oldCategoryName;
        oldSong.category = oldCategoryName;
      }
      sendDiscordEditNotification(oldSong, newSong, changes);
    }

    res.json(songs.find((s) => s.id === id));
  } catch (err) {
    console.error("Error in PUT /songs:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/songs/:id", requireApiKey, async (req, res) => {
  const id = parseInt(req.params.id);
  const songs = readSongs();
  const songToDelete = songs.find((s) => s.id === id);
  if (!songToDelete) {
    return res.status(404).json({ error: "Song not found" });
  }

  const newSongs = songs.filter((s) => s.id !== id);
  await writeSongs(newSongs);
  const lyrics = readLyrics();
  delete lyrics[id];
  await writeLyrics(lyrics);

  sendDiscordDeletion(songToDelete).catch((err) => {
    console.error(err);
  });
  broadcastEvent("song-changed", { action: "delete", songId: id });
  await syncPublicFiles();

  res.json({ message: "Deleted" });
});

syncPublicFiles();

app.put("/songs/:id/lyrics", requireApiKey, async (req, res) => {
  const id = parseInt(req.params.id);
  const { lyrics: lyricArray, skipDiscord } = req.body;
  try {
    if (!Array.isArray(lyricArray)) {
      return res.status(400).json({ error: "lyrics must be an array" });
    }
    for (let item of lyricArray) {
      if (typeof item.chat !== "string" || typeof item.delay !== "number") {
        return res.status(400).json({
          error: "Each lyric must have chat(string) and delay(number)",
        });
      }
    }

    const songs = readSongs();
    const song = songs.find((s) => s.id === id);
    if (!song) return res.status(404).json({ error: "Song not found" });

    const lyrics = readLyrics();
    const oldLyrics = lyrics[id] || [];
    const oldCount = oldLyrics.length;
    const newCount = lyricArray.length;

    lyrics[id] = lyricArray;
    await writeLyrics(lyrics);
    broadcastEvent("song-changed", { action: "edit", songId: id });

    const shouldNotify = skipDiscord !== true;
    if (
      shouldNotify &&
      (oldCount !== newCount ||
        JSON.stringify(oldLyrics) !== JSON.stringify(lyricArray))
    ) {
      const oldSong = { ...song };
      const newSong = { ...song };
      sendDiscordEditNotification(
        oldSong,
        newSong,
        {},
        oldCount,
        newCount,
      ).catch((err) => console.error(err));
    }

    res.json({ message: "Lyrics updated" });
  } catch (err) {
    console.error("Error in PUT /songs/:id/lyrics:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.post("/stats/upload", requireApiKey, async (req, res) => {
  const { key, stats } = req.body;
  if (!key || typeof key !== "string") {
    return res.status(400).json({ error: "key is required" });
  }
  if (!stats || typeof stats !== "object") {
    return res.status(400).json({ error: "stats must be an object" });
  }

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return res
      .status(500)
      .json({ error: "GitHub credentials not configured." });
  }

  try {
    await writeStatsFile(key, stats);
    res.json({ message: `Stats for "${key}" saved successfully` });
  } catch (err) {
    console.error("Stats upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/stats/:key", async (req, res) => {
  const { key } = req.params;
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return res
      .status(500)
      .json({ error: "GitHub credentials not configured." });
  }
  try {
    const stats = await getStatsFile(key);
    if (stats === null) {
      return res.status(404).json({ error: "No stats found for this key." });
    }
    res.json(stats);
  } catch (err) {
    console.error("Stats fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/stats-key", (req, res) => {
  const key = req.cookies.statsKey;
  if (!key) {
    return res.status(404).json({ error: "No stats key stored" });
  }
  res.json({ key });
});

// GITHUB
app.post("/sync-github", requireApiKey, async (req, res) => {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    const errorMsg = "GitHub credentials not configured on server.";
    await sendGitHubSyncNotification(false, errorMsg, "...");
    return res.status(500).json({ error: errorMsg });
  }

  async function updateFile(path, content, retries = 2) {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
    const base64Content = Buffer.from(
      JSON.stringify(content, null, 2),
      "utf8",
    ).toString("base64");
    let sha = null;
    try {
      const getRes = await fetch(url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }
    } catch (e) {
      /* file doesn't exist */
    }

    const body = {
      message: `Update ${path}`,
      content: base64Content,
      branch: GITHUB_BRANCH || "main",
    };
    if (sha) body.sha = sha;

    let putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (putRes.status === 409 && retries > 0) {
      console.log(`Conflict on ${path}, retrying...`);
      const getRes = await fetch(url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (getRes.ok) {
        const data = await getRes.json();
        body.sha = data.sha;
        putRes = await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
      }
      if (putRes.status === 409) {
        return updateFile(path, content, retries - 1);
      }
    }

    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(
        `GitHub API error for ${path}: ${putRes.status} ${errText}`,
      );
    }
    return putRes.json();
  }

  try {
    const songs = readSongs();
    const lyrics = readLyrics();

    let publicSongs = [];
    let publicLyrics = {};
    if (fs.existsSync(PUBLIC_SONGS_FILE) && fs.existsSync(PUBLIC_LYRICS_FILE)) {
      publicSongs = JSON.parse(fs.readFileSync(PUBLIC_SONGS_FILE, "utf8"));
      publicLyrics = JSON.parse(fs.readFileSync(PUBLIC_LYRICS_FILE, "utf8"));
    }

    await updateFile("songs.json", songs);
    await updateFile("lyrics.json", lyrics);
    await updateFile("public/public_songs.json", publicSongs);
    await updateFile("public/public_lyrics.json", publicLyrics);

    const successMsg = `Updated songs.json (${songs.length} songs), lyrics.json (${Object.keys(lyrics).length} entries), and public files.`;
    await sendGitHubSyncNotification(true, successMsg);
    res.json({ message: "Successfully synced to GitHub." });
  } catch (err) {
    console.error("GitHub sync error:", err);
    const errorMsg = err.message || "Unknown error";
    await sendGitHubSyncNotification(false, "Sync failed", errorMsg);
    res.status(500).json({ error: errorMsg });
  }
});

//SSE
let sseClients = [];
app.get("/events", (req, res) => {
  let apiKey = req.headers["x-api-key"];
  if (!apiKey && req.query.token) {
    try {
      apiKey = Buffer.from(req.query.token, "base64").toString("utf8");
    } catch (e) {
      return res.status(401).send("Unauthorized");
    }
  }
  if (apiKey !== API_KEY) {
    return res.status(401).send("Unauthorized");
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  res.write("retry: 10000\n\n");

  sseClients.push(res);
  req.on("close", () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
});

function broadcastEvent(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch (e) {}
  });
}

app.get("/generate", (req, res) => {
  if (req.signedCookies.auth === "true") {
    res.sendFile(__dirname + "/generate.html");
  } else {
    res.redirect("/");
  }
});

app.post("/generate-guest", requireApiKey, (req, res) => {
  const token = generateGuestKey();
  res.json({ token });
});

app.get("/guest-keys", requireApiKey, (req, res) => {
  const now = Date.now();
  for (const key in guestKeys) {
    if (guestKeys[key].expiresAt < now) {
      delete guestKeys[key];
    }
  }
  const list = Object.keys(guestKeys).map((key) => ({
    token: key,
    createdAt: guestKeys[key].createdAt,
    expiresAt: guestKeys[key].expiresAt,
  }));
  res.json(list);
});

app.post("/revoke-guest", requireApiKey, (req, res) => {
  const { token } = req.body;
  if (!token || !guestKeys[token]) {
    return res.status(404).json({ error: "Key not found" });
  }
  delete guestKeys[token];
  res.json({ message: "Key revoked" });
});

app.get("/health", (req, res) => res.send("OK"));

app.use(express.static(__dirname));

//app.listen(PORT, () => console.log(`API running on port ${PORT}`));
server.listen(PORT, () => console.log(`API running on port ${PORT}`));
