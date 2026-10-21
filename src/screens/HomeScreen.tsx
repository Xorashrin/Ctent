// MythTube Home Screen — Aurora Slate & Mint-Cyan Organizer
// Features:
// - Top MythTube bar with Wordmark + LiveServerStatusPill (pulsing online dot & fastest latency)
// - 6 ChipSpec filters: All, Movies, TV Shows, Anime, BDIX Files, My List + Genres
// - HeroRotator spotlight carousel (6 auto-rotating titles with KenBurns drift & ExpandingDots)
// - Direct BDIX Folder row (SectionStyle.FOLDER -> opens BrowseScreen)
// - Multi-style catalog sections (POSTER, LANDSCAPE, TOP10) -> "Explore" opens CatalogScreen
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShimmerBox } from '../components/Animations';
import { Billboard } from '../components/Billboard';
import { Chip } from '../components/Chip';
import { SheetItem } from '../components/ListItems';
import { Wordmark } from '../components/Logo';
import { ContinueRow, FolderRow, PosterRow, SkeletonRow, type ContinueItem } from '../components/Rows';
import { HeaderActions, LiveServerStatusPill } from '../components/ScreenHeader';
import { Sheet } from '../components/Sheet';
import { Txt } from '../components/Txt';
import { findEpisode, type SectionStyle, type Title } from '../data/types';
import { useRootNav, type TabParamList } from '../navigation/types';
import { HOME_ROWS, resolveTitle, useFeedRows, useRows, type RowState } from '../services/catalog';
import { FEATURED_BDIX_FOLDERS, type FeaturedBdixFolder } from '../services/directoryBrowser';
import { filterTitlesByChip, type HomeChipFilter } from '../services/organizer';
import { warmUp } from '../services/playback';
import { useApp } from '../state/AppState';
import { colors, layout, radius } from '../theme/tokens';
import { shade } from '../utils/color';

type Props = BottomTabScreenProps<TabParamList, 'Home'>;

const HOME_CHIPS: { key: HomeChipFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'MOVIES', label: 'Movies' },
  { key: 'SERIES', label: 'TV Shows' },
  { key: 'ANIME', label: 'Anime' },
  { key: 'FILES', label: 'BDIX Files' },
  { key: 'MY_LIST', label: 'My List' },
];

type Section =
  | { key: string; kind: 'hero' }
  | { key: string; kind: 'folders' }
  | { key: string; kind: 'continue'; items: ContinueItem[] }
  | {
      key: string;
      kind: 'row';
      rowKey?: string;
      title: string;
      subtitle?: string;
      styleType?: SectionStyle;
      items: Title[];
      loading: boolean;
      seeAll?: () => void;
    };

export default function HomeScreen({ route, navigation }: Props) {
  const nav = useRootNav();
  const insets = useSafeAreaInsets();
  const { profileData, toggleMyList, rate, removeProgress, showToast } = useApp();
  const [chip, setChip] = useState<HomeChipFilter>('ALL');
  const [menuItem, setMenuItem] = useState<ContinueItem | null>(null);
  const genre = route.params?.genre;
  const { rows: baseRows, refresh, refreshing } = useRows(HOME_ROWS);
  const feed = useFeedRows();

  useEffect(() => {
    feed.more(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilter = useCallback(
    (r: RowState): RowState => {
      let out = filterTitlesByChip(r.items, chip, profileData.myList);
      if (genre) {
        out = out.filter((t) => t.genres.some((g) => g.toLowerCase() === genre.toLowerCase()));
      }
      return { ...r, items: out };
    },
    [chip, genre, profileData.myList],
  );

  const rows = useMemo(
    () =>
      [...baseRows, ...feed.rows]
        .map(applyFilter)
        .filter((r) => (r.loading && chip === 'ALL') || r.items.length > 0),
    [baseRows, feed.rows, applyFilter, chip],
  );

  const spotlightPool = useMemo<Title[]>(() => {
    const pool = rows.flatMap((r) => r.items).filter((t) => t.background || t.poster);
    const seen = new Set<string>();
    const unique: Title[] = [];
    for (const t of pool) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      unique.push(t);
      if (unique.length >= 6) break;
    }
    return unique;
  }, [rows]);

  const hero = spotlightPool[0] ?? null;

  useEffect(() => {
    if (hero) warmUp(hero);
  }, [hero?.id]);

  const continueItems = useMemo<ContinueItem[]>(
    () =>
      profileData.progress
        .map((entry) => {
          const title = resolveTitle(entry.titleId);
          const ep = entry.episodeId ? findEpisode(title, entry.episodeId) : null;
          return { title, entry, label: ep ? `S${ep.season.number}:E${ep.episode.number}` : undefined };
        })
        .filter((i) => i.title.name !== 'Unavailable title'),
    [profileData.progress],
  );

  const myListItems = useMemo(
    () => profileData.myList.map(resolveTitle).filter((t) => t.name !== 'Unavailable title'),
    [profileData.myList],
  );

  const openTitle = useCallback((t: Title) => nav.navigate('Title', { id: t.id }), [nav]);
  const playTitle = useCallback((t: Title) => nav.navigate('Player', { id: t.id }), [nav]);
  const playContinue = useCallback(
    (i: ContinueItem) => nav.navigate('Player', { id: i.title.id, episodeId: i.entry.episodeId }),
    [nav],
  );
  const openFolder = useCallback(
    (f: FeaturedBdixFolder) => nav.navigate('Browse', { serverId: f.id, url: f.url, title: f.serverName }),
    [nav],
  );

  const sections = useMemo<Section[]>(() => {
    const list: Section[] = [{ key: 'hero', kind: 'hero' }];
    if (continueItems.length > 0 && (chip === 'ALL' || chip === 'MY_LIST')) {
      list.push({ key: 'continue', kind: 'continue', items: continueItems });
    }
    if (chip === 'ALL' || chip === 'FILES') {
      list.push({ key: 'folders', kind: 'folders' });
    }
    if (myListItems.length > 0 && (chip === 'ALL' || chip === 'MY_LIST')) {
      list.push({
        key: 'mylist',
        kind: 'row',
        title: 'Saved in My Space',
        subtitle: 'Your personal watchlist',
        styleType: 'POSTER',
        items: myListItems,
        loading: false,
        seeAll: () => nav.navigate('MyList'),
      });
    }
    for (const r of rows) {
      list.push({
        key: r.def.key,
        rowKey: r.def.key,
        kind: 'row',
        title: r.def.title,
        subtitle: r.def.subtitle,
        styleType: r.def.style ?? 'POSTER',
        items: r.items,
        loading: r.loading,
        seeAll: () => nav.navigate('Catalog', { rowKey: r.def.key, title: r.def.title }),
      });
    }
    return list;
  }, [continueItems, myListItems, rows, chip, nav]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = useRef(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true }),
  ).current;

  const headerTop = insets.top + layout.headerHeight;
  const headerBgStyle = {
    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [0.3, 0.96], extrapolate: 'clamp' }),
  };

  useFocusEffect(
    useCallback(() => {
      if (chip === 'ALL' && !genre) return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setChip('ALL');
        navigation.setParams({ genre: undefined });
        return true;
      });
      return () => sub.remove();
    }, [chip, genre, navigation]),
  );

  const tint = hero?.tint ?? '#091522';

  const renderItem = useCallback(
    ({ item }: { item: Section }) => {
      switch (item.kind) {
        case 'hero':
          return hero ? (
            <Billboard
              title={hero}
              pool={spotlightPool}
              inMyList={profileData.myList.includes(hero.id)}
              isSaved={(id: string) => profileData.myList.includes(id)}
              onOpen={openTitle}
              onPlay={playTitle}
              onToggleList={(t: Title) => {
                const exists = profileData.myList.includes(t.id);
                toggleMyList(t.id);
                showToast(exists ? 'Removed from My Space' : 'Saved to My Space');
              }}
            />
          ) : (
            <View style={{ paddingHorizontal: layout.gutter, marginTop: 6 }}>
              <ShimmerBox width="100%" height={390} borderRadius={radius.xxl} />
            </View>
          );
        case 'folders':
          return (
            <FolderRow
              title="Direct BDIX Folders"
              subtitle="Instant zero-buffer HTTP & FTP directory indexes"
              folders={FEATURED_BDIX_FOLDERS}
              onPressFolder={openFolder}
              onSeeAllServers={() => navigation.navigate('Servers')}
            />
          );
        case 'continue':
          return (
            <ContinueRow
              title="Continue Watching"
              items={item.items}
              onPlay={playContinue}
              onInfo={openTitle}
              onMore={setMenuItem}
            />
          );
        default:
          return item.items.length === 0 ? (
            <SkeletonRow title={item.title} subtitle={item.subtitle} />
          ) : (
            <PosterRow
              title={item.title}
              subtitle={item.subtitle}
              styleType={item.styleType}
              items={item.items}
              onPressTitle={openTitle}
              onSeeAll={item.seeAll}
            />
          );
      }
    },
    [
      hero,
      spotlightPool,
      profileData.myList,
      openTitle,
      playTitle,
      toggleMyList,
      showToast,
      openFolder,
      navigation,
      playContinue,
    ],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[shade(tint, 0.18), shade(tint, 0.58), colors.bg]}
        locations={[0, 0.48, 1]}
        style={[styles.tint, { height: headerTop + 680 }]}
        pointerEvents="none"
      />

      <Animated.FlatList
        key={`${chip}-${genre ?? ''}`}
        data={sections}
        keyExtractor={(s) => s.key}
        renderItem={renderItem}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={7}
        removeClippedSubviews
        onEndReachedThreshold={1.5}
        onEndReached={() => feed.more(3)}
        contentContainerStyle={{ paddingTop: headerTop + layout.chipRowHeight + 6, paddingBottom: 42 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.mint}
            progressViewOffset={headerTop + layout.chipRowHeight}
          />
        }
        ListFooterComponent={<SkeletonRow title="Discovering more streams…" />}
      />

      {/* Top Glass Header + MythTube ChipSpec Bar */}
      <View pointerEvents="box-none" style={[styles.header, { height: headerTop + layout.chipRowHeight }]}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, headerBgStyle]}
        />
        <View style={[styles.headerRow, { marginTop: insets.top }]}>
          <View style={{ flex: 1 }}>
            <Wordmark size={19} />
          </View>
          <LiveServerStatusPill onPress={() => navigation.navigate('Servers')} />
          <HeaderActions actions={['downloads', 'search']} searchScope={{ genre }} />
        </View>

        <View style={styles.chipsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {HOME_CHIPS.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                selected={chip === c.key}
                solid={chip === c.key}
                onPress={() => setChip(c.key)}
              />
            ))}
            <Chip
              label={genre ?? 'Genres'}
              caret
              selected={!!genre}
              onPress={() => nav.navigate('Categories', { current: genre })}
            />
          </ScrollView>
        </View>
      </View>

      <Sheet visible={menuItem !== null} onClose={() => setMenuItem(null)}>
        {menuItem ? (
          <>
            <Txt weight="bold" size={16} style={styles.sheetTitle} numberOfLines={1}>
              {menuItem.title.name}
              {menuItem.label ? `  ${menuItem.label}` : ''}
            </Txt>
            <SheetItem
              label="Episodes & Details"
              icon="information-circle-outline"
              onPress={() => {
                setMenuItem(null);
                openTitle(menuItem.title);
              }}
            />
            <SheetItem
              label="Not for me"
              icon="thumbs-down-outline"
              onPress={() => {
                rate(menuItem.title.id, 'down');
                setMenuItem(null);
                showToast("We won't suggest this again.");
              }}
            />
            <SheetItem
              label="I like this"
              icon="thumbs-up-outline"
              onPress={() => {
                rate(menuItem.title.id, 'up');
                setMenuItem(null);
                showToast("You'll see more like this.");
              }}
            />
            <SheetItem
              label="Remove From Continue Watching"
              icon="close-circle-outline"
              destructive
              onPress={() => {
                removeProgress(menuItem.title.id);
                setMenuItem(null);
                showToast('Removed from Continue Watching');
              }}
            />
          </>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tint: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 229, 176, 0.16)',
  },
  headerRow: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.gutter,
    gap: 8,
  },
  chipsWrap: {
    height: layout.chipRowHeight,
    justifyContent: 'center',
  },
  chipsScroll: {
    paddingHorizontal: layout.gutter,
    gap: 8,
    alignItems: 'center',
  },
  sheetTitle: { paddingHorizontal: 20, paddingVertical: 10 },
});
