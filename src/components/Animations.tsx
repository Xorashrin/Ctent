// Ctent Animations — reverse-engineered from app-release.apk (Lr8, Lw8, Lu8):
// 1. ShimmerBox: diagonal sweeping skeleton loader (shimmerTick / shimmerX)
// 2. LivePulseDot: pulsing server health indicator (live / liveA)
// 3. ExpandingDots: animated spotlight carousel indicator (dotW)
// 4. KenBurnsBackdrop: slow continuous drift/zoom for HeroRotator (drift)
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Image } from './Img';
import { colors, radius } from '../theme/tokens';

export function ShimmerBox({
  width,
  height,
  borderRadius = radius.lg,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1350,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 260],
  });

  return (
    <View style={[styles.shimmerContainer, { width, height, borderRadius }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['rgba(38,34,47,0)', 'rgba(139,44,245,0.18)', 'rgba(255,255,255,0.10)', 'rgba(38,34,47,0)']}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
          style={{ width: 180, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}

export function LivePulseDot({
  color = colors.online,
  size = 8,
  pulsing = true,
}: {
  color?: string;
  size?: number;
  pulsing?: boolean;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulsing) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, pulsing]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0] });

  return (
    <View style={{ width: size * 2, height: size * 2, alignItems: 'center', justifyContent: 'center' }}>
      {pulsing ? (
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          }}
        />
      ) : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function ExpandingDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  if (count <= 1) return null;
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              active
                ? { width: 22, backgroundColor: colors.magenta }
                : { width: 6, backgroundColor: 'rgba(255,255,255,0.28)' },
            ]}
          />
        );
      })}
    </View>
  );
}

export function KenBurnsBackdrop({ uri, tint }: { uri?: string; tint?: string }) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    drift.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 7500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 7500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [uri, drift]);

  const scale = drift.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.07] });
  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: tint || colors.surface1, transform: [{ scale }, { translateX }] },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shimmerContainer: {
    backgroundColor: colors.surface2,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
