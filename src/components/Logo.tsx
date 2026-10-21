// MythTube Aurora Emblem — Clean geometric prism mark with Aurora Mint -> Glacier Cyan gradient.
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, GRADIENTS, radius } from '../theme/tokens';
import { Txt } from './Txt';

export function MLogo({ size = 28 }: { size?: number }) {
  const box = Math.round(size * 1.12);
  const r = Math.max(8, Math.round(box * 0.28));
  return (
    <LinearGradient
      colors={GRADIENTS.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.emblem, { width: box, height: box, borderRadius: r }]}
    >
      <View style={[styles.emblemInner, { borderRadius: Math.max(6, r - 2) }]}>
        <Txt weight="black" size={Math.round(size * 0.6)} color={colors.mint} spacing={-0.5}>
          M
        </Txt>
      </View>
    </LinearGradient>
  );
}

export function MythTubeWordmark({ height = 28, showBadge = true }: { height?: number; showBadge?: boolean }) {
  const fontSize = Math.round(height * 0.78);
  return (
    <View style={styles.row}>
      <MLogo size={Math.round(height * 0.86)} />
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginLeft: 9 }}>
        <Txt weight="black" size={fontSize} color={colors.text} spacing={-0.4}>
          Myth
        </Txt>
        <Txt weight="black" size={fontSize} color={colors.mint} spacing={-0.4}>
          Tube
        </Txt>
      </View>
      {showBadge ? (
        <View style={styles.badge}>
          <Txt weight="bold" size={9} color={colors.mint} spacing={0.6}>
            HUB
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

export function Wordmark({ size = 20 }: { size?: number }) {
  return <MythTubeWordmark height={Math.round(size * 1.35)} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  emblem: {
    padding: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemInner: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    marginLeft: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0, 229, 176, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 176, 0.35)',
  },
});
