// Ctent Catalog & See-All Organizer — reverse-engineered from app-release.apk (Lt8 CatalogScreen).
// Features:
// - Displays any row's full catalog or genre feed in a 3-column responsive poster grid
// - SortOption bar: Default, Latest, Popular, Rating
// - Endless pagination for genre catalogs
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Chip } from '../components/Chip';
import { Poster } from '../components/Poster';
import { ScreenHeader } from '../components/ScreenHeader';
import { Txt } from '../components/Txt';
import type { Title } from '../data/types';
import type { RootStackParamList } from '../navigation/types';
import { ANIME_ROWS, HOME_ROWS, loadAnimeGenre } from '../services/catalog';
import { sortTitles, type SortOption } from '../services/organizer';
import * as cinemeta from '../services/sources/cinemeta';
import { colors, layout } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Catalog'>;

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'default', label: 'Featured' },
  { key: 'latest', label: 'Latest' },
  { key: 'popular', label: 'Popular' },
  { key: 'rating', label: 'Top Rated' },
];

export default function CatalogScreen({ navigation, route }: Props) {
  const { rowKey, title, genre, anime } = route.params;
  const { width: screen } = useWindowDimensions();
  const cols = 3;
  const gap = 10;
  const cardWidth = Math.floor((screen - layout.gutter * 2 - gap * (cols - 1)) / cols);
  const cardHeight = Math.round(cardWidth * 1.46);

  const [items, setItems] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('default');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const loadInitial = async () => {
      try {
        if (rowKey) {
          const def = [...HOME_ROWS, ...ANIME_ROWS].find((r) => r.key === rowKey);
          if (def) {
            const data = await def.load();
            if (!cancelled) setItems(data);
            return;
          }
        }
        if (genre) {
          const data = anime
            ? await loadAnimeGenre(genre, 1)
            : await cinemeta.catalog('movie', { genre });
          if (!cancelled) setItems(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [rowKey, genre, anime]);

  const loadMore = async () => {
    if (!genre || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    try {
      const more = anime
        ? await loadAnimeGenre(genre, nextPage)
        : await cinemeta.catalog('movie', { genre, skip: (nextPage - 1) * 50 });
      setItems((prev) => {
        const seen = new Set(prev.map((t) => t.id));
        return [...prev, ...more.filter((t) => !seen.has(t.id))];
      });
    } catch {
      // ignore
    }
  };

  const sorted = useMemo(() => sortTitles(items, sort), [items, sort]);

  return (
    <View style={styles.root}>
      <ScreenHeader
        back
        title={title}
        subtitle={`${sorted.length} titles organized`}
        actions={['search']}
      />

      <View style={styles.sortBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 8, alignItems: 'center' }}
        >
          {SORT_OPTIONS.map((o) => (
            <Chip
              key={o.key}
              label={o.label}
              selected={sort === o.key}
              solid={sort === o.key}
              onPress={() => setSort(o.key)}
            />
          ))}
        </ScrollView>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.violet} />
          <Txt size={12} color={colors.textMuted} style={{ marginTop: 8 }}>
            Organizing {title}…
          </Txt>
        </View>
      ) : (
        <FlatList
          data={sorted}
          numColumns={cols}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ gap }}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, paddingTop: 8, paddingBottom: 36, gap: 14 }}
          onEndReached={genre ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <Poster
              title={item}
              width={cardWidth}
              height={cardHeight}
              onPress={(t) => navigation.navigate('Title', { id: t.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  sortBar: { height: 44, marginBottom: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
