// Ctent Section Rows — reverse-engineered from app-release.apk (Lw8 & SectionStyle):
// Supports all 4 Ctent section styles:
// 1. POSTER: 2:3 vertical cards with rating, server badge & caption
// 2. LANDSCAPE: 16:9 wide backdrop cards with play icon & episode/genre tag
// 3. TOP10: Ranked #1-#10 cards with neon violet-magenta rank pill
// 4. FOLDER: Direct BDIX Server Folder cards that open BrowseScreen
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View, type ListRenderItem } from 'react-native';

import { sourceBadgeName, type SectionStyle, type Title } from '../data/types';
import type { FeaturedBdixFolder } from '../services/directoryBrowser';
import type { ProgressEntry } from '../state/AppState';
import { colors, GRADIENTS, layout, radius } from '../theme/tokens';
import { FadeSlideIn, PressableScale, ShimmerBox } from './Animations';
import { ProgressBar } from './Buttons';
import { Image } from './Img';
import { POSTER, Poster } from './Poster';
import { Txt } from './Txt';

const GAP = 10;
const LANDSCAPE = { width: 224, height: 126 } as const;

const listProps = {
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  initialNumToRender: 5,
  maxToRenderPerBatch: 5,
  windowSize: 5,
  removeClippedSubviews: true,
  contentContainerStyle: { paddingHorizontal: layout.gutter },
  ItemSeparatorComponent: () => <View style={{ width: GAP }} />,
} as const;

export function RowHeader({
  title,
  subtitle,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerAccent} />
      <View style={{ flex: 1 }}>
        <Txt weight="bold" size={16} numberOfLines={1}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt size={11} color={colors.textDim} numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
          <Txt weight="semibold" size={12} color={colors.magenta}>
            Explore
          </Txt>
          <Ionicons name="chevron-forward" size={13} color={colors.magenta} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function SkeletonRow({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.row}>
      <RowHeader title={title} subtitle={subtitle} />
      <View style={{ flexDirection: 'row', paddingHorizontal: layout.gutter, gap: GAP }}>
        {[0, 1, 2].map((i) => (
          <View key={i}>
            <ShimmerBox width={POSTER.width} height={POSTER.height} borderRadius={radius.md} />
            <ShimmerBox width={POSTER.width * 0.78} height={11} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

interface PosterRowProps {
  title: string;
  subtitle?: string;
  styleType?: SectionStyle;
  items: Title[];
  onPressTitle: (t: Title) => void;
  width?: number;
  height?: number;
  onSeeAll?: () => void;
}

export const PosterRow = memo(function PosterRow({
  title,
  subtitle,
  styleType = 'POSTER',
  items,
  onPressTitle,
  width = POSTER.width,
  height = POSTER.height,
  onSeeAll,
}: PosterRowProps) {
  const renderPoster = useCallback<ListRenderItem<Title>>(
    ({ item, index }) => {
      if (styleType === 'LANDSCAPE') {
        const uri = item.background || item.poster;
        return (
          <Pressable
            onPress={() => onPressTitle(item)}
            style={({ pressed }) => [{ width: LANDSCAPE.width, opacity: pressed ? 0.88 : 1 }]}
          >
            <View style={[styles.landscapeFrame, { backgroundColor: item.tint || colors.surface2 }]}>
              {uri ? (
                <Image
                  source={{ uri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={item.id}
                />
              ) : null}
              <LinearGradient
                colors={['transparent', 'rgba(6,10,16,0.90)']}
                locations={[0.35, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.landscapePlay}>
                <Ionicons name="play" size={14} color="#04120E" style={{ marginLeft: 1 }} />
              </View>
              {item.airing ? (
                <View style={styles.airingPill}>
                  <Txt weight="bold" size={9} color="#04120E">
                    EP {item.airing.episode} SOON
                  </Txt>
                </View>
              ) : item.imdbRating ? (
                <View style={styles.landscapeRating}>
                  <Txt weight="bold" size={10} color={colors.gold}>
                    ★ {item.imdbRating}
                  </Txt>
                </View>
              ) : null}
              <View style={styles.landscapeBottom}>
                <Txt weight="bold" size={13} numberOfLines={1}>
                  {item.name}
                </Txt>
                <Txt size={10} color={colors.textMuted} numberOfLines={1}>
                  {[
                    item.year || '',
                    item.genres.slice(0, 2).join(' · ') || sourceBadgeName(item.source, item.serverName),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Txt>
              </View>
            </View>
          </Pressable>
        );
      }

      if (styleType === 'TOP10') {
        return (
          <View style={styles.top10Wrap}>
            <Poster title={item} width={width} height={height} onPress={onPressTitle} showTitle />
            <LinearGradient
              colors={GRADIENTS.pill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rankBadge}
            >
              <Txt weight="black" size={11} color="#04120E">
                #{index + 1}
              </Txt>
            </LinearGradient>
          </View>
        );
      }

      return <Poster title={item} width={width} height={height} onPress={onPressTitle} showTitle />;
    },
    [styleType, width, height, onPressTitle],
  );

  const itemWidth = styleType === 'LANDSCAPE' ? LANDSCAPE.width : width;
  const data = styleType === 'TOP10' ? items.slice(0, 10) : items;

  return (
    <FadeSlideIn style={styles.row}>
      <RowHeader title={title} subtitle={subtitle} onSeeAll={onSeeAll} />
      <FlatList
        {...listProps}
        data={data}
        keyExtractor={(t) => t.id}
        renderItem={renderPoster}
        getItemLayout={(_, index) => ({
          length: itemWidth + GAP,
          offset: (itemWidth + GAP) * index,
          index,
        })}
      />
    </FadeSlideIn>
  );
});

export const FolderRow = memo(function FolderRow({
  title,
  subtitle,
  folders,
  onPressFolder,
  onSeeAllServers,
}: {
  title: string;
  subtitle?: string;
  folders: FeaturedBdixFolder[];
  onPressFolder: (f: FeaturedBdixFolder) => void;
  onSeeAllServers?: () => void;
}) {
  return (
    <View style={styles.row}>
      <RowHeader title={title} subtitle={subtitle} onSeeAll={onSeeAllServers} />
      <FlatList
        {...listProps}
        data={folders}
        keyExtractor={(f) => f.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPressFolder(item)}
            style={({ pressed }) => [styles.folderCard, { opacity: pressed ? 0.86 : 1 }]}
          >
            <View style={[styles.folderIconWrap, { backgroundColor: `${item.accent}24`, borderColor: `${item.accent}66` }]}>
              <MaterialCommunityIcons name="folder-network-outline" size={22} color={item.accent} />
            </View>
            <Txt weight="bold" size={13} numberOfLines={1} style={{ marginTop: 10 }}>
              {item.title}
            </Txt>
            <Txt size={11} color={colors.textMuted} numberOfLines={1} style={{ marginTop: 2 }}>
              {item.subtitle}
            </Txt>
            <View style={styles.folderFooter}>
              <View style={[styles.folderDot, { backgroundColor: item.accent }]} />
              <Txt weight="semibold" size={10} color={item.accent}>
                Browse Index
              </Txt>
              <Ionicons name="arrow-forward" size={11} color={item.accent} style={{ marginLeft: 'auto' }} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
});

export interface ContinueItem {
  title: Title;
  entry: ProgressEntry;
  label?: string;
}

interface ContinueRowProps {
  title: string;
  items: ContinueItem[];
  onPlay: (item: ContinueItem) => void;
  onInfo: (t: Title) => void;
  onMore: (item: ContinueItem) => void;
}

export const ContinueRow = memo(function ContinueRow({ title, items, onPlay, onInfo, onMore }: ContinueRowProps) {
  const renderItem = useCallback<ListRenderItem<ContinueItem>>(
    ({ item }) => {
      const posterUri = item.title.background || item.title.poster;
      const ratio = Math.min(1, Math.max(0.04, item.entry.position / Math.max(1, item.entry.duration)));
      return (
        <View style={styles.continueCard}>
          <Pressable onPress={() => onPlay(item)} style={styles.continueImage}>
            <Image
              source={posterUri ? { uri: posterUri } : undefined}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
              recyclingKey={item.title.id}
            />
            <LinearGradient
              colors={['transparent', 'rgba(7,6,11,0.85)']}
              locations={[0.3, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.playCircle}>
              <Ionicons name="play" size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </View>
            <View style={styles.continueLabel}>
              <Txt weight="bold" size={12} numberOfLines={1}>
                {item.title.name}
              </Txt>
              {item.label ? (
                <Txt size={10} color={colors.textMuted} numberOfLines={1}>
                  {item.label}
                </Txt>
              ) : null}
            </View>
          </Pressable>
          <ProgressBar value={ratio} height={3} track={colors.surface4} style={{ borderRadius: 0 }} />
          <View style={styles.continueBar}>
            <Pressable onPress={() => onInfo(item.title)} hitSlop={8} style={styles.continueAction}>
              <Ionicons name="information-circle-outline" size={17} color={colors.textMuted} />
              <Txt size={11} color={colors.textMuted} style={{ marginLeft: 4 }}>
                Details
              </Txt>
            </Pressable>
            <Pressable onPress={() => onMore(item)} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={17} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      );
    },
    [onPlay, onInfo, onMore],
  );
  return (
    <View style={styles.row}>
      <RowHeader title={title} subtitle="Pick up right where you left off" />
      <FlatList
        {...listProps}
        data={items}
        keyExtractor={(i) => i.title.id}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({ length: 200 + GAP, offset: (200 + GAP) * index, index })}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: { marginTop: 22 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.gutter,
    marginBottom: 10,
  },
  headerAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.mint,
    marginRight: 9,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 176, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 2,
  },
  landscapeFrame: {
    width: LANDSCAPE.width,
    height: LANDSCAPE.height,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  landscapePlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeRating: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(9, 15, 24, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  airingPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.mint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  landscapeBottom: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 8,
  },
  top10Wrap: {
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  folderCard: {
    width: 176,
    padding: 13,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  folderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  folderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  continueCard: {
    width: 200,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  continueImage: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface3,
  },
  playCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 6,
  },
  continueBar: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  continueAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
