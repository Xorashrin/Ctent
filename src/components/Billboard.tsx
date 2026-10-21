// Ctent HeroRotator / Spotlight Carousel — reverse-engineered from app-release.apk (Lw8 & Lm8/m HeroRotator).
// Features:
// - Auto-rotating spotlight items (every 6.5s) with KenBurnsBackdrop drift animation
// - Server badge, quality tag, ★ rating, genre pills
// - Neon violet-to-magenta gradient Play CTA + Glass Details & Watchlist buttons
// - ExpandingDots pagination indicator (dotW)
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { sourceBadgeName, type Title } from '../data/types';
import { colors, GRADIENTS, layout, radius } from '../theme/tokens';
import { ExpandingDots, KenBurnsBackdrop } from './Animations';
import { Txt } from './Txt';

interface BillboardProps {
  title: Title;
  pool?: Title[];
  inMyList: boolean;
  isSaved?: (id: string) => boolean;
  onPlay: (t: Title) => void;
  onToggleList: (t: Title) => void;
  onOpen: (t: Title) => void;
}

export const Billboard = memo(function Billboard({
  title,
  pool,
  inMyList,
  isSaved,
  onPlay,
  onToggleList,
  onOpen,
}: BillboardProps) {
  const { width: screen } = useWindowDimensions();
  const items = pool && pool.length > 1 ? pool.slice(0, 6) : [title];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [items.length]);

  const active = items[index % items.length] ?? title;
  const saved = isSaved ? isSaved(active.id) : inMyList;
  const width = screen - layout.gutter * 2;
  const height = Math.round(width * 1.16);
  const heroImage = active.background || active.poster;
  const serverBadge = active.serverName ?? sourceBadgeName(active.source);
  const copies = active.alternatives?.length ?? 1;

  return (
    <View style={[styles.card, { width, height }]}>
      <Pressable onPress={() => onOpen(active)} style={StyleSheet.absoluteFill}>
        <KenBurnsBackdrop uri={heroImage} tint={active.tint} />
        <LinearGradient
          colors={[...GRADIENTS.heroScrim]}
          locations={[0, 0.38, 0.76, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>

      {/* Top badges: SPOTLIGHT pill + Server / Multi-copy badge */}
      <View style={styles.topRow} pointerEvents="box-none">
        <LinearGradient
          colors={[...GRADIENTS.pill]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.spotlightPill}
        >
          <Ionicons name="sparkles" size={11} color="#FFFFFF" />
          <Txt weight="bold" size={10} spacing={0.7} style={{ marginLeft: 4 }}>
            SPOTLIGHT #{index + 1}
          </Txt>
        </LinearGradient>

        <View style={styles.serverTag}>
          <View style={styles.onlineDot} />
          <Txt weight="semibold" size={10} color={colors.text90}>
            {copies > 1 ? `${serverBadge} +${copies - 1} servers` : serverBadge}
          </Txt>
        </View>
      </View>

      {/* Bottom content */}
      <View style={styles.content} pointerEvents="box-none">
        <View style={styles.metaPills}>
          {active.imdbRating ? (
            <View style={styles.ratingPill}>
              <Txt weight="bold" size={11} color={colors.gold}>
                ★ {active.imdbRating}
              </Txt>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <Txt weight="semibold" size={10} color={colors.text90}>
              {active.kind === 'series' ? 'TV SERIES' : 'MOVIE'}
            </Txt>
          </View>
          {active.year ? (
            <View style={styles.metaChip}>
              <Txt weight="medium" size={10} color={colors.textMuted}>
                {active.year}
              </Txt>
            </View>
          ) : null}
          {active.quality[0] ? (
            <View style={[styles.metaChip, { borderColor: colors.magenta }]}>
              <Txt weight="bold" size={10} color={colors.magenta}>
                {active.quality[0]}
              </Txt>
            </View>
          ) : null}
        </View>

        <Pressable onPress={() => onOpen(active)}>
          <Txt weight="bold" size={26} lineHeight={31} numberOfLines={2} style={styles.heroTitle}>
            {active.name}
          </Txt>
          {active.genres.length > 0 ? (
            <Txt weight="medium" size={12} color={colors.textMuted} numberOfLines={1} style={{ marginTop: 4 }}>
              {active.genres.slice(0, 4).join('  ·  ')}
            </Txt>
          ) : null}
        </Pressable>

        <View style={styles.buttons}>
          <Pressable onPress={() => onPlay(active)} style={styles.playWrap}>
            <LinearGradient
              colors={[...GRADIENTS.brand]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.playBtn}
            >
              <Ionicons name="play" size={18} color="#FFFFFF" />
              <Txt weight="bold" size={14} color="#FFFFFF" style={{ marginLeft: 6 }}>
                Stream Now
              </Txt>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => onOpen(active)} style={styles.glassBtn}>
            <Ionicons name="information-circle-outline" size={18} color={colors.text} />
            <Txt weight="semibold" size={13} style={{ marginLeft: 5 }}>
              Details
            </Txt>
          </Pressable>

          <Pressable onPress={() => onToggleList(active)} style={styles.iconGlassBtn}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={saved ? colors.pink : colors.text}
            />
          </Pressable>
        </View>

        {items.length > 1 ? (
          <Pressable
            onPress={() => setIndex((prev) => (prev + 1) % items.length)}
            hitSlop={10}
            style={{ marginTop: 12, alignSelf: 'center' }}
          >
            <ExpandingDots count={items.length} activeIndex={index % items.length} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: 'rgba(139,44,245,0.28)',
    marginTop: 6,
  },
  topRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spotlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  serverTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,16,25,0.78)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.online,
    marginRight: 5,
  },
  content: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
  },
  metaPills: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  ratingPill: {
    backgroundColor: 'rgba(255,197,61,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,197,61,0.45)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  metaChip: {
    backgroundColor: 'rgba(27,24,36,0.82)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  heroTitle: {
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  playWrap: {
    flex: 1.35,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  playBtn: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  glassBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(38,34,47,0.78)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  iconGlassBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(38,34,47,0.78)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
