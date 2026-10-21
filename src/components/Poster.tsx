// MythTube Clean Poster Card — Zero visual clutter ("zero hibijibi"):
// - Single clean top-right pill badge (+N servers in Aurora Mint, or quality/rating)
// - Smooth spring press animation (0.96x)
// - Optional clean title & progress footer
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from './Img';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import type { Title } from '../data/types';
import { colors, GRADIENTS, radius } from '../theme/tokens';
import { Txt } from './Txt';

export const POSTER = { width: 118, height: 176 } as const;

const TINTS = ['#0D1F2D', '#0E2438', '#112A3E', '#14263B', '#0F292E', '#17253B', '#122234', '#0C1E2C'];

function tintFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}

interface Props {
  title: Title;
  width?: number;
  height?: number;
  aspect?: 'poster' | 'backdrop';
  progress?: number;
  badge?: string;
  altCount?: number;
  showTitle?: boolean;
  onPress?: (title: Title) => void;
}

export const Poster = memo(function Poster({
  title,
  width = 116,
  height = 172,
  aspect = 'poster',
  progress,
  badge,
  altCount,
  showTitle = false,
  onPress,
}: Props) {
  const uri = aspect === 'backdrop' ? title.background || title.poster : title.poster || title.background;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 36,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 6,
    }).start();
  };

  // Single clean top-right badge to avoid visual clutter
  const extraServers = altCount ?? title.alternatives?.length ?? 0;
  const topRightLabel =
    extraServers > 0
      ? `+${extraServers + 1} Servers`
      : badge || (title.hdLabel && title.hdLabel !== 'HD' ? title.hdLabel : undefined);

  return (
    <Pressable
      onPress={onPress ? () => onPress(title) : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ width, transform: [{ scale }] }}>
        <View style={[styles.card, { width, height, backgroundColor: tintFor(title.id) }]}>
          <Image
            source={uri ? { uri } : undefined}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={`${title.id}-${aspect}`}
            transition={150}
          />
          <LinearGradient colors={GRADIENTS.cardScrim} style={styles.bottomScrim} />

          {/* Single clean top-right badge */}
          {topRightLabel ? (
            <View style={[styles.topBadge, extraServers > 0 ? styles.topBadgeMint : null]}>
              <Txt weight="bold" size={9} color={extraServers > 0 ? '#04120E' : colors.text} spacing={0.3}>
                {topRightLabel}
              </Txt>
            </View>
          ) : null}

          {/* Bottom-left subtle rating pill only when available */}
          {title.imdbRating ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={9} color={colors.gold} />
              <Txt weight="bold" size={10} color={colors.text} style={{ marginLeft: 3 }}>
                {title.imdbRating}
              </Txt>
            </View>
          ) : null}

          {progress !== undefined && progress > 0 ? (
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={GRADIENTS.pill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: `${Math.min(100, Math.round(progress * 100))}%`, height: '100%' }}
              />
            </View>
          ) : null}
        </View>

        {showTitle ? (
          <View style={styles.captionWrap}>
            <Txt weight="semibold" size={12} color={colors.text90} numberOfLines={1}>
              {title.name}
            </Txt>
            <Txt size={10} color={colors.textDim} numberOfLines={1} style={{ marginTop: 1 }}>
              {title.year ? `${title.year}` : ''}
              {title.genres[0] ? ` • ${title.genres[0]}` : ''}
            </Txt>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
  },
  topBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    backgroundColor: 'rgba(9, 15, 24, 0.84)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  topBadgeMint: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 7,
    left: 7,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 15, 24, 0.82)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  captionWrap: {
    marginTop: 6,
    paddingHorizontal: 2,
  },
});
