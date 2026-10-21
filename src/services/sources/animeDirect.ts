// Direct Anime Providers (Lh8 from app-release.apk)
// Implements direct fast anime stream & DDL discovery from:
// 1. Tokyo Insider (https://www.tokyoinsider.com — direct high-speed .mkv/.mp4 DDL, 1080p/720p)
// 2. AnimePahe (https://animepahe.pw / https://animepahe.ru — API search & release episodes)
// 3. KickassAnime (https://kaa.lt — API search & show episodes)
// 4. AnimeX (https://animex.one) & AniZone (https://anizone.to)
import { decodeEntities, getJson, getText, postJson, withTimeout } from '../http';
import { WOTAKU_ANIME_SERVERS, type WotakuAnimeServer } from './bdixHosts';

export { WOTAKU_ANIME_SERVERS, type WotakuAnimeServer };

export interface DirectAnimeStream {
  id: string;
  provider: string;
  url: string;
  quality: string;
  label: string;
  size?: string;
  headers?: Record<string, string>;
  hls?: boolean;
}

const TOKYO_BASE = 'https://www.tokyoinsider.com';
const MEDIA_EXT = /\.(mkv|mp4|avi|webm|m4v)(\?|$)/i;
const QUALITY_RE = /\b(2160|1080|720|576|480|360)p?\b/i;
const SIZE_RE = /([\d.]+)\s*(GB|MB)/i;

function normTokens(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && w !== 'the' && w !== 'season');
}

/**
 * 1. Tokyo Insider (Lh8/w): crawls /anime/search?k= -> anime page -> episode page -> direct .mkv/.mp4 DDL links.
 */
export async function searchTokyoInsider(titleName: string, episodeNumber = 1, isMovie = false): Promise<DirectAnimeStream[]> {
  const tokens = normTokens(titleName);
  if (tokens.length === 0) return [];
  try {
    const query = tokens.slice(0, 3).join(' ');
    const searchHtml = await withTimeout(
      getText(`${TOKYO_BASE}/anime/search?k=${encodeURIComponent(query)}`, { timeout: 8000, retries: 0 }),
      8500,
      'TokyoInsider search',
    );
    const showLinks: { href: string; text: string }[] = [];
    for (const m of searchHtml.matchAll(/<a\s[^>]*href="(\/anime\/[A-Za-z0-9#]\/[^"?#]+)"[^>]*>([^<]+)</gi)) {
      const href = m[1];
      const text = decodeEntities(m[2]).trim();
      if (text && !showLinks.some((s) => s.href === href)) {
        showLinks.push({ href, text });
      }
    }
    // Also check direct /anime/X/Slug redirect if search redirected straight to the show page
    const matchedShow =
      showLinks.find((s) => {
        const lower = s.text.toLowerCase();
        return tokens.every((t) => lower.includes(t));
      }) ?? showLinks[0];

    const showHtml = matchedShow
      ? await withTimeout(getText(`${TOKYO_BASE}${matchedShow.href}`, { timeout: 8000, retries: 0 }), 8500, 'TokyoInsider show')
      : searchHtml;

    // Find matching episode or movie page: /anime/.../(episode|movie|ova|special)/{num}
    const epTargets: string[] = [];
    for (const m of showHtml.matchAll(/href="(\/anime\/[^"?#]+\/(episode|movie|ova|special)\/(\d+))"/gi)) {
      const path = m[1];
      const kind = m[2].toLowerCase();
      const num = Number(m[3]);
      if ((isMovie && kind === 'movie') || num === episodeNumber) {
        if (!epTargets.includes(path)) epTargets.unshift(path);
      } else if (epTargets.length < 3 && num === 1) {
        epTargets.push(path);
      }
    }
    if (epTargets.length === 0) return [];

    const epHtml = await withTimeout(
      getText(`${TOKYO_BASE}${epTargets[0]}`, { timeout: 8000, retries: 0 }),
      8500,
      'TokyoInsider episode',
    );

    const out: DirectAnimeStream[] = [];
    for (const m of epHtml.matchAll(/<a\s[^>]*href="(https?:\/\/[^"'\s<>]+\.(?:mkv|mp4))"[^>]*>([^<]*)</gi)) {
      const url = decodeEntities(m[1]);
      if (!MEDIA_EXT.test(url)) continue;
      const fileName = decodeURIComponent(url.split('/').pop() ?? m[2]);
      const qMatch = QUALITY_RE.exec(fileName);
      const quality = qMatch ? `${qMatch[1]}P` : '720P';
      const sizeMatch = SIZE_RE.exec(epHtml.slice(Math.max(0, (m.index ?? 0) - 200), (m.index ?? 0) + 400));
      out.push({
        id: `ti:${url}`,
        provider: 'Tokyo Insider',
        url,
        quality,
        label: fileName,
        size: sizeMatch ? `${sizeMatch[1]} ${sizeMatch[2].toUpperCase()}` : undefined,
        headers: { Referer: `${TOKYO_BASE}/` },
        hls: false,
      });
    }
    return out.slice(0, 8);
  } catch {
    return [];
  }
}

/**
 * 2. AniZone (Lh8/c & Lh8/n): extracts HLS manifest URLs embedded in props="..." on AniZone episode pages.
 */
export async function searchAniZone(titleName: string, episodeNumber = 1): Promise<DirectAnimeStream[]> {
  try {
    const html = await withTimeout(
      getText(`https://anizone.to/anime?search=${encodeURIComponent(titleName)}`, { timeout: 7500, retries: 0 }),
      8000,
      'AniZone search',
    );
    const showMatch = /\/anime\/([A-Za-z0-9]{6,})/.exec(html);
    if (!showMatch) return [];
    const epUrl = `https://anizone.to/anime/${showMatch[1]}/${episodeNumber}`;
    const epHtml = await withTimeout(
      getText(epUrl, { timeout: 7500, retries: 0, headers: { Referer: 'https://anizone.to/' } }),
      8000,
      'AniZone episode',
    );
    const decoded = decodeEntities(epHtml);
    const out: DirectAnimeStream[] = [];
    for (const m of decoded.matchAll(/https?:\/\/[^\s"'<>\\]+\.m3u8(?:\?[^\s"'<>\\]*)?/gi)) {
      const url = m[0].replace(/\\\//g, '/');
      if (!out.some((x) => x.url === url)) {
        out.push({
          id: `az:${url}`,
          provider: 'AniZone',
          url,
          quality: '1080P',
          label: `${titleName} • Ep ${episodeNumber} (AniZone HLS)`,
          headers: { Referer: 'https://anizone.to/', Origin: 'https://anizone.to' },
          hls: true,
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * 3. KickassAnime (Lh8/s): queries /api/search and extracts HLS stream candidates.
 */
export async function searchKickassAnime(titleName: string, episodeNumber = 1): Promise<DirectAnimeStream[]> {
  try {
    const list = await withTimeout(
      postJson<{ slug?: string; title?: string; title_en?: string }[]>(
        'https://kaa.lt/api/search',
        { query: titleName },
        { timeout: 6500, retries: 0, headers: { Referer: 'https://kaa.lt/' } },
      ),
      7000,
      'KickassAnime',
    );
    const first = Array.isArray(list) ? list[0] : null;
    if (!first?.slug) return [];
    const epData = await getJson<{ result?: { slug?: string; episode_number?: number }[] }>(
      `https://kaa.lt/api/show/${first.slug}/episodes?page=1&lang=ja-JP`,
      { timeout: 6500, retries: 0, headers: { Referer: 'https://kaa.lt/' } },
    ).catch(() => null);
    const epHit = epData?.result?.find((e) => Number(e.episode_number) === episodeNumber) ?? epData?.result?.[0];
    if (!epHit?.slug) return [];
    const watchData = await getJson<{ servers?: { name?: string; src?: string }[] }>(
      `https://kaa.lt/api/show/${first.slug}/episode/ep-${episodeNumber}-${epHit.slug}`,
      { timeout: 6500, retries: 0, headers: { Referer: 'https://kaa.lt/' } },
    ).catch(() => null);
    const out: DirectAnimeStream[] = [];
    for (const s of watchData?.servers ?? []) {
      if (s.src && /\.m3u8/i.test(s.src)) {
        out.push({
          id: `kaa:${s.src}`,
          provider: `KickassAnime (${s.name ?? 'Main'})`,
          url: s.src.startsWith('//') ? `https:${s.src}` : s.src,
          quality: '1080P',
          label: `${titleName} • Ep ${episodeNumber}`,
          headers: { Referer: 'https://kaa.lt/' },
          hls: true,
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Unified direct anime stream gatherer combining Tokyo Insider, AniZone, and KickassAnime.
 */
export async function gatherDirectAnimeStreams(
  titleName: string,
  episodeNumber = 1,
  isMovie = false,
): Promise<DirectAnimeStream[]> {
  const settled = await Promise.allSettled([
    searchTokyoInsider(titleName, episodeNumber, isMovie),
    searchAniZone(titleName, episodeNumber),
    searchKickassAnime(titleName, episodeNumber),
  ]);
  return settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
