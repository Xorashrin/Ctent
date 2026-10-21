// CircleFTP Native Provider (Ll8 from app-release.apk)
// Supports CircleFTP JSON API across primary & mirror BDIX endpoints:
// - /home-page/getHomePagePosts, /posts, /posts?category=80 (Anime), /posts?searchTerm=..., /posts/{id}
import { tintFor, type Episode, type Season, type Title } from '../../data/types';
import { getJson, withTimeout } from '../http';

const BASES = [
  'http://new.circleftp.net:5000/api',
  'http://new.circleftp.net/api',
  'http://ftp4.circleftp.net/api',
  'http://circleftp.net/api',
];

const MEDIA_RE = /\.(mkv|mp4|avi|webm|m4v|mov|ts)(\?|$)/i;
const QUALITY_RE = /\b(2160p|4k|1440p|1080p|720p|480p)\b/i;
const YEAR_RE = /\b(19\d{2}|20\d{2})\b/;
const SE_RE = /\bS(\d{1,2})\s*[._\- ]?\s*E(\d{1,4})\b/i;
const EP_RE = /\b(?:episode|ep)\s*[._\- ]?\s*(\d{1,4})\b/i;

export interface CirclePost {
  id: number | string;
  title?: string;
  name?: string;
  type?: string;
  year?: number | string;
  image?: string;
  poster?: string;
  posterLarge?: string;
  cover?: string;
  overview?: string;
  description?: string;
  rating?: number | string;
  category?: number | string;
  categoryName?: string;
  quality?: string;
  createdAt?: string;
}

export interface CircleFile {
  url: string;
  label: string;
  quality: string;
  season?: number;
  episode?: number;
}

function fixUrl(raw: string, baseApi: string): string {
  const s = raw.trim();
  if (s.startsWith('ttp://') || s.startsWith('ttps://')) return `h${s}`;
  if (/^https?:\/\//i.test(s)) return s;
  const origin = baseApi.replace(/\/api\/?$/, '');
  return s.startsWith('/') ? `${origin}${s}` : `${origin}/${s}`;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function cleanTitle(raw: string): { name: string; year: number; quality: string[] } {
  const yearMatch = YEAR_RE.exec(raw);
  const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
  const qMatch = QUALITY_RE.exec(raw);
  const quality = qMatch ? [qMatch[1].toUpperCase()] : ['1080P'];
  const stripped = raw
    .replace(/\s*[(\[]?\b(19|20)\d{2}\b.*$/, '')
    .replace(QUALITY_RE, '')
    .replace(/[._]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { name: stripped || raw.trim(), year, quality };
}

function postToTitle(p: CirclePost, baseApi: string, forceAnime = false): Title | null {
  const rawTitle = (p.title ?? p.name ?? '').trim();
  if (!rawTitle || p.id === undefined) return null;
  const { name, year: parsedYear, quality } = cleanTitle(rawTitle);
  const year = Number(p.year) || parsedYear;
  const rawPoster = p.posterLarge ?? p.poster ?? p.image ?? p.cover;
  const poster = rawPoster ? fixUrl(String(rawPoster), baseApi) : undefined;
  const typeStr = String(p.type ?? p.categoryName ?? '').toLowerCase();
  const isSeries = /series|multi|show|serial|season/i.test(typeStr);
  const isAnime = forceAnime || String(p.category) === '80' || /anime/i.test(typeStr);
  const id = `cf:${p.id}`;
  return {
    id,
    source: 'circleftp',
    ref: String(p.id),
    name,
    kind: isSeries ? 'series' : 'movie',
    year,
    maturity: '13+',
    runtime: 0,
    seasons: [],
    genres: isAnime ? ['Anime'] : [],
    synopsis: (p.overview ?? p.description ?? 'Direct BDIX high-speed stream on CircleFTP.').trim(),
    cast: [],
    creators: [],
    tint: tintFor(id),
    quality: p.quality ? [String(p.quality).toUpperCase()] : quality,
    poster,
    background: poster,
    imdbRating: p.rating ? String(p.rating).slice(0, 3) : undefined,
    serverName: 'CircleFTP',
    detailed: false,
  };
}

async function fetchCircleJson<T>(path: string, timeout = 6500): Promise<{ data: T; base: string }> {
  let lastErr: unknown = new Error('CircleFTP unreachable');
  for (const base of BASES) {
    try {
      const data = await withTimeout(
        getJson<T>(`${base}${path}`, { timeout, retries: 0 }),
        timeout + 400,
        'CircleFTP',
      );
      return { data, base };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function extractPosts(payload: unknown): CirclePost[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as CirclePost[];
  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const k of ['posts', 'data', 'latest', 'mostVisited', 'items', 'results']) {
      if (Array.isArray(obj[k])) return obj[k] as CirclePost[];
    }
    const nested: CirclePost[] = [];
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) {
        for (const item of v) {
          if (item && typeof item === 'object' && ('id' in item) && ('title' in item || 'name' in item)) {
            nested.push(item as CirclePost);
          }
        }
      }
    }
    if (nested.length > 0) return nested;
  }
  return [];
}

export async function latest(): Promise<Title[]> {
  try {
    const { data, base } = await fetchCircleJson<unknown>('/home-page/getHomePagePosts');
    const posts = extractPosts(data);
    if (posts.length > 0) {
      return posts.map((p) => postToTitle(p, base)).filter((t): t is Title => t !== null).slice(0, 30);
    }
  } catch {
    // Fallback to /posts
  }
  try {
    const { data, base } = await fetchCircleJson<unknown>('/posts?page=1&limit=24&order=desc');
    return extractPosts(data).map((p) => postToTitle(p, base)).filter((t): t is Title => t !== null);
  } catch {
    return [];
  }
}

export async function anime(): Promise<Title[]> {
  try {
    const { data, base } = await fetchCircleJson<unknown>('/posts?category=80&page=1&limit=24&order=desc');
    return extractPosts(data).map((p) => postToTitle(p, base, true)).filter((t): t is Title => t !== null);
  } catch {
    return [];
  }
}

export async function search(query: string): Promise<Title[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const { data, base } = await fetchCircleJson<unknown>(`/posts?searchTerm=${encodeURIComponent(q)}&order=desc`, 6000);
    return extractPosts(data).map((p) => postToTitle(p, base)).filter((t): t is Title => t !== null).slice(0, 18);
  } catch {
    return [];
  }
}

function walkMediaLinks(node: unknown, baseApi: string, out: CircleFile[]) {
  if (!node) return;
  if (typeof node === 'string') {
    const fixed = fixUrl(node, baseApi);
    if (/^https?:\/\//i.test(fixed) && MEDIA_RE.test(fixed)) {
      const label = safeDecode(fixed.split('?')[0].split('/').pop() ?? 'Stream');
      const q = QUALITY_RE.exec(label)?.[1].toUpperCase() ?? '1080P';
      const se = SE_RE.exec(label);
      const ep = EP_RE.exec(label);
      out.push({
        url: fixed,
        label,
        quality: q,
        season: se ? Number(se[1]) : undefined,
        episode: se ? Number(se[2]) : ep ? Number(ep[1]) : undefined,
      });
    }
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((n) => walkMediaLinks(n, baseApi, out));
    return;
  }
  if (typeof node === 'object') {
    Object.values(node as Record<string, unknown>).forEach((n) => walkMediaLinks(n, baseApi, out));
  }
}

export async function getFiles(title: Title): Promise<CircleFile[]> {
  try {
    const { data, base } = await fetchCircleJson<unknown>(`/posts/${encodeURIComponent(title.ref)}`, 7000);
    const found: CircleFile[] = [];
    walkMediaLinks(data, base, found);
    const seen = new Set<string>();
    return found.filter((f) => {
      if (seen.has(f.url)) return false;
      seen.add(f.url);
      return true;
    });
  } catch {
    return [];
  }
}

export async function detail(title: Title): Promise<Title> {
  const files = await getFiles(title);
  if (files.length === 0) return { ...title, detailed: true };
  const hasEpisodes = files.some((f) => f.episode !== undefined) || files.length > 1;
  if (title.kind === 'series' || (hasEpisodes && files.length > 2)) {
    const bySeason = new Map<number, Episode[]>();
    files.forEach((f, idx) => {
      const sNum = f.season ?? 1;
      const eNum = f.episode ?? idx + 1;
      const list = bySeason.get(sNum) ?? [];
      list.push({
        id: `${title.id}:s${sNum}:e${eNum}`,
        season: sNum,
        number: eNum,
        name: f.label.replace(/\.[a-z0-9]{2,4}$/i, ''),
        runtime: title.runtime || 24,
        synopsis: `Direct BDIX stream (${f.quality}) on CircleFTP.`,
        still: title.background ?? title.poster,
        directUrl: f.url,
      });
      bySeason.set(sNum, list);
    });
    const seasons: Season[] = [...bySeason.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([number, eps]) => ({ number, episodes: eps.sort((a, b) => a.number - b.number) }));
    return {
      ...title,
      kind: 'series',
      seasons,
      files: files.map((f) => ({ url: f.url, label: f.label })),
      directUrl: files[0]?.url,
      detailed: true,
    };
  }
  return {
    ...title,
    files: files.map((f) => ({ url: f.url, label: f.label })),
    directUrl: files[0]?.url,
    quality: [...new Set(files.map((f) => f.quality))],
    detailed: true,
  };
}
