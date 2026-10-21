// CyberFTP v2 Native Provider (Lm8 from app-release.apk)
// Endpoints extracted via REA:
// - https://local.cyberftp.net/api/v2/movies/
// - https://local.cyberftp.net/api/v2/series/
// - https://local.cyberftp.net/api/v2/search?q=
// - https://local.cyberftp.net/api/v2/stream/{id}
import { tintFor, type Episode, type Season, type Title } from '../../data/types';
import { getJson, getText, withTimeout } from '../http';

const BASE = 'https://local.cyberftp.net';
const QUALITY_RE = /\b(2160p|4K|1440p|1080p|720p|480p)\b/i;

interface CyberItem {
  id?: number | string;
  slug?: string;
  title?: string;
  name?: string;
  type?: string;
  year?: number | string;
  releaseYear?: number | string;
  rating?: number | string;
  imdbRating?: number | string;
  poster?: string;
  posterUrl?: string;
  backdrop?: string;
  backdropUrl?: string;
  overview?: string;
  synopsis?: string;
  quality?: string;
  genres?: string[];
  fileId?: number | string;
  streamUrl?: string;
}

export interface CyberFile {
  url: string;
  label: string;
  quality: string;
}

function resolveImg(raw: string | undefined, size = 'w500'): string | undefined {
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) {
    if (/^\/[a-zA-Z0-9]{20,}\.(jpg|png|webp)$/i.test(raw)) {
      return `https://image.tmdb.org/t/p/${size}${raw}`;
    }
    return `${BASE}${raw}`;
  }
  return `${BASE}/${raw}`;
}

function toTitle(item: CyberItem, defaultKind: 'movie' | 'series' = 'movie', forceAnime = false): Title | null {
  const name = (item.title ?? item.name ?? '').trim();
  const ref = String(item.slug ?? item.id ?? '').trim();
  if (!name || !ref) return null;
  const kind = /series|tv|show/i.test(String(item.type ?? defaultKind)) ? 'series' : 'movie';
  const year = Number(item.year ?? item.releaseYear) || new Date().getFullYear();
  const poster = resolveImg(item.poster ?? item.posterUrl, 'w500');
  const background = resolveImg(item.backdrop ?? item.backdropUrl, 'w780') ?? poster;
  const q = item.quality ? [String(item.quality).toUpperCase()] : ['1080P'];
  const id = `cy:${kind}:${ref}`;
  const directUrl = item.streamUrl
    ? item.streamUrl.startsWith('http')
      ? item.streamUrl
      : `${BASE}${item.streamUrl}`
    : item.fileId
      ? `${BASE}/api/v2/stream/${item.fileId}`
      : undefined;

  return {
    id,
    source: 'cyberftp',
    ref: `${kind}/${ref}`,
    name,
    kind,
    year,
    maturity: '13+',
    runtime: 0,
    seasons: [],
    genres: forceAnime ? ['Anime', ...(item.genres ?? [])] : (item.genres ?? []),
    synopsis: (item.overview ?? item.synopsis ?? 'Direct BDIX stream hosted on CyberFTP.').trim(),
    cast: [],
    creators: [],
    tint: tintFor(id),
    quality: q,
    poster,
    background,
    imdbRating: item.rating || item.imdbRating ? String(item.rating ?? item.imdbRating).slice(0, 3) : undefined,
    directUrl,
    serverName: 'CyberFTP',
    detailed: false,
  };
}

function unwrapList(data: unknown): CyberItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as CyberItem[];
  if (typeof data === 'object') {
    const o = data as Record<string, unknown>;
    for (const k of ['items', 'results', 'movies', 'series', 'data']) {
      if (Array.isArray(o[k])) return o[k] as CyberItem[];
    }
  }
  return [];
}

export async function latestMovies(): Promise<Title[]> {
  try {
    const data = await withTimeout(getJson<unknown>(`${BASE}/api/v2/movies/?sort=released`, { timeout: 6500, retries: 0 }), 7000, 'CyberFTP');
    return unwrapList(data).map((m) => toTitle(m, 'movie')).filter((t): t is Title => t !== null);
  } catch {
    return [];
  }
}

export async function anime(): Promise<Title[]> {
  try {
    const [seriesData, moviesData] = await Promise.all([
      getJson<unknown>(`${BASE}/api/v2/series/?category=anime-tv-series&sort=released`, { timeout: 6500, retries: 0 }).catch(() => null),
      getJson<unknown>(`${BASE}/api/v2/movies/?category=anime-movies&sort=released`, { timeout: 6500, retries: 0 }).catch(() => null),
    ]);
    return [
      ...unwrapList(seriesData).map((s) => toTitle(s, 'series', true)),
      ...unwrapList(moviesData).map((m) => toTitle(m, 'movie', true)),
    ].filter((t): t is Title => t !== null);
  } catch {
    return [];
  }
}

export async function search(query: string): Promise<Title[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const data = await withTimeout(
      getJson<unknown>(`${BASE}/api/v2/search?q=${encodeURIComponent(q)}`, { timeout: 6000, retries: 0 }),
      6500,
      'CyberFTP search',
    );
    return unwrapList(data).map((item) => toTitle(item)).filter((t): t is Title => t !== null).slice(0, 16);
  } catch {
    return [];
  }
}

export async function getFiles(title: Title): Promise<CyberFile[]> {
  if (title.directUrl) {
    return [{ url: title.directUrl, label: `${title.name} (CyberFTP)`, quality: title.quality[0] ?? '1080P' }];
  }
  const out: CyberFile[] = [];
  try {
    const cleanRef = title.ref.replace(/^\/+/, '');
    const apiPath = cleanRef.startsWith('movie/')
      ? `/api/v2/movies/${cleanRef.slice(6)}`
      : cleanRef.startsWith('series/')
        ? `/api/v2/series/${cleanRef.slice(7)}`
        : `/api/v2/movies/${cleanRef}`;
    const raw = await getText(`${BASE}${apiPath}`, { timeout: 6500, retries: 0 }).catch(() => '');
    const pageHtml = raw || (await getText(`${BASE}/${cleanRef}`, { timeout: 6500, retries: 0 }).catch(() => ''));
    for (const m of pageHtml.matchAll(/\/api\/v2\/(?:stream|pkg)\/(\d+)/g)) {
      const url = `${BASE}/api/v2/stream/${m[1]}`;
      if (!out.some((x) => x.url === url)) {
        out.push({ url, label: `${title.name} • Stream #${m[1]}`, quality: '1080P' });
      }
    }
    for (const m of pageHtml.matchAll(/https?:\/\/[^\s"'<>\\]+\.(?:mp4|mkv|m3u8)(?:\?[^\s"'<>\\]*)?/gi)) {
      const url = m[0];
      if (!out.some((x) => x.url === url)) {
        const q = QUALITY_RE.exec(url)?.[1].toUpperCase() ?? '1080P';
        out.push({ url, label: url.split('/').pop() ?? title.name, quality: q });
      }
    }
  } catch {
    // ignore
  }
  return out;
}

export async function detail(title: Title): Promise<Title> {
  const files = await getFiles(title);
  if (files.length === 0) return { ...title, detailed: true };
  if (title.kind === 'series' && files.length > 1) {
    const episodes: Episode[] = files.map((f, idx) => ({
      id: `${title.id}:1:${idx + 1}`,
      season: 1,
      number: idx + 1,
      name: `Episode ${idx + 1}`,
      runtime: title.runtime || 24,
      synopsis: f.label,
      still: title.background ?? title.poster,
      directUrl: f.url,
    }));
    const seasons: Season[] = [{ number: 1, episodes }];
    return { ...title, seasons, files: files.map((f) => ({ url: f.url, label: f.label })), directUrl: files[0]?.url, detailed: true };
  }
  return {
    ...title,
    files: files.map((f) => ({ url: f.url, label: f.label })),
    directUrl: files[0]?.url,
    detailed: true,
  };
}
