const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { timeStamp } = require("console");
const jwt = require("jsonwebtoken");
const http = require("http");
const { WebSocketServer } = require("ws");
const cookieParser = require("cookie-parser");

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

    // show name change if it changed
    if (changes.name) {
      fields.push({
        name: "Name Change",
        value: `~~${oldSong.name}~~ → ${newSong.name}`,
        inline: true,
      });
    }

    // show URL change if it changed
    if (changes.url) {
      fields.push({
        name: "URL",
        value: `[old](${oldSong.url}) → [new](${newSong.url})`,
        inline: false,
      });
    }

    // show lyrics change if the count changed
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

    // Show category change if it changed
    if (changes.category) {
      fields.push({
        name: "Category",
        value: `~~${oldSong.category}~~ → ${newSong.category}`,
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

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser(COOKIE_SECRET));

app.use((req, res, next) => {
  if (req.path === "/manager.html") {
    const auth = req.signedCookies.auth;
    if (auth === "true") {
      next();
    } else {
      res.redirect("/");
    }
  } else {
    next();
  }
});

app.post("/auth", (req, res) => {
  const { apiKey } = req.body;
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  const token = jwt.sign({ type: "sse" }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

app.post("/verify-key", express.json(), (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ valid: false, error: "Missing API key" });
  }
  const isValid = apiKey === API_KEY;
  res.json({ valid: isValid });
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
      sameSite: "lax",
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

// ROOT
app.get("/", (req, res) => {
  const isAuthenticated = req.signedCookies.auth === "true";

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
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
          <input type="password" id="apiKeyInput" placeholder="API Key">
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
          <a href="/public" class="link-btn public">Public Songs</a>
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
        `
            : ""
        }
      </script>
    </body>
    </html>
  `);
});

app.get("/public", (req, res) => {
  res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Public Songs - MMMM</title>
        <style>
            body { background: #1e1e2f; color: #eee; font-family: system-ui; padding: 20px; }
            .container { max-width: 1400px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 10px; border-bottom: 1px solid #444; }
            th { background: #3a3a4a; }
            a { color: #ff79c6; }
        </style>
        </head>
        <body>
            <div class="container">
                <h1>🎵 Public Songs</h1>
                <a href="/">⬅ Back</a>
                <div id="loading">Loading...</div>
                <table id="songsTable" style="display:none;">
                    <thead><tr><th>Name</th><th>URL</th><th>Lyrics Lines</th></tr></thead>
                    <tbody id="songsTableBody"></tbody>
                </table>
            </div>
            <script>
                async function loadPublicSongs() {
                    try {
                        const res = await fetch('/public/songs');
                        const songs = await res.json();
                        const tbody = document.getElementById('songsTableBody');
                        const table = document.getElementById('songsTable');
                        const loading = document.getElementById('loading');
                        if (!songs.length) {
                            loading.textContent = 'No public songs yet.';
                            return;
                        }
                        loading.style.display = 'none';
                        table.style.display = 'table';
                        songs.forEach(song => {
                            const row = tbody.insertRow();
                            row.insertCell(0).textContent = song.name;
                            row.insertCell(1).innerHTML = "<a href="${song.url}" target="_blank">link</a>";
                            row.insertCell(2).textContent = song.lyricsCount || '?';
                        });
                    } catch (e) {
                        document.getElementById('loading').textContent = 'Error loading songs.';
                    }
                }
                loadPublicSongs();
            </script>
        </body>
        </html>
    `);
});

app.get("/manager.html", (req, res) => {
  if (req.signedCookies.auth === "true") {
    res.sendFile(__dirname + "/manager.html");
  } else {
    res.redirect("/");
  }
});

const PUBLIC_SONGS_FILE = "./public_songs.json";
const PUBLIC_LYRICS_FILE = "./public_lyrics.json";

function syncPublicFiles() {
  const songs = readSongs();
  const lyrics = readLyrics();
  const publicSongs = songs.filter((s) => s.public === true && s.id !== 999);
  const publicLyrics = {};
  const publicSongsWithCount = publicSongs.map((s) => {
    const count = lyrics[s.id] ? lyrics[s.id].length : 0;
    publicLyrics[s.id] = lyrics[s.id] || [];
    return { ...s, lyricsCount: count };
  });
  fs.writeFileSync(
    PUBLIC_SONGS_FILE,
    JSON.stringify(publicSongsWithCount, null, 2),
  );
  fs.writeFileSync(PUBLIC_LYRICS_FILE, JSON.stringify(publicLyrics, null, 2));
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

const SONGS_FILE = "./songs.json";
const LYRICS_FILE = "./lyrics.json";
const STATS_FOLDER = "stats";

function readSongs() {
  if (!fs.existsSync(SONGS_FILE)) {
    const init = CATEGORIES.map((c) => ({ id: c.id, name: c.name, url: "" }));
    writeSongs(init);
    return init;
  }
  return JSON.parse(fs.readFileSync(SONGS_FILE, "utf8"));
}
function writeSongs(songs) {
  fs.writeFileSync(SONGS_FILE, JSON.stringify(songs, null, 2));
}
function readLyrics() {
  if (!fs.existsSync(LYRICS_FILE)) return {};
  return JSON.parse(fs.readFileSync(LYRICS_FILE, "utf8"));
}
function writeLyrics(lyrics) {
  fs.writeFileSync(LYRICS_FILE, JSON.stringify(lyrics, null, 2));
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
    if (e.message.includes("404")) return null;
    throw e;
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

let syncSSEClients = {};
const syncRooms = new Map();

function broadcastSyncUpdate(roomCode) {
  const room = syncRooms.get(roomCode);
  if (!room) return;
  const clients = syncSSEClients[roomCode] || [];
  const payload = JSON.stringify({
    type: "room_state",
    leader: room.leader,
    members: room.members,
    currentSong: room.currentSong,
    paused: room.paused || false,
    currentTime: room.currentTime || 0,
  });
  for (const client of clients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (e) {
      /* client disconnected */
    }
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
    syncSSEClients[roomCode] = syncSSEClients[roomCode].filter(
      (c) => c !== res,
    );
    if (syncSSEClients[roomCode].length === 0) delete syncSSEClients[roomCode];
  });
});

app.post("/sync/join", express.json(), (req, res) => {
  const { roomCode, name } = req.body;
  if (!roomCode || !name) {
    return res.status(400).json({ error: "Missing roomCode or name" });
  }
  let room = syncRooms.get(roomCode);
  if (!room) {
    room = {
      leader: name,
      members: [],
      currentSong: null,
      paused: false,
      currentTime: 0,
      lastUpdate: Date.now(),
    };
    syncRooms.set(roomCode, room);
  }
  if (!room.members.includes(name)) {
    room.members.push(name);
  }
  if (!room.leader) room.leader = name;
  room.lastUpdate = Date.now();
  broadcastSyncUpdate(roomCode);
  res.json({
    leader: room.leader,
    members: room.members,
    currentSong: room.currentSong,
    paused: room.paused || false,
    currentTime: room.currentTime || 0,
  });
});

app.post("/sync/leave", express.json(), (req, res) => {
  const { roomCode, name } = req.body;
  if (!roomCode || !name)
    return res.status(400).json({ error: "Missing roomCode or name" });
  const room = syncRooms.get(roomCode);
  if (!room) return res.status(404).json({ error: "Room not found" });
  room.members = room.members.filter((m) => m !== name);
  room.lastUpdate = Date.now();
  if (room.members.length === 0) {
    syncRooms.delete(roomCode);
    syncSSEClients[roomCode] = [];
  } else if (room.leader === name) {
    room.leader = room.members[0];
  }
  broadcastSyncUpdate(roomCode);
  res.json({ message: "Left" });
});

app.post("/sync/play", express.json(), (req, res) => {
  const { roomCode, name, songId, currentTime } = req.body;
  if (!roomCode || !name || songId === undefined) {
    return res.status(400).json({ error: "Missing roomCode, name, or songId" });
  }
  const room = syncRooms.get(roomCode);
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.leader !== name) {
    return res.status(403).json({ error: "Only the leader can play a song" });
  }
  room.currentSong = songId;
  room.paused = false;
  room.currentTime = currentTime || 0;
  room.lastUpdate = Date.now();
  broadcastSyncUpdate(roomCode);
  res.json({ message: "Song set" });
});

app.post("/sync/pause", express.json(), (req, res) => {
  const { roomCode, name, paused, currentTime } = req.body;
  if (!roomCode || !name)
    return res.status(400).json({ error: "Missing roomCode or name" });
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

app.post("/sync/stop", express.json(), (req, res) => {
  const { roomCode, name } = req.body;
  if (!roomCode || !name)
    return res.status(400).json({ error: "Missing roomCode or name" });
  const room = syncRooms.get(roomCode);
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.leader !== name) {
    return res.status(403).json({ error: "Only the leader can stop" });
  }
  room.currentSong = null;
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
  if (!room.members.includes(targetName)) {
    return res.status(404).json({ error: "Target not in room" });
  }
  room.leader = targetName;
  room.lastUpdate = Date.now();
  broadcastSyncUpdate(roomCode);
  res.json({ message: `Leader changed to ${targetName}` });
});

// PROTECTED
app.get("/songs", requireApiKey, (req, res) => {
  const songs = readSongs();
  const lyrics = readLyrics();
  const enhanced = songs.map((song) => {
    const count = lyrics[song.id] ? lyrics[song.id].length : 0;
    return { ...song, lyricsCount: count };
  });
  res.json(enhanced);
});

app.get("/songs/:id/lyrics", requireApiKey, (req, res) => {
  const id = parseInt(req.params.id);
  const lyrics = readLyrics();
  res.json(lyrics[id] || []);
});

app.put("/songs/reorder", requireApiKey, (req, res) => {
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

app.post("/songs", requireApiKey, (req, res) => {
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

  const newSong = { id: newId, name, url };
  songs.splice(insertIndex, 0, newSong);
  writeSongs(songs);

  const lyricCount =
    lyricArray && Array.isArray(lyricArray) ? lyricArray.length : 0;
  if (lyricArray && Array.isArray(lyricArray)) {
    const lyrics = readLyrics();
    lyrics[newId] = lyricArray;
    writeLyrics(lyrics);
  }

  sendDiscordAddition(newSong, categoryName, lyricCount);
  broadcastEvent("song-changed", { action: "add", songId: newId });
  syncPublicFiles();

  res.status(201).json(newSong);
});

app.put("/songs/:id", requireApiKey, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, url, categoryIndex, public: isPublic } = req.body;
  try {
    const songs = readSongs();
    const index = songs.findIndex((s) => s.id === id);
    if (index === -1) return res.status(404).json({ error: "Song not found" });

    const oldSong = { ...songs[index] };
    const changes = { name: false, url: false, category: false };

    // Track old category name
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

    writeSongs(songs);
    broadcastEvent("song-changed", { action: "edit", songId: id });
    syncPublicFiles();

    if (changes.name || changes.url || changes.category) {
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

app.delete("/songs/:id", requireApiKey, (req, res) => {
  const id = parseInt(req.params.id);
  const songs = readSongs();
  const songToDelete = songs.find((s) => s.id === id);
  if (!songToDelete) {
    return res.status(404).json({ error: "Song not found" });
  }

  const newSongs = songs.filter((s) => s.id !== id);
  writeSongs(newSongs);
  const lyrics = readLyrics();
  delete lyrics[id];
  writeLyrics(lyrics);

  sendDiscordDeletion(songToDelete).catch((err) => {
    console.error(err);
  });
  broadcastEvent("song-changed", { action: "delete", songId: id });
  syncPublicFiles();

  res.json({ message: "Deleted" });
});

app.put("/songs/:id/lyrics", requireApiKey, (req, res) => {
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
    writeLyrics(lyrics);
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

// GITHUB
app.post("/sync-github", requireApiKey, async (req, res) => {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    const errorMsg = "GitHub credentials not configured on server.";
    await sendGitHubSyncNotification(
      false,
      errorMsg,
      "GITHUB_TOKEN and GITHUB_REPO missing environment variables.",
    );
    return res.status(500).json({ error: errorMsg });
  }

  try {
    const songs = readSongs();
    const lyrics = readLyrics();

    async function updateFile(path, content) {
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
        branch: GITHUB_BRANCH,
      };
      if (sha) body.sha = sha;
      const putRes = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!putRes.ok) {
        const errText = await putRes.text();
        throw new Error(
          `GitHub API error for ${path}: ${putRes.status} ${errText}`,
        );
      }
      return putRes.json();
    }

    await updateFile("songs.json", songs);
    await updateFile("lyrics.json", lyrics);

    const successMsg = `Updated songs.json (${songs.length} songs) and lyrics.json (${Object.keys(lyrics).length} entries).`;
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

app.get("/health", (req, res) => res.send("OK"));

app.use(express.static(__dirname));

//app.listen(PORT, () => console.log(`API running on port ${PORT}`));
server.listen(PORT, () => console.log(`API running on port ${PORT}`));
