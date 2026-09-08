function getCached(key, useLocalStorage = false) {
  const storage = useLocalStorage ? localStorage : sessionStorage;
  const item = storage.getItem("mmm_" + key);
  if (!item) return null;
  try {
    const parsed = JSON.parse(item);
    if (!useLocalStorage && parsed.expiry && Date.now() > parsed.expiry) {
      storage.removeItem("mmm_" + key);
      return null;
    }
    return parsed.data;
  } catch (e) {
    return null;
  }
}

function setCached(key, data, useLocalStorage = false, ttlMs = null) {
  const storage = useLocalStorage ? localStorage : sessionStorage;
  const obj = { data };
  if (ttlMs) obj.expiry = Date.now() + ttlMs;
  storage.setItem("mmm_" + key, JSON.stringify(obj));
}

if (window._MMM_INITIALIZED) {
  console.warn("MMM mod already initialized.");
} else {
  console.log("initializing...");
  window._MMM_INITIALIZED = true;
  window._mmmCleanup = function () {
    if (window._mmmKeydownHandler) {
      window.removeEventListener("keydown", window._mmmKeydownHandler, true);
      delete window._mmmKeydownHandler;
    }
    if (window._lyricsInterval) {
      clearInterval(window._lyricsInterval);
      window._lyricsInterval = null;
    }
    if (window.currentAudio) {
      window.currentAudio.pause();
      window.currentAudio.currentTime = 0;
      window.currentAudio.loop = false;
      window.currentAudio.src = "";
      window.currentAudio.load();
      delete window.currentAudio;
    }
    const menu = document.querySelector(".modmenu");
    if (menu) menu.remove();
    const notif = document.getElementById("mmm-notification-container");
    if (notif) notif.remove();
    const dele = document.getElementById("delete-me-pls");
    if (dele) dele.remove();
    const styleLink = document.querySelector(
      'link[href="https://mmm-ernr.onrender.com/stylee.css"]',
    );
    if (styleLink) styleLink.remove();
    delete window._MMM_INITIALIZED;
  };
  (() => {
    if (window._mmmKeydownHandler) {
      window.removeEventListener("keydown", window._mmmKeydownHandler, true);
      delete window._mmmKeydownHandler;
    }
    const deletion = document.createElement("div");
    deletion.id = "delete-me-pls";
    const game_ui = document.getElementById("game-ui");
    if (game_ui) game_ui.appendChild(deletion);
    const music_icon = document.createElement("div");
    music_icon.id = "alliance-btn";
    music_icon.style.right = "390px";
    music_icon.style.fontSize = "40px";
    music_icon.style.verticalAlign = "middle";
    music_icon.style.left = "335px";
    music_icon.innerHTML = `
<svg viewBox="0 0 322.199 322.199" width="35" height="40" fill="#fff">
  <path d="M97.173,322.156c35.754,0.874,67.271-11.577,84.481-30.805c6.111-6.845,10.074-14.932,10.836-16.527
  c0.448-0.949,0.825-1.955,1.149-2.997l45.168-148.824c2.678-8.782,9.991-10.542,15.978-3.577
  c4.629,5.392,9.606,11.507,14.659,18.304c20.823,27.968,22.502,64.76,11.397,94.439
  c-11.112,29.667-32.111,38.046-25.375,47.436c6.757,9.418,33.226-13.974,50.453-41.793
  c17.212-27.824,19.136-74.354,3.603-112.445c-15.54-38.099-38.17-62.592-42.486-82.467
  c-0.269-1.272-0.545-2.523-0.821-3.737c-0.453-2.06-0.269-5.574,0.429-7.837l1.242-4.105
  c3.391-11.146-2.89-22.922-14.058-26.307c-11.141-3.384-22.915,2.914-26.297,14.052L172.77,195.409
  c-2.673,8.784-10.884,11.481-19.142,7.494c-15.156-7.325-33.448-11.817-53.236-12.303
  c-53.387-1.311-97.377,27.086-98.267,63.426C1.235,290.35,43.784,320.862,97.173,322.156z"/>
</svg>
`;
    if (deletion && music_icon) {
      document.getElementById("delete-me-pls").appendChild(music_icon);
    }
    music_icon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelector(".modmenu").classList.toggle("fade-out");
    });

    // import MMM v4.2 style.css from website
    let existingStyle = document.querySelector(
      'link[href="https://mmm-ernr.onrender.com/stylee.css"]',
    );
    if (!existingStyle) {
      var stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = "https://mmm-ernr.onrender.com/stylee.css";
      document.head.appendChild(stylesheet);
    }

    window.currentAudio = new Audio();
    const currentAudio = window.currentAudio;
    currentAudio.crossOrigin = "anonymous";
    currentAudio.preload = "none";

    //menu code
    let MusicMenuMod = document.createElement("div");
    MusicMenuMod.className = "modmenu";
    document.body.append(MusicMenuMod);
    MusicMenuMod.innerHTML = `
    <div class="menuColor">
        <legend class="header">Music Menu:</legend>

        <!-- Informational info -->
        <div class="infoText">
            Information: Press "p" to open/close menu! Press "c" to start/stop the music! "b" to mute! "k" to loopsongs! "j" to pause! "shift+nine" to refresh songs! "shift+zero" to upload stats! hover over text for more information!
        </div>

        <!-- Mute chat checkbox -->
        <div class="muteChat">
            <div class="HoverText" style="font-size: 17.5px !important;">Mute Chat?</div>
            <div class="informationText">Mutes the song lyrics</div>
            <div class="custom-checkbox">
                <input type="checkbox" id="mutechat">
                <label for="mutechat" class="checkbox-label"></label>
            </div>
        </div>
        <br>

        <!-- Loop songs checkbox -->
        <div class="loopSong">
            <div class="HoverText" style="font-size: 17.5px !important;">Loop Songs?</div>
            <div class="informationText">Loops the current song</div>
            <div class="custom-checkbox">
                <input type="checkbox" id="loopsong">
                <label for="loopsong" class="checkbox-label"></label>
            </div>
        </div>

        <div class="volumeControl" style="display:flex; align-items:center; gap:10px; margin: 8px 0; padding-bottom: 14px;">
            <span style="font-size:17.5px !important;">Volume</span>
            <input type="range" id="volumeSlider" min="0" max="3" step="0.01" value="1" style="flex:1; background: #3a3a4a; border-radius: 8px; height: 6px; -webkit-appearance: none; accent-color: #ff79c6;">
            <span id="volumeValue" style="font-size:15px !important; color:#aaa; min-width:45px; text-align:right;">100%</span>
        </div>

        <!-- Autoplay songs -->
        <div class="autoplay-section" style="margin: 12px 0; padding: 10px; background: rgba(255,255,255,0.06); border-radius: 12px;">
            <div style="font-size: 17.5px !important; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; cursor: pointer;" id="autoplayToggle">
                <span class="HoverText">Autoplay</span>
                <div class="informationText" style="width:125px!important; height:70px!important;" ">"c" to skip song! "shift+c" to go back!</div>
                <span id="autoplayStatus" style="font-size: 13px !important; color: #aaa; font-weight: normal;">Off</span>
            </div>
           <div class="autoplay-buttons" id="autoplayButtonsContainer">
                <button class="autoplay-btn" data-category="🇺🇸-----English Songs-----" style="background: #ff79c6; border: none; color: #1e1e2f; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">🇺🇸 English</button>
                <button class="autoplay-btn" data-category="🇩🇪-----German Songs-----" style="background: #ff79c6; border: none; color: #1e1e2f; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">🇩🇪 German</button>
                <button class="autoplay-btn" data-category="🇨🇳-----Chinese Songs-----" style="background: #ff79c6; border: none; color: #1e1e2f; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">🇨🇳 Chinese</button>
                <button class="autoplay-btn" data-category="💥-----Pulary Songs-----" style="background: #ff79c6; border: none; color: #1e1e2f; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">💥 Pulary</button>
                <button class="autoplay-btn" data-category="🌍-----other language Songs-----" style="background: #ff79c6; border: none; color: #1e1e2f; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">🌍 Other</button>
                <button class="autoplay-btn" data-category="🦊----- Krimsonthefox Music-----" style="background: #ff79c6; border: none; color: #1e1e2f; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">🦊 Krimson</button>
                <button class="autoplay-btn" data-category="-----Not My Songs-----" style="background: #ff79c6; border: none; color: #1e1e2f; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">❓ Not Mine</button>
                <button class="autoplay-btn" id="randomAutoplayBtn" style="background: #ffb347; border: none; color: #1e1e2f; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Random</button>
                <button class="autoplay-btn" id="stopAutoplayBtn" style="background: #ff5555; border: none; color: white; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Stop</button>
                <button class="autoplay-btn" id="pauseAutoplayBtn" style="background: #3498db; border: none; color: white; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Pause</button>
            </div>
        </div>

        <!-- Sync Songs -->
        <div class="syncsongs-section" style="margin: 12px 0; padding: 10px; background: rgba(255,255,255,0.06); border-radius: 12px;">
            <div style="font-size: 17.5px !important; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; cursor: pointer;" id="syncToggle">
                <span class="HoverText">Sync</span>
                <span id="syncStatus" style="font-size: 13px !important; color: #aaa; font-weight: normal;">Off</span>
            </div>
            <div class="sync-buttons" id="syncButtonsContainer">
                <div style="display: flex; align-items: center; gap: 8px; margin: 6px 0; width: 100%;">
                   <label for="duetModeToggle" style="font-size: 14px !important;">Duet Mode</label>
                   <input type="checkbox" id="duetModeToggle" style="width: auto; margin: 0;">
                   <span id="duetStatus" style="font-size: 12px !important; color: #aaa;">Off</span><br>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin: 6px 0; width: 100%;">
                  <label for="syncNameInput" style="font-size: 14px !important;">Your Name</label>
                  <input type="text" id="syncNameInput" placeholder="a-z, 0-9 only" maxlength="20" style="flex: 1; max-width: 120px; padding: 4px 8px; background: #3a3a4a; border: 1px solid #555; border-radius: 6px; color: #fff; outline: none; font-size: 13px;">
                </div>
                <input type="text" id="roomCodeInput" placeholder="Room Code" class="sync-btn" style="flex: 1; max-width: 160px; padding: 4px 8px; background: #3a3a4a; border: 1px solid #555; border-radius: 6px; color: #fff; outline: none;">
                <button id="joinSyncBtn" class="sync-btn" style="background: #2ecc71; border: none; color: #1e1e2f; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Join / Create</button>
                <button id="leaveSyncBtn" class="sync-btn" style="background: #e74c3c; border: none; color: white; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Leave</button>
                <button id="makeLeaderBtn" class="sync-btn" style="background: #f1c40f; border: none; color: #1e1e2f; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; margin-left: 55%;">Make Leader</button>
            </div>
            <div id="syncMembers" style="font-size: 13px !important; color: #aaa; margin-top: 4px;">Members: none</div>
        </div>

        <!-- Song selection -->
        <div class="wrapper">
            <div class="select-btn">
                <span style="font-size:22px !important;">Select Song</span>
                <i class="uil uil-angle-down"></i>
            </div>
            <div class="content">
                <div class="search">
                    <i class="uil uil-search"></i>
                    <input class="input" id="songSearch" spellcheck="false" type="text" placeholder="Search song title">
                </div>
                <div class="heading" id="scrollbar">
                    <div class="whiteline" style="border-color: transparent!important;">
                        <div class="title" style="text-align: center!important;">Song Names</div>
                        <div class="undersection">
                            <ul class="options1 scrollbar"></ul>
                        </div>
                    </div>
                    <!--<div class="secondrow">
                        <div class="title">Lengths</div>
                        <ul class="durations scrollbar"></ul>
                    </div>-->
                </div>
            </div>
        </div>

        <!-- Music Status and Music State -->
        <div class="infoStatuses">
            <div id="musicStatus" style="font-size: 17.5px !important;">Music Status: False</div>
            <div id="currentlyPlaying" style="font-size: 17.5px !important;">Currently Playing: none</div>
        </div>
    </div>
`;

    let autoplayMode = null;
    let autoplayCategory = null;
    let autoPlaySongs = [];
    let autoplayIndex = 0;
    let randomPool = [];
    let randomCategoryName = null;

    let songHistory = [];
    let songHistoryIndex = -1;
    let isGoingBack = false;

    const activeNotifications = [];

    const notificationContainer = document.createElement("div");
    notificationContainer.id = "mmm-notification-container";
    Object.assign(notificationContainer.style, {
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "flex-end",
      gap: "8px",
      pointerEvents: "none",
      zIndex: 100,
      background: "none",
    });
    document
      .querySelector(".resource-display-holder")
      .prepend(notificationContainer);

    function showNotification(message, type = "song") {
      const el = document.createElement("div");
      const prefix = type === "song" ? "Now Playing:" : "System:";
      el.textContent = `${prefix} ${message}`;

      Object.assign(el.style, {
        color: "#fff",
        backgroundColor: "rgba(0, 0, 0, 0.25)",
        borderRadius: "12px",
        padding: "12px 24px",
        fontSize: "18px",
        transition:
          "right 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
        opacity: 0,
        right: "-350px",
        position: "relative",
        letterSpacing: "0.5px",
        whiteSpace: "pre-line",
        wordWrap: "break-word",
        overflow: "visible",
        lineHeight: "normal",
        height: "auto",
        pointerEvents: "none",
        overflow: "visible !important",
      });

      notificationContainer.appendChild(el);
      requestAnimationFrame(() => {
        el.style.right = "0";
        el.style.opacity = 1;
      });

      const duration = type === "song" ? 3000 : 1500;
      const startTime = Date.now();
      const entry = { el, startTime, duration };
      activeNotifications.push(entry);

      const timeout = setTimeout(() => {
        hideNotification(entry);
      }, duration);
      entry.timeout = timeout;
    }

    function hideNotification(entry) {
      if (!entry) return;
      const { el, timeout } = entry;
      if (timeout) clearTimeout(timeout);
      el.style.opacity = 0;
      el.style.right = "-350px";
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 500);
      const idx = activeNotifications.indexOf(entry);
      if (idx !== -1) activeNotifications.splice(idx, 1);
    }

    setupAutoplayEvents();
    updateAutoplayStatus();

    const wrapper = document.querySelector(".wrapper"),
      selectBtn = wrapper.querySelector(".select-btn"),
      searchInp = wrapper.querySelector("input"),
      optionsDiv = wrapper.querySelector(".options1");

    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = "https://jukehost.co.uk";
    document.head.appendChild(preconnect);

    const API_BASE = "https://mmmm-oa5i.onrender.com";
    let API_KEY = null;

    async function fetchApiKey() {
      const cached = getCached("apiKey");
      if (cached) {
        API_KEY = cached;
        console.log("API key loaded from sessionStorage");
        return true;
      }
      try {
        const res = await fetch(`${API_BASE}/api-key`, {
          credentials: "include",
        });
        if (!res.ok) {
          console.warn("API key request failed with status:", res.status);
          return false;
        }
        const data = await res.json();
        if (data.key) {
          API_KEY = data.key;
          setCached("apiKey", API_KEY);
          console.log("API key fetched and cached in sessionStorage");
          return true;
        }
      } catch (e) {
        console.error("Failed to fetch API key:", e);
      }
      console.warn("Could not obtain API key - some features may not work.");
      return false;
    }

    let playCounts = JSON.parse(localStorage.getItem("plays") || "{}");
    let STATS_KEY = "fallback";
    let statsUploadTimer = null;

    async function fetchStatsKey() {
      const stored = localStorage.getItem("mmm_statsKey");
      if (stored) {
        STATS_KEY = stored;
        console.log("Stats key loaded from localStorage");
        return true;
      }
      try {
        const res = await fetch(`${API_BASE}/stats-key`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.key) {
            STATS_KEY = data.key;
            localStorage.setItem("mmm_statsKey", STATS_KEY);
            console.log("Stats key fetched and stored in localStorage");
            return true;
          }
        }
      } catch (e) {
        console.error("Failed to fetch stats key:", e);
      }
      console.log("No stats key found, using fallback.");
      return false;
    }

    async function uploadStats() {
      const stats = { ...playCounts };
      if (Object.keys(stats).length === 0) return;
      try {
        await apiRequest("/stats/upload", "POST", { key: STATS_KEY, stats });
        console.log(`Stats uploaded (${Object.keys(stats).length} entries)`);
        return true;
      } catch (err) {
        console.warn("Stats upload failed:", err.message);
        throw err;
      }
    }

    function scheduleStatsUpload() {
      if (statsUploadTimer) clearTimeout(statsUploadTimer);
      statsUploadTimer = setTimeout(async () => {
        await uploadStats();
        statsUploadTimer = null;
      }, 30000);
    }

    let songsList = [];
    let lyricsCache = {};

    // changed it to use fetch instead since
    // tampermonkey was ggez'ing unpatcher's websocket proxy
    async function fetchSongs() {
      const cached = getCached("songs");
      if (cached) {
        songsList = cached;
        console.log(
          `Songs loaded from sessionStorage (${songsList.length} songs)`,
        );
        return songsList;
      }
      try {
        const response = await fetch(`${API_BASE}/songs`, {
          method: "GET",
          headers: { "X-API-Key": API_KEY },
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Status ${response.status}: ${errorText}`);
        }
        songsList = await response.json();
        setCached("songs", songsList, false, 300000); // 5 min
        console.log(`Songs fetched and cached (${songsList.length} songs)`);
        return songsList;
      } catch (err) {
        console.error("fetchSongs error:", err);
        throw err;
      }
    }

    async function fetchLyrics(songId) {
      if (lyricsCache[songId]) {
        return lyricsCache[songId];
      }
      const response = await fetch(`${API_BASE}/songs/${songId}/lyrics`, {
        method: "GET",
        headers: { "X-API-Key": API_KEY },
      });
      if (!response.ok) {
        throw new Error(response.statusText || `HTTP ${response.status}`);
      }
      const data = await response.json();
      lyricsCache[songId] = data;

      const keys = Object.keys(lyricsCache);
      if (keys.length > 100) {
        delete lyricsCache[keys[0]];
      }
      return data;
    }

    async function apiRequest(endpoint, method, body) {
      if (!API_KEY) throw new Error("API key not loaded yet");

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || `HTTP ${response.status}`);
      }

      try {
        return JSON.parse(responseText);
      } catch (e) {
        return responseText;
      }
    }

    var selectedSongName, selectedSongId, selectedSongAudio;

    function updateSelectButton(songName) {
      if (selectBtn && selectBtn.firstElementChild) {
        selectBtn.firstElementChild.innerText = songName || "Select Song";
      }
    }

    function addSong(selectedSong) {
      optionsDiv.innerHTML = "";
      songsList.forEach((song) => {
        let isSelected =
          selectedSong !== null && song.name === selectedSong ? "selected" : "";
        let li = document.createElement("li");
        li.textContent = song.name;
        li.className = isSelected;

        li.addEventListener("click", () => {
          updateName(li, song.id, song.name, song.url);
        });

        optionsDiv.appendChild(li);
      });
    }

    function updateName(selectedLi, songId, songName, songAudio) {
      if (!songAudio) return;

      selectedSongId = songId;
      selectedSongName = songName;
      selectedSongAudio = songAudio;

      searchInp.value = "";
      addSong(selectedLi.innerText);
      wrapper.classList.remove("active");
      selectBtn.firstElementChild.innerText = selectedLi.innerText;
    }

    window.updateName = updateName;

    searchInp.addEventListener("keyup", () => {
      let searchWord = searchInp.value.toLowerCase();
      let arr = songsList
        .filter((data) => data.name.toLowerCase().includes(searchWord))
        .map((data) => {
          let isSelected =
            data.name == selectBtn.firstElementChild.innerText
              ? "selected"
              : "";
          return `<li class="${isSelected}" data-id="${data.id}">${data.name}</li>`;
        })
        .join("");
      optionsDiv.innerHTML = arr
        ? arr
        : `<p style="font-size: 24px; margin-top: 5px; padding-left:25px;">the song you searched hasn't been found.</p><h4>DM .wolfi_dolfi. to make it :D</h4>`;
      optionsDiv.querySelectorAll("li").forEach((li) => {
        let id = parseInt(li.dataset.id);
        let song = songsList.find((s) => s.id === id);

        li.addEventListener("click", () => {
          updateName(li, song.id, song.name, song.url);
        });
      });
    });

    selectBtn.addEventListener("click", function () {
      wrapper.classList.toggle("active");
      console.log("open");

      if (
        autoplayMode &&
        selectedSongId !== undefined &&
        selectedSongId !== null
      ) {
        setTimeout(() => {
          const li = optionsDiv.querySelector(
            `li[data-id="${selectedSongId}"]`,
          );
          if (li) {
            const container = optionsDiv;
            const containerRect = container.getBoundingClientRect();
            const liRect = li.getBoundingClientRect();
            let offset =
              liRect.top - containerRect.top + container.scrollTop - 20;
            offset = Math.max(0, offset);
            container.scrollTop = offset;
            console.log(`Scrolled to song ID ${selectedSongId}`);
          } else {
            console.warn(`Song with ID ${selectedSongId} not found in list.`);
          }
        }, 200);
      }
    });

    function getSongsByCategory(categoryName) {
      const songs = [];
      let inCategory = false;
      for (const song of songsList) {
        if (song.id === 999) {
          if (song.name === categoryName) {
            inCategory = true;
          } else if (inCategory) {
            break;
          }
          continue;
        }
        if (inCategory && song.url) {
          songs.push(song);
        }
      }
      return songs;
    }

    function getAllSongs() {
      return songsList.filter((s) => s.id !== 999 && s.url);
    }

    let spamModeActive = false,
      messageTimeouts = [],
      chatMessages = [];

    let currentlyPlaying = document.getElementById("currentlyPlaying");
    let musicStatus = document.getElementById("musicStatus");

    let chatMuted = false;
    let loopSong = false;

    let schedulingActive = false;

    function scheduleMessages(messages, startIndex = 0) {
      schedulingActive = false;
      if (window._lyricsInterval) {
        clearInterval(window._lyricsInterval);
        window._lyricsInterval = null;
      }

      setTimeout(() => {
        schedulingActive = true;
        let i = startIndex;
        window._lyricsInterval = setInterval(() => {
          if (!schedulingActive || !currentAudio || currentAudio.paused) {
            return;
          }
          let currentMs = currentAudio.currentTime * 1000;
          while (i < messages.length && messages[i].delay <= currentMs) {
            if (!chatMuted) pendMessages(messages[i].chat);
            i++;
          }
          if (i >= messages.length) {
            clearInterval(window._lyricsInterval);
            window._lyricsInterval = null;
          }
        }, 50);
      }, 50);
    }

    const DUET_PAIRS = {
      194: 195,
    };
    function getPartnerSongId(songId) {
      if (DUET_PAIRS[songId]) return DUET_PAIRS[songId];
      for (const [key, value] of Object.entries(DUET_PAIRS)) {
        if (value === songId) return parseInt(key);
      }
      return null;
    }

    let audioCtx = null;
    let gainNode = null;
    let volumeSlider = null;
    let volumeValueEl = null;

    function initAudioContext() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioCtx.createGain();
        const source = audioCtx.createMediaElementSource(currentAudio);
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      return gainNode;
    }

    function setBoostedVolume(value) {
      const gain = initAudioContext();
      if (!gain) return;
      const clamped = Math.min(Math.max(value, 0), 3);
      gain.gain.value = clamped;
      if (volumeValueEl) {
        volumeValueEl.textContent = `${Math.round(clamped * 100)}%`;
      }
      localStorage.setItem("musicVolumeBoost", clamped);
    }

    let savedVolume = parseFloat(localStorage.getItem("musicVolumeBoost"));
    if (isNaN(savedVolume)) savedVolume = 1;

    volumeSlider = document.getElementById("volumeSlider");
    volumeValueEl = document.getElementById("volumeValue");
    if (volumeSlider) {
      volumeSlider.value = savedVolume;
      setBoostedVolume(savedVolume);
      volumeSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        setBoostedVolume(val);
      });
    }

    let countedThisPlay = false;
    let lastWebhookTime = 0;
    let onTimeUpdateHandler = null;

    let isPaused = false;
    let syncStartTime = null;

    async function toggleChatSpamMode() {
      if (spamModeActive) {
        if (syncRoom && !syncIsLeader) {
          showNotification("Only the leader can play songs", "system");
          return;
        }
        resetLyricsState();
        schedulingActive = false;
        hideNotification();
        spamModeActive = false;
        messageTimeouts.forEach(clearTimeout);
        messageTimeouts = [];
        currentlyPlaying.innerHTML = "Currently Playing: none";
        musicStatus.innerHTML = `Music Status: OFF`;
        document.getElementById("pauseAutoplayBtn").textContent = "Pause";
        isPaused = false;
        if (onTimeUpdateHandler) {
          currentAudio.removeEventListener("timeupdate", onTimeUpdateHandler);
          onTimeUpdateHandler = null;
        }
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.loop = false;
        currentAudio.removeEventListener("ended", onSongEnded);
        if (syncRoom && syncIsLeader) {
          syncStop();
        }
        updateSelectButton("Select Song");
        return;
      }

      if (autoplayMode) {
        skipSong();
        return;
      }

      if (selectedSongId === undefined || selectedSongId === null) {
        console.log("No song selected. Select one from the dropdown.");
        return;
      }

      try {
        chatMessages = await fetchLyrics(selectedSongId);
        spamModeActive = true;
        currentlyPlaying.innerHTML = `Currently Playing: ${selectedSongName}`;
        musicStatus.innerHTML = `Music Status: ON`;
        updateSelectButton(selectedSongName);

        if (onTimeUpdateHandler) {
          currentAudio.removeEventListener("timeupdate", onTimeUpdateHandler);
          onTimeUpdateHandler = null;
        }

        currentAudio.pause();
        currentAudio.currentTime = syncStartTime !== null ? syncStartTime : 0;
        currentAudio.src = selectedSongAudio;
        currentAudio.loop = false;
        syncStartTime = null;
        countedThisPlay = false;

        onTimeUpdateHandler = function () {
          if (!currentAudio.duration) return;
          let progress = currentAudio.currentTime / currentAudio.duration;
          if (!countedThisPlay && progress >= 0.25) {
            countedThisPlay = true;
            if (!playCounts[selectedSongId]) {
              playCounts[selectedSongId] = 0;
            }
            playCounts[selectedSongId]++;
            localStorage.setItem("plays", JSON.stringify(playCounts));
            scheduleStatsUpload();
            currentAudio.removeEventListener("timeupdate", onTimeUpdateHandler);
            onTimeUpdateHandler = null;
          }
        };
        currentAudio.addEventListener("timeupdate", onTimeUpdateHandler);

        currentAudio.removeEventListener("ended", onSongEnded);
        currentAudio.addEventListener("ended", onSongEnded);

        initAudioContext();

        await currentAudio.play();
        const now = Date.now();
        if (syncRoom && syncIsLeader) {
          syncPlay(selectedSongId, currentAudio.currentTime, now);
        }
        showNotification(selectedSongName, "song");
        scheduleMessages(chatMessages);
        document.getElementById("pauseAutoplayBtn").textContent = "Pause";
        isPaused = false;
      } catch (err) {
        if (err.name === "AbortError" || err.name === "NotAllowedError") {
          console.debug("Playback interrupted gracefully:", err.message);
          return;
        }
        console.warn(
          `play() rejected for "${selectedSongName}":`,
          err.name,
          err.message,
        );
      }
    }

    async function playSong(song) {
      if (!song) return;

      selectedSongId = song.id;
      selectedSongName = song.name;
      selectedSongAudio = song.url;
      updateSelectButton(selectedSongName);

      if (spamModeActive) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        spamModeActive = false;
        currentAudio.removeEventListener("ended", onSongEnded);
        messageTimeouts.forEach(clearTimeout);
        messageTimeouts = [];
      }

      try {
        chatMessages = await fetchLyrics(selectedSongId);
        spamModeActive = true;
        currentlyPlaying.innerHTML = `Currently Playing: ${selectedSongName}`;
        musicStatus.innerHTML = `Music Status: ON (Autoplay: ${autoplayMode})`;
        updateAutoplayStatus();

        if (onTimeUpdateHandler) {
          currentAudio.removeEventListener("timeupdate", onTimeUpdateHandler);
          onTimeUpdateHandler = null;
        }

        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.src = selectedSongAudio;
        currentAudio.loop = false;

        countedThisPlay = false;

        onTimeUpdateHandler = function () {
          if (!currentAudio.duration) return;
          let progress = currentAudio.currentTime / currentAudio.duration;
          if (!countedThisPlay && progress >= 0.25) {
            countedThisPlay = true;
            if (!playCounts[selectedSongId]) {
              playCounts[selectedSongId] = 0;
            }
            playCounts[selectedSongId]++;
            localStorage.setItem("plays", JSON.stringify(playCounts));
            scheduleStatsUpload();
            currentAudio.removeEventListener("timeupdate", onTimeUpdateHandler);
            onTimeUpdateHandler = null;
          }
        };
        currentAudio.addEventListener("timeupdate", onTimeUpdateHandler);

        currentAudio.removeEventListener("ended", onSongEnded);
        currentAudio.addEventListener("ended", onSongEnded);

        initAudioContext();

        await currentAudio.play();
        const currentTime = currentAudio.currentTime;
        const now = Date.now();
        if (syncRoom && syncIsLeader) {
          syncPlay(selectedSongId, currentAudio.currentTime, now);
        }

        scheduleMessages(chatMessages);
        showNotification(selectedSongName, "song");
        document.getElementById("pauseAutoplayBtn").textContent = "Pause";
        isPaused = false;
      } catch (err) {
        if (err.name === "AbortError" || err.name === "NotAllowedError") {
          console.debug("Playback interrupted gracefully:", err.message);
          return;
        }
        console.warn(
          `play() rejected for "${selectedSongName}":`,
          err.name,
          err.message,
        );
        setTimeout(() => {
          playSong(song);
        }, 1000);
      }
    }

    async function playNextAuto() {
      if (!autoplayMode) return;

      let nextSong = null;
      if (autoplayMode === "category") {
        if (autoPlaySongs.length === 0) return;
        if (autoplayIndex >= autoPlaySongs.length) autoplayIndex = 0;
        nextSong = autoPlaySongs[autoplayIndex];
        autoplayIndex++;
      } else if (autoplayMode === "random") {
        if (randomPool.length === 0) {
          const all = getAllSongs();
          if (all.length === 0) return;
          randomPool = all;
          randomCategoryName = null;
        }
        const randomIndex = Math.floor(Math.random() * randomPool.length);
        nextSong = randomPool[randomIndex];
      }
      if (!nextSong) {
        console.log("No next song available in autoplay mode");
        return;
      }

      if (!isGoingBack) {
        songHistory.push(nextSong);
        songHistoryIndex = songHistory.length - 1;
      } else {
        isGoingBack = false;
      }

      if (songHistory.length > 100) {
        songHistory.shift();
        songHistoryIndex--;
      }

      await playSong(nextSong);
    }

    function skipSong() {
      schedulingActive = false;
      if (spamModeActive) {
        hideNotification();
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.removeEventListener("ended", onSongEnded);
        messageTimeouts.forEach(clearTimeout);
        messageTimeouts = [];
        spamModeActive = false;
        document.getElementById("pauseAutoplayBtn").textContent = "Pause";
        isPaused = false;
      }
      if (autoplayMode) {
        playNextAuto();
      } else {
        currentlyPlaying.innerHTML = "Currently Playing: none";
        musicStatus.innerHTML = `Music Status: OFF`;
        updateAutoplayStatus();
      }
    }

    function skipBackSong() {
      if (!autoplayMode) {
        console.log("Not in autoplay mode. Press C to start manual play.");
        return;
      }
      if (songHistoryIndex <= 0) {
        console.log("Already at the first song in history");
        return;
      }

      songHistoryIndex--;
      const prevSong = songHistory[songHistoryIndex];
      if (!prevSong) return;

      if (autoplayMode === "category") {
        const idx = autoPlaySongs.findIndex((s) => s.id === prevSong.id);
        if (idx !== -1) {
          autoplayIndex = idx;
          console.log(`Adjusted autoplayIndex to ${autoplayIndex}`);
        }
      }

      if (spamModeActive) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.removeEventListener("ended", onSongEnded);
        messageTimeouts.forEach(clearTimeout);
        messageTimeouts = [];
        spamModeActive = false;
      }

      isGoingBack = true;

      playSong(prevSong);
    }

    function onSongEnded() {
      setTimeout(() => {
        if (loopSong && !autoplayMode) {
          currentAudio.currentTime = 0;
          currentAudio
            .play()
            .then(() => {
              scheduleMessages(chatMessages);
            })
            .catch((err) => console.warn("Loop restart failed:", err));
          return;
        }
        resetLyricsState();
        if (autoplayMode) {
          playNextAuto();
        } else {
          spamModeActive = false;
          currentlyPlaying.innerHTML = "Currently Playing: none";
          musicStatus.innerHTML = `Music Status: OFF`;
          updateAutoplayStatus();
          document.getElementById("pauseAutoplayBtn").textContent = "Pause";
          isPaused = false;
        }
      }, 200);
    }

    function startCategoryAutoplay(categoryName) {
      if (syncRoom && !syncIsLeader) {
        showNotification("Only the leader can start autoplay", "system");
        return;
      }

      if (spamModeActive) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        spamModeActive = false;
        currentAudio.removeEventListener("ended", onSongEnded);
        messageTimeouts.forEach(clearTimeout);
        messageTimeouts = [];
      }

      autoplayMode = "category";
      autoplayCategory = categoryName;
      autoPlaySongs = getSongsByCategory(categoryName);
      autoplayIndex = 0;
      songHistory = [];
      songHistoryIndex = -1;
      isGoingBack = false;
      randomPool = [];
      randomCategoryName = null;

      if (autoPlaySongs.length === 0) {
        alert(`No songs found in category: ${categoryName}`);
        autoplayMode = null;
        updateAutoplayStatus();
        return;
      }

      console.log(
        `Autoplay category "${categoryName}" (${autoPlaySongs.length} songs)`,
      );
      showNotification(`Autoplay: ${categoryName || "Random"}`, "system");
      updateAutoplayStatus();
      playNextAuto();
    }

    function startRandomAutoplay() {
      let pool = [];
      let categoryName = null;

      if (syncRoom && !syncIsLeader) {
        showNotification("Only the leader can start autoplay", "system");
        return;
      }

      if (autoplayMode === "category" && autoPlaySongs.length > 0) {
        pool = autoPlaySongs;
        categoryName = autoplayCategory;
      } else {
        pool = getAllSongs();
        categoryName = null;
      }

      if (pool.length === 0) {
        alert("No songs available.");
        return;
      }

      if (spamModeActive) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        spamModeActive = false;
        currentAudio.removeEventListener("ended", onSongEnded);
        messageTimeouts.forEach(clearTimeout);
        messageTimeouts = [];
      }

      autoplayMode = "random";
      autoplayCategory = null;
      autoPlaySongs = [];
      autoplayIndex = 0;
      songHistory = [];
      songHistoryIndex = -1;
      isGoingBack = false;
      randomPool = pool;
      randomCategoryName = categoryName;

      console.log(`Autoplay random from ${pool.length} songs`);
      showNotification(`Autoplay: ${categoryName || "Random"}`, "system");
      updateAutoplayStatus();
      playNextAuto();
    }

    function stopAutoplay() {
      schedulingActive = false;
      autoplayMode = null;
      autoplayCategory = null;
      autoPlaySongs = [];
      autoplayIndex = 0;
      hideNotification();
      songHistory = [];
      songHistoryIndex = -1;
      isGoingBack = false;
      randomPool = [];
      randomCategoryName = null;
      document.getElementById("pauseAutoplayBtn").textContent = "Pause";
      isPaused = false;

      if (spamModeActive) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        spamModeActive = false;
        currentAudio.removeEventListener("ended", onSongEnded);
        messageTimeouts.forEach(clearTimeout);
        messageTimeouts = [];
        currentlyPlaying.innerHTML = "Currently Playing: none";
        musicStatus.innerHTML = `Music Status: OFF`;
        document.getElementById("pauseAutoplayBtn").textContent = "Pause";
        isPaused = false;
      }

      updateAutoplayStatus();
      showNotification("Autoplay stopped", "system");
      updateSelectButton("Select Song");
      console.log("Autoplay stopped");
    }

    function updateAutoplayStatus() {
      const statusEl = document.getElementById("autoplayStatus");
      if (!statusEl) return;

      if (autoplayMode === "category" && autoplayCategory) {
        const cleanName = autoplayCategory.replace(/-----.*$/, "").trim();
        statusEl.innerHTML = `${cleanName} (${autoplayIndex}/${autoPlaySongs.length})`;
      } else if (autoplayMode === "random") {
        const count = randomPool.length || getAllSongs().length;
        let label = "Random";
        if (randomCategoryName) {
          const cleanName = randomCategoryName.replace(/-----.*$/, "").trim();
          label = `Random (${cleanName})`;
        }
        statusEl.innerHTML = `${label} (${count} songs)`;
      } else {
        statusEl.innerHTML = `Off`;
      }
    }

    function togglePause() {
      const pauseBtn = document.getElementById("pauseAutoplayBtn");
      if (!pauseBtn) return;

      if (!currentAudio) return;

      if (!spamModeActive && !autoplayMode) {
        showNotification("No song is playing", "system");
        return;
      }

      if (syncRoom && !syncIsLeader) {
        showNotification("Only the leader can pause", "system");
        return;
      }

      if (currentAudio.paused) {
        // Resume
        currentAudio
          .play()
          .then(() => {
            isPaused = false;
            pauseBtn.textContent = "Pause";
            musicStatus.innerHTML = `Music Status: ON (${autoplayMode || "Manual"})`;
            schedulingActive = true;

            let startIndex = 0;
            const currentMs = currentAudio.currentTime * 1000;
            for (let j = 0; j < chatMessages.length; j++) {
              if (chatMessages[j].delay > currentMs) {
                startIndex = j;
                break;
              }
            }
            scheduleMessages(chatMessages, startIndex);
            if (syncRoom && syncIsLeader) {
              syncPause(false, currentAudio.currentTime);
            }
          })
          .catch((err) => console.warn("Resume failed:", err));
      } else {
        // Pause
        currentAudio.pause();
        isPaused = true;
        schedulingActive = false;
        pauseBtn.textContent = "Play";
        musicStatus.innerHTML = `Music Status: Paused`;
        if (syncRoom && syncIsLeader) {
          syncPause(true, currentAudio.currentTime);
        }
      }
    }

    function setupAutoplayEvents() {
      document
        .querySelectorAll(".autoplay-btn[data-category]")
        .forEach((btn) => {
          btn.addEventListener("click", () => {
            startCategoryAutoplay(btn.dataset.category);
          });
        });

      const randomBtn = document.getElementById("randomAutoplayBtn");
      if (randomBtn) randomBtn.addEventListener("click", startRandomAutoplay);

      const stopBtn = document.getElementById("stopAutoplayBtn");
      if (stopBtn) stopBtn.addEventListener("click", stopAutoplay);

      const pauseBtn = document.getElementById("pauseAutoplayBtn");
      if (pauseBtn) pauseBtn.addEventListener("click", togglePause);
    }

    let syncRoom = null;
    let syncLeader = null;
    let syncMembers = [];
    let syncPaused = false;
    let syncName = localStorage.getItem("mmm_syncName") || "User";
    let syncCurrentSongId = null;
    let syncIsLeader = false;
    let syncEventSource = null;
    let syncHeartbeatInterval = null;
    let isRejoining = false;
    let isLeaving = false;
    let syncLoop = false;
    let syncCurrentTime = 0;
    let duetMode = false;

    function resetLyricsState() {
      if (window._lyricsInterval) {
        clearInterval(window._lyricsInterval);
        window._lyricsInterval = null;
      }
      schedulingActive = false;
      chatMessages = [];
      syncStartTime = null;
    }

    function hardResetLyrics() {
      if (window._lyricsInterval) {
        clearInterval(window._lyricsInterval);
        window._lyricsInterval = null;
      }
      schedulingActive = false;

      if (!spamModeActive || !selectedSongId) {
        console.log(
          "No active song – resetting lyrics state (cleared interval)",
        );
        showNotification("Lyrics reset (no song playing)", "system");
        return;
      }

      const songId = selectedSongId;
      const currentTime = currentAudio.currentTime || 0;
      console.log(
        `Hard resetting lyrics for song ${songId} at ${currentTime}s`,
      );

      delete lyricsCache[songId];

      fetchLyrics(songId)
        .then((lyrics) => {
          if (!lyrics || lyrics.length === 0) {
            console.warn("No lyrics returned for hard reset.");
            showNotification("No lyrics available for this song", "system");
            return;
          }
          chatMessages = lyrics;

          const currentMs = currentTime * 1000;
          let startIndex = 0;
          for (let j = 0; j < lyrics.length; j++) {
            if (lyrics[j].delay > currentMs) {
              startIndex = j;
              break;
            }
          }

          scheduleMessages(lyrics, startIndex);
          console.log(
            `Lyrics hard reset: scheduled from index ${startIndex} (${lyrics.length} lines)`,
          );
          showNotification("Lyrics reset and rescheduled", "system");
        })
        .catch((err) => {
          console.error("Hard reset lyrics fetch error:", err);
          showNotification("Lyrics reset failed – fetch error", "system");
        });
    }

    function startHeartbeat(roomCode) {
      if (syncHeartbeatInterval) clearInterval(syncHeartbeatInterval);
      syncHeartbeatInterval = setInterval(() => {
        if (!syncRoom) {
          clearInterval(syncHeartbeatInterval);
          syncHeartbeatInterval = null;
          return;
        }
        fetch(`${API_BASE}/sync/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode: syncRoom, name: syncName }),
        }).catch((err) => console.warn("Heartbeat failed:", err));
      }, 10000);
    }

    function connectSyncSSE(roomCode) {
      if (syncEventSource) {
        syncEventSource.close();
        syncEventSource = null;
      }
      const currentRoom = roomCode;
      syncEventSource = new EventSource(
        `${API_BASE}/sync/events/${currentRoom}`,
      );

      syncEventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("SSE update:", msg);
          handleSyncMessage(msg);
        } catch (e) {
          console.warn("SSE parse error:", e);
        }
      };

      syncEventSource.onerror = (err) => {
        console.warn("SSE error, checking room...", err);
        if (isRejoining || isLeaving) return;
        const currentRoom = roomCode;
        const originalLeader = syncLeader;
        fetch(`${API_BASE}/sync/${currentRoom}`)
          .then((res) => {
            if (!res.ok) {
              console.warn(
                "Room no longer exists. Rejoining with original leader:",
                originalLeader,
              );
              showNotification("Room was deleted, rejoining...", "system");
              syncJoin(currentRoom, originalLeader);
            } else {
              console.log("Room exists, SSE will reconnect automatically.");
            }
          })
          .catch(() => {
            console.log(
              "Network error checking room, will retry on next SSE error.",
            );
          });
      };
    }

    function handleSyncMessage(msg) {
      if (msg.type !== "room_state") return;
      let needUIUpdate = false;

      if (msg.leader !== syncLeader) {
        syncLeader = msg.leader;
        syncIsLeader = syncLeader === syncName;
        showNotification(`Leader changed to "${syncLeader}"`, "system");
        document.getElementById("syncStatus").textContent =
          `Connected (Leader: ${syncLeader})`;
        needUIUpdate = true;
      }

      if (JSON.stringify(msg.members) !== JSON.stringify(syncMembers)) {
        syncMembers = msg.members || [];
        updateSyncUI();
        needUIUpdate = true;
      }

      if (msg.currentTime !== undefined) {
        syncCurrentTime = msg.currentTime;
      }

      if (
        msg.currentSong !== undefined &&
        msg.currentSong !== syncCurrentSongId
      ) {
        syncCurrentSongId = msg.currentSong;

        if (syncCurrentSongId === null) {
          if (spamModeActive) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            spamModeActive = false;
            currentAudio.removeEventListener("ended", onSongEnded);
            messageTimeouts.forEach(clearTimeout);
            messageTimeouts = [];
            currentlyPlaying.innerHTML = "Currently Playing: none";
            musicStatus.innerHTML = `Music Status: OFF (synced)`;
            document.getElementById("pauseAutoplayBtn").textContent = "Pause";
            isPaused = false;
            schedulingActive = false;
            hideNotification();
          }
          syncPaused = false;
          syncCurrentTime = 0;
          needUIUpdate = true;
        } else if (!syncIsLeader && syncCurrentSongId !== null) {
          const timestamp = msg.timestamp || Date.now();
          let targetSongId = syncCurrentSongId;
          if (duetMode && msg.partnerSongId) {
            targetSongId = msg.partnerSongId;
            console.log(
              `Duet mode: playing partner song ${targetSongId} instead of ${syncCurrentSongId}`,
            );
          }
          playSyncSong(targetSongId, msg.currentTime || 0, timestamp);
        }
        needUIUpdate = true;
      }

      if (msg.paused !== undefined && syncCurrentSongId !== null) {
        const newPaused = msg.paused;
        if (newPaused !== syncPaused) {
          syncPaused = newPaused;

          if (syncPaused) {
            if (spamModeActive && !currentAudio.paused) {
              if (syncCurrentTime !== undefined) {
                currentAudio.currentTime = syncCurrentTime;
              }
              currentAudio.pause();
              isPaused = true;
              document.getElementById("pauseAutoplayBtn").textContent = "Play";
              musicStatus.innerHTML = "Music Status: Paused (synced)";
              schedulingActive = false;
              hideNotification();
            }
          } else {
            if (spamModeActive && currentAudio.paused) {
              if (syncCurrentTime !== undefined) {
                currentAudio.currentTime = syncCurrentTime;
                console.log(`Resume: aligned to ${syncCurrentTime}s`);
              }
              currentAudio
                .play()
                .then(() => {
                  isPaused = false;
                  document.getElementById("pauseAutoplayBtn").textContent =
                    "Pause";
                  musicStatus.innerHTML = `Music Status: ON (Sync)`;
                  schedulingActive = true;
                  let startIndex = 0;
                  const currentMs = currentAudio.currentTime * 1000;
                  for (let j = 0; j < chatMessages.length; j++) {
                    if (chatMessages[j].delay > currentMs) {
                      startIndex = j;
                      break;
                    }
                  }
                  scheduleMessages(chatMessages, startIndex);
                })
                .catch((err) => console.warn("Resume failed:", err));
            }
          }
          needUIUpdate = true;
        }
      }

      if (msg.loop !== undefined && msg.loop !== syncLoop) {
        syncLoop = msg.loop;
        const loopCheckbox = document.getElementById("loopsong");
        if (loopCheckbox) {
          loopCheckbox.checked = syncLoop;
          loopSong = syncLoop;
          if (currentAudio) currentAudio.loop = syncLoop;
        }
        needUIUpdate = true;
      }

      if (needUIUpdate) updateSyncUI();
    }

    async function syncJoin(roomCode, originalLeader = null) {
      stopMusic();
      syncIsLeader = false;
      syncLeader = null;

      if (isRejoining) return;
      isRejoining = true;
      isLeaving = false;
      try {
        const body = { roomCode, name: syncName };
        if (originalLeader) body.originalLeader = originalLeader;
        const res = await fetch(`${API_BASE}/sync/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        syncRoom = roomCode;
        syncLeader = data.leader;
        syncMembers = data.members || [];
        syncCurrentSongId = data.currentSong || null;
        syncCurrentTime = data.currentTime || 0;
        syncPaused = data.paused || false;
        syncIsLeader = syncLeader === syncName;
        if (!syncLeader) {
          syncLeader = syncName;
          syncIsLeader = true;
        }
        syncLoop = data.loop || false;
        const loopCheckbox = document.getElementById("loopsong");
        if (loopCheckbox) {
          loopCheckbox.checked = syncLoop;
          loopSong = syncLoop;
          if (currentAudio) currentAudio.loop = syncLoop;
        }
        updateSyncUI();

        if (data.isNewRoom) {
          showNotification(`Created new room: ${roomCode}`, "system");
        } else {
          showNotification(`Joined existing room: ${roomCode}`, "system");
        }

        startHeartbeat(roomCode);
        connectSyncSSE(roomCode);
        updateSyncUI();
        document.getElementById("syncStatus").textContent =
          `Connected (Leader: ${syncLeader})`;
        if (syncCurrentSongId !== null && !syncPaused && !syncIsLeader) {
          const timestamp = data.timestamp || Date.now();
          playSyncSong(syncCurrentSongId, syncCurrentTime, timestamp);
        }
      } catch (err) {
        console.error("Sync join error:", err);
        showNotification("Failed to join sync room", "system");
        alert("Failed to join sync room");
      } finally {
        isRejoining = false;
        isLeaving = false;
      }
    }

    async function syncLeave() {
      isLeaving = true;
      resetLyricsState();
      isRejoining = false;
      if (syncRoom) {
        try {
          await fetch(`${API_BASE}/sync/leave`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomCode: syncRoom, name: syncName }),
          });
        } catch (e) {
          /* ignore */
        }
      }
      if (syncEventSource) {
        syncEventSource.close();
        syncEventSource = null;
      }
      if (syncHeartbeatInterval) {
        clearInterval(syncHeartbeatInterval);
        syncHeartbeatInterval = null;
      }
      syncRoom = null;
      syncLeader = null;
      syncMembers = [];
      syncCurrentSongId = null;
      syncCurrentTime = 0;
      syncPaused = false;
      syncIsLeader = false;
      syncLoop = false;
      syncStartTime = null;
      updateSyncUI();
      document.getElementById("syncStatus").textContent = "Off";
      setTimeout(() => {
        isLeaving = false;
      }, 1000);
    }

    async function syncPlay(songId, currentTime = 0, timestamp = Date.now()) {
      if (!syncRoom || !syncIsLeader) return;
      let partnerSongId = null;
      if (duetMode) {
        partnerSongId = getPartnerSongId(songId);
        if (partnerSongId) {
          console.log(
            `Duet mode: sending partner song ID ${partnerSongId} for ${songId}`,
          );
        }
      }
      try {
        await fetch(`${API_BASE}/sync/play`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode: syncRoom,
            name: syncName,
            songId,
            currentTime,
            timestamp,
            partnerSongId,
          }),
        });
        syncCurrentSongId = songId;
        syncPaused = false;
      } catch (err) {
        console.error("Sync play error:", err);
      }
    }

    async function syncPause(paused, currentTime = 0) {
      if (!syncRoom || !syncIsLeader) return;
      try {
        await fetch(`${API_BASE}/sync/pause`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode: syncRoom,
            name: syncName,
            paused,
            currentTime,
          }),
        });
        syncPaused = paused;
      } catch (err) {
        console.error("Sync pause error:", err);
      }
    }

    async function syncSetLoop(loop) {
      if (!syncRoom || !syncIsLeader) return;
      try {
        await fetch(`${API_BASE}/sync/set_loop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode: syncRoom, name: syncName, loop }),
        });
        syncLoop = loop;
      } catch (err) {
        console.error("Sync set loop error:", err);
      }
    }

    async function syncStop() {
      if (!syncRoom || !syncIsLeader) return;
      try {
        await fetch(`${API_BASE}/sync/stop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode: syncRoom, name: syncName }),
        });
        syncCurrentSongId = null;
        syncPaused = true;
      } catch (err) {
        console.error("Sync stop error:", err);
      }
    }

    async function syncMakeLeader(targetName) {
      if (!syncRoom || !syncIsLeader) return;
      try {
        const res = await fetch(`${API_BASE}/sync/make_leader`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode: syncRoom,
            name: syncName,
            targetName: targetName.trim(),
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          showNotification(
            `${err.error || "Failed to change leader"}`,
            "system",
          );
          return;
        }
      } catch (err) {
        console.error("Make leader error:", err);
        showNotification("ould not change leader", "system");
      }
    }

    function updateSyncUI() {
      const membersEl = document.getElementById("syncMembers");
      if (!membersEl) return;
      const count = syncMembers.length;
      if (count === 0) {
        membersEl.textContent = "Members: none";
        return;
      }
      const list = syncMembers
        .map((m) => `${m}${m === syncLeader ? " 👑" : ""}`)
        .join(", ");
      membersEl.textContent = `Members (${count}): ${list}`;
    }

    function playSyncSong(songId, startTime = 0, serverTimestamp = Date.now()) {
      resetLyricsState();
      const song = songsList.find((s) => s.id === songId);
      if (!song) {
        console.warn("Sync song not found:", songId);
        return;
      }

      const now = Date.now();
      const elapsed = (now - serverTimestamp) / 1000;
      let adjustedStart = Math.max(0, startTime + elapsed);

      console.log(
        `Sync playing: ${song.name}, target start ${adjustedStart}s (offset ${elapsed}s)`,
      );

      selectedSongId = song.id;
      selectedSongName = song.name;
      selectedSongAudio = song.url;

      if (spamModeActive) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        spamModeActive = false;
        currentAudio.removeEventListener("ended", onSongEnded);
        messageTimeouts.forEach(clearTimeout);
        messageTimeouts = [];
      }

      currentAudio.src = selectedSongAudio;
      currentAudio.preload = "auto";

      const loadPromise = new Promise((resolve) => {
        if (currentAudio.readyState >= 2) {
          resolve();
        } else {
          const onLoad = () => {
            currentAudio.removeEventListener("loadedmetadata", onLoad);
            resolve();
          };
          currentAudio.addEventListener("loadedmetadata", onLoad);
          setTimeout(resolve, 2000);
        }
      });

      loadPromise.then(() => {
        const loadTime = (Date.now() - now) / 1000;
        adjustedStart = Math.max(0, adjustedStart + loadTime);
        console.log(
          `Audio loaded in ${loadTime}s, adjusted start ${adjustedStart}s`,
        );

        currentAudio.currentTime = adjustedStart;
        currentAudio.loop = false;
        syncStartTime = adjustedStart;
        syncCurrentTime = adjustedStart;

        initAudioContext();

        currentAudio
          .play()
          .then(() => {
            spamModeActive = true;
            currentlyPlaying.innerHTML = `Currently Playing: ${selectedSongName}`;
            musicStatus.innerHTML = `Music Status: ON (Sync)`;
            document.getElementById("pauseAutoplayBtn").textContent = "Pause";
            isPaused = false;

            const scheduleLyrics = (lyrics) => {
              chatMessages = lyrics;
              const currentMs = currentAudio.currentTime * 1000;
              let startIndex = 0;
              for (let j = 0; j < chatMessages.length; j++) {
                if (chatMessages[j].delay > currentMs) {
                  startIndex = j;
                  break;
                }
              }
              scheduleMessages(chatMessages, startIndex);
              console.log(
                `Scheduled lyrics from index ${startIndex} (time: ${currentMs}ms)`,
              );
            };

            if (lyricsCache[selectedSongId]) {
              scheduleLyrics(lyricsCache[selectedSongId]);
            } else {
              fetchLyrics(selectedSongId)
                .then((lyrics) => {
                  scheduleLyrics(lyrics);
                })
                .catch((err) => {
                  console.error("Failed to fetch lyrics for sync:", err);
                  chatMessages = [];
                  showNotification("Sync lyrics unavailable", "system");
                });
            }

            currentAudio.removeEventListener("ended", onSongEnded);
            currentAudio.addEventListener("ended", onSongEnded);

            const actualTime = currentAudio.currentTime;
            if (Math.abs(actualTime - adjustedStart) > 0.5) {
              console.warn(
                `Position discrepancy: actual ${actualTime}s, intended ${adjustedStart}s, correcting...`,
              );
              currentAudio.currentTime = adjustedStart;
            }
          })
          .catch((err) => {
            console.warn("Sync play error:", err);
            spamModeActive = false;
            showNotification("Sync playback failed", "system");
          });
      });
    }

    const syncNameInput = document.getElementById("syncNameInput");
    if (syncNameInput) {
      syncNameInput.value = syncName;
      syncNameInput.addEventListener("input", function (e) {
        let raw = this.value;
        let cleaned = raw.replace(/[^a-zA-Z0-9]/g, "");
        if (cleaned !== raw) {
          this.value = cleaned;
        }
        if (cleaned.length > 0) {
          syncName = cleaned;
          localStorage.setItem("mmm_syncName", syncName);
          if (syncRoom) {
            document.getElementById("syncStatus").textContent =
              `Connected (Leader: ${syncLeader})`;
            updateSyncUI();
          }
        }
      });
    }

    document.getElementById("joinSyncBtn").addEventListener("click", () => {
      const room = document.getElementById("roomCodeInput").value.trim();
      if (!room) {
        alert("Please enter a room code.");
        return;
      }
      if (syncRoom) syncLeave();
      syncJoin(room);
    });

    document.getElementById("leaveSyncBtn").addEventListener("click", () => {
      syncLeave();
    });

    document.getElementById("makeLeaderBtn").addEventListener("click", () => {
      if (!syncRoom || !syncIsLeader) {
        showNotification("You are not the leader", "system");
        return;
      }
      if (syncMembers.length <= 1) {
        showNotification("No other members to make leader", "system");
        return;
      }
      const memberList = syncMembers.filter((m) => m !== syncName).join(", ");
      const target = prompt(
        `Enter the name of the new leader:\nAvailable: ${memberList}`,
      );
      if (!target) return;
      if (!syncMembers.includes(target) || target === syncName) {
        showNotification("Invalid member name", "system");
        return;
      }
      syncMakeLeader(target);
    });

    document.getElementById("autoplayToggle").addEventListener("click", () => {
      document.querySelector(".autoplay-section").classList.toggle("open");
    });

    document.getElementById("syncToggle").addEventListener("click", () => {
      document.querySelector(".syncsongs-section").classList.toggle("open");
    });

    document
      .getElementById("duetModeToggle")
      .addEventListener("change", function () {
        duetMode = this.checked;
        document.getElementById("duetStatus").textContent = duetMode
          ? "ON"
          : "Off";
        if (duetMode && syncRoom && !syncIsLeader) {
          showNotification(
            "Duet mode enabled – you will receive partner lyrics",
            "system",
          );
        }
      });

    document.getElementById("mutechat").addEventListener("change", function () {
      chatMuted = this.checked;
      if (chatMuted) pendMessages("");
    });

    document.getElementById("loopsong").addEventListener("change", function () {
      if (syncRoom && !syncIsLeader) {
        this.checked = syncLoop;
        showNotification("Only the leader can change loop", "system");
        return;
      }
      loopSong = this.checked;
      if (currentAudio) currentAudio.loop = loopSong;
      if (syncRoom && syncIsLeader) {
        syncSetLoop(loopSong);
      }
    });

    let pingpong1 = false,
      interval;
    function pingpong() {
      pendMessages(window.pingTime + "'pingpong");
    }

    function togglepingpong() {
      if (pingpong1) {
        clearInterval(interval);
      } else {
        interval = setInterval(pingpong, 1000);
      }
      pingpong1 = !pingpong1;
    }

    let inputs = [
      "chatBox",
      "chat-input",
      "nameInput",
      "name-input",
      "allianceInput",
      "alliance-input",
      "mChBox",
      "mch-box",
      "songSearch",
      "roomCodeInput",
      "syncNameInput",
    ];

    const keydownHandler = function (e) {
      const menu = document.querySelector(".modmenu");
      const mainMenu =
        document.getElementById("mainMenu") ||
        document.getElementById("main-menu");

      const isGameMenuClosed =
        mainMenu === null || mainMenu.style.display === "none";

      if (!isGameMenuClosed) return;

      // ---- Key: C (Uppercase) - Skip Back ----
      if (e.key === "C" && !inputs.includes(document.activeElement.id)) {
        e.preventDefault();
        e.stopPropagation();
        skipBackSong();
        showNotification("Back", "system");
        return;
      }

      // ---- Key: c (Lowercase) - Skip or Play/Stop ----
      if (
        e.key.toLowerCase() === "c" &&
        !inputs.includes(document.activeElement.id)
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (autoplayMode) {
          skipSong();
          showNotification("Skipped", "system");
        } else {
          toggleChatSpamMode();
        }
        return;
      }

      // ---- Key: p - Toggle Mod Menu ----
      if (
        e.key.toLowerCase() === "p" &&
        !inputs.includes(document.activeElement.id)
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (menu) {
          menu.classList.toggle("fade-out");
        } else {
          console.warn("Mod menu not found – cannot toggle.");
        }
        return;
      }

      // ---- Key: u - Toggle PingPong ----
      if (
        e.key.toLowerCase() === "u" &&
        !inputs.includes(document.activeElement.id)
      ) {
        e.preventDefault();
        e.stopPropagation();
        togglepingpong();
        return;
      }

      // ---- Key: b - Toggle Mute Chat ----
      if (
        e.key.toLowerCase() === "b" &&
        !inputs.includes(document.activeElement.id)
      ) {
        e.preventDefault();
        e.stopPropagation();
        const muteChat = document.getElementById("mutechat");
        if (muteChat) {
          muteChat.checked = !muteChat.checked;
          muteChat.dispatchEvent(new Event("change"));
          showNotification(`Mute ${muteChat.checked ? "ON" : "OFF"}`, "system");
        }
        return;
      }

      // ---- Key: k - Toggle Loop Song ----
      if (
        e.key.toLowerCase() === "k" &&
        !inputs.includes(document.activeElement.id)
      ) {
        e.preventDefault();
        e.stopPropagation();
        const songLoop = document.getElementById("loopsong");
        if (songLoop) {
          songLoop.checked = !songLoop.checked;
          songLoop.dispatchEvent(new Event("change"));
          showNotification(`Loop ${songLoop.checked ? "ON" : "OFF"}`, "system");
        }
        return;
      }

      // ---- Shift+9 - Refresh Songs ----
      if (
        e.shiftKey &&
        e.which === 57 &&
        !inputs.includes(document.activeElement.id)
      ) {
        e.preventDefault();
        if (typeof refreshSongs === "function") {
          refreshSongs()
            .then(() => showNotification("Refreshed", "system"))
            .catch(() => showNotification("Refreshed failed", "system"));
        } else {
          console.warn("refreshSongs function not defined");
        }
        return;
      }

      // ---- Shift+0 - Upload Stats ----
      if (
        e.shiftKey &&
        e.which === 48 &&
        !inputs.includes(document.activeElement.id)
      ) {
        e.preventDefault();
        if (typeof uploadStats === "function") {
          uploadStats()
            .then(() => showNotification("Stats uploaded", "system"))
            .catch(() => showNotification("Stats upload failed", "system"));
        } else {
          console.warn("uploadStats function not defined");
        }
        return;
      }

      // ---- Key: j - Toggle Pause ----
      if (
        e.key.toLowerCase() === "j" &&
        !inputs.includes(document.activeElement.id)
      ) {
        e.preventDefault();
        togglePause();
        showNotification(currentAudio.paused ? "Paused" : "Resumed", "system");
        return;
      }

      // ---- Shift+8 - Hard Reset Lyrics ----
      if (
        e.shiftKey &&
        e.which === 56 &&
        !inputs.includes(document.activeElement.id)
      ) {
        e.preventDefault();
        if (typeof hardResetLyrics === "function") {
          hardResetLyrics();
          showNotification("Lyrics reset", "system");
        } else {
          console.warn("hardResetLyrics function not defined");
        }
        return;
      }
    };

    window._mmmKeydownHandler = keydownHandler;
    window.addEventListener("keydown", keydownHandler, true);

    function stopMusic() {
      if (spamModeActive) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        spamModeActive = false;
        currentAudio.removeEventListener("ended", onSongEnded);
        messageTimeouts.forEach(clearTimeout);
        messageTimeouts = [];
        currentlyPlaying.innerHTML = "Currently Playing: none";
        musicStatus.innerHTML = `Music Status: OFF`;
        document.getElementById("pauseAutoplayBtn").textContent = "Pause";
        isPaused = false;
        schedulingActive = false;
        hideNotification();
      }
    }

    window.stopMusic = function () {
      stopMusic();
    };

    window.addEventListener("beforeunload", () => {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.loop = false;
      messageTimeouts.forEach(clearTimeout);
      messageTimeouts = [];
    });

    let songsHash = "";
    async function refreshSongs() {
      try {
        const newList = await fetchSongs();
        const newHash = JSON.stringify(newList);
        if (newHash === songsHash) return;
        songsList = newList;
        songsHash = newHash;

        if (selectedSongId === undefined || selectedSongId === null) {
          addSong(null);
          console.log(`Songs updated (${songsList.length})`);
          return;
        }

        let exists = songsList.some((s) => s.id === selectedSongId);
        let newSelection = null;
        if (exists) {
          newSelection = songsList.find((s) => s.id === selectedSongId);
        } else {
          const firstReal = songsList.find((s) => s.id !== 999 && s.url);
          if (firstReal) newSelection = firstReal;
        }

        if (newSelection) {
          selectBtn.firstElementChild.innerText = newSelection.name;
          selectedSongId = newSelection.id;
          selectedSongName = newSelection.name;
          selectedSongAudio = newSelection.url;
          addSong(newSelection.name);
        } else {
          addSong(null);
        }

        console.log(`Songs updated (${songsList.length})`);
      } catch (err) {
        console.warn("Refresh failed:", err);
      }
    }

    function waitInit() {
      console.log("MMM mod initializing...");
      (async function init() {
        try {
          await fetchApiKey();
          if (!API_KEY) {
            console.error("No API key available...");
            return;
          }
          await Promise.all([fetchStatsKey(), fetchSongs()]);
          if (songsList.length) {
            addSong(null);
          } else {
            console.warn("No songs loaded from API");
            addSong("No songs");
          }
        } catch (err) {
          console.error("Failed to fetch songs:", err);
          addSong("Error loading songs");
        }
      })();
    }

    if (document.readyState === "complete") {
      setTimeout(waitInit, 2000);
    } else {
      window.addEventListener("load", () => setTimeout(waitInit, 2000));
    }

    async function getSSEToken() {
      if (!API_KEY) throw new Error("API key not loaded yet");

      const res = await fetch(`${API_BASE}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: API_KEY }),
      });
      if (!res.ok) throw new Error("Failed to get token");
      const data = await res.json();
      return data.token;
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) return;
      const now = Date.now();
      for (const entry of activeNotifications) {
        if (now - entry.startTime >= entry.duration) {
          hideNotification(entry);
        }
      }
    });

    const roomInput = document.getElementById("roomCodeInput");
    if (roomInput) {
      roomInput.addEventListener("keydown", function (e) {
        e.stopPropagation();
      });
    }

    const songInput = document.getElementById("songSearch");
    if (songInput) {
      songInput.addEventListener("keydown", function (e) {
        e.stopPropagation();
      });
    }
  })();
}
