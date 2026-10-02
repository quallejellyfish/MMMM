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
    if (typeof window._mmmSyncLeave === "function") {
      try {
        window._mmmSyncLeave();
      } catch (e) { }
    }
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

    const game_ui = document.getElementById("game-ui");
    if (game_ui) {
      const deletion = document.createElement("div");
      deletion.id = "delete-me-pls";

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

      deletion.appendChild(music_icon);
      game_ui.appendChild(deletion);

      music_icon.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelector(".modmenu").classList.toggle("fade-out");
      });
    }

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
            Information: Press "p" to open/close menu! Press "c" to start/stop the music! "b" to mute! "k" to loopsongs! "j" to pause! "shift+nine" to refresh songs! "shift+zero" to upload stats! "shift+seven" prompt to manually add a stats key! hover over text for more information!
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
                <button class="autoplay-btn style" data-category="🇺🇸-----English Songs-----">🇺🇸 English</button>
                <button class="autoplay-btn style" data-category="🇩🇪-----German Songs-----">🇩🇪 German</button>
                <button class="autoplay-btn style" data-category="🇨🇳-----Chinese Songs-----">🇨🇳 Chinese</button>
                <button class="autoplay-btn style" data-category="💥-----Pulary Songs-----">💥 Pulary</button>
                <button class="autoplay-btn style" data-category="🌍-----other language Songs-----">🌍 Other</button>
                <button class="autoplay-btn style" data-category="🦊----- Krimsonthefox Music-----">🦊 Krimson</button>
                <button class="autoplay-btn style" data-category="❓-----Not My Songs-----">❓ Not Mine</button>
                <button class="autoplay-btn" id="randomAutoplayBtn">Random</button>
                <button class="autoplay-btn" id="stopAutoplayBtn">Stop</button>
                <button class="autoplay-btn" id="pauseAutoplayBtn">Pause</button>
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
                  <input type="text" id="syncNameInput" placeholder="a-z, 0-9 only" maxlength="15" style="flex: 1; max-width: 120px; padding: 4px 8px; background: #3a3a4a; border: 1px solid #555; border-radius: 6px; color: #fff; outline: none; font-size: 13px;">
                </div>
               <div style="display:flex; align-items:center; gap:6px; margin: 6px 0; width: 100%;">
                <input type="text" id="roomCodeInput" placeholder="Room Code" class="sync-btn" style="flex: 1; max-width: 130px; padding: 4px 8px; background: #3a3a4a; border: 1px solid #555; border-radius: 6px; color: #fff; outline: none;">
                <button id="browseRoomsBtn" class="sync-btn">Browse</button>
              </div>

              <div id="roomListContainer" style="display: none; max-height: 180px; overflow-y: auto; background: rgba(0,0,0,0.35); border: 1px solid #555; border-radius: 8px; padding: 6px; margin: 6px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 0 4px;">
                  <span style="font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">Active Rooms</span>
                  <span id="refreshRoomsBtn" style="cursor: pointer; color: #ff79c6; font-size: 13px; user-select: none;" title="Refresh"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg></span>
                </div>
                <ul id="roomList" style="list-style: none; margin: 0; padding: 0;"></ul>
                <div id="roomListEmpty" style="display: none; color: #888; font-size: 12px; text-align: center; padding: 8px;">No active rooms right now</div>
              </div>
              <button id="joinSyncBtn" class="sync-btn">Join / Create</button>
              <button id="leaveSyncBtn" class="sync-btn">Leave</button>
              <button id="lockRoomBtn" class="sync-btn">Lock</button>
              <button id="makeLeaderBtn" class="sync-btn">Make Leader</button>
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

    const SYNC_START_DELAY_MS = 2000;

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

    const resource_display_holder = document.querySelector(
      ".resource-display-holder",
    );
    if (resource_display_holder)
      resource_display_holder.prepend(notificationContainer);

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

    let lastSongNotification = null;

    function showSongNotification(songName) {
      if (lastSongNotification) {
        hideNotification(lastSongNotification);
        lastSongNotification = null;
      }
      showNotification(songName, "song");
      lastSongNotification =
        activeNotifications[activeNotifications.length - 1];
    }

    function clearSongNotification() {
      if (lastSongNotification) {
        hideNotification(lastSongNotification);
        lastSongNotification = null;
      }
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

    function getClientId() {
      let id = sessionStorage.getItem("mmm_clientId");
      if (!id) {
        id =
          (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
          "c_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("mmm_clientId", id);
      }
      return id;
    }
    const CLIENT_ID = getClientId();

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
        console.log(`[MMM] Stats key loaded from localStorage: "${STATS_KEY}"`);
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
            console.log(`[MMM] Stats key fetched from server: "${STATS_KEY}"`);
            return true;
          }
        }
      } catch (e) {
        console.error("Failed to fetch stats key:", e);
      }
      console.log(`[MMM] No stats key found, using fallback: "${STATS_KEY}"`);
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

    function setStatsKeyManually() {
      const currentKey =
        STATS_KEY || localStorage.getItem("mmm_statsKey") || "";
      const input = prompt(
        "Enter your stats key:\n" + "Your current key:",
        currentKey,
      );

      if (input === null) {
        showNotification("Stats key change cancelled", "system");
        return;
      }

      const trimmed = input.trim();

      if (!trimmed) {
        localStorage.removeItem("mmm_statsKey");
        STATS_KEY = "fallback";
        console.log("[MMM] Stats key cleared, using fallback");
        showNotification("Stats key cleared (using fallback)", "system");
        return;
      }

      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(trimmed)) {
        showNotification("Invalid key", "system");
        return;
      }

      STATS_KEY = trimmed;
      localStorage.setItem("mmm_statsKey", STATS_KEY);
      console.log(`[MMM] Stats key set to: ${STATS_KEY}`);
      showNotification(`Stats key set: ${STATS_KEY}`, "system");

      // confirmation
      if (Object.keys(playCounts).length > 0) {
        uploadStats()
          .then(() => showNotification("Stats uploaded", "system"))
          .catch((err) =>
            showNotification(`Upload failed: ${err.message}`, "system"),
          );
      } else {
        showNotification("No stats yet — play a song to test", "system");
      }
    }

    let songsList = [];
    let lyricsCache = {};

    // changed it to use fetch instead since
    // tampermonkey was ggez'ing unpatcher's websocket proxy
    async function fetchSongs(force = false) {
      if (!force) {
        const cached = getCached("songs");
        if (cached) {
          songsList = cached;
          console.log(
            `Songs loaded from sessionStorage (${songsList.length} songs)`,
          );
          return songsList;
        }
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

    function highlightCurrentSong() {
      if (!optionsDiv) return;
      optionsDiv
        .querySelectorAll("li")
        .forEach((li) => li.classList.remove("selected"));
      if (selectedSongId !== undefined && selectedSongId !== null) {
        const targetLi = optionsDiv.querySelector(
          `li[data-id="${selectedSongId}"]`,
        );
        if (targetLi) {
          targetLi.classList.add("selected");
        }
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
        li.dataset.id = song.id;
        li.addEventListener("click", () => {
          updateName(li, song.id, song.name, song.url);
        });

        optionsDiv.appendChild(li);
      });
    }

    function updateName(selectedLi, songId, songName, songAudio) {
      if (!songAudio) return;
      if (blockIfFollower("select songs")) return;

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
      const isOpening = !wrapper.classList.contains("active");
      wrapper.classList.toggle("active");
      console.log("open");

      if (
        isOpening &&
        autoplayMode &&
        selectedSongId !== undefined &&
        selectedSongId !== null
      ) {
        setTimeout(() => {
          const li = optionsDiv.querySelector(
            `li[data-id="${selectedSongId}"]`,
          );
          if (li) {
            li.scrollIntoView({ block: "start", behavior: "smooth" });
            console.log(`Scrolled to song ID ${selectedSongId}`);
          } else {
            console.warn(`Song with ID ${selectedSongId} not found in list.`);
          }
        }, 200);
      }
    });

    function normalizeCategoryName(name) {
      return String(name)
        .replace(/[^\w\s\-]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    }

    function getSongsByCategory(categoryName) {
      const songs = [];
      let inCategory = false;
      const targetNorm = normalizeCategoryName(categoryName);

      for (const song of songsList) {
        if (song.id === 999) {
          if (normalizeCategoryName(song.name) === targetNorm) {
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
        }, 20);
      }, 20);
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
        window._mmmAudioCtx = audioCtx;
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
    let onTimeUpdateHandler = null;

    let isPaused = false;
    let syncStartTime = null;

    async function toggleChatSpamMode() {
      if (blockIfFollower("play songs")) return;

      if (spamModeActive) {
        hardStopAudio();
        if (syncRoom && syncIsLeader) syncStop();
        updateSelectButton("Select Song");
        highlightCurrentSong();
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
        highlightCurrentSong();
        showSongNotification(selectedSongName);

        if (onTimeUpdateHandler) {
          currentAudio.removeEventListener("timeupdate", onTimeUpdateHandler);
          onTimeUpdateHandler = null;
        }

        const startAt = syncStartTime !== null ? syncStartTime : 0;
        syncStartTime = null;
        currentAudio.pause();
        currentAudio.src = selectedSongAudio;
        currentAudio.load();
        currentAudio.currentTime = startAt;
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

        let announcedStart = null;
        if (syncRoom && syncIsLeader) {
          announcedStart = Date.now() + SYNC_START_DELAY_MS;
          syncPlay(selectedSongId, 0, announcedStart);

          currentAudio.currentTime = 0;
          const waitMs = announcedStart - Date.now();
          if (waitMs > 0) {
            await new Promise((r) => setTimeout(r, waitMs));
          }
          currentAudio.currentTime = 0;
        }

        try {
          await currentAudio.play();
        } catch (err) {
          if (syncRoom && syncIsLeader && announcedStart !== null) {
            console.warn(
              "[Sync] Leader play() failed — retracting phantom room state:",
              err.name,
              err.message,
            );
            syncStop();
          }
          throw err;
        }

        scheduleMessages(chatMessages, 0);
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
      if (blockIfFollower("play songs")) return;

      selectedSongId = song.id;
      selectedSongName = song.name;
      selectedSongAudio = song.url;
      updateSelectButton(selectedSongName);
      highlightCurrentSong();
      showSongNotification(selectedSongName);

      if (spamModeActive) {
        hardStopAudio();
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

        let announcedStart = null;
        if (syncRoom && syncIsLeader) {
          announcedStart = Date.now() + SYNC_START_DELAY_MS;
          syncPlay(selectedSongId, 0, announcedStart);

          currentAudio.currentTime = 0;
          const waitMs = announcedStart - Date.now();
          if (waitMs > 0) {
            await new Promise((r) => setTimeout(r, waitMs));
          }
          currentAudio.currentTime = 0;
        }

        try {
          await currentAudio.play();
        } catch (err) {
          if (syncRoom && syncIsLeader && announcedStart !== null) {
            console.warn(
              "[Sync] Leader play() failed — retracting phantom room state:",
              err.name,
              err.message,
            );
            syncStop();
          }
          throw err;
        }

        scheduleMessages(chatMessages, 0);
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
        const retryId = song.id;
        setTimeout(() => {
          if (selectedSongId === retryId) playSong(song);
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
      if (blockIfFollower("skip songs")) return false;
      const wasSyncedLeader = syncRoom && syncIsLeader && spamModeActive;
      schedulingActive = false;
      hardStopAudio();
      if (autoplayMode) {
        playNextAuto();
      } else {
        if (wasSyncedLeader) syncStop();
        currentlyPlaying.innerHTML = "Currently Playing: none";
        musicStatus.innerHTML = `Music Status: OFF`;
        updateAutoplayStatus();
      }
      return true;
    }

    function skipBackSong() {
      if (blockIfFollower("skip songs")) return false;

      if (!autoplayMode) {
        console.log("Not in autoplay mode. Press C to start manual play.");
        return false;
      }
      if (songHistoryIndex <= 0) {
        console.log("Already at the first song in history");
        return false;
      }

      songHistoryIndex--;
      const prevSong = songHistory[songHistoryIndex];
      if (!prevSong) return false;

      if (autoplayMode === "category") {
        const idx = autoPlaySongs.findIndex((s) => s.id === prevSong.id);
        if (idx !== -1) {
          autoplayIndex = idx;
          console.log(`Adjusted autoplayIndex to ${autoplayIndex}`);
        }
      }
      hardStopAudio();
      isGoingBack = true;

      playSong(prevSong);
      return true;
    }

    function onSongEnded() {
      if (loopSong && !autoplayMode) {
        const now = Date.now();

        if (syncRoom && syncIsLeader && selectedSongId !== null) {
          syncPlay(selectedSongId, 0, now);
        }
        syncRoomStartTime = 0;
        syncRoomPlayTimestamp = now;
        currentAudio.currentTime = 0;
        currentAudio
          .play()
          .then(() => scheduleMessages(chatMessages))
          .catch((err) => console.warn("Loop restart failed:", err));
        return;
      }

      if (syncRoom && syncIsLeader) {
        syncStop();
      }

      setTimeout(() => {
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
      if (blockIfFollower("start autoplay")) return;

      hardStopAudio();

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

      if (blockIfFollower("start autoplay")) return;

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

      hardStopAudio();

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

    function stopAutoplay(opts = {}) {
      const wasSyncedLeader = syncRoom && syncIsLeader && spamModeActive;

      schedulingActive = false;
      autoplayMode = null;
      autoplayCategory = null;
      autoPlaySongs = [];
      autoplayIndex = 0;
      clearSongNotification();
      songHistory = [];
      songHistoryIndex = -1;
      isGoingBack = false;
      randomPool = [];
      randomCategoryName = null;
      document.getElementById("pauseAutoplayBtn").textContent = "Pause";
      isPaused = false;

      hardStopAudio();

      if (wasSyncedLeader && opts.sync !== false) {
        syncStop();
      }

      updateAutoplayStatus();
      showNotification("Autoplay stopped", "system");
      updateSelectButton("Select Song");
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
      if (!pauseBtn) return false;

      if (!currentAudio) return false;

      if (!spamModeActive && !autoplayMode) {
        showNotification("No song is playing", "system");
        return false;
      }

      if (blockIfFollower("pause")) return false;

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
      return true;
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
    let assignedName = null;
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
    let preferredLoop = localStorage.getItem("mmm_preferredLoop") === "true";
    let syncCurrentTime = 0;
    let duetMode = false;
    let syncLocked = false;
    let syncRoomStartTime = 0;
    let syncRoomPlayTimestamp = 0;

    const syncStatus = document.getElementById("syncStatus");

    function myRoomName() {
      return assignedName || syncName;
    }

    function isSyncFollower() {
      if (syncIsLeader) return false;
      if (window._mmmRejoining) return true;
      return !!syncRoom;
    }

    function blockIfFollower(action) {
      if (isSyncFollower()) {
        showNotification(`Only the leader can ${action}`, "system");
        return true;
      }
      return false;
    }

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
          let startIndex = lyrics.length;
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
          showNotification("Lyrics reset failed - fetch error", "system");
        });
    }

    function startHeartbeat(roomCode) {
      if (syncHeartbeatInterval) clearInterval(syncHeartbeatInterval);
      syncHeartbeatInterval = setInterval(async () => {
        if (!syncRoom) {
          clearInterval(syncHeartbeatInterval);
          syncHeartbeatInterval = null;
          return;
        }
        if (window._mmmRejoining) return;
        try {
          const res = await fetch(`${API_BASE}/sync/heartbeat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomCode: syncRoom,
              name: myRoomName(),
              clientId: CLIENT_ID,
            }),
          });
          if (res.status === 404) {
            if (isRejoining || isLeaving || window._mmmReconnectTimer) {
              console.log("[Sync] Ignoring heartbeat 404 — rejoin already pending");
              return;
            }
            console.warn("[MMM] Room vanished, rejoining...");
            const currentRoom = syncRoom;
            const leader = syncLeader;
            if (syncEventSource) {
              syncEventSource.close();
              syncEventSource = null;
            }
            if (syncHeartbeatInterval) {
              clearInterval(syncHeartbeatInterval);
              syncHeartbeatInterval = null;
            }
            showNotification("Room expired — rejoining...", "system");
            syncJoin(currentRoom, leader);
          } else if (res.status === 403) {
            console.warn(
              "[MMM] Heartbeat rejected (403) — you may have been pruned from a locked room",
            );
          } else if (res.status === 400) {
            console.warn(
              "[MMM] Heartbeat malformed (400) — check request body",
            );
          }
        } catch (err) {
          console.warn("Heartbeat failed:", err);
        }
      }, 7000);
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
        console.warn("SSE error, attempting to rejoin...", err);
        if (isRejoining || isLeaving) return;

        if (syncEventSource) {
          syncEventSource.close();
          syncEventSource = null;
        }

        if (window._mmmReconnectTimer) clearTimeout(window._mmmReconnectTimer);
        window._mmmReconnectTimer = setTimeout(() => {
          window._mmmReconnectTimer = null;
          if (syncRoom && !isRejoining) {
            const room = syncRoom;
            const leader = syncLeader;
            syncJoin(room, leader || null);
          }
        }, 1500);
      };
    }

    function handleSyncMessage(msg) {
      if (msg.type !== "room_state") return;
      let needUIUpdate = false;

      if (msg.leader !== syncLeader) {
        if (msg.leader === null && syncLeader !== null) {
          console.log(
            "[Sync] Received null leader — keeping last known:",
            syncLeader,
          );
        } else {
          const wasLeader = syncIsLeader;
          syncLeader = msg.leader;
          syncIsLeader = syncLeader === myRoomName();
          if (wasLeader && !syncIsLeader && autoplayMode) {
            console.log("[Sync] Lost leadership — stopping local autoplay");
            stopAutoplay({ sync: false });
          }
          showNotification(`Leader changed to "${syncLeader}"`, "system");
          syncStatus.textContent = `Connected (Leader: ${syncLeader})`;
          needUIUpdate = true;
        }
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
          const intentionalStop = msg.paused === true;
          if (intentionalStop && spamModeActive) {
            hardStopAudio();
          } else if (!intentionalStop) {
            console.log(
              "[Sync] Room reset (paused=false) — keeping local playback",
            );
            republishIfLeaderPlaying();
          }
          syncPaused = msg.paused || false;
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
              clearSongNotification();
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

      if (
        msg.currentSong !== undefined &&
        msg.currentSong !== null &&
        msg.currentSong === syncCurrentSongId &&
        !syncIsLeader &&
        !msg.paused &&
        msg.timestamp !== undefined &&
        msg.timestamp > syncRoomPlayTimestamp + 500
      ) {
        console.log(`[Sync] Re-anchor to ${msg.currentTime}s @ ${msg.timestamp}`);
        syncRoomPlayTimestamp = msg.timestamp;
        syncRoomStartTime = msg.currentTime || 0;
        syncCurrentTime = msg.currentTime || 0;

        if (spamModeActive && currentAudio) {
          const elapsed = (Date.now() - msg.timestamp) / 1000;
          let target = (msg.currentTime || 0) + elapsed;
          const dur = currentAudio.duration || 0;
          if (dur > 0) {
            while (target >= dur) target -= dur;
          }
          if (Math.abs(currentAudio.currentTime - target) > 0.25) {
            currentAudio.currentTime = Math.max(0, target);
          }
          if (currentAudio.paused) {
            currentAudio
              .play()
              .catch((err) => console.warn("Re-anchor play failed:", err));
            isPaused = false;
            document.getElementById("pauseAutoplayBtn").textContent = "Pause";
            musicStatus.innerHTML = "Music Status: ON (Sync)";
          }
          if (chatMessages.length > 0) {
            const currentMs = currentAudio.currentTime * 1000;
            let startIndex = chatMessages.length;
            for (let j = 0; j < chatMessages.length; j++) {
              if (chatMessages[j].delay > currentMs) {
                startIndex = j;
                break;
              }
            }
            scheduleMessages(chatMessages, startIndex);
          }
        }
        needUIUpdate = true;
      }

      if (msg.loop !== undefined && msg.loop !== syncLoop) {
        syncLoop = msg.loop;
        const loopCheckbox = document.getElementById("loopsong");
        if (loopCheckbox) {
          loopCheckbox.checked = syncLoop;
          loopSong = syncLoop;
        }
        needUIUpdate = true;
      }

      if (msg.locked !== undefined && msg.locked !== syncLocked) {
        syncLocked = msg.locked;
        updateLockButton();
        showNotification(
          syncLocked ? "Room locked by leader" : "Room unlocked",
          "system",
        );
      }

      if (needUIUpdate) updateSyncUI();
    }

    let joinGeneration = 0;
    async function syncJoin(roomCode, originalLeader = null, attempt = 0) {
      const myGen = ++joinGeneration;
      songHistory = [];
      songHistoryIndex = -1;
      isGoingBack = false;

      if (window._mmmReconnectTimer) {
        clearTimeout(window._mmmReconnectTimer);
        window._mmmReconnectTimer = null;
      }

      const wasAlreadyInRoom = !!syncRoom;
      if (!wasAlreadyInRoom) {
        stopMusic();
        syncIsLeader = false;
        syncLeader = null;
      }

      if (isRejoining) return;
      isRejoining = true;
      isLeaving = false;
      window._mmmRejoining = true;

      const wasLeaderBefore = syncIsLeader;
      let effectiveLeader = originalLeader;
      if (!effectiveLeader && wasLeaderBefore) effectiveLeader = myRoomName();

      try {
        const requestedName = myRoomName();
        const body = { roomCode, name: requestedName, clientId: CLIENT_ID };
        if (effectiveLeader) body.originalLeader = effectiveLeader;
        if (window._mmmRejoining || wasAlreadyInRoom) body.isRejoin = true;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let res;
        try {
          res = await fetch(`${API_BASE}/sync/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          showNotification(errData.error || "Failed to join room", "system");
          return;
        }
        const data = await res.json();
        assignedName = data.assignedName || requestedName;

        if (assignedName !== requestedName) {
          showNotification(`Name taken — you are "${assignedName}"`, "system");
        }
        if (syncNameInput) syncNameInput.value = assignedName;

        syncRoom = roomCode;
        syncLeader = data.leader;
        syncMembers = data.members || [];
        syncCurrentSongId = data.currentSong || null;
        syncCurrentTime = data.currentTime || 0;
        syncPaused = data.paused || false;
        syncIsLeader = syncLeader === myRoomName();
        if (!syncLeader) {
          syncLeader = assignedName || syncName;
          syncIsLeader = true;
        }
        syncLoop = data.loop || false;
        if (data.isNewRoom && syncIsLeader && preferredLoop) {
          syncLoop = true;
          syncSetLoop(true);
        }
        syncLocked = data.locked || false;
        updateLockButton();
        const loopCheckbox = document.getElementById("loopsong");
        if (loopCheckbox) {
          loopCheckbox.checked = syncLoop;
          loopSong = syncLoop;
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
        syncStatus.textContent = `Connected (Leader: ${syncLeader})`;

        if (syncCurrentSongId !== null && !syncPaused && !syncIsLeader) {
          const alreadyPlaying =
            spamModeActive &&
            selectedSongId === syncCurrentSongId &&
            currentAudio &&
            !currentAudio.paused;

          if (alreadyPlaying) {
            const timestamp = data.timestamp || Date.now();
            const expected = syncCurrentTime + (Date.now() - timestamp) / 1000;
            const actual = currentAudio.currentTime;
            const drift = actual - expected;
            console.log(
              `[Sync] Rejoin — same song already playing. Drift ${(drift * 1000).toFixed(0)}ms`,
            );
            if (Math.abs(drift) > 1.0) {
              currentAudio.currentTime = expected;
              console.log(`[Sync] Rejoin drift corrected to ${expected.toFixed(2)}s`);
            }
            if (chatMessages.length === 0 && selectedSongId) {
              fetchLyrics(selectedSongId).then((lyrics) => {
                chatMessages = lyrics;
                const currentMs = currentAudio.currentTime * 1000;
                let startIndex = lyrics.length;
                for (let j = 0; j < lyrics.length; j++) {
                  if (lyrics[j].delay > currentMs) {
                    startIndex = j;
                    break;
                  }
                }
                scheduleMessages(chatMessages, startIndex);
              }).catch(() => { });
            }
          } else {
            const timestamp = data.timestamp || Date.now();
            playSyncSong(syncCurrentSongId, syncCurrentTime, timestamp);
          }
        }
        republishIfLeaderPlaying();
      } catch (err) {
        if (err.name === "AbortError") {
          console.warn(`[Sync] Join timed out (attempt ${attempt + 1})`);
          if (attempt >= 2) {
            showNotification(
              "Server did not respond. Try again later.",
              "system",
            );
          } else {
            showNotification("Server waking up — retrying...", "system");
            window._mmmReconnectTimer = setTimeout(() => {
              window._mmmReconnectTimer = null;
              if (myGen !== joinGeneration) return;
              if (!effectiveLeader && syncIsLeader)
                effectiveLeader = myRoomName();
              syncJoin(roomCode, effectiveLeader || null, attempt + 1);
            }, 3000);
          }
        } else {
          console.error("Sync join error:", err);
          showNotification("Failed to join sync room", "system");
        }
      } finally {
        isRejoining = false;
        isLeaving = false;
        window._mmmRejoining = false;
      }
    }

    function republishIfLeaderPlaying() {
      if (!syncRoom || !syncIsLeader) return;
      if (!spamModeActive) return;
      if (selectedSongId === null || selectedSongId === undefined) return;
      if (!currentAudio || currentAudio.paused) return;
      if (syncCurrentSongId === selectedSongId) return;

      const now = Date.now();
      const curTime = currentAudio.currentTime || 0;
      console.log(
        `[Sync] Republishing leader state: song=${selectedSongId} time=${curTime.toFixed(2)}s`,
      );
      syncPlay(selectedSongId, curTime, now);
    }

    async function syncLeave() {
      if (isLeaving) return;
      isLeaving = true;
      resetLyricsState();
      isRejoining = false;

      if (syncRoom) {
        try {
          await fetch(`${API_BASE}/sync/leave`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomCode: syncRoom, name: myRoomName() }),
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
      loopSong = preferredLoop;
      syncLocked = false;
      syncStartTime = null;
      assignedName = null;

      hardStopAudio();

      const loopCheckbox = document.getElementById("loopsong");
      if (loopCheckbox) loopCheckbox.checked = preferredLoop;
      if (syncNameInput) syncNameInput.value = syncName;

      updateSyncUI();
      updateLockButton();
      if (syncStatus) syncStatus.textContent = "Off";

      setTimeout(() => {
        isLeaving = false;
      }, 1000);
    }
    window._mmmSyncLeave = syncLeave;

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
            name: myRoomName(),
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
            name: myRoomName(),
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
          body: JSON.stringify({
            roomCode: syncRoom,
            name: myRoomName(),
            loop,
          }),
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
          body: JSON.stringify({ roomCode: syncRoom, name: myRoomName() }),
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
            name: myRoomName(),
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

    function updateLockButton() {
      const btn = document.getElementById("lockRoomBtn");
      if (!btn) return;
      btn.textContent = syncLocked ? "Unlock" : "Lock";
      btn.style.background = syncLocked ? "#c0392b" : "#e67e22";
    }

    async function syncLockRoom(locked) {
      if (!syncRoom || !syncIsLeader) return;

      try {
        const res = await fetch(`${API_BASE}/sync/lock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode: syncRoom,
            name: myRoomName(),
            locked,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showNotification(err.error || "Failed to lock room", "system");
          return;
        }
        const data = await res.json();
        syncLocked = data.locked;
        updateLockButton();
        showNotification(
          syncLocked ? "Room locked" : "Room unlocked",
          "system",
        );
      } catch (err) {
        console.error("Sync lock error", err);
        showNotification("Failed to lock room", "system");
      }
    }

    function setBtnState(btn, enabled, reason) {
      if (!btn) return;
      btn.style.opacity = enabled ? "1" : "0.4";
      btn.style.cursor = enabled ? "pointer" : "not-allowed";
      btn.style.filter = enabled ? "none" : "grayscale(0.6)";
      btn.title = enabled ? "" : reason || "";
      btn.dataset.enabled = enabled ? "true" : "false";
    }

    function updateSyncButtons() {
      const joinBtn = document.getElementById("joinSyncBtn");
      const leaveBtn = document.getElementById("leaveSyncBtn");
      const lockBtn = document.getElementById("lockRoomBtn");
      const leaderBtn = document.getElementById("makeLeaderBtn");
      const browseBtn = document.getElementById("browseRoomsBtn");
      const roomInput = document.getElementById("roomCodeInput");
      const nameInput = document.getElementById("syncNameInput");

      const inRoom = !!syncRoom;
      const isLeader = syncIsLeader;
      const hasOthers = syncMembers.length > 1;

      setBtnState(joinBtn, !inRoom, "You're already in a room — leave first");
      setBtnState(leaveBtn, inRoom, "You're not in a room");
      setBtnState(
        lockBtn,
        inRoom && isLeader,
        !inRoom ? "Join a room first" : "Only the leader can lock the room",
      );
      setBtnState(
        leaderBtn,
        inRoom && isLeader && hasOthers,
        !inRoom
          ? "Join a room first"
          : !isLeader
            ? "Only the leader can change the leader"
            : "No other members to promote",
      );
      setBtnState(browseBtn, true, "");

      if (roomInput) {
        roomInput.disabled = inRoom;
        roomInput.style.opacity = inRoom ? "0.5" : "1";
        roomInput.style.cursor = inRoom ? "not-allowed" : "text";
      }
      if (nameInput) {
        nameInput.disabled = inRoom;
        nameInput.style.opacity = inRoom ? "0.5" : "1";
        nameInput.style.cursor = inRoom ? "not-allowed" : "text";
      }
    }

    function updateSyncUI() {
      const membersEl = document.getElementById("syncMembers");
      if (membersEl) {
        const count = syncMembers.length;
        if (count === 0) {
          membersEl.textContent = "Members: none";
        } else {
          const list = syncMembers
            .map((m) => `${m}${m === syncLeader ? " 👑" : ""}`)
            .join(", ");
          membersEl.textContent = `Members (${count}): ${list}`;
        }
      }
      updateLockButton();
      updateSyncButtons();
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
      updateSelectButton(selectedSongName);
      highlightCurrentSong();

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
        const nowMs = Date.now();
        const isScheduledFuture = serverTimestamp > nowMs;

        let delayMs = 0;
        if (isScheduledFuture) {
          delayMs = serverTimestamp - nowMs;
          adjustedStart = Math.max(0, startTime);
          console.log(
            `[Sync] Scheduled start in ${delayMs}ms at position ${adjustedStart}s`,
          );
        } else {
          const elapsed = (nowMs - serverTimestamp) / 1000;
          adjustedStart = Math.max(0, startTime + elapsed);
          console.log(
            `[Sync] Late join: elapsed ${elapsed.toFixed(2)}s → start ${adjustedStart.toFixed(2)}s`,
          );
        }
        const dur = currentAudio.duration || 0;
        if (dur > 0 && adjustedStart >= dur) {
          if (loopSong) {
            adjustedStart = adjustedStart % dur;
            console.log(
              `[Sync] Looping — wrapped position to ${adjustedStart.toFixed(2)}s (dur ${dur.toFixed(2)}s)`,
            );
          } else {
            console.log(
              `[Sync] Song already ended (${adjustedStart.toFixed(2)}s >= ${dur.toFixed(2)}s) — skipping playback`,
            );
            spamModeActive = false;
            currentlyPlaying.innerHTML = "Currently Playing: none";
            musicStatus.innerHTML = `Music Status: OFF (song ended)`;
            const pauseBtn = document.getElementById("pauseAutoplayBtn");
            if (pauseBtn) pauseBtn.textContent = "Pause";
            isPaused = false;
            return;
          }
        }

        showSongNotification(selectedSongName);
        const doPlay = () => {
          const currentPos = currentAudio.currentTime || 0;
          const needsSeek = Math.abs(currentPos - adjustedStart) > 0.5;

          const startPlayback = () => {
            if (syncCurrentSongId !== songId) {
              console.log(
                `[Sync] Song changed during seek, aborting playback (wanted ${songId}, room is on ${syncCurrentSongId})`,
              );
              return;
            }

            currentAudio.loop = false;
            syncStartTime = adjustedStart;
            syncCurrentTime = adjustedStart;
            syncRoomStartTime = startTime;
            syncRoomPlayTimestamp = serverTimestamp;

            initAudioContext();

            currentAudio
              .play()
              .then(() => {
                spamModeActive = true;
                currentlyPlaying.innerHTML = `Currently Playing: ${selectedSongName}`;
                musicStatus.innerHTML = `Music Status: ON (Sync)`;
                document.getElementById("pauseAutoplayBtn").textContent =
                  "Pause";
                isPaused = false;

                const scheduleLyrics = (lyrics) => {
                  chatMessages = lyrics;
                  const intendedMs = adjustedStart * 1000;
                  let startIndex = chatMessages.length;
                  for (let j = 0; j < chatMessages.length; j++) {
                    if (chatMessages[j].delay > intendedMs) {
                      startIndex = j;
                      break;
                    }
                  }
                  console.log(
                    `[Sync] Scheduling lyrics from index ${startIndex}/${chatMessages.length} at ${intendedMs}ms`,
                  );
                  scheduleMessages(chatMessages, startIndex);
                };

                if (lyricsCache[selectedSongId]) {
                  console.log(
                    `[Sync] Using cached lyrics for ${selectedSongId}`,
                  );
                  scheduleLyrics(lyricsCache[selectedSongId]);
                } else {
                  console.log(`[Sync] Fetching lyrics for ${selectedSongId}`);
                  fetchLyrics(selectedSongId)
                    .then((lyrics) => {
                      console.log(
                        `[Sync] Got ${lyrics.length} lyrics lines for ${selectedSongId}`,
                      );
                      scheduleLyrics(lyrics);
                    })
                    .catch((err) => {
                      console.error("[Sync] Failed to fetch lyrics:", err);
                      chatMessages = [];
                      showNotification("Sync lyrics unavailable", "system");
                    });
                }

                currentAudio.removeEventListener("ended", onSongEnded);
                currentAudio.addEventListener("ended", onSongEnded);

                const isLateJoin = serverTimestamp <= now;
                if (isLateJoin) {
                  const correctDrift = () => {
                    if (syncCurrentSongId !== songId) return;
                    if (!currentAudio) return;
                    if (currentAudio.paused) {
                      setTimeout(correctDrift, 500);
                      return;
                    }
                    let expected =
                      syncRoomStartTime + (Date.now() - syncRoomPlayTimestamp) / 1000;
                    const d = currentAudio.duration || 0;
                    if (d > 0 && expected >= d) {
                      if (loopSong) {
                        expected = expected % d;
                      } else {
                        return;
                      }
                    }
                    const actual = currentAudio.currentTime;
                    const drift = actual - expected;
                    if (Math.abs(drift) > 0.15) {
                      console.log(
                        `[Sync] Drift ${(drift * 1000).toFixed(0)}ms — correcting`,
                      );
                      currentAudio.currentTime = expected;
                    }
                    setTimeout(correctDrift, 500);
                  };
                  correctDrift();
                }
              })
              .catch((err) => {
                console.warn("Sync play error:", err);
                spamModeActive = false;
                showNotification("Sync playback failed", "system");
              });
          };

          if (!needsSeek) {
            startPlayback();
            return;
          }

          let seekHandled = false;
          const onSeeked = () => {
            if (seekHandled) return;
            seekHandled = true;
            currentAudio.removeEventListener("seeked", onSeeked);

            const landed = currentAudio.currentTime || 0;
            if (Math.abs(landed - adjustedStart) > 2) {
              console.log(
                `[Sync] Seek landed at ${landed.toFixed(2)}s instead of ${adjustedStart.toFixed(2)}s — retrying`,
              );
              currentAudio.currentTime = adjustedStart;
              setTimeout(() => {
                if (syncCurrentSongId !== songId) return;
                startPlayback();
              }, 500);
            } else {
              startPlayback();
            }
          };
          currentAudio.addEventListener("seeked", onSeeked);
          currentAudio.currentTime = adjustedStart;

          setTimeout(() => {
            if (seekHandled) return;
            seekHandled = true;
            currentAudio.removeEventListener("seeked", onSeeked);
            console.log("[Sync] Seek timed out — starting playback anyway");
            startPlayback();
          }, 3000);
        };

        if (delayMs > 0) {
          setTimeout(doPlay, delayMs);
        } else {
          doPlay();
        }
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
          syncName =
            cleaned || "fallback usr" + Math.floor(Math.random() * 9999);
          localStorage.setItem("mmm_syncName", syncName);
          if (syncRoom) {
            syncStatus.textContent = `Connected (Leader: ${syncLeader})`;
            updateSyncUI();
          }
        }
      });
    }

    document
      .getElementById("joinSyncBtn")
      .addEventListener("click", async () => {
        if (syncRoom) {
          showNotification("Leave your current room first", "system");
          return;
        }
        const room = document.getElementById("roomCodeInput").value.trim();
        if (!room) {
          alert("Please enter a room code.");
          return;
        }
        syncJoin(room);
      });

    document.getElementById("leaveSyncBtn").addEventListener("click", () => {
      const likelyInRoom =
        syncRoom || assignedName || syncMembers.length > 0 || syncEventSource;
      if (!likelyInRoom) {
        showNotification("You're not in a room", "system");
        return;
      }
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
      const memberList = syncMembers
        .filter((m) => m !== myRoomName())
        .join(", ");
      const target = prompt(
        `Enter the name of the new leader:\nAvailable: ${memberList}`,
      );
      if (!target) return;
      if (!syncMembers.includes(target) || target === myRoomName()) {
        showNotification("Invalid member name", "system");
        return;
      }
      syncMakeLeader(target);
    });

    document.getElementById("lockRoomBtn").addEventListener("click", () => {
      if (!syncRoom) {
        showNotification("Join a room first", "system");
        return;
      }
      if (!syncIsLeader) {
        showNotification("Only the leader can lock the room", "system");
        return;
      }
      syncLockRoom(!syncLocked);
    });

    document.getElementById("syncToggle").addEventListener("click", () => {
      document.querySelector(".syncsongs-section").classList.toggle("open");
    });

    const browseRoomsBtn = document.getElementById("browseRoomsBtn");
    const roomListContainer = document.getElementById("roomListContainer");
    const roomListEl = document.getElementById("roomList");
    const roomListEmpty = document.getElementById("roomListEmpty");
    const refreshRoomsBtn = document.getElementById("refreshRoomsBtn");

    updateSyncUI();

    async function loadRoomList() {
      roomListEl.innerHTML =
        '<li style="color:#888; font-size:12px; text-align:center; padding:8px;">Loading…</li>';
      roomListEmpty.style.display = "none";
      try {
        const res = await fetch(`${API_BASE}/sync/rooms`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rooms = await res.json();

        roomListEl.innerHTML = "";
        if (!rooms.length) {
          roomListEmpty.style.display = "block";
          return;
        }

        rooms.forEach((room) => {
          const isCurrent = room.roomCode === syncRoom;
          const li = document.createElement("li");
          li.style.cssText =
            "display: flex; justify-content: space-between; align-items: center; " +
            "padding: 6px 10px; border-radius: 6px; cursor: pointer; " +
            "transition: background 0.15s; font-size: 13px; " +
            (isCurrent ? "background: rgba(46,204,113,0.15);" : "");

          const name = document.createElement("span");
          name.textContent =
            (room.locked ? "🔒 " : "") +
            room.roomCode +
            (isCurrent ? " (current)" : "");
          name.style.cssText = "color: #fff; font-weight: bold;";

          const meta = document.createElement("span");
          meta.textContent =
            `${room.members} member${room.members === 1 ? "" : "s"}` +
            (room.hasSong ? (room.paused ? " · paused" : " · playing") : "");
          meta.style.cssText = "color: #aaa; font-size: 11px;";

          li.appendChild(name);
          li.appendChild(meta);

          if (!isCurrent) {
            li.addEventListener("mouseenter", () => {
              li.style.background = "rgba(255,121,198,0.18)";
            });
            li.addEventListener("mouseleave", () => {
              li.style.background = "transparent";
            });
          }

          li.addEventListener("click", async () => {
            if (isCurrent) {
              showNotification("Already in this room", "system");
              return;
            }
            document.getElementById("roomCodeInput").value = room.roomCode;
            roomListContainer.style.display = "none";
            if (syncRoom) await syncLeave();
            syncJoin(room.roomCode);
          });

          roomListEl.appendChild(li);
        });
      } catch (err) {
        roomListEl.innerHTML = "";
        roomListEmpty.textContent = `Failed to load: ${err.message}`;
        roomListEmpty.style.display = "block";
      }
    }

    browseRoomsBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const isHidden = roomListContainer.style.display === "none";
      if (isHidden) {
        roomListContainer.style.display = "block";
        await loadRoomList();
      } else {
        roomListContainer.style.display = "none";
      }
    });

    refreshRoomsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      loadRoomList();
    });

    document.getElementById("autoplayToggle").addEventListener("click", () => {
      document.querySelector(".autoplay-section").classList.toggle("open");
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
      if (isSyncFollower()) {
        this.checked = syncLoop;
        showNotification("Only the leader can change loop", "system");
        return;
      }
      loopSong = this.checked;
      preferredLoop = this.checked;
      localStorage.setItem("mmm_preferredLoop", preferredLoop);
      if (syncRoom && syncIsLeader) {
        syncSetLoop(loopSong);
      }
    });

    let pingpong1 = false,
      interval;

    function getPingFromDisplay() {
      const el = document.getElementById("ping-display");
      if (!el) return "0";
      const text = el.textContent || "";
      const match = text.match(/(\d+)\s*ms/);
      return match ? match[1] : "0";
    }

    function pingpong() {
      const ping = getPingFromDisplay();
      pendMessages(ping + "'pingpong");
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
      "username-input",
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
        if (skipBackSong() !== false) showNotification("Back", "system");
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
          if (skipSong() !== false) showNotification("Skipped", "system");
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
        if (isSyncFollower()) {
          showNotification("Only the leader can change loop", "system");
          return;
        }
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
        if (togglePause() !== false) {
          showNotification(
            currentAudio.paused ? "Paused" : "Resumed",
            "system",
          );
        }
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

      // ---- Shift+7 - Set Stats Key Manually ----
      if (
        e.shiftKey &&
        e.which === 55 &&
        !inputs.includes(document.activeElement.id)
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof setStatsKeyManually === "function") {
          setStatsKeyManually();
        } else {
          console.warn("setStatsKeyManually not defined");
        }
        return;
      }
    };

    window._mmmKeydownHandler = keydownHandler;
    window.addEventListener("keydown", keydownHandler, true);

    function hardStopAudio() {
      // Audio element
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.loop = false;
        currentAudio.playbackRate = 1;
        currentAudio.removeEventListener("ended", onSongEnded);
        if (onTimeUpdateHandler) {
          currentAudio.removeEventListener("timeupdate", onTimeUpdateHandler);
          onTimeUpdateHandler = null;
        }
        if (currentAudio.src) {
          currentAudio.src = "";
          currentAudio.load();
        }
      } catch (e) { }

      // Lyrics scheduling + timers
      resetLyricsState(); // clears _lyricsInterval, schedulingActive, chatMessages, syncStartTime
      messageTimeouts.forEach(clearTimeout);
      messageTimeouts = [];

      // Playback flags
      spamModeActive = false;
      countedThisPlay = false;
      isPaused = false;
      syncRoomStartTime = 0;
      syncRoomPlayTimestamp = 0;

      // UI
      currentlyPlaying.innerHTML = "Currently Playing: none";
      musicStatus.innerHTML = `Music Status: OFF`;
      const pauseBtn = document.getElementById("pauseAutoplayBtn");
      if (pauseBtn) pauseBtn.textContent = "Pause";
      clearSongNotification();
    }

    function stopMusic() {
      hardStopAudio();
    }

    window.stopMusic = function () {
      stopMusic();
    };

    window.addEventListener("beforeunload", () => {
      let beaconSent = false;
      if (syncRoom && typeof navigator.sendBeacon === "function") {
        try {
          const body = JSON.stringify({
            roomCode: syncRoom,
            name: myRoomName(),
          });
          beaconSent = navigator.sendBeacon(
            `${API_BASE}/sync/leave`,
            new Blob([body], { type: "application/json" }),
          );
        } catch (e) { }
      }
      if (!beaconSent && typeof syncLeave === "function") {
        syncLeave();
      }
    });

    let songsHash = "";
    async function refreshSongs() {
      try {
        const newList = await fetchSongs(true);
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

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      if (document.hidden) return;
      if (!syncRoom) return;

      if (
        !syncIsLeader &&
        spamModeActive &&
        currentAudio &&
        syncRoomPlayTimestamp > 0
      ) {
        const expected =
          syncRoomStartTime + (Date.now() - syncRoomPlayTimestamp) / 1000;
        const actual = currentAudio.currentTime;
        const drift = actual - expected;

        console.log(
          `[Sync] Tab visible — paused=${currentAudio.paused}, ` +
          `drift ${(drift * 1000).toFixed(0)}ms ` +
          `(expected ${expected.toFixed(2)}s, actual ${actual.toFixed(2)}s)`
        );

        if (currentAudio.paused) {
          const resumeAt = Math.max(0, expected);
          currentAudio.currentTime = resumeAt;
          currentAudio
            .play()
            .then(() => {
              isPaused = false;
              const pauseBtn = document.getElementById("pauseAutoplayBtn");
              if (pauseBtn) pauseBtn.textContent = "Pause";
              musicStatus.innerHTML = `Music Status: ON (Sync)`;
              console.log(`[Sync] Resumed from ${resumeAt.toFixed(2)}s`);

              if (chatMessages.length > 0) {
                const currentMs = currentAudio.currentTime * 1000;
                let startIndex = chatMessages.length;
                for (let j = 0; j < chatMessages.length; j++) {
                  if (chatMessages[j].delay > currentMs) {
                    startIndex = j;
                    break;
                  }
                }
                scheduleMessages(chatMessages, startIndex);
              }
            })
            .catch((err) => console.warn("Resume on visible failed:", err));
        } else if (Math.abs(drift) > 0.3) {
          currentAudio.currentTime = Math.max(0, expected);
          console.log(`[Sync] Drift corrected to ${expected.toFixed(2)}s`);
        }
      }

      const now = Date.now();
      for (const entry of activeNotifications) {
        if (now - entry.startTime >= entry.duration) {
          hideNotification(entry);
        }
      }

      fetch(`${API_BASE}/sync/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: syncRoom,
          name: myRoomName(),
          clientId: CLIENT_ID,
        }),
      }).catch(() => { });
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

    if (syncNameInput) {
      syncNameInput.addEventListener("keydown", function (e) {
        e.stopPropagation();
      });
    }
  })();
}
