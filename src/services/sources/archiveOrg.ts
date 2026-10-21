// Internet Archive Feature Films & Public Domain Movies (ALL_SOURCES_MASTER.md Part B §1)
// Collections: feature_films, publicmovies212, historical-movies
// Provides full-length direct .mp4 / .mkv streaming and offline download.
import { tintFor, type Title } from '../../data/types';
import { getJson } from '../http';

interface ArchiveDoc {
  identifier?: string;
  title?: string;
  year?: string | number;
  description?: string | string[];
  avg_rating?: string | number;
  downloads?: number;
}

interface ArchiveSearchResponse {
  response?: {
    docs?: ArchiveDoc[];
  };
}

interface ArchiveFile {
  name?: string;
  format?: string;
  size?: string;
  length?: string;
}

interface ArchiveMetaResponse {
  files?: ArchiveFile[];
  metadata?: {
    title?: string;
    year?: string;
    description?: string | string[];
    director?: string | string[];
    creator?: string | string[];
  };
}

function docToTitle(doc: ArchiveDoc): Title | null {
  const id = doc.identifier?.trim();
  const rawTitle = Array.isArray(doc.title) ? doc.title[0] : doc.title;
  if (!id || !rawTitle) return null;
  const yearNum = Number(String(doc.year ?? '').slice(0, 4)) || 1965;
  const descRaw = Array.isArray(doc.description) ? doc.description.join(' ') : doc.description ?? '';
  const cleanDesc = descRaw.replace(/<[^>]+>/g, '').trim();
  const rating = doc.avg_rating ? Number(doc.avg_rating).toFixed(1) : undefined;
  const poster = `https://archive.org/services/img/${encodeURIComponent(id)}`;
  const tid = `archive:${id}`;
  return {
    id: tid,
    source: 'archive',
    ref: id,
    name: String(rawTitle).trim(),
    kind: 'movie',
    year: yearNum,
    maturity: '13+',
    runtime: 95,
    seasons: [],
    genres: ['Classic', 'Feature Film'],
    synopsis: cleanDesc || `Full-length feature film from Internet Archive (${id}). Direct stream & download enabled.`,
    cast: [],
    creators: ['Internet Archive'],
    tint: tintFor(tid),
    poster,
    background: poster,
    quality: ['MP4', 'Direct'],
    imdbRating: rating,
    serverName: 'Archive.org',
    detailed: false,
  };
}

export async function archiveOrgFeatured(limit = 28): Promise<Title[]> {
  try {
    const url =
      `https://archive.org/advancedsearch.php?q=collection:(feature_films+OR+publicmovies212)+AND+mediatype:(movies)` +
      `&fl[]=identifier,title,year,description,avg_rating,downloads&sort[]=downloads+desc&rows=${limit}&page=1&output=json`;
    const data = await getJson<ArchiveSearchResponse>(url, { timeout: 10000 });
    const docs = data?.response?.docs ?? [];
    const out: Title[] = [];
    for (const d of docs) {
      const t = docToTitle(d);
      if (t) out.push(t);
    }
    return out;
  } catch {
    return [];
  }
}

export async function archiveOrgSearch(query: string, limit = 20): Promise<Title[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const encoded = encodeURIComponent(`title:(${q}) AND mediatype:(movies) AND collection:(feature_films OR publicmovies212 OR historical-movies)`);
    const url =
      `https://archive.org/advancedsearch.php?q=${encoded}` +
      `&fl[]=identifier,title,year,description,avg_rating,downloads&sort[]=downloads+desc&rows=${limit}&page=1&output=json`;
    const data = await getJson<ArchiveSearchResponse>(url, { timeout: 9000 });
    const docs = data?.response?.docs ?? [];
    const out: Title[] = [];
    for (const d of docs) {
      const t = docToTitle(d);
      if (t) out.push(t);
    }
    return out;
  } catch {
    return [];
  }
}

export async function archiveOrgDetail(title: Title): Promise<Title> {
  if (title.directUrl && title.files && title.files.length > 0) return title;
  try {
    const identifier = title.ref;
    const meta = await getJson<ArchiveMetaResponse>(
      `https://archive.org/metadata/${encodeURIComponent(identifier)}`,
      { timeout: 10000 },
    );
    const files = (meta?.files ?? []).filter((f) => {
      const n = (f.name ?? '').toLowerCase();
      return (n.endsWith('.mp4') || n.endsWith('.mkv')) && !n.includes('sample') && !n.includes('.ia.mp4');
    });
    const fallbackFiles =
      files.length > 0
        ? files
        : (meta?.files ?? []).filter((f) => (f.name ?? '').toLowerCase().endsWith('.mp4'));

    const mapped = fallbackFiles.map((f) => {
      const fname = f.name ?? '';
      const streamUrl = `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(fname).replace(/%2F/g, '/')}`;
      const mb = f.size ? `${Math.round(Number(f.size) / (1024 * 1024))} MB` : 'MP4';
      return {
        url: streamUrl,
        label: `${fname} (${mb})`,
      };
    });

    return {
      ...title,
      directUrl: mapped[0]?.url ?? title.directUrl,
      files: mapped.length > 0 ? mapped : title.files,
      detailed: true,
    };
  } catch {
    return { ...title, detailed: true };
  }
}
