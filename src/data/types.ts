// Shared catalog types. Every Title comes from a live source adapter (src/services/sources).

export type Kind = 'series' | 'movie';
export type Maturity = 'ALL' | '7+' | '13+' | '16+' | '18+';
export type Badge = 'new' | 'new-episode' | 'airing';

/** Where a title came from. Decides how it is played, downloaded and refreshed. */
export type SourceId =
  | 'southfreak'
  | 'sfadult'
  | 'amaderftp'
  | 'circleftp'
  | 'cyberftp'
  | 'bdix'
  | 'animedirect'
  | 'archive'
  | 'vodm3u'
  | 'stremio'
  | 'cinemeta'
  | 'anilist';

export type SectionStyle = 'POSTER' | 'LANDSCAPE' | 'TOP10' | 'FOLDER';

export interface Episode {
  id: string;
  season: number;
  number: number;
  name: string;
  runtime: number;
  synopsis: string;
  still?: string;
  airDate?: string;
  directUrl?: string;
}

export interface Season {
  number: number;
  episodes: Episode[];
}

export interface AltSource {
  id: string;
  source: SourceId;
  serverName: string;
  quality: string[];
  directUrl?: string;
}

export interface Title {
  id: string;
  source: SourceId;
  /** Provider-specific reference: post link, IMDb id, AniList id or detail page id. */
  ref: string;
  name: string;
  kind: Kind;
  year: number;
  maturity: Maturity;
  /** Minutes; 0 when unknown. */
  runtime: number;
  seasons: Season[];
  genres: string[];
  synopsis: string;
  cast: string[];
  creators: string[];
  tint: string;
  /** Labels such as 1080p, WEB-DL, Dual Audio. */
  quality: string[];
  language?: string;
  poster?: string;
  background?: string;
  imdbRating?: string;
  imdbId?: string;
  tmdbId?: number;
  /** TMDB season this entry maps to (anime sequels are separate AniList entries). */
  tmdbSeason?: number;
  /** When the source published the title (ms since epoch). Drives "New" badges. */
  addedAt?: number;
  badge?: Badge;
  /** Next airing episode for ongoing anime. */
  airing?: { episode: number; at: number };
  /** Direct file URL known up front (BDIX/FTP sources). */
  directUrl?: string;
  /** All direct files known up front (BDIX index servers). */
  files?: { url: string; label: string }[];
  /** Stremio addon that owns this title (adult catalogs). */
  addon?: string;
  nsfw?: boolean;
  /** True once the detail fetch (episodes, cast, full synopsis) has completed. */
  detailed?: boolean;
  /** Human-readable server origin badge (e.g. CircleFTP, CyberFTP, DhakaFlix, AniList). */
  serverName?: string;
  /** Alternative copies merged across servers via ContentRepository (Ln8). */
  alternatives?: AltSource[];
}

export interface Profile {
  id: string;
  name: string;
  color: string;
  kids?: boolean;
}

export const MAIN_PROFILE_ID = 'main';
export const PROFILE_COLOR = '#00E5B0';

export const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family',
  'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller',
];

export function findEpisode(title: Title, episodeId?: string): { season: Season; episode: Episode } | null {
  for (const season of title.seasons) {
    for (const episode of season.episodes) {
      if (!episodeId || episode.id === episodeId) return { season, episode };
    }
  }
  return null;
}

export function nextEpisode(title: Title, episodeId: string): Episode | null {
  const all = title.seasons.flatMap((s) => s.episodes);
  const i = all.findIndex((e) => e.id === episodeId);
  return i >= 0 && i + 1 < all.length ? all[i + 1] : null;
}

const TINTS = ['#0D1F2D', '#0E2438', '#112A3E', '#14263B', '#0F292E', '#17253B', '#122234', '#0C1E2C', '#102536', '#0E2231'];

export function tintFor(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return TINTS[(h >>> 0) % TINTS.length];
}

export function sourceBadgeName(source: SourceId, custom?: string): string {
  if (custom) return custom;
  switch (source) {
    case 'circleftp':
      return 'CircleFTP';
    case 'cyberftp':
      return 'CyberFTP';
    case 'amaderftp':
      return 'AmaderFTP';
    case 'bdix':
      return 'BDIX';
    case 'southfreak':
      return 'Southfreak';
    case 'animedirect':
      return 'Anime Direct';
    case 'archive':
      return 'Archive PD';
    case 'vodm3u':
      return 'Direct VOD';
    case 'anilist':
      return 'AniList';
    case 'cinemeta':
      return 'Global';
    case 'stremio':
      return 'Addon';
    case 'sfadult':
      return '18+';
  }
}
