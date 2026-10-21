// Catalog & ContentRepository (Ln8 from app-release.apk):
// Loads live rows from CircleFTP, CyberFTP, AmaderFTP, Southfreak, Cinemeta, AniList, Stremio & BDIX,
// caches feeds (stale-while-revalidate), and deduplicates multi-server hits via mergeAcrossServers.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { sourceBadgeName, tintFor, type SectionStyle, type Title } from '../data/types';
import { verifyLater } from './availability';
import { isListed, useAvailabilityVersion } from './availabilityStore';
import { cached } from './cache';
import { mergeAcrossServers } from './organizer';
import * as amaderftp from './sources/amaderftp';
import * as anilist from './sources/anilist';
import * as bdix from './sources/bdix';
import * as cinemeta from './sources/cinemeta';
import * as circleftp from './sources/circleftp';
import * as cyberftp from './sources/cyberftp';
import * as stremio from './sources/stremio';
import { CATEGORY, listPosts, SOUTHFREAK, SOUTHFREAK_18 } from './sources/wordpress';

const NEW_WINDOW = 72 * 3600 * 1000;
const FEED_TTL = 12 * 60 * 1000;
const SAVED_KEY = 'ctent:titles:v1';

// ---------------------------------------------------------------- title registry

const registry = new Map<string, Title>();

export function register(titles: Title[]): Title[] {
  const now = Date.now();
  return titles.map((t) => {
    const prev = registry.get(t.id);
    const merged = prev?.detailed && !t.detailed ? { ...t, ...prev, badge: undefined } : t;
    const fresh = merged.addedAt !== undefined && now - merged.addedAt < NEW_WINDOW;
    const final: Title = {
      ...merged,
      serverName: merged.serverName ?? sourceBadgeName(merged.source),
      badge: merged.airing ? 'airing' : fresh ? 'new' : undefined,
    };
    registry.set(t.id, final);
    return final;
  });
}

function stub(id: string): Title {
  return {
    id,
    source: 'cinemeta',
    ref: id,
    name: 'Unavailable title',
    kind: 'movie',
    year: new Date().getFullYear(),
    maturity: '13+',
    runtime: 0,
    seasons: [],
    genres: [],
    synopsis: '',
    cast: [],
    creators: [],
    tint: tintFor(id),
    quality: [],
  };
}

export function resolveTitle(id: string): Title {
  return registry.get(id) ?? stub(id);
}

export function registeredNames(): string[] {
  return [...new Set([...registry.values()].map((t) => t.name))];
}

export function hasTitle(id: string): boolean {
  return registry.has(id);
}

export async function loadSavedTitles(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    if (raw) {
      for (const t of JSON.parse(raw) as Title[]) {
        if (!registry.has(t.id)) registry.set(t.id, t);
      }
    }
  } catch {
    // first run
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function saveTitles(ids: string[]) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const list = [...new Set(ids)]
      .map((id) => registry.get(id))
      .filter((t): t is Title => !!t)
      .map((t) => ({ ...t, seasons: t.seasons.length > 40 ? [] : t.seasons }));
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify(list)).catch(() => undefined);
  }, 800);
}

// ---------------------------------------------------------------- detail

const detailJobs = new Map<string, Promise<Title>>();

export function loadDetail(id: string): Promise<Title> {
  const base = registry.get(id);
  if (!base) return Promise.resolve(stub(id));
  if (base.detailed) return Promise.resolve(base);
  const running = detailJobs.get(id);
  if (running) return running;
  const job = (async () => {
    try {
      const fresh =
        base.source === 'cinemeta'
          ? await cinemeta.detail(base)
          : base.source === 'anilist'
            ? await anilist.detail(base)
            : base.source === 'amaderftp'
              ? await amaderftp.detail(base)
              : base.source === 'circleftp'
                ? await circleftp.detail(base)
                : base.source === 'cyberftp'
                  ? await cyberftp.detail(base)
                  : { ...base, detailed: true };
      return register([fresh])[0];
    } catch {
      return base;
    } finally {
      detailJobs.delete(id);
    }
  })();
  detailJobs.set(id, job);
  return job;
}

// ---------------------------------------------------------------- feeds

export interface RowDef {
  key: string;
  title: string;
  subtitle?: string;
  style?: SectionStyle;
  load: (force?: boolean) => Promise<Title[]>;
  nsfw?: boolean;
}

const feed = (key: string, load: () => Promise<Title[]>, ttl = FEED_TTL) => async (force?: boolean) =>
  register(await cached(`feed:${key}`, { ttl, force }, load));

function wp(key: string, category: number | undefined, perPage = 20): RowDef['load'] {
  return feed(`sf:${key}`, () => listPosts(SOUTHFREAK, { category, perPage }));
}

export const HOME_ROWS: RowDef[] = [
  {
    key: 'bdix-fast',
    title: 'On Your BDIX Servers',
    subtitle: 'Full speed · CircleFTP, CyberFTP & AmaderFTP',
    style: 'POSTER',
    load: feed('bdix:fast', async () => {
      const [cf, cy, ft] = await Promise.all([
        circleftp.latest().catch(() => []),
        cyberftp.latestMovies().catch(() => []),
        amaderftp.latest().catch(() => []),
      ]);
      return mergeAcrossServers([...cf, ...cy, ...ft]);
    }),
  },
  {
    key: 'sf-latest',
    title: 'Fresh Releases',
    subtitle: 'Latest Dual Audio & HD uploads',
    style: 'POSTER',
    load: wp('latest', undefined, 24),
  },
  {
    key: 'cm-movies',
    title: 'Top 10 Movies Today',
    subtitle: 'Global box-office & streaming chart',
    style: 'TOP10',
    load: feed('cm:movie', () => cinemeta.catalog('movie')),
  },
  {
    key: 'cm-series',
    title: 'Trending TV & Web Series',
    subtitle: 'Binge-worthy series across all servers',
    style: 'LANDSCAPE',
    load: feed('cm:series', () => cinemeta.catalog('series')),
  },
  {
    key: 'sf-hindi',
    title: 'Hindi Dubbed Vault',
    subtitle: 'Multi-mirror 1080p & 720p',
    style: 'POSTER',
    load: wp('hindi', CATEGORY.hindiDubbed),
  },
  {
    key: 'sf-hollywood',
    title: 'Hollywood Blockbusters',
    style: 'POSTER',
    load: wp('hollywood', CATEGORY.hollywood),
  },
  {
    key: 'sf-bollywood',
    title: 'Bollywood Hits',
    style: 'POSTER',
    load: wp('bollywood', CATEGORY.bollywood),
  },
  {
    key: 'sf-south',
    title: 'South Indian Action',
    subtitle: 'Telugu, Tamil & Malayalam',
    style: 'POSTER',
    load: feed('sf:south', async () =>
      (
        await Promise.all(
          [CATEGORY.telugu, CATEGORY.tamil, CATEGORY.malayalam].map((c) =>
            listPosts(SOUTHFREAK, { category: c, perPage: 10 }).catch(() => []),
          ),
        )
      )
        .flat()
        .sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0)),
    ),
  },
  {
    key: 'sf-korean',
    title: 'K-Drama & Korean Cinema',
    style: 'POSTER',
    load: wp('korean', CATEGORY.korean),
  },
  {
    key: 'al-trending',
    title: 'Top 10 Anime Now',
    subtitle: 'Simulcast & BDIX direct anime',
    style: 'TOP10',
    load: feed('al:trending', () => anilist.trending()),
  },
  {
    key: 'sf-scifi',
    title: 'Sci-Fi & Cyberpunk',
    style: 'POSTER',
    load: wp('scifi', CATEGORY.scifi),
  },
  {
    key: 'sf-horror',
    title: 'Horror & Supernatural',
    style: 'POSTER',
    load: wp('horror', CATEGORY.horror),
  },
  {
    key: 'sf-animation',
    title: 'Animated Features',
    style: 'POSTER',
    load: wp('animation', CATEGORY.animation),
  },
];

const anime = (
  key: string,
  title: string,
  o: anilist.BrowseOptions,
  style: SectionStyle = 'POSTER',
  subtitle?: string,
  ttl = FEED_TTL,
): RowDef => ({
  key,
  title,
  subtitle,
  style,
  load: feed(`al:${key}`, () => anilist.browse(o), ttl),
});

const THIS_SEASON = anilist.currentSeason();
const NEXT_SEASON = anilist.nextSeason();

export const ANIME_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

/** Rows of the Ctent Anime Hub (Lq8): BDIX anime first, followed by AniList schedule, seasons & top charts. */
export const ANIME_ROWS: RowDef[] = [
  {
    key: 'an-bdix',
    title: 'On Your BDIX Servers',
    subtitle: 'Full speed, no buffering · CircleFTP & CyberFTP Anime',
    style: 'POSTER',
    load: feed('an:bdix', async () => {
      const [cf, cy] = await Promise.all([circleftp.anime().catch(() => []), cyberftp.anime().catch(() => [])]);
      return mergeAcrossServers([...cf, ...cy]);
    }),
  },
  {
    key: 'an-schedule',
    title: 'Airing This Week',
    subtitle: 'Live simulcast countdown',
    style: 'LANDSCAPE',
    load: feed('al:schedule', () => anilist.upcoming(7), 30 * 60 * 1000),
  },
  anime('an-trending', 'Top 10 Trending Anime', { sort: 'TRENDING_DESC' }, 'TOP10', 'Most watched right now'),
  anime(
    'an-season',
    `Popular This Season (${THIS_SEASON.season} ${THIS_SEASON.year})`,
    { sort: 'POPULARITY_DESC', season: THIS_SEASON.season, seasonYear: THIS_SEASON.year },
    'POSTER',
  ),
  anime('an-airing', 'Currently Airing', { sort: 'POPULARITY_DESC', status: 'RELEASING' }, 'POSTER'),
  anime('an-popular', 'All-Time Popular', { sort: 'POPULARITY_DESC' }, 'POSTER', undefined, 6 * 3600 * 1000),
  anime('an-top', 'Top Rated Classics', { sort: 'SCORE_DESC' }, 'POSTER', undefined, 6 * 3600 * 1000),
  anime('an-movies', 'Anime Movies', { sort: 'POPULARITY_DESC', format: ['MOVIE'] }, 'POSTER', undefined, 6 * 3600 * 1000),
  anime(
    'an-next',
    'Coming Next Season',
    { sort: 'POPULARITY_DESC', season: NEXT_SEASON.season, seasonYear: NEXT_SEASON.year },
    'POSTER',
    undefined,
    6 * 3600 * 1000,
  ),
  anime('an-action', 'Action & Shonen', { sort: 'POPULARITY_DESC', genre: 'Action' }, 'POSTER', undefined, 6 * 3600 * 1000),
  anime('an-romance', 'Romance & Drama', { sort: 'POPULARITY_DESC', genre: 'Romance' }, 'POSTER', undefined, 6 * 3600 * 1000),
  anime('an-fantasy', 'Isekai & Fantasy', { sort: 'POPULARITY_DESC', genre: 'Fantasy' }, 'POSTER', undefined, 6 * 3600 * 1000),
];

export async function loadAnimeGenre(genre: string, page: number): Promise<Title[]> {
  return register(await anilist.browse({ sort: 'POPULARITY_DESC', genre, page, perPage: 30 }));
}

export const ADULT_ROWS: RowDef[] = stremio.ONLYPORN_CATALOGS.map((c) => ({
  key: `sx-${c.id}`,
  title: c.name,
  style: 'POSTER',
  load: feed(`sx:${c.id}`, () => stremio.catalog(stremio.ONLYPORN, c.id)),
  nsfw: true,
}));

export async function loadAdultPage(page: number): Promise<Title[]> {
  return register(await listPosts(SOUTHFREAK_18, { page, perPage: 30 }));
}

// ---------------------------------------------------------------- search

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function score(t: Title, q: string): number {
  const n = norm(t.name);
  const bdixBonus =
    t.source === 'circleftp' || t.source === 'cyberftp' || t.source === 'bdix' || t.source === 'amaderftp' ? 18 : 0;
  const langBonus = /beng|bangla|bangladesh/i.test(`${t.language ?? ''} ${t.genres.join(' ')}`) ? 12 : 0;
  const copyBonus = Math.min(12, ((t.alternatives?.length ?? 1) - 1) * 4);
  const bonus = bdixBonus + langBonus + copyBonus;
  if (n === q) return 100 + bonus;
  if (n.startsWith(q)) return 80 + bonus;
  if (n.includes(q)) return 60 + bonus;
  return (q.split(' ').every((w) => n.includes(w)) ? 40 : 10) + bonus;
}

async function bdixTitles(query: string): Promise<Title[]> {
  const hits = await bdix.search(query, 8000);
  const byName = new Map<string, { name: string; year: number; files: { url: string; label: string }[]; server: string }>();
  for (const { server, files } of hits) {
    for (const f of files) {
      const base = f.label.replace(/\.[a-z0-9]{2,4}$/i, '');
      const cut = /^(.*?)[\s._(\[]+((?:19|20)\d{2})\b/.exec(base);
      const name = (cut ? cut[1] : base.split(/[\s._]+(?:\d{3,4}p|WEB|BluRay|HDRip)/i)[0])
        .replace(/[._]+/g, ' ')
        .trim();
      if (!name) continue;
      const year = cut ? Number(cut[2]) : new Date().getFullYear();
      const key = `${norm(name)}-${year}`;
      const entry = byName.get(key) ?? { name, year, files: [], server: server.name };
      entry.files.push(f);
      byName.set(key, entry);
    }
  }
  return [...byName.values()].map((e) => bdix.filesToTitle(e.name, e.year, e.files, e.server));
}

// ---------------------------------------------------------------- endless feed

const CM_MOVIE_GENRES = [
  'Action', 'Comedy', 'Drama', 'Thriller', 'Horror', 'Sci-Fi', 'Romance', 'Animation', 'Crime', 'Adventure',
  'Fantasy', 'Mystery', 'Family', 'Documentary', 'War', 'History', 'Music', 'Western', 'Biography', 'Sport',
];
const CM_SERIES_GENRES = [
  'Drama', 'Comedy', 'Crime', 'Action', 'Sci-Fi', 'Mystery', 'Animation', 'Fantasy', 'Documentary', 'Romance',
  'Horror', 'Reality-TV', 'Adventure', 'Family', 'History',
];
const SF_CATEGORIES: [string, number][] = [
  ['Hindi Dubbed', CATEGORY.hindiDubbed],
  ['Hollywood', CATEGORY.hollywood],
  ['Bollywood', CATEGORY.bollywood],
  ['Dual Audio', CATEGORY.dualAudio],
  ['Telugu', CATEGORY.telugu],
  ['Tamil', CATEGORY.tamil],
  ['Malayalam', CATEGORY.malayalam],
  ['Korean', CATEGORY.korean],
  ['Bangla', CATEGORY.bengali],
  ['Thriller', 8],
  ['Comedy', 9],
  ['Action', 3],
  ['Drama', 10],
  ['Romance', 6],
  ['Crime', 7],
  ['Adventure', 33],
  ['Animation', CATEGORY.animation],
];

export function feedRow(i: number): RowDef {
  const lane = i % 4;
  const n = Math.floor(i / 4);
  const more = (page: number) => (page > 1 ? 'More ' : '');
  if (lane === 0) {
    const genre = CM_MOVIE_GENRES[n % CM_MOVIE_GENRES.length];
    const page = Math.floor(n / CM_MOVIE_GENRES.length);
    return {
      key: `feed-${i}`,
      title: `${more(page + 1)}${genre} Movies`,
      style: 'POSTER',
      load: feed(`feed:cm:m:${genre}:${page}`, () => cinemeta.catalog('movie', { genre, skip: page * 50 }), 6 * 3600 * 1000),
    };
  }
  if (lane === 1) {
    const [name, id] = SF_CATEGORIES[n % SF_CATEGORIES.length];
    const page = Math.floor(n / SF_CATEGORIES.length) + 1;
    return {
      key: `feed-${i}`,
      title: `${more(page)}${name}`,
      style: 'POSTER',
      load: feed(`feed:sf:${id}:${page}`, () => listPosts(SOUTHFREAK, { category: id, perPage: 20, page }), 6 * 3600 * 1000),
    };
  }
  if (lane === 2) {
    const genre = CM_SERIES_GENRES[n % CM_SERIES_GENRES.length];
    const page = Math.floor(n / CM_SERIES_GENRES.length);
    return {
      key: `feed-${i}`,
      title: `${more(page + 1)}${genre} Series`,
      style: 'POSTER',
      load: feed(`feed:cm:s:${genre}:${page}`, () => cinemeta.catalog('series', { genre, skip: page * 50 }), 6 * 3600 * 1000),
    };
  }
  const genre = ANIME_GENRES[n % ANIME_GENRES.length];
  const page = Math.floor(n / ANIME_GENRES.length) + 1;
  return {
    key: `feed-${i}`,
    title: `${more(page)}${genre} Anime`,
    style: 'POSTER',
    load: feed(
      `feed:al:${genre}:${page}`,
      () => anilist.browse({ sort: 'POPULARITY_DESC', genre, page, perPage: 20 }),
      6 * 3600 * 1000,
    ),
  };
}

export function useFeedRows() {
  const [rows, setRows] = useState<RowState[]>([]);
  const requested = useRef(0);
  const loading = useRef(0);
  const availability = useAvailabilityVersion();
  const stable = useRef(new Map<string, { src: Title[]; out: Title[]; v: number }>()).current;

  const loadRow = useCallback(async (i: number) => {
    const def = feedRow(i);
    loading.current++;
    setRows((prev) => [...prev, { def, items: [], loading: true, error: false }]);
    try {
      const items = await def.load();
      setRows((prev) => prev.map((r) => (r.def.key === def.key ? { ...r, items, loading: false } : r)));
    } catch {
      setRows((prev) => prev.map((r) => (r.def.key === def.key ? { ...r, loading: false, error: true } : r)));
    } finally {
      loading.current--;
    }
  }, []);

  const more = useCallback(
    (count = 3) => {
      if (loading.current >= 4) return;
      for (let k = 0; k < count; k++) loadRow(requested.current++);
    },
    [loadRow],
  );

  useEffect(() => {
    const pending = rows
      .flatMap((r) => r.items.slice(0, 6))
      .filter((t) => t.source === 'cinemeta' || t.source === 'anilist');
    if (pending.length > 0) verifyLater(pending);
  }, [rows]);

  const visible = useMemo(
    () =>
      rows
        .map((r) => {
          const hit = stable.get(r.def.key);
          if (hit && hit.src === r.items && hit.v === availability) return { ...r, items: hit.out };
          const out = r.items.filter(isListed);
          stable.set(r.def.key, { src: r.items, out, v: availability });
          return { ...r, items: out };
        })
        .filter((r) => r.loading || r.items.length > 0),
    [rows, availability, stable],
  );

  return { rows: visible, more };
}

export function rowsByKey(...keys: string[]): RowDef[] {
  return keys.map((k) => HOME_ROWS.find((r) => r.key === k)).filter((r): r is RowDef => !!r);
}

function queryVariants(query: string): string[] {
  const full = query.trim();
  const beforeColon = full.split(/\s*[:–—]\s*|\s+-\s+/)[0].trim();
  const words = full.split(/\s+/);
  const noArticle = full.replace(/^(the|a|an)\s+/i, '');
  const shorter = words.length > 2 ? words.slice(0, -1).join(' ') : '';
  return [...new Set([full, beforeColon, noArticle, shorter].filter((v) => v.length >= 2))].slice(0, 3);
}

async function searchOnce(query: string, includeAdult: boolean): Promise<Title[]> {
  const jobs: Promise<Title[]>[] = [
    circleftp.search(query),
    cyberftp.search(query),
    amaderftp.search(query),
    bdixTitles(query),
    listPosts(SOUTHFREAK, { search: query, perPage: 15 }),
    cinemeta.search(query),
    anilist.search(query),
  ];
  if (includeAdult) {
    jobs.push(listPosts(SOUTHFREAK_18, { search: query, perPage: 15 }));
    jobs.push(stremio.catalog(stremio.ONLYPORN, 'eporner', { search: query }));
  }
  const settled = await Promise.allSettled(
    jobs.map((j) =>
      Promise.race([
        j,
        new Promise<Title[]>((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000)),
      ]),
    ),
  );
  return settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

/**
 * Multi-source search across CircleFTP, CyberFTP, AmaderFTP, 1,470+ BDIX servers, Southfreak,
 * Cinemeta, and AniList. Also returns raw unmerged items when grouped by server.
 */
export async function searchAll(query: string, includeAdult = false): Promise<Title[]> {
  const q = norm(query);
  if (q.length < 2) return [];
  const key = `search:${q}:${includeAdult ? 1 : 0}`;
  let results: Title[] = [];
  for (const variant of queryVariants(query)) {
    results = await searchOnce(variant, includeAdult);
    if (results.length > 0) break;
  }
  if (results.length === 0) {
    return (await cached<Title[]>(key, { ttl: Infinity }, async () => [])).map((t) => registry.get(t.id) ?? t);
  }
  const registered = register(results);
  const merged = register(mergeAcrossServers(registered));
  const sorted = merged.filter(isListed).sort((a, b) => score(b, q) - score(a, q));
  verifyLater(sorted.slice(0, 8));
  await cached<Title[]>(key, { ttl: 0, force: true }, async () => sorted.slice(0, 45));
  return sorted;
}

// ---------------------------------------------------------------- hooks

export interface RowState {
  def: RowDef;
  items: Title[];
  loading: boolean;
  error: boolean;
}

export function useRows(defs: RowDef[], enabled = true) {
  const [rows, setRows] = useState<RowState[]>(() =>
    defs.map((def) => ({ def, items: [], loading: true, error: false })),
  );
  const [refreshing, setRefreshing] = useState(false);
  const lastLoad = useRef(0);
  const availability = useAvailabilityVersion();
  const stable = useRef(new Map<string, { src: Title[]; out: Title[]; v: number }>()).current;

  const load = useCallback(
    async (force: boolean) => {
      lastLoad.current = Date.now();
      let next = 0;
      const worker = async () => {
        while (next < defs.length) {
          const def = defs[next++];
          try {
            const items = await def.load(force);
            setRows((prev) =>
              prev.map((r) =>
                r.def.key === def.key
                  ? { ...r, items: items.length ? items : r.items, loading: false, error: false }
                  : r,
              ),
            );
          } catch {
            setRows((prev) =>
              prev.map((r) =>
                r.def.key === def.key ? { ...r, loading: false, error: r.items.length === 0 } : r,
              ),
            );
          }
        }
      };
      await Promise.all(Array.from({ length: 3 }, worker));
    },
    [defs],
  );

  useEffect(() => {
    if (!enabled) return;
    load(false);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && Date.now() - lastLoad.current > FEED_TTL) load(true);
    });
    return () => sub.remove();
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled) return;
    const pending = rows
      .flatMap((r) => r.items.slice(0, 8))
      .filter((t) => t.source === 'cinemeta' || t.source === 'anilist');
    if (pending.length > 0) verifyLater(pending);
  }, [rows, enabled]);

  const visible = useMemo(
    () =>
      rows.map((r) => {
        const hit = stable.get(r.def.key);
        if (hit && hit.src === r.items && hit.v === availability)
          return r.items === hit.out ? r : { ...r, items: hit.out };
        const out = r.items.filter(isListed);
        const reuse =
          hit && hit.out.length === out.length && hit.out.every((t, i) => t === out[i]) ? hit.out : out;
        stable.set(r.def.key, { src: r.items, out: reuse, v: availability });
        return { ...r, items: reuse };
      }),
    [rows, availability, stable],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  return { rows: visible, refresh, refreshing };
}

export function titleById(rows: RowState[], key: string): Title[] {
  return rows.find((r) => r.def.key === key)?.items ?? [];
}
