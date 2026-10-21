// MythTube Smooth Motion Primitives — Native-driver spring & cubic-bezier animations
// for staggered entrance (FadeSlideIn), tactile press physics (PressableScale),
// Aurora shimmer skeletons (ShimmerBox), breathing live indicators (LivePulseDot),
// expanding pagination pills (ExpandingDots), and cinematic Ken Burns backdrops.
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, GRADIENTS, radius } from '../theme/tokens';

/** Staggered entrance animation: fades in while sliding upward with a crisp spring curve. */
export function FadeSlideIn({
  delay = 0,
  distance = 14,
  duration = 320,
  style,
  children,
}: {
  delay?: number;
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        speed: 18,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/** Tactile spring-physics pressable wrapper for cards, pills, and action tiles. */
export function PressableScale({
  onPress,
  onLongPress,
  scaleTo = 0.96,
  disabled,
  hitSlop,
  style,
  children,
}: {
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  scaleTo?: number;
  disabled?: boolean;
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
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

  return (
    <Pressable
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Smooth sweeping Aurora shimmer skeleton for loading cards and rows. */
export function ShimmerBox({
  width,
  height,
  borderRadius = radius.md,
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
        duration: 1250,
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
    <View style={[{ width, height, borderRadius, backgroundColor: colors.surface2, overflow: 'hidden' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['rgba(0,229,176,0)', 'rgba(0,229,176,0.09)', 'rgba(14,165,233,0.12)', 'rgba(0,229,176,0)']}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 1, y: 0.7 }}
          style={{ width: 160, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}

/** Breathing live status dot with expanding halo ring. */
export function LivePulseDot({
  color = colors.mint,
  size = 8,
}: {
  color?: string;
  size?: number;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 950, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 950, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <View style={{ width: size * 2, height: size * 2, alignItems: 'center', justifyContent: 'center' }}>
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

/** Animated pill pagination indicator for HeroRotator. */
export function ExpandingDots({
  count,
  activeIndex,
}: {
  count: number;
  activeIndex: number;
}) {
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
              active ? styles.dotActive : styles.dotInactive,
            ]}
          >
            {active ? (
              <LinearGradient
                colors={GRADIENTS.pill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** Subtle Ken Burns zoom + pan wrapper for hero and detail backdrops. */
export function KenBurnsBackdrop({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.07] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

  return (
    <View style={[ { overflow: 'hidden' }, style ]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }, { translateX }] }]}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(248, 250, 252, 0.24)',
  },
});
