// Complete Live IPTV, BDIX TV, Sports, FAST & Adult M3U Playlist Registry
// Extracted from /home/ASHRIN/Downloads/FREE_IPTV_RESOURCES.md & ALL_SOURCES_MASTER.md.
import { registerChannels, type Channel } from '../../data/channels';
import { getText } from '../http';

export interface IptvPlaylistSource {
  id: string;
  name: string;
  category: 'BDIX & BD' | 'India & South Asia' | 'Sports' | 'Movies & Series' | 'Kids & Anime' | 'FAST Services' | 'News & Docs' | 'Global Aggregators';
  url: string;
  badge: string;
}

export const IPTV_PLAYLIST_SOURCES: IptvPlaylistSource[] = [
  // 1. Bangladesh + BDIX
  {
    id: 'mrgify_bdix',
    name: 'Mrgify BDIX IPTV',
    category: 'BDIX & BD',
    url: 'https://raw.githubusercontent.com/abusaeeidx/Mrgify-BDIX-IPTV/main/playlist.m3u',
    badge: 'BDIX',
  },
  {
    id: 'saeid_bdix_iptv',
    name: 'BDIX-IPTV (BD + India)',
    category: 'BDIX & BD',
    url: 'https://raw.githubusercontent.com/saeidrahmanbd/BDIX-IPTV/main/IPTV-Playlist.m3u',
    badge: 'BD + IN',
  },
  {
    id: 'zaman_active',
    name: 'Zaman Active (BD + Sports)',
    category: 'BDIX & BD',
    url: 'https://raw.githubusercontent.com/Zaman-Topu/Ip-tv-Collection/main/FINAL_IPTV_ACTIVE.m3u',
    badge: 'Verified',
  },
  {
    id: 'iptvorg_bd',
    name: 'iptv-org Bangladesh',
    category: 'BDIX & BD',
    url: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    badge: 'BD Official',
  },
  {
    id: 'iptvorg_ben',
    name: 'Bengali Channels',
    category: 'BDIX & BD',
    url: 'https://iptv-org.github.io/iptv/languages/ben.m3u',
    badge: 'Bangla',
  },
  {
    id: 'shadman_bd',
    name: 'BD IPTV Backup',
    category: 'BDIX & BD',
    url: 'https://raw.githubusercontent.com/Shadmanislam/bdiptv/master/BD%20IPTV.m3u',
    badge: 'BD',
  },

  // 2. India & South Asia
  {
    id: 'iptvorg_in',
    name: 'iptv-org India',
    category: 'India & South Asia',
    url: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    badge: 'India',
  },
  {
    id: 'iptvorg_hin',
    name: 'Hindi Channels',
    category: 'India & South Asia',
    url: 'https://iptv-org.github.io/iptv/languages/hin.m3u',
    badge: 'Hindi',
  },
  {
    id: 'iptvorg_pk',
    name: 'Pakistan Channels',
    category: 'India & South Asia',
    url: 'https://iptv-org.github.io/iptv/countries/pk.m3u',
    badge: 'PK',
  },

  // 3. Sports (Football / Cricket)
  {
    id: 'shovo_sports',
    name: 'IPTV-By-Shovo (Sports & Movies)',
    category: 'Sports',
    url: 'https://shovo127.github.io/IPTV-By-Shovo/index.m3u',
    badge: 'Live Sports',
  },
  {
    id: 'iptvorg_sports',
    name: 'Global Sports TV',
    category: 'Sports',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    badge: 'Sports',
  },

  // 4. Movies & Series Channels
  {
    id: 'iptvorg_movies',
    name: '24/7 Movie Channels',
    category: 'Movies & Series',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    badge: 'Movies',
  },
  {
    id: 'iptvorg_series',
    name: '24/7 Series Channels',
    category: 'Movies & Series',
    url: 'https://iptv-org.github.io/iptv/categories/series.m3u',
    badge: 'Series',
  },
  {
    id: 'iptvorg_entertainment',
    name: 'Entertainment TV',
    category: 'Movies & Series',
    url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    badge: 'Ent.',
  },
  {
    id: 'iptvorg_comedy',
    name: 'Comedy Channels',
    category: 'Movies & Series',
    url: 'https://iptv-org.github.io/iptv/categories/comedy.m3u',
    badge: 'Comedy',
  },
  {
    id: 'iptvorg_classic',
    name: 'Classic Cinema TV',
    category: 'Movies & Series',
    url: 'https://iptv-org.github.io/iptv/categories/classic.m3u',
    badge: 'Classic',
  },

  // 5. Kids, Cartoon & Animation
  {
    id: 'iptvorg_animation',
    name: 'Animation & Anime TV',
    category: 'Kids & Anime',
    url: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
    badge: 'Animation',
  },
  {
    id: 'iptvorg_kids',
    name: 'Kids & Cartoon TV',
    category: 'Kids & Anime',
    url: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
    badge: 'Kids',
  },
  {
    id: 'iptvorg_family',
    name: 'Family Channels',
    category: 'Kids & Anime',
    url: 'https://iptv-org.github.io/iptv/categories/family.m3u',
    badge: 'Family',
  },

  // 6. Free FAST Services (Pluto / Samsung / Tubi / Plex / Roku / Xumo)
  {
    id: 'fast_pluto',
    name: 'Pluto TV (All Channels)',
    category: 'FAST Services',
    url: 'https://raw.githubusercontent.com/BuddyChewChew/app-m3u-generator/refs/heads/main/playlists/plutotv_all.m3u',
    badge: 'Pluto TV',
  },
  {
    id: 'fast_samsung',
    name: 'Samsung TV Plus',
    category: 'FAST Services',
    url: 'https://raw.githubusercontent.com/BuddyChewChew/app-m3u-generator/refs/heads/main/playlists/samsungtvplus_all.m3u',
    badge: 'Samsung',
  },
  {
    id: 'fast_tubi',
    name: 'Tubi Live Channels',
    category: 'FAST Services',
    url: 'https://raw.githubusercontent.com/BuddyChewChew/app-m3u-generator/refs/heads/main/playlists/tubi_all.m3u',
    badge: 'Tubi',
  },
  {
    id: 'fast_plex',
    name: 'Plex Live TV',
    category: 'FAST Services',
    url: 'https://raw.githubusercontent.com/BuddyChewChew/app-m3u-generator/refs/heads/main/playlists/plex_all.m3u',
    badge: 'Plex',
  },
  {
    id: 'fast_roku',
    name: 'The Roku Channel',
    category: 'FAST Services',
    url: 'https://raw.githubusercontent.com/BuddyChewChew/app-m3u-generator/refs/heads/main/playlists/roku_all.m3u',
    badge: 'Roku',
  },
  {
    id: 'fast_xumo',
    name: 'Xumo Play Live',
    category: 'FAST Services',
    url: 'https://raw.githubusercontent.com/BuddyChewChew/xumo-playlist-generator/refs/heads/main/playlists/xumo_playlist.m3u',
    badge: 'Xumo',
  },

  // 7. News, Documentary, Music & Science
  {
    id: 'iptvorg_news',
    name: 'World Live News',
    category: 'News & Docs',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    badge: 'News',
  },
  {
    id: 'iptvorg_doc',
    name: 'Documentary Channels',
    category: 'News & Docs',
    url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    badge: 'Docs',
  },
  {
    id: 'iptvorg_science',
    name: 'Science & Tech TV',
    category: 'News & Docs',
    url: 'https://iptv-org.github.io/iptv/categories/science.m3u',
    badge: 'Science',
  },
  {
    id: 'iptvorg_music',
    name: 'Music Channels',
    category: 'News & Docs',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    badge: 'Music',
  },

  // 8. Global Checked Aggregators
  {
    id: 'romaxa_world',
    name: 'World IPTV Checker (6h Auto-Verified)',
    category: 'Global Aggregators',
    url: 'https://romaxa55.github.io/world_ip_tv/output/index.m3u',
    badge: 'Auto-Checked',
  },
  {
    id: 'freetv_clean',
    name: 'Free-TV Clean FTA',
    category: 'Global Aggregators',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    badge: 'Free-TV',
  },
  {
    id: 'guovin_ipv4',
    name: 'Guovin Auto-Updated IPv4',
    category: 'Global Aggregators',
    url: 'https://guovin.github.io/iptv-api/ipv4.m3u',
    badge: 'IPv4',
  },
];

// 18+ Adult Live M3U8 & Playlists (FREE_IPTV_RESOURCES.md §8 — strictly gated inside AdultContentScreen)
export interface AdultLiveSource {
  id: string;
  name: string;
  url: string;
  kind: 'direct_m3u8' | 'playlist_m3u';
}

export const ADULT_LIVE_SOURCES: AdultLiveSource[] = [
  { id: 'adult_livecams', name: 'AdultIPTV Live Cams', url: 'http://cdn.adultiptv.net/livecams.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_milf', name: 'AdultIPTV MILF', url: 'http://cdn.adultiptv.net/milf.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_hardcore', name: 'AdultIPTV Hardcore', url: 'http://cdn.adultiptv.net/hardcore.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_anal', name: 'AdultIPTV Anal', url: 'http://cdn.adultiptv.net/anal.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_lesbian', name: 'AdultIPTV Lesbian', url: 'http://cdn.adultiptv.net/lesbian.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_asian', name: 'AdultIPTV Asian', url: 'http://cdn.adultiptv.net/asian.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_bigtits', name: 'AdultIPTV Big Tits', url: 'http://cdn.adultiptv.net/bigtits.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_bigass', name: 'AdultIPTV Big Ass', url: 'http://cdn.adultiptv.net/bigass.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_pov', name: 'AdultIPTV POV', url: 'http://cdn.adultiptv.net/pov.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_interracial', name: 'AdultIPTV Interracial', url: 'http://cdn.adultiptv.net/interracial.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_latina', name: 'AdultIPTV Latina', url: 'http://cdn.adultiptv.net/latina.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_blowjob', name: 'AdultIPTV Blowjob', url: 'http://cdn.adultiptv.net/blowjob.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_fetish', name: 'AdultIPTV Fetish', url: 'http://cdn.adultiptv.net/fetish.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_pornstar', name: 'AdultIPTV Pornstar', url: 'http://cdn.adultiptv.net/pornstar.m3u8', kind: 'direct_m3u8' },
  { id: 'adult_keglr', name: 'Keglr Adult M3U Pack', url: 'https://raw.githubusercontent.com/Keglr/IPTV_V6/main/Adult.m3u', kind: 'playlist_m3u' },
  { id: 'adult_cooder', name: 'CooderIPTV Adult Pack', url: 'https://raw.githubusercontent.com/cooderiptv/iptv/main/adult.m3u', kind: 'playlist_m3u' },
  { id: 'adult_tom229', name: 'Tom229 Adult M3U Pack', url: 'https://raw.githubusercontent.com/tom229/IPTV_m3u/main/Adult.m3u', kind: 'playlist_m3u' },
];

const playlistCache = new Map<string, Channel[]>();

/** Fetches and parses any M3U playlist into Channel[] objects for instant Live Player playback. */
export async function fetchIptvPlaylistChannels(source: IptvPlaylistSource, limit = 120): Promise<Channel[]> {
  const hit = playlistCache.get(source.id);
  if (hit && hit.length > 0) return hit.slice(0, limit);

  try {
    const raw = await getText(source.url, { timeout: 9000 });
    const lines = raw.split(/\r?\n/);
    const out: Channel[] = [];
    let pending: string | null = null;

    for (let i = 0; i < lines.length && out.length < limit; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith('#EXTINF')) {
        pending = line;
        continue;
      }
      if (line.startsWith('#')) continue;
      if (pending && /^https?:\/\//i.test(line)) {
        const logoMatch = pending.match(/tvg-logo="([^"]+)"/i);
        const groupMatch = pending.match(/group-title="([^"]+)"/i);
        const comma = pending.lastIndexOf(',');
        const name = (comma >= 0 ? pending.slice(comma + 1) : source.name).trim();
        if (name) {
          out.push({
            id: `m3u_${source.id}_${out.length}`,
            name,
            category: groupMatch?.[1]?.trim() || source.category,
            country: source.badge,
            logo: logoMatch?.[1]?.trim() || '',
            url: line,
            fallbacks: [],
            quality: 'HD',
          });
        }
        pending = null;
      }
    }
    if (out.length > 0) {
      playlistCache.set(source.id, out);
      registerChannels(out);
    }
    return out;
  } catch {
    return [];
  }
}

/** Registers and returns the 14 direct AdultIPTV.net M3U8 channels + 3 Adult M3U playlists as playable Channel[] items. */
export function getAdultDirectChannels(): Channel[] {
  const channels: Channel[] = ADULT_LIVE_SOURCES.filter((s) => s.kind === 'direct_m3u8').map((s) => ({
    id: s.id,
    name: s.name,
    category: 'Adult',
    country: 'AdultIPTV',
    logo: '',
    url: s.url,
    fallbacks: [],
    quality: 'HD',
  }));
  registerChannels(channels);
  return channels;
}
