// MythTube Library & Hub ("My Space") — Aurora Slate & Mint-Cyan Organizer
// Combines:
// - Stats dashboard (Saved in My Space, Offline Downloads, Online BDIX Servers, Continue Watching)
// - Quick Organizer Grid (Downloads, BDIX & IPTV Hub, Live TV Channels, Live News, App Settings, 18+ Vault)
// - Watchlist ("My Space"), Liked Titles & Live TV Channel Strip
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { FadeSlideIn, PressableScale } from '../components/Animations';
import { ChannelLogo } from '../components/ChannelLogo';
import { Poster, POSTER } from '../components/Poster';
import { RowHeader } from '../components/Rows';
import { ScreenHeader } from '../components/ScreenHeader';
import { Txt } from '../components/Txt';
import { CHANNELS } from '../data/channels';
import type { Title } from '../data/types';
import { useRootNav } from '../navigation/types';
import { resolveTitle } from '../services/catalog';
import { useServerEngine } from '../services/serverEngine';
import { useApp } from '../state/AppState';
import { colors, layout, radius } from '../theme/tokens';

export default function MyNetflixScreen() {
  const nav = useRootNav();
  const { profileData } = useApp();
  const { state: serverState } = useServerEngine();
  const open = useCallback((t: Title) => nav.navigate('Title', { id: t.id }), [nav]);

  const liked = Object.entries(profileData.ratings)
    .filter(([, r]) => r !== 'down')
    .map(([id]) => resolveTitle(id))
    .filter((t) => t.name !== 'Unavailable title');
  const myList = profileData.myList.map(resolveTitle).filter((t) => t.name !== 'Unavailable title');
  const downloadCount = new Set(profileData.downloads.map((d) => d.titleId)).size;
  const livePreview = CHANNELS.slice(0, 18);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="My Space"
        subtitle="Library · Offline Downloads · Live TV · Settings"
        showServerPill
        actions={['search']}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 42 }} showsVerticalScrollIndicator={false}>
        {/* Dashboard Stats Card */}
        <FadeSlideIn delay={20} distance={10}>
          <LinearGradient
            colors={['rgba(0, 229, 176, 0.14)', 'rgba(14, 165, 233, 0.12)', 'rgba(13, 21, 34, 0.94)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCard}
          >
            <View style={styles.statBox}>
              <Txt weight="bold" size={20} color={colors.mint}>
                {myList.length}
              </Txt>
              <Txt size={11} color={colors.textMuted}>
                Saved
              </Txt>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Txt weight="bold" size={20} color={colors.cyan}>
                {downloadCount}
              </Txt>
              <Txt size={11} color={colors.textMuted}>
                Downloads
              </Txt>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Txt weight="bold" size={20} color={colors.emerald}>
                {serverState.onlineCount}
              </Txt>
              <Txt size={11} color={colors.textMuted}>
                Online BDIX
              </Txt>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Txt weight="bold" size={20} color={colors.amber}>
                {profileData.progress.length}
              </Txt>
              <Txt size={11} color={colors.textMuted}>
                History
              </Txt>
            </View>
          </LinearGradient>
        </FadeSlideIn>

        {/* Organizer Action Tiles */}
        <FadeSlideIn delay={55} distance={12} style={styles.tileGrid}>
          <PressableScale scaleTo={0.96} onPress={() => nav.navigate('Downloads')} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(14, 165, 233, 0.14)' }]}>
              <Ionicons name="download-outline" size={20} color={colors.cyan} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={14}>
                Downloads
              </Txt>
              <Txt size={11} color={colors.textDim}>
                {downloadCount > 0 ? `${downloadCount} offline files` : 'Multi-thread Giga'}
              </Txt>
            </View>
          </PressableScale>

          <PressableScale scaleTo={0.96} onPress={() => nav.navigate('MyList')} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(0, 229, 176, 0.14)' }]}>
              <Ionicons name="bookmark-outline" size={20} color={colors.mint} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={14}>
                Watchlist
              </Txt>
              <Txt size={11} color={colors.textDim}>
                {myList.length} saved titles
              </Txt>
            </View>
          </PressableScale>

          <PressableScale scaleTo={0.96} onPress={() => nav.navigate('ServersModal')} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
              <MaterialCommunityIcons name="server-network" size={20} color={colors.emerald} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={14}>
                BDIX & IPTV
              </Txt>
              <Txt size={11} color={colors.textDim}>
                {serverState.totalKnown} servers
              </Txt>
            </View>
          </PressableScale>

          <PressableScale scaleTo={0.96} onPress={() => nav.navigate('Notifications')} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
              <Ionicons name="radio-outline" size={20} color={colors.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={14}>
                Live News
              </Txt>
              <Txt size={11} color={colors.textDim}>
                24/7 TV streams
              </Txt>
            </View>
          </PressableScale>

          <PressableScale scaleTo={0.96} onPress={() => nav.navigate('AppSettings')} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(59, 130, 246, 0.16)' }]}>
              <Ionicons name="settings-outline" size={20} color={colors.sapphire} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={14}>
                Settings
              </Txt>
              <Txt size={11} color={colors.textDim}>
                Quality, threads & dir
              </Txt>
            </View>
          </PressableScale>

          <PressableScale scaleTo={0.96} onPress={() => nav.navigate('AdultContent')} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(244, 63, 94, 0.14)' }]}>
              <Ionicons name="flame-outline" size={20} color={colors.rose} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={14}>
                18+ Vault
              </Txt>
              <Txt size={11} color={colors.textDim}>
                Adult catalogs & TV
              </Txt>
            </View>
          </PressableScale>
        </FadeSlideIn>

        {/* Saved Watchlist Row */}
        {myList.length > 0 ? (
          <View style={{ marginTop: 22 }}>
            <RowHeader title="Saved in My Space" subtitle="Your bookmarked movies, series & anime" onSeeAll={() => nav.navigate('MyList')} />
            <FlatList
              horizontal
              data={myList}
              keyExtractor={(t) => t.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 10 }}
              renderItem={({ item }) => <Poster title={item} width={POSTER.width} height={POSTER.height} onPress={open} />}
            />
          </View>
        ) : null}

        {/* Liked Row */}
        {liked.length > 0 ? (
          <View style={{ marginTop: 22 }}>
            <RowHeader title="Liked & Favorited" subtitle="Titles you rated positively" />
            <FlatList
              horizontal
              data={liked}
              keyExtractor={(t) => t.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 10 }}
              renderItem={({ item }) => <Poster title={item} width={POSTER.width} height={POSTER.height} onPress={open} />}
            />
          </View>
        ) : null}

        {/* Live TV Channels Organizer */}
        <FadeSlideIn delay={90} distance={12} style={{ marginTop: 24 }}>
          <RowHeader
            title="Live TV Channels"
            subtitle="Bangladeshi, Indian & International live broadcasts"
            onSeeAll={() => nav.navigate('Search', { live: true })}
          />
          <FlatList
            horizontal
            data={livePreview}
            keyExtractor={(c) => c.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 10 }}
            renderItem={({ item }) => (
              <PressableScale
                scaleTo={0.95}
                onPress={() => nav.navigate('Live', { channelId: item.id })}
                style={styles.channelCard}
              >
                <ChannelLogo channel={item} size={96} />
                <Txt weight="semibold" size={11} numberOfLines={1} style={{ marginTop: 6 }}>
                  {item.name}
                </Txt>
              </PressableScale>
            )}
          />
        </FadeSlideIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  statsCard: {
    marginHorizontal: layout.gutter,
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 176, 0.28)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: layout.gutter,
    marginTop: 14,
    gap: 10,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelCard: {
    width: 96,
    alignItems: 'center',
  },
});
