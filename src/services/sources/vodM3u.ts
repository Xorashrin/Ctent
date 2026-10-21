// Full-Length VOD M3U Playlist Parser (ALL_SOURCES_MASTER.md Part B §4)
// Parses Supabase TMDB Top Movies, Trending Series, and Zaman Movies Complete M3U playlists
// into playable Movie & Series Title cards with posters and direct stream URLs.
import { tintFor, type Title } from '../../data/types';
import { getText } from '../http';

export interface VodPlaylistSource {
  id: string;
  name: string;
  url: string;
  defaultKind: 'movie' | 'series';
}

export const VOD_M3U_SOURCES: VodPlaylistSource[] = [
  {
    id: 'supabase_top_movies',
    name: 'TMDB Top Movies VOD',
    url: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/top-movies.m3u',
    defaultKind: 'movie',
  },
  {
    id: 'supabase_trending_series',
    name: 'TMDB Trending Series VOD',
    url: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/trending-series.m3u',
    defaultKind: 'series',
  },
  {
    id: 'zaman_movies_complete',
    name: 'Zaman BDIX Movies VOD',
    url: 'https://raw.githubusercontent.com/Zaman-Topu/Ip-tv-Collection/main/FINAL_MOVIES_COMPLETE.m3u',
    defaultKind: 'movie',
  },
];

let cachedTitles: Title[] | null = null;

function parseVodM3u(raw: string, src: VodPlaylistSource, limit = 60): Title[] {
  const lines = raw.split(/\r?\n/);
  const out: Title[] = [];
  let pendingInfo: string | null = null;

  for (let i = 0; i < lines.length && out.length < limit; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('#EXTINF')) {
      pendingInfo = line;
      continue;
    }
    if (line.startsWith('#')) continue;
    if (pendingInfo && /^https?:\/\//i.test(line)) {
      const logoMatch = pendingInfo.match(/tvg-logo="([^"]+)"/i);
      const groupMatch = pendingInfo.match(/group-title="([^"]+)"/i);
      const commaIdx = pendingInfo.lastIndexOf(',');
      const rawName = commaIdx >= 0 ? pendingInfo.slice(commaIdx + 1).trim() : 'Untitled Movie';
      const yearMatch = rawName.match(/\((\d{4})\)/);
      const year = yearMatch ? Number(yearMatch[1]) : 2024;
      const cleanName = rawName.replace(/\(\d{4}\)/g, '').replace(/\s+/g, ' ').trim();
      const logo = logoMatch?.[1]?.trim();
      const group = groupMatch?.[1]?.trim() || 'Movies';
      const id = `vodm3u:${src.id}:${out.length}:${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      if (cleanName && logo && /^https?:\/\//i.test(logo)) {
        out.push({
          id,
          source: 'vodm3u',
          ref: line,
          name: cleanName,
          kind: src.defaultKind,
          year,
          maturity: '13+',
          runtime: 115,
          seasons: [],
          genres: [group, 'Direct VOD'],
          synopsis: `${cleanName} (${year}) — Full-length direct stream from ${src.name}.`,
          cast: [],
          creators: [src.name],
          tint: tintFor(id),
          poster: logo,
          background: logo,
          quality: ['1080P', 'Direct'],
          directUrl: line,
          files: [{ url: line, label: `${cleanName} (Direct Stream)` }],
          serverName: src.name,
          detailed: true,
        });
      }
      pendingInfo = null;
    }
  }
  return out;
}

export async function vodM3uFeatured(limit = 36): Promise<Title[]> {
  if (cachedTitles && cachedTitles.length > 0) return cachedTitles.slice(0, limit);
  const results = await Promise.all(
    VOD_M3U_SOURCES.map(async (src) => {
      try {
        const raw = await getText(src.url, { timeout: 8500 });
        return parseVodM3u(raw, src, 30);
      } catch {
        return [];
      }
    }),
  );
  const flat = results.flat();
  if (flat.length > 0) cachedTitles = flat;
  return flat.slice(0, limit);
}

export async function vodM3uSearch(query: string): Promise<Title[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = cachedTitles ?? (await vodM3uFeatured(90));
  return all.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 20);
}
