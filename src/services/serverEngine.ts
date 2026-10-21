// ServerEngine & ServerClassifier — reverse-engineered from app-release.apk (Lo8 package).
// Manages 1,470+ BDIX servers + 19 Wotaku/Direct Anime portals:
// - Live latency probing (QUICK_PROBE on launch + SWEEPING "Deep scan all")
// - Automatic server classification (CIRCLEFTP, CYBERFTP, EMBY, JELLYFIN, DIRECTORY, MEDIA_SITE, PORTAL, ANIME_WEB)
// - Automatic (fastest) vs Preferred route server selection
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { getText, hostOf, mapLimit, request } from './http';
import { BDIX_SERVERS, noteReach } from './sources/bdix';
import { ACTIVE_POOL_SERVERS, MEGA_HOSTS, WOTAKU_ANIME_SERVERS } from './sources/bdixHosts';

export type ServerType =
  | 'CIRCLEFTP'
  | 'CYBERFTP'
  | 'EMBY'
  | 'JELLYFIN'
  | 'DIRECTORY'
  | 'MEDIA_SITE'
  | 'PORTAL'
  | 'ANIME_WEB';

export type ServerCategory = 'bdix' | 'anime';
export type ProbePhase = 'IDLE' | 'QUICK_PROBE' | 'SWEEPING';
export type ServerFilter = 'ALL' | 'ONLINE' | 'MEDIA' | 'NATIVE' | 'WEB' | 'BDIX' | 'ANIME' | 'IPTV';

export interface ManagedServer {
  id: string;
  name: string;
  url: string;
  mirror?: string;
  category: ServerCategory;
  type: ServerType;
  online: boolean;
  latencyMs: number;
  lastChecked: number;
  meta?: string;
  tier: number;
  browsePaths?: string[];
}

export interface ServerEngineState {
  servers: ManagedServer[];
  totalKnown: number;
  bdixCount: number;
  animeCount: number;
  onlineCount: number;
  phase: ProbePhase;
  sweepDone: number;
  sweepTotal: number;
  sweepProgress: number;
  preferredServerId: string | null; // null = Automatic (fastest)
  lastChecked: number;
  ready: boolean;
}

const STORAGE_KEY = 'mythtube:server_engine:v2';

function inferInitialType(url: string, category: ServerCategory): { type: ServerType; meta: string } {
  if (category === 'anime') return { type: 'ANIME_WEB', meta: 'Anime Portal · HLS / DDL' };
  const u = url.toLowerCase();
  if (u.includes('circleftp')) return { type: 'CIRCLEFTP', meta: 'CircleFTP Native JSON API' };
  if (u.includes('cyberftp')) return { type: 'CYBERFTP', meta: 'CyberFTP v2 Native API' };
  if (u.includes('emby') || u.includes(':8096')) return { type: 'EMBY', meta: 'Emby Media Server' };
  if (u.includes('jellyfin')) return { type: 'JELLYFIN', meta: 'Jellyfin Media Server' };
  if (
    /172\.16\.50\.|10\.100\.100\.|10\.16\.100\.|cds\d\.|fileserver\.|fs\d?\.|media\.ftpbd|index/i.test(u)
  ) {
    return { type: 'DIRECTORY', meta: 'Direct HTTP / h5ai File Index' };
  }
  if (/amaderftp|dflix|moviehaat|showtime|samftp|timepass|khulnaflix|ctgmovies|cinemacity/i.test(u)) {
    return { type: 'MEDIA_SITE', meta: 'BDIX Media Index & Direct Stream' };
  }
  return { type: 'PORTAL', meta: 'BDIX ISP Media Portal' };
}

function prettyServerName(url: string, fallback?: string): string {
  if (fallback && !/^mega:|^dir:|^fsb:|^bdix_/i.test(fallback)) return fallback;
  const u = url.toLowerCase();
  if (u.includes('10.100.100.12')) return 'ICC FTP 12 (Dhaka)';
  if (u.includes('10.100.100.13')) return 'ICC FTP 13 (Series)';
  if (u.includes('10.100.100.10')) return 'ICC FTP 10 (Main)';
  if (u.includes('172.16.50.4')) return 'DhakaFlix 4 (Movies)';
  if (u.includes('172.16.50.7')) return 'DhakaFlix 7 (HD)';
  if (u.includes('172.16.50.14')) return 'DhakaFlix 14 (1080p)';
  if (u.includes('172.16.50.12')) return 'DhakaFlix 12 (Series)';
  if (u.includes('10.16.100.244')) return 'SamOnline FTP';
  if (u.includes('local.cyberftp.net')) return 'CyberFTP Local';
  if (u.includes('new.circleftp.net')) return 'CircleFTP New';
  if (u.includes('ftp4.circleftp.net')) return 'CircleFTP 4';
  if (u.includes('ftp2.circleftp.net')) return 'CircleFTP 2';
  if (u.includes('hd.circleftp.net')) return 'CircleFTP HD';
  if (u.includes('discoverynetbd')) return 'DiscoveryNet BD';
  if (u.includes('bnet-bd')) return 'BNet BD';
  if (u.includes('onesky.com.bd')) return 'OneSky BD';
  if (u.includes('amaderftp.net')) return 'AmaderFTP';
  const h = hostOf(url).replace(/^www\./, '');
  return h || url;
}

function buildInitialRegistry(): ManagedServer[] {
  const seen = new Set<string>();
  const list: ManagedServer[] = [];

  const add = (
    id: string,
    url: string,
    category: ServerCategory,
    tier: number,
    name?: string,
    online = false,
    latencyMs = 0,
    mirror?: string,
    browsePaths?: string[],
  ) => {
    const cleanUrl = url.trim().replace(/\/$/, '');
    const key = `${category}:${hostOf(cleanUrl) || cleanUrl}`;
    if (seen.has(key)) return;
    seen.add(key);
    const { type, meta } = inferInitialType(cleanUrl, category);
    list.push({
      id,
      name: prettyServerName(cleanUrl, name),
      url: cleanUrl,
      mirror,
      category,
      type,
      online,
      latencyMs,
      lastChecked: online ? Date.now() : 0,
      meta,
      tier,
      browsePaths,
    });
  };

  // 1. Ctent APK's 12 Active Pool BDIX servers (pre-verified low latency)
  for (const ap of ACTIVE_POOL_SERVERS) {
    add(ap.id, ap.url, 'bdix', 0, undefined, ap.online, ap.latency);
  }

  // 2. Curated BDIX_SERVERS with known browse paths
  for (const s of BDIX_SERVERS) {
    add(`cur:${s.id}`, s.base, 'bdix', 1, s.name, false, 0, undefined, s.paths);
  }

  // 3. Wotaku + Direct Anime Portals (19 servers)
  for (const a of WOTAKU_ANIME_SERVERS) {
    add(a.id, a.url, 'anime', 1, a.name, true, 140, a.mirror);
  }

  // 4. All 1,470 merged BDIX hosts (Ctent master servers + MEGA_HOSTS)
  MEGA_HOSTS.forEach(([url, tier], idx) => {
    add(`bdix_${idx + 1}`, url, 'bdix', tier);
  });

  return list;
}

// Classify HTML response using Ctent Lo8/d rules
function classifyBody(url: string, html: string): { type: ServerType; meta: string; valid: boolean } {
  const lower = html.slice(0, 6000).toLowerCase();
  if (
    /for sale|hugedomains|example domain|site maintenance|under construction|403 forbidden|404 not found|suspended|parked|cpanel|webmail/.test(
      lower,
    )
  ) {
    return { type: 'PORTAL', meta: 'Parked / Maintenance', valid: false };
  }
  if (lower.includes('cyberftp') || url.includes('cyberftp')) {
    return { type: 'CYBERFTP', meta: 'CyberFTP v2 Native API', valid: true };
  }
  if (lower.includes('circleftp') || lower.includes('circle ftp') || url.includes('circleftp')) {
    return { type: 'CIRCLEFTP', meta: 'CircleFTP Native JSON API', valid: true };
  }
  if (lower.includes('jellyfin')) {
    return { type: 'JELLYFIN', meta: 'Jellyfin Media Server', valid: true };
  }
  if (lower.includes('emby')) {
    return { type: 'EMBY', meta: 'Emby Media Server', valid: true };
  }
  if (
    lower.includes('index of') ||
    lower.includes('parent directory') ||
    lower.includes('[to parent directory]') ||
    lower.includes('_h5ai') ||
    lower.includes('h5ai') ||
    lower.includes('_autoindex')
  ) {
    return { type: 'DIRECTORY', meta: 'Direct HTTP / FTP Folder Index', valid: true };
  }
  if (/movie|film|cinema|cineplex|flix|stream|series|anime|ftp|bdix|media|watch/i.test(lower)) {
    return { type: 'MEDIA_SITE', meta: 'BDIX Media Portal', valid: true };
  }
  return { type: 'PORTAL', meta: 'BDIX Server', valid: true };
}

class ServerEngineManager {
  state: ServerEngineState;
  private listeners = new Set<() => void>();
  private sweepAbort = false;

  constructor() {
    const servers = buildInitialRegistry();
    const bdixCount = servers.filter((s) => s.category === 'bdix').length;
    const animeCount = servers.filter((s) => s.category === 'anime').length;
    const onlineCount = servers.filter((s) => s.online).length;
    this.state = {
      servers,
      totalKnown: servers.length,
      bdixCount,
      animeCount,
      onlineCount,
      phase: 'IDLE',
      sweepDone: 0,
      sweepTotal: 0,
      sweepProgress: 0,
      preferredServerId: null,
      lastChecked: Date.now(),
      ready: false,
    };
    this.hydrate();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const onlineCount = this.state.servers.filter((s) => s.online).length;
    this.state = { ...this.state, onlineCount };
    this.listeners.forEach((l) => l());
  }

  private async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          preferredServerId?: string | null;
          states?: Record<string, { online: boolean; latencyMs: number; type: ServerType; meta?: string; lastChecked: number }>;
        };
        if (saved.preferredServerId !== undefined) {
          this.state.preferredServerId = saved.preferredServerId;
        }
        if (saved.states) {
          this.state.servers = this.state.servers.map((s) => {
            const hit = saved.states?.[s.id];
            return hit ? { ...s, ...hit } : s;
          });
        }
      }
    } catch {
      // first run
    }
    this.state.ready = true;
    this.emit();
    // Run automatic quick probe of active pool + top tier servers on startup
    setTimeout(() => this.runQuickProbe(), 600);
  }

  private async persist() {
    try {
      const states: Record<string, { online: boolean; latencyMs: number; type: ServerType; meta?: string; lastChecked: number }> = {};
      for (const s of this.state.servers) {
        if (s.lastChecked > 0) {
          states[s.id] = {
            online: s.online,
            latencyMs: s.latencyMs,
            type: s.type,
            meta: s.meta,
            lastChecked: s.lastChecked,
          };
        }
      }
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ preferredServerId: this.state.preferredServerId, states }),
      );
    } catch {
      // ignore
    }
  }

  setPreferredServer(serverId: string | null) {
    this.state = { ...this.state, preferredServerId: serverId };
    this.emit();
    this.persist();
  }

  get activeRoute(): ManagedServer | null {
    if (this.state.preferredServerId) {
      const pinned = this.state.servers.find((s) => s.id === this.state.preferredServerId);
      if (pinned) return pinned;
    }
    const onlineBdix = this.state.servers
      .filter((s) => s.category === 'bdix' && s.online)
      .sort((a, b) => (a.latencyMs || 9999) - (b.latencyMs || 9999));
    return onlineBdix[0] ?? this.state.servers[0] ?? null;
  }

  private async probeSingle(server: ManagedServer, timeoutMs = 3200): Promise<void> {
    const t0 = Date.now();
    try {
      const res = await request(server.url, {
        timeout: timeoutMs,
        retries: 0,
        headers: { Range: 'bytes=0-2048', 'Cache-Control': 'no-cache' },
      });
      const latencyMs = Math.max(12, Date.now() - t0);
      const ok = res.status >= 200 && res.status < 400;
      if (ok) {
        const cls = server.category === 'anime'
          ? { type: 'ANIME_WEB' as const, meta: 'Anime Portal · Online', valid: true }
          : classifyBody(server.url, res.text || '');
        server.online = cls.valid;
        server.latencyMs = latencyMs;
        server.type = cls.type;
        server.meta = cls.meta;
        server.lastChecked = Date.now();
        noteReach(hostOf(server.url), cls.valid);
      } else {
        server.online = false;
        server.lastChecked = Date.now();
      }
    } catch {
      // keep pre-seeded active pool servers marked online if on international network fallback, or mark checked
      if (server.tier > 0) {
        server.online = false;
      }
      server.lastChecked = Date.now();
    }
  }

  async runQuickProbe(): Promise<void> {
    if (this.state.phase !== 'IDLE') return;
    const candidates = this.state.servers.filter((s) => s.tier <= 1).slice(0, 48);
    this.state = {
      ...this.state,
      phase: 'QUICK_PROBE',
      sweepDone: 0,
      sweepTotal: candidates.length,
      sweepProgress: 0,
    };
    this.emit();

    let done = 0;
    await mapLimit(candidates, 10, async (s) => {
      await this.probeSingle(s, 3000);
      done++;
      if (done % 6 === 0 || done === candidates.length) {
        this.state = {
          ...this.state,
          sweepDone: done,
          sweepProgress: done / Math.max(1, candidates.length),
          lastChecked: Date.now(),
        };
        this.emit();
      }
    });

    this.state = { ...this.state, phase: 'IDLE', sweepProgress: 1, lastChecked: Date.now() };
    this.emit();
    await this.persist();
  }

  async runDeepScanAll(): Promise<void> {
    if (this.state.phase === 'SWEEPING') {
      this.sweepAbort = true;
      return;
    }
    this.sweepAbort = false;
    const all = this.state.servers;
    this.state = {
      ...this.state,
      phase: 'SWEEPING',
      sweepDone: 0,
      sweepTotal: all.length,
      sweepProgress: 0,
    };
    this.emit();

    let done = 0;
    await mapLimit(all, 24, async (s) => {
      if (this.sweepAbort) return;
      await this.probeSingle(s, 2400);
      done++;
      if (done % 18 === 0 || done === all.length) {
        this.state = {
          ...this.state,
          sweepDone: done,
          sweepProgress: done / Math.max(1, all.length),
          lastChecked: Date.now(),
        };
        this.emit();
      }
    });

    this.state = { ...this.state, phase: 'IDLE', sweepProgress: 1, lastChecked: Date.now() };
    this.emit();
    await this.persist();
  }
}

export const serverEngine = new ServerEngineManager();

export function useServerEngine() {
  const [, setTick] = useState(0);
  useEffect(() => serverEngine.subscribe(() => setTick((t) => t + 1)), []);
  return {
    state: serverEngine.state,
    activeRoute: serverEngine.activeRoute,
    setPreferredServer: (id: string | null) => serverEngine.setPreferredServer(id),
    runQuickProbe: () => serverEngine.runQuickProbe(),
    runDeepScanAll: () => serverEngine.runDeepScanAll(),
  };
}
