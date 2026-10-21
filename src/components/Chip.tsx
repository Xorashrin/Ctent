// MythTube Category & Filter Pill Chip — Aurora Mint -> Glacier Cyan gradient when active,
// frosted midnight-slate glass when inactive, with spring press feedback.
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { colors, GRADIENTS, radius } from '../theme/tokens';
import { Txt } from './Txt';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  label?: string;
  selected?: boolean;
  solid?: boolean;
  caret?: boolean;
  icon?: IoniconName;
  badge?: string | number;
  onPress?: () => void;
}

export function Chip({ label, selected, caret, icon, badge, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
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
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} hitSlop={4}>
      <Animated.View style={[styles.outer, { transform: [{ scale }] }]}>
        {selected ? (
          <LinearGradient
            colors={GRADIENTS.pill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activeInner}
          >
            {icon ? <Ionicons name={icon} size={14} color="#04120E" style={label ? { marginRight: 5 } : undefined} /> : null}
            {label ? (
              <Txt weight="bold" size={12} color="#04120E">
                {label}
              </Txt>
            ) : null}
            {badge !== undefined ? (
              <View style={styles.badgeActive}>
                <Txt weight="bold" size={10} color={colors.mint}>
                  {String(badge)}
                </Txt>
              </View>
            ) : null}
            {caret ? <Ionicons name="chevron-down" size={13} color="#04120E" style={{ marginLeft: 4 }} /> : null}
          </LinearGradient>
        ) : (
          <View style={styles.inactiveInner}>
            {icon ? <Ionicons name={icon} size={14} color={colors.textSoft} style={label ? { marginRight: 5 } : undefined} /> : null}
            {label ? (
              <Txt weight="medium" size={12} color={colors.textSoft}>
                {label}
              </Txt>
            ) : null}
            {badge !== undefined ? (
              <View style={styles.badgeInactive}>
                <Txt weight="bold" size={10} color={colors.mint}>
                  {String(badge)}
                </Txt>
              </View>
            ) : null}
            {caret ? <Ionicons name="chevron-down" size={13} color={colors.textMuted} style={{ marginLeft: 4 }} /> : null}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  activeInner: {
    height: 34,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveInner: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: '#061A14',
  },
  badgeInactive: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0, 229, 176, 0.14)',
  },
});
