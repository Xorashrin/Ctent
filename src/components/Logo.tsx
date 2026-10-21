import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, GRADIENTS } from '../theme/tokens';
import { Txt } from './Txt';

export function MLogo({ size = 30 }: { size?: number }) {
  const r = Math.round(size * 0.32);
  return (
    <LinearGradient
      colors={[...GRADIENTS.brand]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.badge, { width: size, height: size, borderRadius: r }]}
    >
      <Ionicons name="play" size={Math.round(size * 0.52)} color="#FFFFFF" style={{ marginLeft: 2 }} />
    </LinearGradient>
  );
}

export function Wordmark({ size = 22, subtitle = true }: { size?: number; subtitle?: boolean }) {
  return (
    <View style={styles.row}>
      <MLogo size={Math.round(size * 1.28)} />
      <View style={{ marginLeft: 9 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Txt weight="bold" size={size} color={colors.text} spacing={0.4} lineHeight={size * 1.1}>
            Ctent
          </Txt>
          <View style={styles.dot} />
        </View>
        {subtitle ? (
          <Txt weight="medium" size={10} color={colors.textMuted} spacing={0.5} lineHeight={12}>
            ALL IN ONE · BDIX & ANIME
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.pink,
    marginLeft: 3,
    marginTop: 4,
  },
});
