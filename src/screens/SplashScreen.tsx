import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Wordmark } from '../components/Logo';
import type { RootStackParamList } from '../navigation/types';
import { useApp } from '../state/AppState';
import { colors, motion } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { state } = useApp();
  const scale = useRef(new Animated.Value(0.84)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 480, easing: motion.decelerate, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
  }, [opacity, scale, glow]);

  useEffect(() => {
    if (!state.hydrated) return;
    const timer = setTimeout(() => {
      navigation.replace('Main');
    }, 950);
    return () => clearTimeout(timer);
  }, [state.hydrated, navigation]);

  const glowStyle = {
    opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.32] }),
    transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.35] }) }],
  };

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Wordmark size={34} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.violet,
  },
});
