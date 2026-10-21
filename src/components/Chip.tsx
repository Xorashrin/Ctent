import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, GRADIENTS, radius } from '../theme/tokens';
import { Txt } from './Txt';

interface ChipProps {
  label?: string;
  onPress?: () => void;
  selected?: boolean;
  caret?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  emoji?: string;
  solid?: boolean;
}

export function Chip({ label, onPress, selected, caret, icon, emoji, solid }: ChipProps) {
  const filled = solid && selected;
  if (filled) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
        <LinearGradient
          colors={[...GRADIENTS.pill]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.chip, label ? styles.withLabel : styles.iconOnly, { borderWidth: 0 }]}
        >
          {icon ? <Ionicons name={icon} size={15} color="#FFFFFF" style={{ marginRight: label ? 5 : 0 }} /> : null}
          {emoji ? <Txt size={13}>{emoji} </Txt> : null}
          {label ? (
            <Txt weight="bold" size={13} color="#FFFFFF">
              {label}
            </Txt>
          ) : null}
          {caret ? <Ionicons name="chevron-down" size={13} color="#FFFFFF" style={{ marginLeft: 4 }} /> : null}
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        label ? styles.withLabel : styles.iconOnly,
        selected ? styles.selected : null,
        pressed ? { opacity: 0.72 } : null,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={selected ? colors.magenta : colors.textMuted}
          style={{ marginRight: label ? 5 : 0 }}
        />
      ) : null}
      {emoji ? <Txt size={13}>{emoji} </Txt> : null}
      {label ? (
        <Txt weight={selected ? 'bold' : 'medium'} size={13} color={selected ? colors.text : colors.textMuted}>
          {label}
        </Txt>
      ) : null}
      {caret ? (
        <Ionicons name="chevron-down" size={13} color={selected ? colors.magenta : colors.textMuted} style={{ marginLeft: 4 }} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: colors.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withLabel: { paddingHorizontal: 14 },
  iconOnly: { width: 34 },
  selected: {
    backgroundColor: 'rgba(139,44,245,0.22)',
    borderColor: colors.magenta,
  },
});
