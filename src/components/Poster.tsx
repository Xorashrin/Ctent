import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { sourceBadgeName, type Title } from '../data/types';
import { colors, radius } from '../theme/tokens';
import { Image } from './Img';
import { Txt } from './Txt';

export const POSTER = { width: 122, height: 178 } as const;
export const TALL_POSTER = { width: 146, height: 218 } as const;

const BADGE_LABEL = { new: 'NEW', 'new-episode': 'NEW EP', airing: 'AIRING' } as const;

export function thumbUri(uri: string, width: number): string {
  if (width > 170) return uri;
  return uri
    .replace('images.metahub.space/poster/medium/', 'images.metahub.space/poster/small/')
    .replace('image.tmdb.org/t/p/w500/', 'image.tmdb.org/t/p/w342/')
    .replace('/cover/extraLarge/', '/cover/large/');
}

export function categoryOf(t: Title): string {
  if (t.nsfw) return 'Adult';
  if (t.source === 'anilist' || t.source === 'animedirect' || t.genres.includes('Anime')) {
    return t.kind === 'movie' ? 'Anime Movie' : 'Anime';
  }
  return t.kind === 'series' ? 'TV Series' : 'Movie';
}

interface PosterProps {
  title: Title;
  width?: number;
  height?: number;
  onPress?: (title: Title) => void;
  showBadges?: boolean;
  showCaption?: boolean;
  label?: string;
}

export const Poster = memo(function Poster({
  title,
  width = POSTER.width,
  height = POSTER.height,
  onPress,
  showBadges = true,
  showCaption = true,
  label,
}: PosterProps) {
  const raw = title.poster || title.background;
  const uri = raw ? thumbUri(raw, width) : undefined;
  const copies = title.alternatives?.length ?? 1;
  const topTag =
    label ??
    (copies > 1
      ? `${copies} SRV`
      : title.quality[0] && title.quality[0] !== 'Anime'
        ? title.quality[0]
        : sourceBadgeName(title.source, title.serverName));

  return (
    <Pressable
      onPress={onPress ? () => onPress(title) : undefined}
      style={({ pressed }) => [{ width, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
    >
      <View style={[styles.frame, { width, height, backgroundColor: title.tint || colors.surface2 }]}>
        {uri ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={title.id}
          />
        ) : null}
        <LinearGradient
          colors={['rgba(7,6,11,0.18)', 'rgba(7,6,11,0)', 'rgba(7,6,11,0.82)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        {!uri ? (
          <View style={styles.fallback}>
            <Txt weight="bold" size={13} lineHeight={17} align="center" numberOfLines={4}>
              {title.name}
            </Txt>
          </View>
        ) : null}

        {showBadges && title.imdbRating ? (
          <View style={styles.rating}>
            <Txt weight="bold" size={10} color={colors.gold}>
              ★ {title.imdbRating}
            </Txt>
          </View>
        ) : null}

        {showBadges && topTag ? (
          <View style={[styles.label, copies > 1 ? { backgroundColor: colors.online } : null]}>
            <Txt weight="bold" size={9} color={copies > 1 ? '#07060B' : '#FFFFFF'} numberOfLines={1}>
              {topTag.toUpperCase()}
            </Txt>
          </View>
        ) : null}

        {showBadges && title.badge ? (
          <View style={styles.badge}>
            <Txt weight="bold" size={9} color="#FFFFFF">
              {BADGE_LABEL[title.badge]}
            </Txt>
          </View>
        ) : null}
      </View>

      {showCaption ? (
        <View style={styles.captionWrap}>
          <Txt weight="semibold" size={12} numberOfLines={1} color={colors.text90}>
            {title.name}
          </Txt>
          <Txt size={10} color={colors.textDim} numberOfLines={1}>
            {[title.year || '', title.serverName ?? sourceBadgeName(title.source)].filter(Boolean).join(' · ')}
          </Txt>
        </View>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  rating: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(12,10,18,0.82)',
    borderRadius: radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,197,61,0.35)',
  },
  label: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(139,44,245,0.88)',
    borderRadius: radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 2,
    maxWidth: 64,
  },
  badge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: colors.pink,
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  captionWrap: {
    marginTop: 5,
    paddingHorizontal: 2,
  },
});
