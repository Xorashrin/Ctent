// MythTube Aurora Hero Rotator — Clean, breathable featured banner:
// - Auto-advances every 5.5s with smooth crossfade + vertical slide
// - KenBurnsBackdrop subtle zoom + pan
// - Aurora Mint -> Glacier Cyan "Watch Now" pill CTA + "Details" + "+ My List"
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from './Img';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { Title } from '../data/types';
import { inMyList, useApp } from '../state/AppState';
import { colors, GRADIENTS, layout, radius } from '../theme/tokens';
import { ExpandingDots, KenBurnsBackdrop, PressableScale } from './Animations';
import { Txt } from './Txt';

interface Props {
  title: Title;
  pool?: Title[];
  candidates?: Title[];
  inMyList?: boolean;
  isSaved?: (id: string) => boolean;
  onPlay?: ((target: Title) => void) | (() => void);
  onPlayTarget?: (target: Title) => void;
  onOpen?: (target: Title) => void;
  onInfo?: (target?: Title) => void;
  onToggleList?: (target: Title) => void;
}

export function Billboard({
  title,
  pool: propPool,
  candidates,
  inMyList: propInMyList,
  isSaved,
  onPlay,
  onPlayTarget,
  onOpen,
  onInfo,
  onToggleList,
}: Props) {
  const { width } = useWindowDimensions();
  const { profileData, toggleMyList, showToast } = useApp();

  const pool = React.useMemo(() => {
    const list = propPool && propPool.length > 0 ? propPool.slice(0, 6) : candidates && candidates.length > 0 ? candidates.slice(0, 6) : [title];
    return list.length > 0 ? list : [title];
  }, [propPool, candidates, title]);

  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(0)).current;

  const current = pool[index % pool.length] ?? title;
  const listed = isSaved ? isSaved(current.id) : propInMyList !== undefined ? propInMyList : inMyList(profileData, current.id);
  const height = Math.min(460, Math.round(width * 1.08));

  const switchSlide = useCallback(
    (nextIdx: number) => {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0.15, duration: 180, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: 8, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        setIndex(nextIdx);
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(slideY, { toValue: 0, speed: 20, bounciness: 4, useNativeDriver: true }),
        ]).start();
      });
    },
    [fade, slideY],
  );

  useEffect(() => {
    if (pool.length <= 1) return;
    const timer = setInterval(() => {
      switchSlide((index + 1) % pool.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [index, pool.length, switchSlide]);

  const heroUri = current.background || current.poster;
  const serverCount = (current.alternatives?.length ?? 0) + 1;

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => onInfo(current)}
        onLongPress={() => {
          if (pool.length > 1) switchSlide((index + 1) % pool.length);
        }}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
          <KenBurnsBackdrop style={StyleSheet.absoluteFill}>
            <Image
              source={heroUri ? { uri: heroUri } : undefined}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={220}
            />
          </KenBurnsBackdrop>
        </Animated.View>
        <LinearGradient colors={GRADIENTS.heroScrim} locations={[0, 0.42, 0.82, 1]} style={StyleSheet.absoluteFill} />
      </Pressable>

      <Animated.View style={[styles.bottom, { opacity: fade, transform: [{ translateY: slideY }] }]}>
        {/* Single clean top pill */}
        <View style={styles.metaTopRow}>
          <View style={styles.featuredBadge}>
            <View style={styles.featuredDot} />
            <Txt weight="bold" size={10} color={colors.mint} spacing={0.8}>
              {current.kind === 'series' ? 'FEATURED SERIES' : 'FEATURED MOVIE'}
            </Txt>
          </View>
          {serverCount > 1 ? (
            <View style={styles.metaChip}>
              <Txt weight="semibold" size={10} color={colors.textSoft}>
                {serverCount} Servers Ready
              </Txt>
            </View>
          ) : null}
        </View>

        <Txt weight="black" size={26} align="center" numberOfLines={2} style={styles.heroTitle}>
          {current.name}
        </Txt>

        {/* Clean single-line metadata */}
        <View style={styles.genreRow}>
          {current.year ? (
            <Txt weight="semibold" size={12} color={colors.textSoft}>
              {current.year}
            </Txt>
          ) : null}
          {current.imdbRating ? (
            <>
              <View style={styles.dotSep} />
              <Ionicons name="star" size={11} color={colors.gold} style={{ marginRight: 3 }} />
              <Txt weight="bold" size={12} color={colors.gold}>
                {current.imdbRating}
              </Txt>
            </>
          ) : null}
          {current.genres.slice(0, 2).map((g) => (
            <React.Fragment key={g}>
              <View style={styles.dotSep} />
              <Txt weight="medium" size={12} color={colors.textMuted}>
                {g}
              </Txt>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.actions}>
          <PressableScale
            scaleTo={0.95}
            onPress={() => {
              if (onPlayTarget) onPlayTarget(current);
              else if (onPlay) (onPlay as (t: Title) => void)(current);
            }}
          >
            <LinearGradient
              colors={GRADIENTS.pill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.playPill}
            >
              <Ionicons name="play" size={17} color="#04120E" />
              <Txt weight="black" size={14} color="#04120E" style={{ marginLeft: 6 }}>
                Watch Now
              </Txt>
            </LinearGradient>
          </PressableScale>

          <PressableScale
            scaleTo={0.95}
            onPress={() => {
              if (onOpen) onOpen(current);
              else if (onInfo) onInfo(current);
            }}
            style={styles.glassPill}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.text} />
            <Txt weight="semibold" size={13} style={{ marginLeft: 5 }}>
              Details
            </Txt>
          </PressableScale>

          <PressableScale
            scaleTo={0.92}
            onPress={() => {
              if (onToggleList) onToggleList(current);
              else {
                toggleMyList(current.id);
                showToast(listed ? 'Removed from My Space' : 'Saved to My Space');
              }
            }}
            style={[styles.iconCircle, listed ? styles.iconCircleActive : null]}
          >
            <Ionicons name={listed ? 'checkmark' : 'add'} size={20} color={listed ? colors.mint : colors.text} />
          </PressableScale>
        </View>

        <View style={{ marginTop: 14 }}>
          <ExpandingDots count={pool.length} activeIndex={index % pool.length} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'flex-end',
    backgroundColor: colors.surface1,
  },
  bottom: {
    paddingHorizontal: layout.gutter + 4,
    paddingBottom: 16,
    alignItems: 'center',
  },
  metaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0, 229, 176, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 176, 0.35)',
  },
  featuredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mint,
    marginRight: 6,
  },
  metaChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(19, 30, 48, 0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  heroTitle: {
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: -0.3,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  dotSep: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: colors.textDim,
    marginHorizontal: 7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  playPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.glassButton,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glassButton,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    borderColor: colors.mint,
    backgroundColor: 'rgba(0, 229, 176, 0.16)',
  },
});
