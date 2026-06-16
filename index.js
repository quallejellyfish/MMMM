const express = require("express");
const fs = require("fs");
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_KEY;
function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'no' });
  }
  next();
}

app.use(cors());
app.use(express.static(__dirname));
app.use(express.json({ limit: '10mb' }));

const SONGS_FILE = "./songs.json";
const LYRICS_FILE = "./lyrics.json";

function readSongs() {
  if (!fs.existsSync(SONGS_FILE)) return [];
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

app.post('/songs', requireApiKey, (req, res) => {
  const { name, url, lyrics: lyricArray } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'name and url are required' });
  }
  const songs = readSongs();
  const nextId = songs.length > 0 ? Math.max(...songs.map(s => s.id)) + 1 : 0;
  const newSong = { id: nextId, name, url };
  songs.push(newSong);
  writeSongs(songs);

  if (lyricArray && Array.isArray(lyricArray)) {
    const lyrics = readLyrics();
    lyrics[nextId] = lyricArray;
    writeLyrics(lyrics);
  }
  res.status(201).json(newSong);
});

app.put('/songs/:id', requireApiKey, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, url } = req.body;
  const songs = readSongs();
  const index = songs.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Song not found' });
  if (name) songs[index].name = name;
  if (url) songs[index].url = url;
  writeSongs(songs);
  res.json(songs[index]);
});

app.delete('/songs/:id', requireApiKey, (req, res) => {
  const id = parseInt(req.params.id);
  let songs = readSongs();
  const newSongs = songs.filter(s => s.id !== id);
  if (newSongs.length === songs.length) return res.status(404).json({ error: 'Song not found' });
  writeSongs(newSongs);
  const lyrics = readLyrics();
  delete lyrics[id];
  writeLyrics(lyrics);
  res.json({ message: 'Deleted' });
});

app.get('/songs/:id/lyrics', requireApiKey, (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`Fetching lyrics for ID: ${id} (type: ${typeof id})`);
  const lyrics = readLyrics();
  const result = lyrics[id] || [];
  console.log(`Found ${result.length} lines`);
  res.json(result);
});

// ROOT

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/manager.html');
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
