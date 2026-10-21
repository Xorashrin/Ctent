import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRootNav } from '../navigation/types';
import { useServerEngine } from '../services/serverEngine';
import { colors, layout, radius } from '../theme/tokens';
import { LivePulseDot } from './Animations';
import { Wordmark } from './Logo';
import { Txt } from './Txt';

export type HeaderAction = 'downloads' | 'search' | 'menu' | 'servers';

export type SearchScope = { genre?: string; kind?: 'movie' | 'series' | 'anime'; live?: boolean };

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  back?: boolean;
  actions?: HeaderAction[];
  onMenu?: () => void;
  left?: React.ReactNode;
  transparent?: boolean;
  searchScope?: SearchScope;
  showServerPill?: boolean;
  onPressServerPill?: () => void;
}

export function LiveServerStatusPill({ onPress }: { onPress?: () => void }) {
  const { state, activeRoute } = useServerEngine();
  const isScanning = state.phase !== 'IDLE';
  const online = state.onlineCount;

  return (
    <Pressable onPress={onPress} style={styles.serverPill}>
      <LivePulseDot
        color={isScanning ? colors.cyan : online > 0 ? colors.online : colors.warning}
        size={7}
        pulsing={isScanning || online > 0}
      />
      <View style={{ marginLeft: 5 }}>
        <Txt weight="bold" size={11} color={colors.text} numberOfLines={1}>
          {isScanning
            ? `Scanning ${state.sweepDone}/${state.sweepTotal}`
            : `${online} servers online`}
        </Txt>
        <Txt size={9} color={colors.textMuted} numberOfLines={1}>
          {state.preferredServerId && activeRoute
            ? `Pin: ${activeRoute.name}`
            : activeRoute
              ? `Auto · ${activeRoute.name}`
              : 'Tap to manage BDIX'}
        </Txt>
        {isScanning ? (
          <View style={styles.sweepTrack}>
            <View style={[styles.sweepFill, { width: `${Math.round(state.sweepProgress * 100)}%` }]} />
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={12} color={colors.textMuted} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

export function HeaderActions({
  actions,
  onMenu,
  searchScope,
}: {
  actions: HeaderAction[];
  onMenu?: () => void;
  searchScope?: SearchScope;
}) {
  const nav = useRootNav();
  return (
    <View style={styles.actions}>
      {actions.map((a) => {
        switch (a) {
          case 'servers':
            return (
              <Pressable key={a} hitSlop={8} onPress={() => nav.navigate('ServersModal')} style={styles.iconBtn}>
                <MaterialCommunityIcons name="server-network" size={20} color={colors.cyan} />
              </Pressable>
            );
          case 'downloads':
            return (
              <Pressable key={a} hitSlop={8} onPress={() => nav.navigate('Downloads')} style={styles.iconBtn}>
                <Ionicons name="download-outline" size={20} color={colors.text} />
              </Pressable>
            );
          case 'search':
            return (
              <Pressable key={a} hitSlop={8} onPress={() => nav.navigate('Search', searchScope)} style={styles.iconBtn}>
                <Ionicons name="search" size={20} color={colors.text} />
              </Pressable>
            );
          case 'menu':
            return (
              <Pressable key={a} hitSlop={8} onPress={onMenu} style={styles.iconBtn}>
                <Ionicons name="options-outline" size={20} color={colors.text} />
              </Pressable>
            );
          default:
            return null;
        }
      })}
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  back,
  actions = [],
  onMenu,
  left,
  transparent,
  searchScope,
  showServerPill,
  onPressServerPill,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const nav = useRootNav();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top, backgroundColor: transparent ? 'transparent' : colors.bg }]}>
      <View style={styles.bar}>
        {back ? (
          <Pressable hitSlop={10} onPress={() => nav.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        {left ??
          (title ? (
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={back ? 17 : 20} numberOfLines={1}>
                {title}
              </Txt>
              {subtitle ? (
                <Txt size={11} color={colors.textMuted} numberOfLines={1}>
                  {subtitle}
                </Txt>
              ) : null}
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Wordmark size={20} />
            </View>
          ))}
        {showServerPill ? (
          <LiveServerStatusPill onPress={onPressServerPill ?? (() => nav.navigate('ServersModal'))} />
        ) : null}
        {actions.length > 0 ? <HeaderActions actions={actions} onMenu={onMenu} searchScope={searchScope} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 10 },
  bar: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.gutter,
    gap: 8,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(139,44,245,0.35)',
    maxWidth: 185,
  },
  sweepTrack: {
    height: 2,
    backgroundColor: colors.surface4,
    borderRadius: 1,
    marginTop: 3,
    overflow: 'hidden',
  },
  sweepFill: {
    height: '100%',
    backgroundColor: colors.cyan,
  },
});
