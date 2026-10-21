// MythTube Frosted Glass Top Header — Clean, minimal bar with MythTube Aurora wordmark,
// Live Server Status Pill (online server count + fastest latency), and quick actions.
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRootNav, type RootStackParamList } from '../navigation/types';
import { ensureServerEngineInitialized, useServerEngine } from '../services/serverEngine';
import { colors, GRADIENTS, layout, radius } from '../theme/tokens';
import { LivePulseDot, PressableScale } from './Animations';
import { IconButton } from './Buttons';
import { MythTubeWordmark } from './Logo';
import { Txt } from './Txt';

type ActionKind = 'search' | 'categories' | 'downloads';

interface Props {
  title?: string;
  subtitle?: string;
  logo?: boolean;
  back?: boolean;
  transparent?: boolean;
  right?: React.ReactNode;
  left?: React.ReactNode;
  children?: React.ReactNode;
  hideSearch?: boolean;
  hideServerPill?: boolean;
  showServerPill?: boolean;
  actions?: ActionKind[];
  searchScope?: RootStackParamList['Search'];
}

export function LiveServerStatusPill({ onPress }: { onPress?: () => void } = {}) {
  const nav = useRootNav();
  const { state, activeRoute } = useServerEngine();

  useEffect(() => {
    ensureServerEngineInitialized();
  }, []);

  const scanning = state.phase === 'QUICK_PROBE' || state.phase === 'SWEEPING';
  const count = state.onlineCount;
  const fastestMs = activeRoute?.latencyMs;

  return (
    <PressableScale
      scaleTo={0.95}
      onPress={onPress ?? (() => nav.navigate('Main', { screen: 'Servers' }))}
      style={styles.serverPill}
    >
      <LivePulseDot color={count > 0 ? colors.mint : scanning ? colors.amber : colors.danger} size={6} />
      <Txt weight="bold" size={11} color={colors.text} style={{ marginLeft: 4 }}>
        {scanning && count === 0 ? 'Probing…' : `${count} Active`}
      </Txt>
      {fastestMs ? (
        <View style={styles.latencyBadge}>
          <Txt weight="bold" size={9} color={colors.mint}>
            {fastestMs}ms
          </Txt>
        </View>
      ) : null}
    </PressableScale>
  );
}

export function HeaderActions({
  actions = ['search'],
  searchScope,
}: {
  actions?: ActionKind[];
  searchScope?: RootStackParamList['Search'];
}) {
  const nav = useRootNav();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {actions.includes('downloads') ? (
        <PressableScale scaleTo={0.92} onPress={() => nav.navigate('Downloads')} style={styles.actionBtn}>
          <Ionicons name="download-outline" size={18} color={colors.text} />
        </PressableScale>
      ) : null}
      {actions.includes('categories') ? (
        <PressableScale scaleTo={0.92} onPress={() => nav.navigate('Categories')} style={styles.actionBtn}>
          <Ionicons name="grid-outline" size={17} color={colors.text} />
        </PressableScale>
      ) : null}
      {actions.includes('search') ? (
        <PressableScale scaleTo={0.92} onPress={() => nav.navigate('Search', searchScope)} style={styles.actionBtn}>
          <Ionicons name="search" size={18} color={colors.text} />
        </PressableScale>
      ) : null}
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  logo,
  back,
  transparent,
  right,
  left,
  children,
  hideSearch,
  hideServerPill,
  showServerPill,
  actions,
  searchScope,
}: Props) {
  const insets = useSafeAreaInsets();
  const nav = useRootNav();
  const displayServerPill = showServerPill !== undefined ? showServerPill : !hideServerPill && !back;

  const body = (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <View style={styles.left}>
          {back ? (
            <IconButton icon="arrow-back" size={24} onPress={() => nav.goBack()} style={{ marginRight: 10 }} />
          ) : null}
          {logo ? <MythTubeWordmark height={26} /> : null}
          {title ? (
            <View style={{ marginLeft: logo ? 10 : 0, flex: 1 }}>
              <Txt weight="bold" size={19} numberOfLines={1}>
                {title}
              </Txt>
              {subtitle ? (
                <Txt size={11} color={colors.textMuted} numberOfLines={1} style={{ marginTop: 1 }}>
                  {subtitle}
                </Txt>
              ) : null}
            </View>
          ) : null}
          {left}
        </View>
        <View style={styles.right}>
          {right ?? (
            <>
              {displayServerPill ? <LiveServerStatusPill /> : null}
              {actions ? (
                <HeaderActions actions={actions} searchScope={searchScope} />
              ) : !hideSearch ? (
                <HeaderActions actions={['search']} searchScope={searchScope} />
              ) : null}
            </>
          )}
        </View>
      </View>
      {children}
    </View>
  );

  if (transparent) {
    return <LinearGradient colors={GRADIENTS.topScrim}>{body}</LinearGradient>;
  }
  return <View style={{ backgroundColor: colors.bg }}>{body}</View>;
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  bar: {
    minHeight: layout.headerHeight,
    paddingHorizontal: layout.gutter,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(19, 30, 48, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 176, 0.28)',
  },
  latencyBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(0, 229, 176, 0.14)',
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(19, 30, 48, 0.88)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
