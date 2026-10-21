// MythTube Server Routing, Classifier & Live IPTV Organizer
// Features:
// - Automatic (fastest) vs Preferred route server selection
// - Quick Probe (active pool) + Deep scan all (all 1,490+ BDIX & 27 Anime servers with sweepProgress bar)
// - Category filter chips: Online, All, IPTV (28 M3U packs), Media, File Index, BDIX, Anime, Portals
// - Search filter across server names, IPs & IPTV playlists
// - One-tap "Browse Folders" into any server's HTTP/FTP directory via BrowseScreen
// - One-tap "Load Channels" on any of the 28 Live IPTV & FAST playlists -> instant Live Player playback
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { FadeSlideIn, LivePulseDot, PressableScale } from '../components/Animations';
import { ChannelLogo } from '../components/ChannelLogo';
import { Chip } from '../components/Chip';
import { ScreenHeader } from '../components/ScreenHeader';
import { Sheet } from '../components/Sheet';
import { Txt } from '../components/Txt';
import type { Channel } from '../data/channels';
import { useRootNav } from '../navigation/types';
import {
  useServerEngine,
  type ManagedServer,
  type ServerFilter,
  type ServerType,
} from '../services/serverEngine';
import {
  fetchIptvPlaylistChannels,
  IPTV_PLAYLIST_SOURCES,
  type IptvPlaylistSource,
} from '../services/sources/iptvPlaylists';
import { colors, font, GRADIENTS, layout, radius } from '../theme/tokens';

const FILTERS: { key: ServerFilter; label: string }[] = [
  { key: 'ONLINE', label: 'Online' },
  { key: 'ALL', label: 'All' },
  { key: 'IPTV', label: `Live IPTV (${IPTV_PLAYLIST_SOURCES.length})` },
  { key: 'MEDIA', label: 'Media APIs' },
  { key: 'NATIVE', label: 'File Index' },
  { key: 'BDIX', label: 'BDIX' },
  { key: 'ANIME', label: 'Anime' },
  { key: 'WEB', label: 'Portals' },
];

function badgeForType(t: ServerType): { label: string; color: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] } {
  switch (t) {
    case 'CIRCLEFTP':
      return { label: 'CircleFTP API', color: colors.mint, icon: 'api' };
    case 'CYBERFTP':
      return { label: 'CyberFTP v2', color: colors.cyan, icon: 'lightning-bolt' };
    case 'EMBY':
      return { label: 'Emby Server', color: colors.emerald, icon: 'play-network-outline' };
    case 'JELLYFIN':
      return { label: 'Jellyfin', color: colors.sapphire, icon: 'jellyfish-outline' };
    case 'DIRECTORY':
      return { label: 'Native FTP Index', color: colors.mint, icon: 'folder-network-outline' };
    case 'MEDIA_SITE':
      return { label: 'Media Portal', color: colors.amber, icon: 'movie-open-outline' };
    case 'ANIME_WEB':
      return { label: 'Anime Portal', color: colors.cyan, icon: 'star-four-points' };
    default:
      return { label: 'BDIX Host', color: colors.textMuted, icon: 'server-network' };
  }
}

export default function ServersScreen() {
  const nav = useRootNav();
  const { state, activeRoute, setPreferredServer, runQuickProbe, runDeepScanAll } = useServerEngine();
  const [filter, setFilter] = useState<ServerFilter>('ONLINE');
  const [query, setQuery] = useState('');

  // IPTV Playlist Sheet state
  const [activePlaylist, setActivePlaylist] = useState<IptvPlaylistSource | null>(null);
  const [playlistChannels, setPlaylistChannels] = useState<Channel[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);

  const openPlaylist = async (pl: IptvPlaylistSource) => {
    setActivePlaylist(pl);
    setPlaylistLoading(true);
    setPlaylistChannels([]);
    try {
      const chs = await fetchIptvPlaylistChannels(pl, 140);
      setPlaylistChannels(chs);
    } finally {
      setPlaylistLoading(false);
    }
  };

  const filteredIptv = useMemo(() => {
    const q = query.trim().toLowerCase();
    return IPTV_PLAYLIST_SOURCES.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.badge.toLowerCase().includes(q),
    );
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.servers
      .filter((s) => {
        if (q && !s.name.toLowerCase().includes(q) && !s.url.toLowerCase().includes(q)) return false;
        switch (filter) {
          case 'ONLINE':
            return s.online;
          case 'MEDIA':
            return s.type === 'CIRCLEFTP' || s.type === 'CYBERFTP' || s.type === 'EMBY' || s.type === 'JELLYFIN' || s.type === 'MEDIA_SITE';
          case 'NATIVE':
            return s.type === 'DIRECTORY' || s.type === 'CIRCLEFTP' || s.type === 'CYBERFTP';
          case 'WEB':
            return s.type === 'PORTAL' || s.type === 'MEDIA_SITE';
          case 'BDIX':
            return s.category === 'bdix';
          case 'ANIME':
            return s.category === 'anime';
          case 'ALL':
          default:
            return true;
        }
      })
      .sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        if (a.online && b.online) return (a.latencyMs || 9999) - (b.latencyMs || 9999);
        return a.tier - b.tier;
      });
  }, [state.servers, filter, query]);

  const isScanning = state.phase !== 'IDLE';

  const renderServer = ({ item }: { item: ManagedServer }) => {
    const pinned = state.preferredServerId === item.id;
    const badge = badgeForType(item.type);
    const browseUrl = item.browsePaths?.[0] ? `${item.url}${item.browsePaths[0]}` : item.url;

    return (
      <View style={[styles.serverCard, pinned ? styles.serverCardPinned : null]}>
        <View style={styles.serverTop}>
          <View style={[styles.iconBox, { backgroundColor: `${badge.color}1C`, borderColor: `${badge.color}4A` }]}>
            <MaterialCommunityIcons name={badge.icon} size={20} color={badge.color} />
          </View>
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Txt weight="bold" size={14} numberOfLines={1} style={{ flexShrink: 1 }}>
                {item.name}
              </Txt>
              <View style={[styles.typeBadge, { borderColor: `${badge.color}55`, backgroundColor: `${badge.color}14` }]}>
                <Txt weight="bold" size={9} color={badge.color}>
                  {badge.label.toUpperCase()}
                </Txt>
              </View>
            </View>
            <Txt size={11} color={colors.textDim} numberOfLines={1} style={{ marginTop: 2 }}>
              {item.url} {item.meta ? `· ${item.meta}` : ''}
            </Txt>
          </View>

          <View style={styles.pingWrap}>
            <LivePulseDot color={item.online ? colors.mint : colors.textFaint} size={7} pulsing={item.online} />
            <Txt
              weight="bold"
              size={11}
              color={item.online ? colors.mint : colors.textDim}
              style={{ marginLeft: 4 }}
            >
              {item.online ? `${item.latencyMs || 45} ms` : 'Offline'}
            </Txt>
          </View>
        </View>

        <View style={styles.serverActions}>
          <PressableScale
            scaleTo={0.96}
            onPress={() => setPreferredServer(pinned ? null : item.id)}
            style={[styles.actionBtn, pinned ? styles.actionBtnActive : null]}
          >
            <Ionicons
              name={pinned ? 'checkmark-circle' : 'navigate-outline'}
              size={15}
              color={pinned ? '#04120E' : colors.textMuted}
            />
            <Txt weight="bold" size={11} color={pinned ? '#04120E' : colors.textMuted} style={{ marginLeft: 5 }}>
              {pinned ? 'Preferred Route' : 'Pin Route'}
            </Txt>
          </PressableScale>

          <PressableScale
            scaleTo={0.96}
            onPress={() => nav.navigate('Browse', { serverId: item.id, url: browseUrl, title: item.name })}
            style={styles.browseBtn}
          >
            <MaterialCommunityIcons name="folder-open-outline" size={15} color={colors.mint} />
            <Txt weight="bold" size={11} color={colors.mint} style={{ marginLeft: 5 }}>
              Browse Folders
            </Txt>
          </PressableScale>
        </View>
      </View>
    );
  };

  const renderIptv = ({ item }: { item: IptvPlaylistSource }) => (
    <PressableScale scaleTo={0.97} onPress={() => openPlaylist(item)} style={styles.serverCard}>
      <View style={styles.serverTop}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(14, 165, 233, 0.14)', borderColor: 'rgba(14, 165, 233, 0.42)' }]}>
          <MaterialCommunityIcons name="television-play" size={20} color={colors.cyan} />
        </View>
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Txt weight="bold" size={14} numberOfLines={1} style={{ flexShrink: 1 }}>
              {item.name}
            </Txt>
            <View style={[styles.typeBadge, { borderColor: 'rgba(0, 229, 176, 0.45)', backgroundColor: 'rgba(0, 229, 176, 0.12)' }]}>
              <Txt weight="bold" size={9} color={colors.mint}>
                {item.badge.toUpperCase()}
              </Txt>
            </View>
          </View>
          <Txt size={11} color={colors.textDim} numberOfLines={1} style={{ marginTop: 2 }}>
            {item.category} · Live M3U Playlist
          </Txt>
        </View>
        <View style={styles.browseBtn}>
          <Ionicons name="play-circle" size={16} color={colors.mint} />
          <Txt weight="bold" size={11} color={colors.mint} style={{ marginLeft: 4 }}>
            Channels
          </Txt>
        </View>
      </View>
    </PressableScale>
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Server & IPTV Hub"
        subtitle={`${state.onlineCount} online · ${state.bdixCount} BDIX · ${state.animeCount} Anime · ${IPTV_PLAYLIST_SOURCES.length} IPTV`}
        actions={['search']}
      />

      {/* Route Mode & Scanner Hero Card */}
      <FadeSlideIn delay={20} distance={10} style={styles.heroCard}>
        <View style={styles.routeHeader}>
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={11} color={colors.mint} spacing={0.6}>
              AURORA ROUTING ENGINE
            </Txt>
            <Txt weight="bold" size={16} style={{ marginTop: 2 }}>
              {state.preferredServerId && activeRoute
                ? `Pinned: ${activeRoute.name}`
                : 'Automatic (Fastest Route)'}
            </Txt>
            <Txt size={11} color={colors.textMuted} style={{ marginTop: 2 }}>
              {state.preferredServerId
                ? 'Using your manually pinned server first'
                : `Picks the lowest-ping server (${activeRoute ? `${activeRoute.name} · ${activeRoute.latencyMs || 42} ms` : 're-ranked on every probe'})`}
            </Txt>
          </View>

          {state.preferredServerId ? (
            <PressableScale scaleTo={0.94} onPress={() => setPreferredServer(null)} style={styles.autoSwitchBtn}>
              <Txt weight="bold" size={11} color={colors.mint}>
                Reset Auto
              </Txt>
            </PressableScale>
          ) : null}
        </View>

        {isScanning ? (
          <View style={styles.progressSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Txt weight="semibold" size={11} color={colors.mint}>
                {state.phase === 'SWEEPING' ? 'Deep scanning all BDIX servers…' : 'Quick probing active pool…'}
              </Txt>
              <Txt weight="bold" size={11} color={colors.text}>
                {state.sweepDone} / {state.sweepTotal} ({Math.round(state.sweepProgress * 100)}%)
              </Txt>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.round(state.sweepProgress * 100)}%` }]} />
            </View>
          </View>
        ) : null}

        <View style={styles.scanButtons}>
          <PressableScale
            scaleTo={0.96}
            onPress={runQuickProbe}
            disabled={isScanning}
            style={[styles.quickBtn, isScanning ? { opacity: 0.5 } : null]}
          >
            <Ionicons name="flash-outline" size={15} color={colors.text} />
            <Txt weight="semibold" size={12} style={{ marginLeft: 5 }}>
              Quick Probe
            </Txt>
          </PressableScale>

          <PressableScale scaleTo={0.96} onPress={runDeepScanAll} style={styles.deepScanWrap}>
            <LinearGradient colors={[...GRADIENTS.pill]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.deepScanBtn}>
              <MaterialCommunityIcons
                name={state.phase === 'SWEEPING' ? 'stop-circle-outline' : 'radar'}
                size={16}
                color="#04120E"
              />
              <Txt weight="bold" size={12} color="#04120E" style={{ marginLeft: 5 }}>
                {state.phase === 'SWEEPING' ? 'Stop Deep Scan' : `Deep Scan All (${state.totalKnown})`}
              </Txt>
            </LinearGradient>
          </PressableScale>
        </View>
      </FadeSlideIn>

      {/* Search & Filter Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.mint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Filter servers by ISP name, domain, IP or IPTV playlist…"
          placeholderTextColor={colors.textDim}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ height: 42 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 8, alignItems: 'center' }}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.key === 'ONLINE' ? `Online (${state.onlineCount})` : f.label}
              selected={filter === f.key}
              solid={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>
      </View>

      {filter === 'IPTV' ? (
        <FlatList
          data={filteredIptv}
          keyExtractor={(item) => item.id}
          renderItem={renderIptv}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, paddingTop: 8, paddingBottom: 36, gap: 10 }}
          initialNumToRender={12}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderServer}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, paddingTop: 8, paddingBottom: 36, gap: 10 }}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="server-network-off" size={42} color={colors.textDim} />
              <Txt weight="bold" size={15} style={{ marginTop: 10 }}>
                No servers match this filter
              </Txt>
              <Txt size={12} color={colors.textMuted} align="center" style={{ marginTop: 4 }}>
                Tap "All" or run "Deep Scan All" to probe every BDIX server on your current ISP.
              </Txt>
            </View>
          }
        />
      )}

      {/* Live IPTV Playlist Channel Browser Sheet */}
      <Sheet visible={activePlaylist !== null} onClose={() => setActivePlaylist(null)}>
        {activePlaylist ? (
          <View style={{ maxHeight: 460 }}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
              <Txt weight="bold" size={16}>
                {activePlaylist.name}
              </Txt>
              <Txt size={12} color={colors.textMuted} style={{ marginTop: 2 }}>
                {playlistLoading
                  ? 'Fetching live M3U channels…'
                  : `${playlistChannels.length} live streams ready to play`}
              </Txt>
            </View>
            {playlistLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.mint} />
              </View>
            ) : playlistChannels.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Txt size={13} color={colors.textMuted}>
                  No active streams returned by this playlist right now.
                </Txt>
              </View>
            ) : (
              <FlatList
                data={playlistChannels}
                keyExtractor={(c) => c.id}
                initialNumToRender={14}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}
                renderItem={({ item }) => (
                  <PressableScale
                    scaleTo={0.97}
                    onPress={() => {
                      setActivePlaylist(null);
                      nav.navigate('Live', { channelId: item.id });
                    }}
                    style={styles.channelItem}
                  >
                    <ChannelLogo channel={item} size={42} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Txt weight="bold" size={14} numberOfLines={1}>
                        {item.name}
                      </Txt>
                      <Txt size={11} color={colors.textMuted} numberOfLines={1}>
                        {item.category} · {item.country}
                      </Txt>
                    </View>
                    <Ionicons name="play-circle" size={26} color={colors.mint} />
                  </PressableScale>
                )}
              />
            )}
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  heroCard: {
    marginHorizontal: layout.gutter,
    marginTop: 4,
    padding: 14,
    borderRadius: radius.xl,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 176, 0.28)',
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoSwitchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0, 229, 176, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 176, 0.42)',
  },
  progressSection: {
    marginTop: 12,
  },
  progressBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surface4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.mint,
  },
  scanButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  quickBtn: {
    flex: 1,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deepScanWrap: {
    flex: 1.4,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  deepScanBtn: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    marginHorizontal: layout.gutter,
    marginTop: 10,
    marginBottom: 6,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: font.regular,
    fontSize: 13,
    paddingVertical: 0,
  },
  serverCard: {
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  serverCardPinned: {
    borderColor: colors.mint,
    backgroundColor: 'rgba(0, 229, 176, 0.08)',
  },
  serverTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  serverActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.12)',
  },
  actionBtn: {
    flex: 1,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: {
    backgroundColor: colors.mint,
  },
  browseBtn: {
    flex: 1,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0, 229, 176, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 229, 176, 0.38)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 28,
  },
});
