# Ctent — All in One (BDIX, FTP, Anime & Global Streaming Hub)

**Ctent** (`com.ctent.allinone`) is a cosmic-dark, server-first Android media organizer and streaming app built with React Native / Expo. It combines **1,470+ BDIX & FTP servers**, native **CircleFTP** & **CyberFTP** APIs, **Direct Anime Scrapers & 19 Wotaku Portals**, **SouthFreak**, **AmaderFTP**, **46 Nuvio repositories**, and **Stremio addons** into a unified, zero-clutter interface.

---

## Key Features

### 1. Cosmic Glass Design Language (`Lc9/b`)
- **Zero Netflix Clutter**: Boots directly into the 5-tab hub (`Home`, `Anime`, `Search`, `Servers`, `My Ctent`) with no sign-in wall.
- **Palette**: Deep cosmic night (`#07060B`), obsidian surfaces (`#121019`, `#1B1824`, `#26222F`), 4-stop neon violet-to-pink gradient (`#3B1CFF` → `#8B2CF5` → `#E21CF0` → `#FF2D95`), emerald online indicators (`#22D37A`), and gold rating badges (`#FFC53D`).
- **Signature Animations**:
  - `HeroRotator`: Auto-advancing 5.5s featured banner with smooth crossfade, Ken Burns zoom/pan, and expanding pill pagination indicators.
  - `ShimmerBox`: Diagonal sweeping shimmer skeletons during catalog & directory loading.
  - `LivePulseDot`: Breathing emerald pulse on live BDIX server status pills.
  - Spring-physics press feedback on every poster card, category chip, and server tile.

### 2. Three Built-In Organizers
- **Server Engine & Classifier (`src/services/serverEngine.ts`)**:
  - Automatic quick probe on startup + deep sweep across **1,470+ BDIX hosts** with live progress and millisecond latency badges.
  - Classifies servers into `CIRCLEFTP`, `CYBERFTP`, `EMBY`, `JELLYFIN`, `DIRECTORY`, `MEDIA_SITE`, `PORTAL`, and `ANIME_WEB`.
  - Supports **Automatic (Fastest)** routing or pinning a **Preferred Route**.
- **Cross-Server Title Deduplicator (`src/services/organizer.ts`)**:
  - Normalizes title names across servers (`mergeAcrossServers`) and attaches `alternatives: AltSource[]` so every card displays a `+N servers` badge and lets you switch servers on the detail screen.
  - Groups search results by provider (`groupSearchByServer`) in **By Server** mode or merges them in **All Ranked** mode.
- **BDIX HTTP/FTP Directory Browser (`src/services/directoryBrowser.ts`)**:
  - Crawls Apache, Nginx, LiteSpeed, IIS, and `_h5ai` autoindex directories with breadcrumb navigation (`Crumb[]`), file-type classification (`VIDEO`, `SUBTITLE`, `ARCHIVE`, `AUDIO`), language filtering (`All`, `Bangla`, `Hindi`, `English`), and instant video playback.

### 3. Unified Content Sources
- **Native BDIX APIs**: CircleFTP (`http://new.circleftp.net:5000/api`) & CyberFTP (`https://API.cyberftp.net/api/v2`).
- **BDIX Directory & Server Pool**: 1,470+ BDIX hosts (`src/services/sources/bdixHosts.ts`), AmaderFTP, DFlix, DiscoveryFTP, RoarZone, ICC FTP, DhakaFlix, Bengalix, Fanush, Ebox, ShowTimeBD, BossBD, BasNet, TimePassBD, MazedaNetworks, CTGFun, FunTimeBD, Link3, AmberIT, Carnival, DotInternet, SAMOnline, and more.
- **Anime Hub**: AniList GraphQL catalog + Tokyo Insider direct `.mkv`/`.mp4` DDL scraper + AniZone HLS + KickassAnime HLS + 19 Wotaku & Anime portals.
- **Global & Regional Providers**: SouthFreak, Cinemeta, 46 Nuvio plugin repositories, and Stremio community addons.
