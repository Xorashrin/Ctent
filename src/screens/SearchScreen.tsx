// Ctent Multi-Server Search Organizer — reverse-engineered from app-release.apk (La9 SearchScreen & Ln8 SearchGroup).
// Features:
// - Filter chips: All, Movies, TV Shows, Anime, BDIX Files
// - Dual Organizer View:
//   1. "Merged Grid": deduplicated 3-column grid showing multi-server copy badges ("3 SRV")
//   2. "By Server": grouped per server (SearchGroup(server, items)) for CircleFTP, CyberFTP, AmaderFTP, BDIX, Southfreak, AniList & Global
// - Smart query parser ("Show Name season 1 ep 5") with instant episode jump
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChannelLogo } from '../components/ChannelLogo';
import { Chip } from '../components/Chip';
import { Image } from '../components/Img';
import { categoryOf, Poster, POSTER } from '../components/Poster';
import { RowHeader } from '../components/Rows';
import { Txt } from '../components/Txt';
import { searchChannels } from '../data/channels';
import type { Title } from '../data/types';
import { useRootNav, type RootStackParamList } from '../navigation/types';
import { ANIME_ROWS, loadDetail, rowsByKey, searchAll, useRows } from '../services/catalog';
import { filterTitlesByChip, groupSearchByServer, type HomeChipFilter } from '../services/organizer';
import { warmUp } from '../services/playback';
import { addHistory, clearHistory, getHistory, parseQuery, removeHistory, suggest, type Suggestion } from '../services/searchTools';
import { colors, font, layout, radius } from '../theme/tokens';

const RECOMMENDED_ROWS = rowsByKey('bdix-fast', 'cm-series', 'cm-movies');
const ANIME_RECOMMENDED = ANIME_ROWS.slice(0, 3);

const SEARCH_CHIPS: { key: HomeChipFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'MOVIES', label: 'Movies' },
  { key: 'SERIES', label: 'TV Shows' },
  { key: 'ANIME', label: 'Anime' },
  { key: 'FILES', label: 'BDIX Direct' },
];

export default function SearchScreen({ route }: { route?: { name?: string; params?: RootStackParamList['Search'] } }) {
  const nav = useRootNav();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scope = route?.params;
  const isStackModal = route?.name === 'Search';

  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [results, setResults] = useState<Title[]>([]);
  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [focused, setFocused] = useState(false);
  const [chip, setChip] = useState<HomeChipFilter>(
    scope?.kind === 'anime' ? 'ANIME' : scope?.kind === 'movie' ? 'MOVIES' : scope?.kind === 'series' ? 'SERIES' : 'ALL',
  );
  const [groupByServer, setGroupByServer] = useState(false);

  const { rows } = useRows(scope?.kind === 'anime' ? ANIME_RECOMMENDED : RECOMMENDED_ROWS);
  const parsed = useMemo(() => parseQuery(deferred), [deferred]);

  const recommended = useMemo(() => {
    const all = rows.flatMap((r) => r.items);
    return filterTitlesByChip(all, chip).slice(0, 28);
  }, [rows, chip]);

  useEffect(() => {
    getHistory().then(setHistory);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || scope?.live) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      suggest(q, history).then((s) => !cancelled && setSuggestions(s));
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, history, scope?.live]);

  useEffect(() => {
    const q = parsed.text;
    if (q.length < 2 || scope?.live) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchAll(q)
        .then((found) => {
          if (cancelled) return;
          setResults(found);
          if (found[0] && !found[0].nsfw) warmUp(found[0]);
        })
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [parsed.text, scope?.live]);

  const filteredResults = useMemo(() => filterTitlesByChip(results, chip), [results, chip]);
  const serverGroups = useMemo(() => groupSearchByServer(filteredResults), [filteredResults]);
  const channels = useMemo(() => (scope?.live ? searchChannels(deferred, 24) : []), [deferred, scope?.live]);
  const hasQuery = deferred.trim().length > 0;
  const cell = Math.floor((width - layout.gutter * 2 - 20) / 3);

  const series = useMemo(
    () => (parsed.season || parsed.episode ? filteredResults.find((t) => t.kind === 'series') : undefined),
    [parsed, filteredResults],
  );

  const remember = useCallback(async (text: string) => {
    setHistory(await addHistory(text));
  }, []);

  const open = useCallback(
    (t: Title, season?: number) => {
      Keyboard.dismiss();
      remember(query || t.name);
      nav.navigate('Title', { id: t.id, season });
    },
    [nav, query, remember],
  );

  const playEpisode = useCallback(
    async (t: Title, season: number, episode: number) => {
      Keyboard.dismiss();
      remember(query);
      const full = await loadDetail(t.id);
      const hit = full.seasons.find((s) => s.number === season)?.episodes.find((e) => e.number === episode);
      if (hit) nav.navigate('Player', { id: t.id, episodeId: hit.id });
      else nav.navigate('Title', { id: t.id, season });
    },
    [nav, query, remember],
  );

  const renderRecommended = useCallback<ListRenderItem<Title>>(
    ({ item }) => (
      <Pressable
        onPress={() => open(item)}
        style={({ pressed }) => [styles.recRow, pressed ? { backgroundColor: colors.surface2 } : null]}
      >
        <View style={styles.recThumb}>
          <Image
            source={item.background || item.poster ? { uri: (item.background || item.poster)! } : undefined}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={item.id}
          />
        </View>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Txt weight="bold" size={14} numberOfLines={1}>
            {item.name}
          </Txt>
          <Txt size={11} color={colors.textMuted} numberOfLines={1} style={{ marginTop: 2 }}>
            {[item.year, item.serverName, ...item.genres.slice(0, 2)].filter(Boolean).join(' · ')}
          </Txt>
        </View>
        <Pressable hitSlop={10} onPress={() => nav.navigate('Player', { id: item.id })} style={styles.recPlay}>
          <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginLeft: 1 }} />
        </Pressable>
      </Pressable>
    ),
    [open, nav],
  );

  const renderResult = useCallback<ListRenderItem<Title>>(
    ({ item }) => (
      <Poster
        title={item}
        width={cell}
        height={Math.round(cell * 1.46)}
        label={categoryOf(item)}
        onPress={(t) => open(t, parsed.season)}
      />
    ),
    [cell, open, parsed.season],
  );

  const showSuggestions = focused && suggestions.length > 0 && query.trim().length >= 2;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.top}>
        {isStackModal ? (
          <Pressable hitSlop={10} onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Txt weight="bold" size={20}>
            Multi-Server Search
          </Txt>
          <Txt size={11} color={colors.textMuted}>
            CircleFTP · CyberFTP · AmaderFTP · 1,470+ BDIX · AniList · Global
          </Txt>
        </View>
        <Pressable
          onPress={() => setGroupByServer((g) => !g)}
          style={[styles.groupToggle, groupByServer ? styles.groupToggleActive : null]}
        >
          <MaterialCommunityIcons
            name={groupByServer ? 'server-network' : 'view-grid-outline'}
            size={15}
            color={groupByServer ? colors.cyan : colors.magenta}
          />
          <Txt weight="bold" size={11} color={groupByServer ? colors.cyan : colors.magenta} style={{ marginLeft: 4 }}>
            {groupByServer ? 'By Server' : 'Merged'}
          </Txt>
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={19} color={colors.magenta} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCorrect={false}
          autoCapitalize="none"
          placeholder='Search movies, series, anime or "Show S1 E5"…'
          placeholderTextColor={colors.textDim}
          selectionColor={colors.magenta}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => {
            Keyboard.dismiss();
            remember(query);
          }}
        />
        {searching ? <ActivityIndicator size="small" color={colors.magenta} style={{ marginRight: 8 }} /> : null}
        {query.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={19} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.chipRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 8, alignItems: 'center' }}
        >
          {SEARCH_CHIPS.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              selected={chip === c.key}
              solid={chip === c.key}
              onPress={() => setChip(c.key)}
            />
          ))}
        </ScrollView>
      </View>

      {showSuggestions ? (
        <View style={styles.suggestions}>
          {suggestions.map((s) => (
            <Pressable
              key={`${s.kind}:${s.text}`}
              onPress={() => {
                const { season, episode } = parseQuery(query);
                const suffix = season ? ` season ${season}${episode ? ` ep ${episode}` : ''}` : '';
                setQuery(`${s.text}${suffix}`);
                Keyboard.dismiss();
                remember(s.text);
              }}
              style={({ pressed }) => [styles.suggestRow, pressed ? { backgroundColor: colors.surface2 } : null]}
            >
              <Ionicons name={s.kind === 'history' ? 'time-outline' : 'search-outline'} size={17} color={colors.textDim} />
              <Txt size={13} numberOfLines={1} style={{ flex: 1, marginLeft: 10 }}>
                {s.text}
              </Txt>
              <Pressable hitSlop={8} onPress={() => setQuery(s.text + ' ')}>
                <Ionicons name="arrow-up-outline" size={17} color={colors.textDim} style={{ transform: [{ rotate: '-45deg' }] }} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      ) : null}

      {!hasQuery ? (
        <FlatList
          key="recommended"
          data={recommended}
          keyExtractor={(t) => t.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={10}
          windowSize={7}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListHeaderComponent={
            <View>
              {history.length > 0 && !scope?.live ? (
                <View>
                  <View style={styles.historyHead}>
                    <Txt weight="bold" size={15}>
                      Recent Searches
                    </Txt>
                    <Pressable
                      hitSlop={8}
                      onPress={async () => {
                        await clearHistory();
                        setHistory([]);
                      }}
                    >
                      <Txt weight="semibold" size={12} color={colors.magenta}>
                        Clear All
                      </Txt>
                    </Pressable>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 8, paddingVertical: 6 }}
                  >
                    {history.slice(0, 10).map((h) => (
                      <Pressable
                        key={h}
                        onPress={() => setQuery(h)}
                        style={styles.historyChip}
                      >
                        <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                        <Txt size={12} color={colors.text90} style={{ marginHorizontal: 6 }}>
                          {h}
                        </Txt>
                        <Pressable hitSlop={8} onPress={async () => setHistory(await removeHistory(h))}>
                          <Ionicons name="close" size={14} color={colors.textDim} />
                        </Pressable>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
              <Txt weight="bold" size={16} style={styles.section}>
                Trending Across BDIX & Global
              </Txt>
            </View>
          }
          renderItem={renderRecommended}
        />
      ) : filteredResults.length === 0 && channels.length === 0 && searching ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={colors.violet} />
          <Txt size={13} color={colors.textMuted} align="center" style={{ marginTop: 12 }}>
            Probing CircleFTP, CyberFTP, AmaderFTP, BDIX indexes & global catalogs…
          </Txt>
        </View>
      ) : filteredResults.length === 0 && channels.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="movie-search-outline" size={44} color={colors.textDim} />
          <Txt weight="bold" size={17} align="center" style={{ marginTop: 10 }}>
            No matches for “{parsed.text || deferred}”
          </Txt>
          <Txt size={13} color={colors.textMuted} align="center" style={{ marginTop: 6 }}>
            Try a shorter title or switch the filter chip above to "All".
          </Txt>
        </View>
      ) : groupByServer ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 38 }}
        >
          {serverGroups.map((g) => (
            <View key={g.server} style={{ marginTop: 18 }}>
              <RowHeader
                title={g.server}
                subtitle={`${g.items.length} ${g.items.length === 1 ? 'result' : 'results'} on this source`}
              />
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={g.items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 10 }}
                renderItem={({ item }) => (
                  <Poster
                    title={item}
                    width={POSTER.width}
                    height={POSTER.height}
                    onPress={(t) => open(t, parsed.season)}
                  />
                )}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          key="results-grid"
          data={filteredResults}
          keyExtractor={(t) => t.id}
          numColumns={3}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          initialNumToRender={12}
          ListHeaderComponent={
            <View>
              {series && (parsed.season || parsed.episode) ? (
                <View style={styles.jump}>
                  <Txt weight="bold" size={15} numberOfLines={1}>
                    {series.name}
                  </Txt>
                  <View style={styles.jumpRow}>
                    {parsed.episode ? (
                      <Pressable
                        style={[styles.jumpBtn, { backgroundColor: colors.violet }]}
                        onPress={() => playEpisode(series, parsed.season ?? 1, parsed.episode!)}
                      >
                        <Ionicons name="play" size={16} color="#FFFFFF" />
                        <Txt weight="bold" size={13} color="#FFFFFF" style={{ marginLeft: 6 }}>
                          Play S{parsed.season ?? 1} · E{parsed.episode}
                        </Txt>
                      </Pressable>
                    ) : null}
                    <Pressable
                      style={[styles.jumpBtn, { backgroundColor: colors.surface3 }]}
                      onPress={() => open(series, parsed.season ?? 1)}
                    >
                      <Ionicons name="list" size={16} color={colors.text} />
                      <Txt weight="bold" size={13} style={{ marginLeft: 6 }}>
                        {parsed.season ? `Season ${parsed.season} Episodes` : 'All Episodes'}
                      </Txt>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              {channels.length > 0 ? (
                <>
                  <Txt weight="bold" size={16} style={styles.section}>
                    Live TV Channels
                  </Txt>
                  <FlatList
                    horizontal
                    data={channels}
                    keyExtractor={(c) => c.id}
                    keyboardShouldPersistTaps="handled"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.channelRow}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => {
                          Keyboard.dismiss();
                          remember(query);
                          nav.navigate('Live', { channelId: item.id });
                        }}
                        style={{ width: cell }}
                      >
                        <ChannelLogo channel={item} size={cell} />
                        <Txt weight="medium" size={12} numberOfLines={1} style={{ marginTop: 6 }}>
                          {item.name}
                        </Txt>
                      </Pressable>
                    )}
                  />
                </>
              ) : null}
              <Txt weight="bold" size={14} color={colors.textMuted} style={styles.section}>
                {filteredResults.length} deduplicated results ({serverGroups.length} sources)
              </Txt>
            </View>
          }
          renderItem={renderResult}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.gutter,
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(226,28,240,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(226,28,240,0.4)',
  },
  groupToggleActive: {
    backgroundColor: 'rgba(61,220,255,0.14)',
    borderColor: 'rgba(61,220,255,0.45)',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.gutter,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: 'rgba(139,44,245,0.35)',
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: font.regular,
    fontSize: 14,
    marginHorizontal: 10,
    paddingVertical: 0,
  },
  chipRow: {
    height: 46,
    justifyContent: 'center',
    marginTop: 2,
  },
  suggestions: {
    marginHorizontal: layout.gutter,
    marginTop: 4,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  historyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.gutter,
    marginTop: 12,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  section: { paddingHorizontal: layout.gutter, marginTop: 14, marginBottom: 10 },
  recRow: {
    height: 74,
    marginHorizontal: layout.gutter,
    marginBottom: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    overflow: 'hidden',
  },
  recThumb: {
    width: 124,
    height: 74,
    backgroundColor: colors.surface2,
  },
  recPlay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { paddingHorizontal: 32, paddingTop: 72, alignItems: 'center' },
  grid: { gap: 10, paddingBottom: 34 },
  gridRow: { gap: 10, paddingHorizontal: layout.gutter },
  channelRow: { gap: 10, paddingHorizontal: layout.gutter },
  jump: {
    marginHorizontal: layout.gutter,
    marginTop: 10,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  jumpRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  jumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: radius.md,
  },
});
