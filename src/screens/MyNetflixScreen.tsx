// Ctent Library & Hub ("My Ctent") — reverse-engineered from app-release.apk (Lz8 MyListScreen).
// Combines:
// - Stats dashboard (Saved in My Ctent, Offline Downloads, Online BDIX Servers, Continue Watching)
// - Quick Organizer Grid (Downloads, BDIX Server Manager, Live TV Channels, Live News, App Settings, 18+ Vault)
// - Watchlist ("My Ctent"), Liked Titles & Live TV Channel Strip
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
import { colors, GRADIENTS, layout, radius } from '../theme/tokens';

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
        title="My Ctent"
        subtitle="Library · Offline Downloads · Live TV · Settings"
        showServerPill
        actions={['search']}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 42 }} showsVerticalScrollIndicator={false}>
        {/* Dashboard Stats Card */}
        <LinearGradient
          colors={['rgba(59,28,255,0.22)', 'rgba(139,44,245,0.18)', 'rgba(27,24,36,0.92)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsCard}
        >
          <View style={styles.statBox}>
            <Txt weight="bold" size={20} color={colors.magenta}>
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
            <Txt weight="bold" size={20} color={colors.online}>
              {serverState.onlineCount}
            </Txt>
            <Txt size={11} color={colors.textMuted}>
              Online BDIX
            </Txt>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Txt weight="bold" size={20} color={colors.gold}>
              {profileData.progress.length}
            </Txt>
            <Txt size={11} color={colors.textMuted}>
              History
            </Txt>
          </View>
        </LinearGradient>

        {/* Organizer Action Tiles */}
        <View style={styles.tileGrid}>
          <Pressable onPress={() => nav.navigate('Downloads')} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(61,220,255,0.16)' }]}>
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
          </Pressable>

          <Pressable onPress={() => nav.navigate('MyList')} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(226,28,240,0.16)' }]}>
              <Ionicons name="bookmark-outline" size={20} color={colors.magenta} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={14}>
                Watchlist
              </Txt>
              <Txt size={11} color={colors.textDim}>
                {myList.length} saved titles
              </Txt>
            </View>
          </Pressable>

          <Pressable onPress={() => nav.navigate('ServersModal')} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(34,211,122,0.16)' }]}>
              <MaterialCommunityIcons name="server-network" size={20} color={colors.online} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={14}>
                BDIX Routers
              </Txt>
              <Txt size={11} color={colors.textDim}>
                {serverState.totalKnown} servers
              </Txt>
            </View>
          </Pressable>

          <Pressable onPress={() => nav.navigate('Notifications')} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(255,176,32,0.16)' }]}>
              <Ionicons name="radio-outline" size={20} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={14}>
                Live News
              </Txt>
              <Txt size={11} color={colors.textDim}>
                24/7 TV streams
              </Txt>
            </View>
          </Pressable>

          <Pressable onPress={() => nav.navigate('AppSettings')} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(139,44,245,0.18)' }]}>
              <Ionicons name="settings-outline" size={20} color={colors.violet} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={14}>
                Settings
              </Txt>
              <Txt size={11} color={colors.textDim}>
                Quality, threads & dir
              </Txt>
            </View>
          </Pressable>

          <Pressable onPress={() => nav.navigate('AdultContent')} style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(255,45,149,0.16)' }]}>
              <Ionicons name="flame-outline" size={20} color={colors.pink} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={14}>
                18+ Vault
              </Txt>
              <Txt size={11} color={colors.textDim}>
                Adult catalogs
              </Txt>
            </View>
          </Pressable>
        </View>

        {/* Saved Watchlist Row */}
        {myList.length > 0 ? (
          <View style={{ marginTop: 22 }}>
            <RowHeader title="Saved in My Ctent" subtitle="Your bookmarked movies, series & anime" onSeeAll={() => nav.navigate('MyList')} />
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
        <View style={{ marginTop: 24 }}>
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
              <Pressable
                onPress={() => nav.navigate('Live', { channelId: item.id })}
                style={styles.channelCard}
              >
                <ChannelLogo channel={item} size={96} />
                <Txt weight="semibold" size={11} numberOfLines={1} style={{ marginTop: 6 }}>
                  {item.name}
                </Txt>
              </Pressable>
            )}
          />
        </View>
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
    borderColor: 'rgba(139,44,245,0.32)',
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
    backgroundColor: 'rgba(255,255,255,0.10)',
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
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
