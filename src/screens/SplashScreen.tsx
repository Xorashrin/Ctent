// MythTube Aurora Splash Screen — Smooth spring entrance into the 5-tab hub.
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { LivePulseDot } from '../components/Animations';
import { MLogo } from '../components/Logo';
import { Txt } from '../components/Txt';
import type { RootStackParamList } from '../navigation/types';
import { ensureServerEngineInitialized } from '../services/serverEngine';
import { useApp } from '../state/AppState';
import { colors } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { state } = useApp();
  const scale = useRef(new Animated.Value(0.75)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    ensureServerEngineInitialized();
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        speed: 14,
        bounciness: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringScale, { toValue: 1.25, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(ringScale, { toValue: 0.9, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    ]).start();
  }, [opacity, ringScale, scale]);

  useEffect(() => {
    if (!state.hydrated) return;
    const t = setTimeout(() => {
      navigation.replace('Main');
    }, 650);
    return () => clearTimeout(t);
  }, [navigation, state.hydrated]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.glowHalo, { transform: [{ scale: ringScale }] }]} />
      <Animated.View style={{ alignItems: 'center', opacity, transform: [{ scale }] }}>
        <MLogo size={72} />
        <View style={{ flexDirection: 'row', marginTop: 18 }}>
          <Txt weight="black" size={28} color={colors.text} spacing={-0.5}>
            Myth
          </Txt>
          <Txt weight="black" size={28} color={colors.mint} spacing={-0.5}>
            Tube
          </Txt>
        </View>
        <View style={styles.subRow}>
          <LivePulseDot color={colors.mint} size={6} />
          <Txt size={12} color={colors.textMuted} style={{ marginLeft: 6 }}>
            Initializing BDIX, IPTV, Anime & VOD engines…
          </Txt>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 229, 176, 0.08)',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
});
