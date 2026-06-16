const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { timeStamp } = require("console");
const app = express();
const PORT = process.env.PORT || 3000;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH;
const API_KEY = process.env.API_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const CATEGORIES = [
  { id: 999, name: "🇺🇸-----English Songs-----" },
  { id: 999, name: "🇩🇪-----German Songs-----" },
  { id: 999, name: "🇨🇳-----Chinese Songs-----" },
  { id: 999, name: "💥-----Pulary Songs-----" },
  { id: 999, name: "🌍-----other language Songs-----" },
  { id: 999, name: "🦊----- Krimsonthefox Music-----" },
  { id: 999, name: "❓-----Not My Songs-----" },
];

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

function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  console.log("Received API key:", key);
  console.log("Expected API key:", API_KEY);
  if (key !== API_KEY) {
    return res.status(401).json({ error: "no" });
  }
  next();
}

app.use(cors());
app.use(express.static(__dirname));
app.use(express.json({ limit: "10mb" }));

const SONGS_FILE = "./songs.json";
const LYRICS_FILE = "./lyrics.json";

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

// PUBLIC

app.get("/songs", (req, res) => {
  const songs = readSongs();
  res.json(songs);
});

app.get("/songs/:id/lyrics", (req, res) => {
  const id = parseInt(req.params.id);
  const lyrics = readLyrics();
  res.json(lyrics[id] || []);
});

// PROTECTED
app.post("/songs", requireApiKey, (req, res) => {
  const { name, url, lyrics: lyricArray, categoryIndex } = req.body;
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

  res.status(201).json(newSong);
});

app.put("/songs/:id", requireApiKey, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, url } = req.body;
  const songs = readSongs();
  const index = songs.findIndex((s) => s.id === id);
  if (index === -1) return res.status(404).json({ error: "Song not found" });
  if (name) songs[index].name = name;
  if (url) songs[index].url = url;
  writeSongs(songs);
  res.json(songs[index]);
});

app.delete("/songs/:id", requireApiKey, (req, res) => {
  const id = parseInt(req.params.id);
  const songs = readSongs();
  const songToDelete = songs.find((s) => s.id === id);
  if (!songToDelete) {
    return res.status(404).json({ error: "Song not found" });
  }
  writeSongs(newSongs);
  const lyrics = readLyrics();
  delete lyrics[id];
  writeLyrics(lyrics);

  sendDiscordDeletion(songToDelete).catch((err) => {
    console.error("Discord deletion notification error:", err);
  });

  res.json({ message: "Deleted" });
});

app.get("/songs/:id/lyrics", requireApiKey, (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`Fetching lyrics for ID: ${id} (type: ${typeof id})`);
  const lyrics = readLyrics();
  const result = lyrics[id] || [];
  console.log(`Found ${result.length} lines`);
  res.json(result);
});

// GITHUB
app.post("/sync-github", requireApiKey, async (req, res) => {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return res.status(500);
  }

  try {
    const songs = readSongs();
    const lyrics = readLyrics();

    async function updateFile(path, content) {
      const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
      const base64Content = Buffer.from(
        JSON.stringify(content, null, 2),
        "utf-8",
      ).toString("base64");

      let sha = null;
      try {
        const getRes = await fetch(url, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (getRes.status === 200) {
          const data = await getRes.json();
          sha = data.sha;
          console.log(`Found existing file ${path} with SHA: ${sha}`);
        } else if (getRes.status === 404) {
          console.log(`File ${path} does not exist yet, will create it.`);
        } else {
          const errText = await getRes.text();
          throw new Error(
            `Failed to get file info: ${getRes.status} ${errText}`,
          );
        }
      } catch (e) {
        if (e.message.includes("404")) {
          console.log(`File ${path} not found, will create.`);
        } else {
          throw e;
        }
      }

      const body = {
        message: `Update ${path}`,
        content: base64Content,
        branch: GITHUB_BRANCH,
      };

      if (sha) {
        body.sha = sha;
        console.log(`Updating existing file ${path} with SHA: ${sha}`);
      } else {
        console.log(`Creating new file ${path}`);
      }

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
        console.error(`GitHub API error for ${path}:`, putRes.status, errText);
        throw new Error(
          `GitHub API error for ${path}: ${putRes.status} ${errText}`,
        );
      }

      const result = await putRes.json();
      console.log(
        `Successfully updated ${path}, commit: ${result.commit?.sha}`,
      );
      return result;
    }

    await updateFile("songs.json", songs);
    await updateFile("lyrics.json", lyrics);

    res.json({ message: "Successfully synced to GitHub." });
  } catch (err) {
    console.error("GitHub sync error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ROOT
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/manager.html");
});

app.get("/health", (req, res) => res.send("OK"));

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
