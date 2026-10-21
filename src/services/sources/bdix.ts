// BDIX / FTP movie & series servers (Bangladesh).
// Merges the 1,470+ hosts in bdixHosts.ts with curated BDIX servers and h5ai JSON directory search
// reverse-engineered from app-release.apk (Lcom/ctent/app/data/provider/directory/k0).
import AsyncStorage from '@react-native-async-storage/async-storage';

import { tintFor, type Title } from '../../data/types';
import { cached } from '../cache';
import { decodeEntities, getJson, getText, hostAvailable, hostOf, mapLimit, postJson, withTimeout } from '../http';
import { ACTIVE_POOL_SERVERS, MEGA_HOSTS } from './bdixHosts';

export interface FtpServer {
  id: string;
  name: string;
  type: 'index' | 'circle' | 'h5ai';
  base: string;
  tier?: number;
  paths?: string[];
}

export const BDIX_SERVERS: FtpServer[] = [
  { id: 'circle', name: 'CircleFTP', type: 'circle', base: 'http://new.circleftp.net:5000' },
  { id: 'dhaka14', name: 'DhakaFlix 14', type: 'index', base: 'http://172.16.50.14', paths: ['/DHAKA-FLIX-14/English%20Movies%20(1080p)/', '/DHAKA-FLIX-14/Hindi%20Movies/', '/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/Hindi%20Dubbed/', '/DHAKA-FLIX-14/Animation%20Movies%20(1080p)/'] },
  { id: 'dhaka12', name: 'DhakaFlix 12', type: 'index', base: 'http://172.16.50.12', paths: ['/DHAKA-FLIX-12/TV-WEB-Series/'] },
  { id: 'dhaka7', name: 'DhakaFlix 7', type: 'index', base: 'http://172.16.50.7' },
  { id: 'dhaka4', name: 'DhakaFlix 4', type: 'index', base: 'http://172.16.50.4' },
  { id: 'icc12', name: 'ICC FTP 12', type: 'index', base: 'http://10.100.100.12' },
  { id: 'icc13', name: 'ICC FTP 13', type: 'index', base: 'http://10.100.100.13' },
  { id: 'icc10', name: 'ICC FTP 10', type: 'index', base: 'http://10.100.100.10' },
  { id: 'samonline', name: 'SamOnline FTP', type: 'index', base: 'http://10.16.100.244' },
  { id: 'ftpbd', name: 'FTPBD', type: 'index', base: 'http://media.ftpbd.net' },
  { id: 'samftp', name: 'SamFTP', type: 'index', base: 'https://samftp.com' },
  { id: 'discovery', name: 'Discovery FTP', type: 'index', base: 'http://movies.discoveryftp.net' },
  { id: 'cds1', name: 'Discovery CDS 1', type: 'index', base: 'http://cds1.discoveryftp.net' },
  { id: 'cds2', name: 'Discovery CDS 2', type: 'index', base: 'http://cds2.discoveryftp.net' },
  { id: 'khulnaflix', name: 'Khulnaflix', type: 'index', base: 'http://khulnaflix.net' },
  { id: 'naturalbd', name: 'NaturalBD', type: 'index', base: 'http://www.naturalbd.com' },
  { id: 'ctgmovies', name: 'CTG Movies', type: 'index', base: 'http://ctgmovies.com' },
  { id: 'showtime', name: 'Showtime BD', type: 'index', base: 'http://showtimebd.com' },
  { id: 'dflix', name: 'Dflix', type: 'index', base: 'http://fs1.dflix.live' },
  { id: 'timepass', name: 'TimepassBD', type: 'index', base: 'http://www.timepassbd.live' },
  { id: 'ihub', name: 'iHub', type: 'index', base: 'http://ihub.live' },
  { id: 'moviehaat', name: 'MovieHaat', type: 'index', base: 'http://moviehaat.net' },
  { id: 'ebox', name: 'E-Box', type: 'index', base: 'http://fileserver.ebox.live', paths: ['/movies/'] },
  { id: 'fsebox', name: 'FS E-Box', type: 'index', base: 'http://fs.ebox.live' },
  { id: 'dnet', name: 'D-Net', type: 'index', base: 'https://dnetdrive.com' },
  { id: 'c1', name: 'Cloudone', type: 'index', base: 'http://www.c1movies.com' },
  { id: 'bdmovies', name: 'BDMovies', type: 'index', base: 'http://bdmovies.net' },
  { id: 'moviemela', name: 'Moviemela', type: 'index', base: 'http://www.moviemela.live' },
  { id: 'pollyflix', name: 'Pollyflix', type: 'index', base: 'http://pollyflix.com' },
  { id: 'amrbd', name: 'AmrBD', type: 'index', base: 'http://fs.amrbd.com' },
  { id: 'khulnaflix2', name: 'Khulnaflix Files', type: 'index', base: 'https://file.khulnaflix.net' },
  { id: 'bdflix', name: 'BDFlix Live', type: 'index', base: 'https://bdflixlive.com' },
  { id: 'mojar', name: 'MojarFTP', type: 'index', base: 'https://www.mojarftp.com' },
  { id: 'bolmovies', name: 'BolMovies', type: 'index', base: 'https://www.bolmovies.com' },
  { id: 'timepass2', name: 'TimepassBD (com)', type: 'index', base: 'https://timepassbd.com' },
  { id: 'moviebazar', name: 'MyMovieBazar', type: 'index', base: 'https://mymoviebazar.com' },
  { id: 'pandaclub', name: 'PandaClub', type: 'index', base: 'https://pandaclubbd.com' },
  { id: 'dhakaftp', name: 'DhakaFTP', type: 'index', base: 'https://dhakaftp.com' },
  { id: 'cinemacity', name: 'CinemaCity', type: 'index', base: 'https://cinemacity.live' },
  { id: 'ftpcombd', name: 'FTP.com.bd', type: 'index', base: 'https://ftp.com.bd' },
  { id: 'abcmovies', name: 'ABC Movies', type: 'index', base: 'https://abcmoviesbd.com' },
  { id: 'ctgoz', name: 'CTGOZ', type: 'index', base: 'https://ctgoz.com' },
  { id: 'roar', name: 'RoarMediaZone', type: 'index', base: 'https://roarmediazone.com' },
  { id: 'movieboxbd', name: 'MovieBoxBD', type: 'index', base: 'https://movieboxbd.com' },
  { id: 'sunplex', name: 'SunPlex', type: 'index', base: 'http://sunplex.net' },
  { id: 'rangdhanu', name: 'Rangdhanu Live', type: 'index', base: 'http://fs.rangdhanu.live' },
  { id: 'bnet', name: 'BNet BD', type: 'index', base: 'http://www.bnet-bd.com' },
  { id: 'onesky', name: 'OneSky BD', type: 'index', base: 'http://www.onesky.com.bd' },
  { id: 'discoverynet', name: 'DiscoveryNet BD', type: 'index', base: 'https://www.discoverynetbd.com' },
];

const MEDIA = /\.(mkv|mp4|avi|webm|m4v|mov)$/i;
const SKIP_NAME = /sample|trailer|\bextras?\b|behind the scenes|subs?$/i;
const STEP_TIMEOUT = 5500;

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

const norm = (s: string) =>
  safeDecode(s)
    .toLowerCase()
    .replace(/[._\-()[\]]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function matches(name: string, tokens: string[]): boolean {
  const n = norm(name);
  return tokens.every((t) => n.includes(t));
}

interface Entry {
  href: string;
  name: string;
  dir: boolean;
}

export function parseIndex(html: string, pageUrl: string): Entry[] {
  const out: Entry[] = [];
  const dirUrl = pageUrl.endsWith('/') ? pageUrl : pageUrl.replace(/[^/]*$/, '');
  for (const m of html.matchAll(/<a\s[^>]*href="([^"?#]+)"[^>]*>([^<]*)</gi)) {
    const href = decodeEntities(m[1]);
    if (
      href.startsWith('.') ||
      /^(mailto|javascript):/i.test(href) ||
      /parent directory|\[to parent directory\]/i.test(m[2])
    )
      continue;
    let abs: string;
    try {
      abs = new URL(href, pageUrl).href;
    } catch {
      continue;
    }
    if (!abs.startsWith(dirUrl) || abs === pageUrl || abs === dirUrl) continue;
    const name = decodeEntities(m[2]).trim() || safeDecode(href.replace(/\/$/, '').split('/').pop() ?? '');
    if (!name) continue;
    out.push({ href: abs, name, dir: abs.endsWith('/') });
  }
  return out;
}

/**
 * h5ai JSON search API (extracted from Ctent APK Lcom/ctent/app/data/provider/directory/k0):
 * Many Bangladeshi BDIX servers (DhakaFlix, ICC, Dflix, Rangdhanu) run h5ai or similar JSON endpoints.
 */
async function tryH5aiSearch(baseUrl: string, query: string): Promise<{ url: string; label: string }[]> {
  try {
    const res = await postJson<{ items?: { href?: string }[] }>(
      `${baseUrl.replace(/\/$/, '')}/?`,
      { action: 'get', search: { href: '/', pattern: query, ignorecase: true } },
      { timeout: 4000, retries: 0 },
    );
    const out: { url: string; label: string }[] = [];
    for (const item of res?.items ?? []) {
      if (!item.href || !MEDIA.test(item.href)) continue;
      const abs = new URL(item.href, baseUrl).href;
      const label = safeDecode(abs.split('/').pop() ?? 'Video');
      if (!SKIP_NAME.test(label)) out.push({ url: abs, label });
    }
    return out.slice(0, 12);
  } catch {
    return [];
  }
}

async function crawl(server: FtpServer, tokens: string[], deadline: number): Promise<{ url: string; label: string }[]> {
  // First attempt ultra-fast h5ai search if query has tokens
  const h5aiHits = await tryH5aiSearch(server.base, tokens.join('.*'));
  if (h5aiHits.length > 0) return h5aiHits;

  const found: { url: string; label: string }[] = [];
  let reached = false;
  const roots = (server.paths ?? ['/']).map((p) => server.base.replace(/\/$/, '') + p);
  const queue: { url: string; depth: number; matched: boolean }[] = roots.map((url) => ({
    url,
    depth: 0,
    matched: false,
  }));
  while (queue.length > 0 && Date.now() < deadline && found.length < 12) {
    const { url, depth, matched } = queue.shift()!;
    let html: string;
    try {
      html = await withTimeout(getText(url, { timeout: STEP_TIMEOUT, retries: 0 }), STEP_TIMEOUT + 500, 'index');
    } catch {
      continue;
    }
    reached = true;
    for (const e of parseIndex(html, url)) {
      if (SKIP_NAME.test(e.name)) continue;
      if (e.dir) {
        const hit = matches(e.name, tokens);
        if (hit && depth < 3) queue.unshift({ url: e.href, depth: depth + 1, matched: true });
        else if (!matched && depth < 1) queue.push({ url: e.href, depth: depth + 1, matched: false });
      } else if (MEDIA.test(e.name) && (matched || matches(e.name, tokens))) {
        found.push({ url: e.href, label: safeDecode(e.name) });
      }
    }
  }
  if (!reached) throw new Error('unreachable');
  return found;
}

const DIRECTORY_URL = 'https://bdix.app/servers';

async function directoryServers(): Promise<FtpServer[]> {
  try {
    return await cached('ctent:bdix:directory', { ttl: 24 * 3600 * 1000 }, async () => {
      const out: FtpServer[] = [];
      try {
        const page = await getText('https://ftpserverbd.com/ftp-movie-server', { timeout: 10000, retries: 1 });
        const seenHosts = new Set<string>();
        for (const m of page.matchAll(/https?:\/\/[^\s"'<>)]+/g)) {
          const url = m[0].replace(/[.,;]+$/, '');
          const host = hostOf(url);
          if (
            !host ||
            seenHosts.has(host) ||
            /ftpserverbd|google|facebook|youtube|w3\.org|cloudflare|twitter|schema|gstatic|jsdelivr|bdix\.app|wa\.me|t\.me|linkedin|profitableratecpmnetwork/.test(
              host,
            ) ||
            /\.(js|css|png|jpg|svg|ico)(\?|$)/.test(url)
          )
            continue;
          seenHosts.add(host);
          out.push({ id: `fsb:${host}`, name: host.replace(/^www\./, ''), type: 'index', base: url.replace(/\/$/, '') });
        }
      } catch {
        // continue
      }
      const html = await getText(DIRECTORY_URL, { timeout: 10000, retries: 1 }).catch(() => '');
      for (const row of html.match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
        const cell = (label: string) => {
          const m = new RegExp(`data-label="${label}"[^>]*>([\\s\\S]*?)</td>`).exec(row);
          return m ? decodeEntities(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : '';
        };
        const name = (/<a[^>]*>([^<]+)<\/a>/.exec(row)?.[1] ?? '').trim();
        const addr = cell('IP / Domain').split(' ')[0];
        const content = cell('Content');
        if (!name || !addr || !/movie|mixed|media|tv/i.test(content)) continue;
        out.push({
          id: `dir:${addr}`,
          name,
          type: 'index',
          base: /^https?:/.test(addr) ? addr : `http://${addr}`,
        });
      }
      return out;
    });
  } catch {
    return [];
  }
}

interface Reach {
  ok: number;
  fail: number;
  at: number;
}

const REACH_KEY = 'ctent:bdix:reach:v1';
let reach: Record<string, Reach> | null = null;

async function readReach(): Promise<Record<string, Reach>> {
  if (reach) return reach;
  try {
    reach = JSON.parse((await AsyncStorage.getItem(REACH_KEY)) ?? '{}') as Record<string, Reach>;
  } catch {
    reach = {};
  }
  // Seed with Ctent APK's pre-verified active pool servers on first run
  for (const ap of ACTIVE_POOL_SERVERS) {
    const h = hostOf(ap.url);
    if (h && !reach[h]) {
      reach[h] = { ok: 3, fail: 0, at: Date.now() };
    }
  }
  return reach;
}

export function noteReach(host: string, ok: boolean) {
  const r = (reach ??= {});
  const cur = r[host] ?? { ok: 0, fail: 0, at: 0 };
  if (ok) cur.ok++;
  else cur.fail++;
  cur.at = Date.now();
  r[host] = cur;
}

async function saveReach() {
  if (reach) await AsyncStorage.setItem(REACH_KEY, JSON.stringify(reach)).catch(() => undefined);
}

export function megaServers(): FtpServer[] {
  return MEGA_HOSTS.map(([base, tier]) => ({
    id: `mega:${hostOf(base)}`,
    name: hostOf(base).replace(/^www\./, ''),
    type: 'index' as const,
    base,
    tier,
  }));
}

const UNKNOWN_PER_SEARCH = 80;
const CURSOR_KEY = '__cursor';

async function orderByReach(servers: FtpServer[]): Promise<FtpServer[]> {
  const r = await readReach();
  const now = Date.now();
  const known: FtpServer[] = [];
  const fresh: FtpServer[] = [];
  for (const s of servers) {
    const h = r[hostOf(s.base)];
    if (h && h.ok > 0) known.push(s);
    else if (!h || h.fail < 3 || now - h.at > 12 * 3600 * 1000) fresh.push(s);
  }
  known.sort((a, b) => (r[hostOf(b.base)]?.ok ?? 0) - (r[hostOf(a.base)]?.ok ?? 0));
  fresh.sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
  const head = fresh.filter((s) => (s.tier ?? 0) <= 2);
  const tail = fresh.filter((s) => (s.tier ?? 0) > 2);
  const cursor = (r[CURSOR_KEY]?.ok ?? 0) % Math.max(1, tail.length);
  const rotated = [...tail.slice(cursor), ...tail.slice(0, cursor)].slice(0, UNKNOWN_PER_SEARCH);
  r[CURSOR_KEY] = { ok: cursor + UNKNOWN_PER_SEARCH, fail: 0, at: now };
  return [...known, ...head, ...rotated];
}

export async function allServers(): Promise<FtpServer[]> {
  const seen = new Set(BDIX_SERVERS.map((s) => hostOf(s.base)));
  const extra = [...(await directoryServers()), ...megaServers()].filter((s) => {
    const h = hostOf(s.base);
    if (!h || seen.has(h)) return false;
    seen.add(h);
    return true;
  });
  return orderByReach([...BDIX_SERVERS, ...extra]);
}

export async function search(
  query: string,
  budgetMs = 9000,
): Promise<{ server: FtpServer; files: { url: string; label: string }[] }[]> {
  const tokens = norm(query)
    .split(' ')
    .filter((t) => t.length > 1);
  if (tokens.length === 0) return [];
  const deadline = Date.now() + budgetMs;
  const servers = (await allServers()).filter((s) => hostAvailable(s.base));
  const hits = await mapLimit(servers, 14, async (server) => {
    try {
      if (Date.now() > deadline) return null;
      const files =
        server.type === 'circle' ? await searchCircle(server, query) : await crawl(server, tokens, deadline);
      noteReach(hostOf(server.base), true);
      return files.length > 0 ? { server, files } : null;
    } catch {
      noteReach(hostOf(server.base), false);
      return null;
    }
  });
  saveReach();
  return hits.filter((h): h is { server: FtpServer; files: { url: string; label: string }[] } => h !== null);
}

async function searchCircle(server: FtpServer, query: string): Promise<{ url: string; label: string }[]> {
  const list = await getJson<
    { posts?: { id: number; title?: string; name?: string }[] } | { id: number; title?: string; name?: string }[]
  >(`${server.base}/api/posts?searchTerm=${encodeURIComponent(query)}&order=desc`, {
    timeout: STEP_TIMEOUT,
    retries: 0,
  });
  const posts = Array.isArray(list) ? list : (list.posts ?? []);
  const tokens = norm(query).split(' ');
  const out: { url: string; label: string }[] = [];
  for (const post of posts.slice(0, 4)) {
    if (!matches(post.title ?? post.name ?? '', tokens)) continue;
    const detail = await getJson<unknown>(`${server.base}/api/posts/${post.id}`, {
      timeout: STEP_TIMEOUT,
      retries: 0,
    }).catch(() => null);
    walk(detail, (s) => {
      const fixed = s.startsWith('ttp') ? `h${s}` : s;
      if (/^https?:\/\//i.test(fixed) && MEDIA.test(fixed.split('?')[0])) {
        out.push({ url: fixed, label: safeDecode(fixed.split('/').pop() ?? post.title ?? 'file') });
      }
    });
  }
  return out;
}

function walk(node: unknown, visit: (s: string) => void) {
  if (typeof node === 'string') visit(node);
  else if (Array.isArray(node)) node.forEach((n) => walk(n, visit));
  else if (node && typeof node === 'object') Object.values(node).forEach((n) => walk(n, visit));
}

export function filesToTitle(
  name: string,
  year: number,
  files: { url: string; label: string }[],
  serverName: string,
): Title {
  const id = `bx:${norm(name).replace(/ /g, '-')}-${year}`;
  return {
    id,
    source: 'bdix',
    ref: id,
    name,
    kind: 'movie',
    year,
    maturity: '13+',
    runtime: 0,
    seasons: [],
    genres: [],
    synopsis: `Direct high-speed BDIX files on ${serverName}.`,
    cast: [],
    creators: [],
    tint: tintFor(id),
    quality: [
      ...new Set(files.map((f) => /(2160p|1080p|720p|480p)/i.exec(f.label)?.[1].toUpperCase() ?? 'HD')),
    ],
    files,
    directUrl: files[0]?.url,
    serverName,
    detailed: true,
  };
}
