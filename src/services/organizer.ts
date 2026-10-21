// Cross-Server Content Deduplicator & Organizer — reverse-engineered from app-release.apk (Ln8 package).
// - MergedTitle: normalizes titles across CircleFTP, CyberFTP, AmaderFTP, Southfreak, Cinemeta, AniList & BDIX
//   so duplicate copies collapse into one unified card with `alternatives: AltSource[]`.
// - SearchGroup: groups search results per server/provider alongside category filters & sort options.
import { sourceBadgeName, type AltSource, type Title } from '../data/types';

export type HomeChipFilter = 'ALL' | 'MOVIES' | 'SERIES' | 'ANIME' | 'FILES' | 'MY_LIST';
export type SortOption = 'default' | 'latest' | 'popular' | 'rating';

export interface SearchGroup {
  server: string;
  sourceId: string;
  online: boolean;
  items: Title[];
}

// Normalization regexes extracted from Ln8/n & Ln8/r in app-release.apk
const YEAR_TAGS = /\(\d{4}\)|\[\d{4}\]/g;
const QUALITY_TAGS = /\b(1080p|720p|480p|2160p|4k|web-?dl|webrip|hdrip|bluray|x264|x265|hevc|dual audio|hindi dubbed|esub|aac)\b/gi;
const SEASON_TAGS = /\b(?:season|series)\s*(\d{1,2})\b|\bs(\d{1,2})\b|\b(\d{1,2})(?:st|nd|rd|th)\s+season\b/gi;
const PART_TAGS = /\b(?:part|pt|cour)\s*(\d{1,2})\b/gi;

export function normalizeTitleKey(rawName: string, year?: number): string {
  const base = rawName
    .replace(YEAR_TAGS, ' ')
    .replace(QUALITY_TAGS, ' ')
    .replace(SEASON_TAGS, ' s$1$2$3 ')
    .replace(PART_TAGS, ' p$1 ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return year ? `${base}:${Math.floor(year / 2)}` : base;
}

/**
 * Merges duplicate titles across multiple BDIX and global sources into a single primary Title
 * with `alternatives: AltSource[]` attached (Ln8/o MergedTitle).
 */
export function mergeAcrossServers(titles: Title[]): Title[] {
  const groups = new Map<string, Title[]>();
  for (const t of titles) {
    const key = normalizeTitleKey(t.name, t.year);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  const out: Title[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      const single = group[0];
      out.push({
        ...single,
        serverName: single.serverName ?? sourceBadgeName(single.source),
      });
      continue;
    }
    // Prefer entry with rich poster + backdrop + rating as display base, while keeping BDIX directUrl/files
    const sorted = [...group].sort((a, b) => {
      const score = (x: Title) =>
        (x.poster ? 4 : 0) +
        (x.imdbRating ? 2 : 0) +
        (x.synopsis ? 2 : 0) +
        (x.directUrl || (x.files && x.files.length > 0) ? 3 : 0);
      return score(b) - score(a);
    });
    const primary = sorted[0];
    const directHit = sorted.find((x) => x.directUrl || (x.files && x.files.length > 0));
    const alternatives: AltSource[] = sorted.map((item) => ({
      id: item.id,
      source: item.source,
      serverName: item.serverName ?? sourceBadgeName(item.source),
      quality: item.quality.length ? item.quality : ['HD'],
      directUrl: item.directUrl ?? item.files?.[0]?.url,
    }));
    const mergedQualities = [...new Set(sorted.flatMap((x) => x.quality))].slice(0, 4);
    out.push({
      ...primary,
      directUrl: primary.directUrl ?? directHit?.directUrl,
      files: primary.files ?? directHit?.files,
      quality: mergedQualities.length ? mergedQualities : primary.quality,
      serverName: directHit ? (directHit.serverName ?? sourceBadgeName(directHit.source)) : sourceBadgeName(primary.source),
      alternatives,
    });
  }
  return out;
}

/**
 * Organizes search results into per-server groups (Ln8/p SearchGroup).
 */
export function groupSearchByServer(titles: Title[]): SearchGroup[] {
  const map = new Map<string, SearchGroup>();
  for (const t of titles) {
    const serverLabel = t.serverName ?? sourceBadgeName(t.source);
    const existing = map.get(serverLabel) ?? {
      server: serverLabel,
      sourceId: t.source,
      online: true,
      items: [],
    };
    existing.items.push(t);
    map.set(serverLabel, existing);
  }
  // Order BDIX / direct FTP servers first, then global catalogs
  const rank = (s: SearchGroup) =>
    s.sourceId === 'circleftp' || s.sourceId === 'cyberftp' || s.sourceId === 'bdix' || s.sourceId === 'amaderftp'
      ? 0
      : s.sourceId === 'southfreak' || s.sourceId === 'animedirect'
        ? 1
        : 2;
  return [...map.values()].sort((a, b) => rank(a) - rank(b) || b.items.length - a.items.length);
}

/**
 * Filters a list of titles by Ctent Home/Search chip category.
 */
export function filterTitlesByChip(titles: Title[], chip: HomeChipFilter, myListIds: string[] = []): Title[] {
  switch (chip) {
    case 'ALL':
      return titles;
    case 'MOVIES':
      return titles.filter((t) => t.kind === 'movie' && t.source !== 'anilist' && !t.genres.includes('Anime'));
    case 'SERIES':
      return titles.filter((t) => t.kind === 'series' && t.source !== 'anilist' && !t.genres.includes('Anime'));
    case 'ANIME':
      return titles.filter((t) => t.source === 'anilist' || t.source === 'animedirect' || t.genres.includes('Anime') || t.quality.includes('Anime'));
    case 'FILES':
      return titles.filter(
        (t) =>
          t.source === 'bdix' ||
          t.source === 'circleftp' ||
          t.source === 'cyberftp' ||
          t.source === 'amaderftp' ||
          !!t.directUrl ||
          (t.files && t.files.length > 0),
      );
    case 'MY_LIST': {
      const set = new Set(myListIds);
      return titles.filter((t) => set.has(t.id));
    }
  }
}

/**
 * Sorts titles by Ctent Catalog/SeeAll SortOption (Lt8).
 */
export function sortTitles(titles: Title[], sort: SortOption): Title[] {
  if (sort === 'default') return titles;
  const copy = [...titles];
  if (sort === 'latest') {
    return copy.sort((a, b) => (b.year || 0) - (a.year || 0) || (b.addedAt ?? 0) - (a.addedAt ?? 0));
  }
  if (sort === 'rating') {
    return copy.sort((a, b) => ( parseFloat(b.imdbRating ?? '0') || 0) - (parseFloat(a.imdbRating ?? '0') || 0));
  }
  if (sort === 'popular') {
    return copy.sort(
      (a, b) =>
        (b.alternatives?.length ?? 1) - (a.alternatives?.length ?? 1) ||
        (parseFloat(b.imdbRating ?? '0') || 0) - (parseFloat(a.imdbRating ?? '0') || 0),
    );
  }
  return copy;
}
