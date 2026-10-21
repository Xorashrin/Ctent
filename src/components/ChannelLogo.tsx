import { Image } from './Img';
import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Channel } from '../data/channels';
import { colors } from '../theme/tokens';
import { Txt } from './Txt';

const TINTS = ['#00E5B0', '#0EA5E9', '#3B82F6', '#F59E0B', '#10B981', '#06B6D4', '#6366F1'];

function initials(name: string): string {
  const words = name.split(/[\s\-_.]+/).filter((w) => /^[A-Za-z0-9]/.test(w));
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase();
}

/** Channel logo on a neutral tile, falling back to an initials badge when the logo fails to load. */
export const ChannelLogo = memo(function ChannelLogo({ channel, size }: { channel: Channel; size: number }) {
  const [failed, setFailed] = useState(!channel.logo);
  const tint = TINTS[channel.id.length % TINTS.length];
  return (
    <View style={[styles.tile, { width: size, height: size * 0.62 }]}>
      {failed ? (
        <View style={[styles.fallback, { backgroundColor: tint }]}>
          <Txt weight="black" size={size / 5}>
            {initials(channel.name)}
          </Txt>
        </View>
      ) : (
        <Image
          source={channel.logo}
          style={styles.logo}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={channel.id}
          transition={120}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  tile: { borderRadius: 6, overflow: 'hidden', backgroundColor: colors.surface3, padding: 10 },
  logo: { flex: 1 },
  fallback: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
