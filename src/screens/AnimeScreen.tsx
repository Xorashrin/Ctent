// MythTube Anime Hub — Aurora Slate & Mint-Cyan Organizer
// Features:
// - "On Your BDIX Servers" full-speed anime row (CircleFTP + CyberFTP anime)
// - "Anime Portals & Direct DDL" organizer row (27 Wotaku + AniSpace + Tokyo Insider portals)
// - "Explore by Genre" chips (ANIME_GENRES)
// - Airing schedule (LANDSCAPE), Top 10 Trending (TOP10), Seasonal, Popular, Top Rated & Anime Movies
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { FadeSlideIn, PressableScale, ShimmerBox } from '../components/Animations';
import { Billboard } from '../components/Billboard';
import { Chip } from '../components/Chip';
import { Poster } from '../components/Poster';
import { PosterRow, RowHeader, SkeletonRow } from '../components/Rows';
import { ScreenHeader } from '../components/ScreenHeader';
import { Txt } from '../components/Txt';
import type { Title } from '../data/types';
import { useRootNav } from '../navigation/types';
import { ANIME_GENRES, ANIME_ROWS, loadAnimeGenre, useRows } from '../services/catalog';
import { warmUp } from '../services/playback';
import { WOTAKU_ANIME_SERVERS, type WotakuAnimeServer } from '../services/sources/animeDirect';
import { useApp } from '../state/AppState';
import { colors, layout, PORTAL_PALETTE, radius } from '../theme/tokens';

export default function AnimeScreen() {
  const nav = useRootNav();
  const { width } = useWindowDimensions();
  const { profileData, toggleMyList, showToast } = useApp();
  const { rows, refresh, refreshing } = useRows(ANIME_ROWS);
  const [genre, setGenre] = useState<string | null>(null);
  const [items, setItems] = useState<Title[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const cell = Math.floor((width - layout.gutter * 2 - 20) / 3);

  const openTitle = useCallback((t: Title) => nav.navigate('Title', { id: t.id }), [nav]);
  const playTitle = useCallback((t: Title) => nav.navigate('Player', { id: t.id }), [nav]);

  const spotlightPool = useMemo(() => {
    const trending = rows.find((r) => r.def.key === 'an-trending')?.items ?? [];
    const bdix = rows.find((r) => r.def.key === 'an-bdix')?.items ?? [];
    return [...bdix, ...trending].filter((t) => t.background || t.poster).slice(0, 6);
  }, [rows]);

  const hero = spotlightPool[0] ?? null;

  useEffect(() => {
    if (hero) warmUp(hero);
  }, [hero?.id]);

  const more = useCallback(
    async (reset: boolean) => {
      if (!genre || loading || (done && !reset)) return;
      setLoading(true);
      try {
        const p = reset ? 1 : page;
        const next = await loadAnimeGenre(genre, p);
        setItems((prev) => (reset ? next : [...prev, ...next.filter((n) => !prev.some((x) => x.id === n.id))]));
        setPage(p + 1);
        setDone(next.length < 30);
      } catch {
        // retry on scroll
      } finally {
        setLoading(false);
      }
    },
    [genre, loading, done, page],
  );

  useEffect(() => {
    setItems([]);
    setPage(1);
    setDone(false);
    if (genre) more(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre]);

  const handlePortalPress = (portal: WotakuAnimeServer) => {
    showToast(`${portal.name} is active in MythTube's Anime Engine`);
    nav.navigate('Search', { kind: 'anime' });
  };

  const chips = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      <Chip label="All Anime" selected={genre === null} solid={genre === null} onPress={() => setGenre(null)} />
      {ANIME_GENRES.map((g) => (
        <Chip key={g} label={g} selected={genre === g} solid={genre === g} onPress={() => setGenre(g)} />
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Anime Hub"
        subtitle={`BDIX Direct · AniList · ${WOTAKU_ANIME_SERVERS.length} Anime Portals`}
        showServerPill
        actions={['search']}
        searchScope={{ kind: 'anime' }}
      />
      {genre ? (
        <FlatList
          key={`genre-${genre}`}
          data={items}
          keyExtractor={(t) => t.id}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          onEndReached={() => more(false)}
          onEndReachedThreshold={0.6}
          initialNumToRender={12}
          windowSize={7}
          removeClippedSubviews
          ListHeaderComponent={chips}
          ListFooterComponent={
            loading ? <ActivityIndicator color={colors.mint} style={{ padding: 24 }} /> : <View style={{ height: 24 }} />
          }
          renderItem={({ item }) => (
            <Poster title={item} width={cell} height={Math.round(cell * 1.46)} onPress={openTitle} />
          )}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 38 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mint} />}
        >
          {chips}
          {hero ? (
            <Billboard
              title={hero}
              pool={spotlightPool}
              inMyList={profileData.myList.includes(hero.id)}
              isSaved={(id) => profileData.myList.includes(id)}
              onOpen={openTitle}
              onPlay={playTitle}
              onToggleList={(t) => {
                const exists = profileData.myList.includes(t.id);
                toggleMyList(t.id);
                showToast(exists ? 'Removed from My Space' : 'Saved to My Space');
              }}
            />
          ) : (
            <View style={{ paddingHorizontal: layout.gutter, marginTop: 6 }}>
              <ShimmerBox width="100%" height={380} borderRadius={radius.xxl} />
            </View>
          )}

          {/* Anime Portals Organizer (27 Wotaku + AniSpace + Tokyo Insider DDL) */}
          <FadeSlideIn delay={40} distance={10} style={{ marginTop: 22 }}>
            <RowHeader
              title="Anime Portals & Direct Scrapers"
              subtitle={`${WOTAKU_ANIME_SERVERS.length} verified anime sources (Tokyo Insider, AniSpace, AniZone, Pahe, KAA)`}
              onSeeAll={() => nav.navigate('ServersModal')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 10 }}
            >
              {WOTAKU_ANIME_SERVERS.map((p, idx) => {
                const accent = PORTAL_PALETTE[idx % PORTAL_PALETTE.length];
                return (
                  <PressableScale
                    key={p.id}
                    scaleTo={0.96}
                    onPress={() => handlePortalPress(p)}
                    style={[styles.portalCard, { borderColor: `${accent}44` }]}
                  >
                    <View style={[styles.portalIcon, { backgroundColor: `${accent}1E` }]}>
                      <MaterialCommunityIcons name="star-four-points" size={18} color={accent} />
                    </View>
                    <Txt weight="bold" size={13} numberOfLines={1} style={{ marginTop: 8 }}>
                      {p.name}
                    </Txt>
                    <Txt size={10} color={colors.textDim} numberOfLines={1} style={{ marginTop: 2 }}>
                      {p.url.replace(/^https?:\/\/(www\.)?/, '')}
                    </Txt>
                    <View style={styles.portalStatus}>
                      <View style={[styles.portalDot, { backgroundColor: colors.mint }]} />
                      <Txt weight="semibold" size={9} color={accent}>
                        {p.source.toUpperCase()}
                      </Txt>
                    </View>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </FadeSlideIn>

          {rows.map((r) =>
            r.items.length === 0 ? (
              r.loading ? <SkeletonRow key={r.def.key} title={r.def.title} subtitle={r.def.subtitle} /> : null
            ) : (
              <PosterRow
                key={r.def.key}
                title={r.def.title}
                subtitle={r.def.subtitle}
                styleType={r.def.style ?? 'POSTER'}
                items={r.items}
                onPressTitle={openTitle}
                onSeeAll={() => nav.navigate('Catalog', { rowKey: r.def.key, title: r.def.title, anime: true })}
              />
            ),
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  chips: { gap: 8, paddingHorizontal: layout.gutter, paddingVertical: 10 },
  grid: { gap: 10, paddingBottom: 28 },
  gridRow: { gap: 10, paddingHorizontal: layout.gutter },
  portalCard: {
    width: 148,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
  },
  portalIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },
  portalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
