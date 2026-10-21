// BDIX Directory & File Browser Organizer — reverse-engineered from app-release.apk
// (Lcom/ctent/app/data/provider/directory/* & Ls8 BrowseScreen).
// - Parses Apache, Nginx, LiteSpeed, IIS, lighttpd & h5ai directory listings
// - Classifies entries into FileKind (FOLDER, VIDEO, AUDIO, SUBTITLE, IMAGE, ARCHIVE, OTHER)
// - Extracts file size, modification date, language tag (Bangla, Hindi, English), and clean movie/episode title
// - Builds interactive breadcrumb navigation (Crumb[])
import { tintFor, type Title } from '../data/types';
import { decodeEntities, getText, withTimeout } from './http';

export type FileKind = 'FOLDER' | 'VIDEO' | 'AUDIO' | 'SUBTITLE' | 'IMAGE' | 'ARCHIVE' | 'OTHER';
export type BrowseViewMode = 'POSTERS' | 'FILES';
export type BrowseLangFilter = 'All' | 'Bangla' | 'Hindi' | 'English';
export type BrowseSort = 'NAME' | 'DATE' | 'SIZE';

export interface Crumb {
  label: string;
  url: string;
}

export interface DirectoryEntry {
  name: string;
  cleanTitle: string;
  year?: number;
  quality?: string;
  language: BrowseLangFilter;
  url: string;
  isDir: boolean;
  kind: FileKind;
  sizeBytes: number;
  sizeText: string;
  modified: string;
  season?: number;
  episode?: number;
}

export interface ParsedListing {
  url: string;
  title: string;
  software: string;
  breadcrumbs: Crumb[];
  entries: DirectoryEntry[];
}

const VIDEO_EXT = /\.(mkv|mp4|avi|m4v|webm|mov|ts|m2ts|wmv|flv|3gp|mpg|mpeg|vob|divx)$/i;
const AUDIO_EXT = /\.(mp3|flac|aac|ogg|wav|m4a|opus)$/i;
const SUB_EXT = /\.(srt|vtt|ass|ssa|sub)$/i;
const IMG_EXT = /\.(jpg|jpeg|png|webp|gif|bmp)$/i;
const ARCHIVE_EXT = /\.(zip|rar|7z|tar|gz|iso)$/i;

const DATE_RE =
  /(\d{4}-\d{2}-\d{2}(?:[ T]\d{1,2}:\d{2})?|\d{1,2}-[A-Za-z]{3}-\d{4}(?: \d{1,2}:\d{2})?|\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{1,2}:\d{2})?)/;
const SIZE_RE = /(?:^|\s)(\d+(?:\.\d+)?)\s*([KMGTP])(i?B)?(?=\s|$|<)/i;
const YEAR_RE = /(?:^|[^0-9])(19[2-9]\d|20[0-4]\d)(?![0-9])/;
const QUALITY_RE = /\b(2160p|4k|1440p|1080p|720p|480p|bluray|web-?dl|hdrip)\b/i;
const SE_RE = /\bS(\d{1,2})\s*[._\- ]?\s*E(\d{1,3})\b/i;

const IGNORE_NAMES =
  /^(parent directory|\[to parent directory\]|\.\.?\/?|up|back|_h5ai|_autoindex|cgi-bin|icons|lost\+found|thumbs\.db|\.ds_store)$/i;

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function classifyFileKind(name: string, isDir: boolean): FileKind {
  if (isDir) return 'FOLDER';
  if (VIDEO_EXT.test(name)) return 'VIDEO';
  if (SUB_EXT.test(name)) return 'SUBTITLE';
  if (AUDIO_EXT.test(name)) return 'AUDIO';
  if (IMG_EXT.test(name)) return 'IMAGE';
  if (ARCHIVE_EXT.test(name)) return 'ARCHIVE';
  return 'OTHER';
}

function detectLanguage(text: string): BrowseLangFilter {
  const lower = text.toLowerCase();
  if (/bangla|bengali|bd\b|chorki|hoichoi|bongo|natok/.test(lower)) return 'Bangla';
  if (/hindi|bollywood|south|dual[\s._-]*audio|hin\b|tamil|telugu/.test(lower)) return 'Hindi';
  if (/english|hollywood|eng\b/.test(lower)) return 'English';
  return 'All';
}

function parseSizeToBytes(val: number, unit: string): { bytes: number; text: string } {
  const u = unit.toUpperCase();
  const mult =
    u === 'T' ? 1024 ** 4 : u === 'G' ? 1024 ** 3 : u === 'M' ? 1024 ** 2 : u === 'K' ? 1024 : 1;
  return { bytes: Math.round(val * mult), text: `${val} ${u}B` };
}

function cleanEntryName(rawName: string, isDir: boolean): {
  cleanTitle: string;
  year?: number;
  quality?: string;
  season?: number;
  episode?: number;
} {
  const noExt = isDir ? rawName.replace(/\/$/, '') : rawName.replace(/\.[a-z0-9]{2,4}$/i, '');
  const yearMatch = YEAR_RE.exec(noExt);
  const year = yearMatch ? Number(yearMatch[1]) : undefined;
  const qMatch = QUALITY_RE.exec(noExt);
  const quality = qMatch ? qMatch[1].toUpperCase() : undefined;
  const seMatch = SE_RE.exec(noExt);
  const season = seMatch ? Number(seMatch[1]) : undefined;
  const episode = seMatch ? Number(seMatch[2]) : undefined;

  let clean = noExt
    .replace(/\[[^\]]*\]|\{[^}]*\}/g, ' ')
    .replace(/[._]+/g, ' ');
  if (yearMatch && yearMatch.index && yearMatch.index > 2) {
    clean = clean.slice(0, yearMatch.index);
  }
  clean = clean
    .replace(/\b(2160p|4k|1080p|720p|480p|web-?dl|webrip|bluray|hdrip|x264|x265|hevc|dual audio|hindi|english|bangla|esub)\b.*$/i, '')
    .replace(/[(\[-]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    cleanTitle: clean || noExt.replace(/[._]+/g, ' ').trim(),
    year,
    quality,
    season,
    episode,
  };
}

export function buildBreadcrumbs(url: string, serverName = 'Server'): Crumb[] {
  try {
    const u = new URL(url);
    const origin = u.origin;
    const crumbs: Crumb[] = [{ label: serverName, url: `${origin}/` }];
    const parts = u.pathname.split('/').filter(Boolean);
    let acc = origin;
    for (const part of parts) {
      acc += `/${part}`;
      crumbs.push({ label: safeDecode(part), url: `${acc}/` });
    }
    return crumbs;
  } catch {
    return [{ label: serverName, url }];
  }
}

function detectSoftware(html: string): string {
  const lower = html.slice(0, 4000).toLowerCase();
  if (lower.includes('_h5ai') || lower.includes('h5ai')) return 'h5ai';
  if (lower.includes('litespeed')) return 'LiteSpeed';
  if (lower.includes('nginx')) return 'nginx';
  if (lower.includes('apache')) return 'Apache';
  if (lower.includes('[to parent directory]')) return 'IIS';
  return 'HTTP Index';
}

export async function browseDirectory(url: string, serverName = 'BDIX Server'): Promise<ParsedListing> {
  const targetUrl = url.endsWith('/') || /\.[a-z0-9]{2,5}$/i.test(url) ? url : `${url}/`;
  const html = await withTimeout(getText(targetUrl, { timeout: 9000, retries: 1 }), 9500, 'Directory listing');
  const software = detectSoftware(html);
  const dirBase = targetUrl.endsWith('/') ? targetUrl : targetUrl.replace(/[^/]*$/, '');

  const entries: DirectoryEntry[] = [];
  const seenUrls = new Set<string>();

  for (const m of html.matchAll(/<a\s[^>]*href="([^"?#]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const rawHref = decodeEntities(m[1]).trim();
    if (!rawHref || rawHref.startsWith('?') || rawHref.startsWith('#') || /^(mailto|javascript|tel):/i.test(rawHref)) {
      continue;
    }
    const linkText = decodeEntities(m[2].replace(/<[^>]+>/g, '')).trim();
    if (IGNORE_NAMES.test(linkText) || IGNORE_NAMES.test(rawHref)) continue;

    let absUrl: string;
    try {
      absUrl = new URL(rawHref, targetUrl).href;
    } catch {
      continue;
    }

    // Skip links pointing to parent/outside unless this is the root portal page linking to sub-folders/servers
    if (absUrl === targetUrl || absUrl === dirBase) continue;
    const sameHost = new URL(absUrl).host === new URL(targetUrl).host;
    if (sameHost && dirBase.length > new URL(targetUrl).origin.length + 1 && !absUrl.startsWith(dirBase)) {
      continue;
    }
    if (seenUrls.has(absUrl)) continue;
    seenUrls.add(absUrl);

    const isDir = absUrl.endsWith('/') || (!/\.[a-z0-9]{2,5}$/i.test(absUrl.split('/').pop() ?? '') && sameHost);
    const fallbackName = safeDecode(absUrl.replace(/\/$/, '').split('/').pop() ?? '');
    const name = linkText && !/^(download|watch|open|link|click here)$/i.test(linkText) ? linkText : fallbackName;
    if (!name || IGNORE_NAMES.test(name)) continue;

    const kind = classifyFileKind(absUrl, isDir);
    if (kind === 'IMAGE' || kind === 'OTHER') {
      // Skip tiny webpage assets (.css, .js, .ico, .svg)
      if (/\.(css|js|ico|svg|woff2?|ttf|php|html?)(\?|$)/i.test(absUrl)) continue;
    }

    // Look ahead 220 chars in the HTML row for date and file size
    const rowContext = html.slice(m.index ?? 0, (m.index ?? 0) + 320).replace(/&nbsp;/gi, ' ');
    const dateMatch = DATE_RE.exec(rowContext);
    const sizeMatch = !isDir ? SIZE_RE.exec(rowContext) : null;
    const sizeInfo = sizeMatch
      ? parseSizeToBytes(parseFloat(sizeMatch[1]), sizeMatch[2])
      : { bytes: 0, text: isDir ? 'Folder' : '' };

    const { cleanTitle, year, quality, season, episode } = cleanEntryName(name, isDir);
    const language = detectLanguage(`${targetUrl} ${name}`);

    entries.push({
      name: safeDecode(name),
      cleanTitle,
      year,
      quality,
      language,
      url: isDir && !absUrl.endsWith('/') ? `${absUrl}/` : absUrl,
      isDir,
      kind,
      sizeBytes: sizeInfo.bytes,
      sizeText: sizeInfo.text,
      modified: dateMatch ? dateMatch[1] : '',
      season,
      episode,
    });
  }

  const crumbs = buildBreadcrumbs(targetUrl, serverName);
  const title = crumbs[crumbs.length - 1]?.label || serverName;

  return {
    url: targetUrl,
    title,
    software,
    breadcrumbs: crumbs,
    entries,
  };
}

/**
 * Converts a VIDEO DirectoryEntry (or all sibling videos in a folder) into a playable Title
 * so tapping a file in BrowseScreen opens directly in Ctent's Player or Title details!
 */
export function directoryEntryToTitle(
  entry: DirectoryEntry,
  siblings: DirectoryEntry[],
  serverName: string,
): Title {
  const videos = siblings.filter((s) => s.kind === 'VIDEO');
  const files = (videos.length > 0 ? videos : [entry]).map((v) => ({
    url: v.url,
    label: v.name,
  }));
  const id = `dir:${entry.url}`;
  return {
    id,
    source: 'bdix',
    ref: entry.url,
    name: entry.cleanTitle || entry.name,
    kind: entry.season !== undefined ? 'series' : 'movie',
    year: entry.year ?? new Date().getFullYear(),
    maturity: '13+',
    runtime: 0,
    seasons: [],
    genres: ['BDIX Direct'],
    synopsis: `Direct file on ${serverName} (${entry.sizeText || 'BDIX High-Speed Stream'}).`,
    cast: [],
    creators: [],
    tint: tintFor(id),
    quality: [entry.quality ?? '1080P'],
    directUrl: entry.url,
    files,
    serverName,
    detailed: true,
  };
}

/**
 * Curated Featured BDIX Folders for the Home `FOLDER` section style & Quick Browse.
 */
export interface FeaturedBdixFolder {
  id: string;
  title: string;
  subtitle: string;
  serverName: string;
  url: string;
  accent: string;
}

export const FEATURED_BDIX_FOLDERS: FeaturedBdixFolder[] = [
  {
    id: 'fld_dhaka14_eng',
    title: 'English 1080p Movies',
    subtitle: 'DhakaFlix 14 · Direct Index',
    serverName: 'DhakaFlix 14',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/English%20Movies%20(1080p)/',
    accent: '#8B2CF5',
  },
  {
    id: 'fld_dhaka14_hin',
    title: 'Hindi & Bollywood HD',
    subtitle: 'DhakaFlix 14 · Direct Index',
    serverName: 'DhakaFlix 14',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/Hindi%20Movies/',
    accent: '#FF2D95',
  },
  {
    id: 'fld_dhaka12_tv',
    title: 'TV & Web Series Vault',
    subtitle: 'DhakaFlix 12 · Multi-Season',
    serverName: 'DhakaFlix 12',
    url: 'http://172.16.50.12/DHAKA-FLIX-12/TV-WEB-Series/',
    accent: '#3DDCFF',
  },
  {
    id: 'fld_dhaka14_south',
    title: 'South Indian Hindi Dubbed',
    subtitle: 'DhakaFlix 14 · Dual Audio',
    serverName: 'DhakaFlix 14',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/Hindi%20Dubbed/',
    accent: '#FF8A3D',
  },
  {
    id: 'fld_icc12',
    title: 'ICC FTP 12 Media Root',
    subtitle: '10.100.100.12 · Ultra-Low Ping',
    serverName: 'ICC FTP 12',
    url: 'http://10.100.100.12/',
    accent: '#22D37A',
  },
  {
    id: 'fld_ebox',
    title: 'E-Box Live Movies',
    subtitle: 'fileserver.ebox.live · BDIX',
    serverName: 'E-Box Live',
    url: 'http://fileserver.ebox.live/movies/',
    accent: '#E21CF0',
  },
];
