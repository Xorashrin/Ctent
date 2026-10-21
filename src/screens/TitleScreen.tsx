// Ctent Title & Anime Details Organizer — reverse-engineered from app-release.apk (Lv8 DetailsScreen & Ln8 AltSource).
// Features:
// - Cosmic violet hero backdrop + poster card + server origin pill + ★ gold rating
// - Neon violet-to-magenta gradient Play/Resume CTA + Multi-thread Download CTA
// - "Available on Other Servers" (AltSource[]) cross-server copy switcher
// - Season chips + Episode search filter + real-time verified Server & Source list
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleIconButton, IconAction, ProgressBar } from '../components/Buttons';
import { DownloadSheet } from '../components/DownloadSheet';
import { Image } from '../components/Img';
import { Txt } from '../components/Txt';
import { findEpisode, sourceBadgeName, type Episode, type Title } from '../data/types';
import type { RootStackParamList } from '../navigation/types';
import { loadDetail, resolveTitle } from '../services/catalog';
import { useSourceSearch } from '../services/playback';
import { downloadFor, progressFor, useApp, type Rating } from '../state/AppState';
import { colors, font, GRADIENTS, layout, radius } from '../theme/tokens';
import { formatRuntime, seasonsLabel } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Title'>;
type Tab = 'episodes' | 'servers';

const RATING_ICON: Record<Rating, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  down: 'thumb-down',
  up: 'thumb-up',
  love: 'thumbs-up-down',
};

function EpisodeRow({ title, episode, onPlay }: { title: Title; episode: Episode; onPlay: () => void }) {
  const { profileData } = useApp();
  const progress = progressFor(profileData, title.id);
  const watched = progress?.episodeId === episode.id ? progress.position / Math.max(1, progress.duration) : 0;
  return (
    <Pressable onPress={onPlay} style={styles.episodeCard}>
      <View style={styles.episodeTop}>
        <View style={styles.still}>
          <Image
            source={episode.still ? { uri: episode.still } : undefined}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
          <View style={styles.stillPlay}>
            <Ionicons name="play" size={15} color="#FFFFFF" style={{ marginLeft: 1 }} />
          </View>
          {watched > 0 ? <ProgressBar value={watched} height={3} style={styles.stillProgress} /> : null}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Txt weight="bold" size={13} numberOfLines={2}>
            E{episode.number} · {episode.name}
          </Txt>
          {episode.runtime > 0 || episode.airDate ? (
            <Txt size={11} color={colors.textDim} style={{ marginTop: 3 }}>
              {episode.runtime > 0 ? `${episode.runtime}m` : new Date(episode.airDate!).toLocaleDateString()}
            </Txt>
          ) : null}
          {episode.synopsis ? (
            <Txt size={11} color={colors.textMuted} numberOfLines={2} style={{ marginTop: 4 }}>
              {episode.synopsis}
            </Txt>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function TitleScreen({ navigation, route }: Props) {
  const [title, setTitle] = useState<Title>(() => resolveTitle(route.params.id));
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profileData, toggleMyList, rate, startDownload, showToast } = useApp();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [epFilter, setEpFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadDetail(route.params.id).then((t) => !cancelled && setTitle(t));
    return () => {
      cancelled = true;
    };
  }, [route.params.id]);

  const [tab, setTab] = useState<Tab>(title.kind === 'series' ? 'episodes' : 'servers');
  useEffect(() => {
    setTab(title.kind === 'series' ? 'episodes' : 'servers');
  }, [title.kind]);

  const [seasonNumber, setSeasonNumber] = useState(route.params.season ?? -1);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const progress = progressFor(profileData, title.id);
  const resume = progress?.episodeId ? findEpisode(title, progress.episodeId) : null;
  const first = findEpisode(title);
  const target = resume ?? first;

  const { engine } = useSourceSearch(title, title.kind === 'series' ? target?.episode : undefined);
  const serverCount = engine.servers.length;
  const downloadable = engine.downloadable.length > 0 ? true : engine.done ? false : null;
  const inList = profileData.myList.includes(title.id);
  const rating = profileData.ratings[title.id];
  const wantedSeason = seasonNumber >= 0 ? seasonNumber : (target?.season.number ?? title.seasons[0]?.number ?? 1);
  const season = title.seasons.find((s) => s.number === wantedSeason) ?? title.seasons[0];
  const activeDownload = downloadFor(profileData, title.id, title.kind === 'series' ? target?.episode.id : undefined);

  const filteredEpisodes = useMemo(() => {
    if (!season) return [];
    const q = epFilter.trim().toLowerCase();
    if (!q) return season.episodes;
    return season.episodes.filter(
      (e) => String(e.number) === q || e.name.toLowerCase().includes(q) || e.synopsis.toLowerCase().includes(q),
    );
  }, [season, epFilter]);

  const play = (episodeId?: string) => {
    navigation.navigate('Player', { id: title.id, episodeId });
  };

  const setRating = (r: Rating) => {
    const next = rating === r ? null : r;
    rate(title.id, next);
    setRatingOpen(false);
    if (next === 'down') showToast("We won't suggest this again.");
    else if (next === 'up') showToast("You'll see more like this.");
    else if (next === 'love') showToast('Saved to your favorites!');
  };

  const playLabel = progress ? 'Resume Stream' : 'Stream Now';
  const epCode = target ? `S${target.season.number}:E${target.episode.number}` : '';
  const serverBadge = title.serverName ?? sourceBadgeName(title.source);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 42 }} showsVerticalScrollIndicator={false}>
        {/* Hero Backdrop Header */}
        <View style={{ width, height: Math.round(width * 0.72), backgroundColor: title.tint || colors.surface2 }}>
          <Image
            source={title.background || title.poster ? { uri: (title.background || title.poster)! } : undefined}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={['rgba(7,6,11,0.55)', 'rgba(7,6,11,0.2)', 'rgba(7,6,11,0.92)', colors.bg]}
            locations={[0, 0.35, 0.82, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroTopBar, { top: insets.top + 10 }]}>
            <CircleIconButton icon="arrow-back" size={36} onPress={() => navigation.goBack()} />
            <View style={styles.serverOriginPill}>
              <View style={styles.onlineDot} />
              <Txt weight="bold" size={11} color={colors.text}>
                {serverBadge}
              </Txt>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Txt weight="bold" size={24} lineHeight={30}>
            {title.name}
          </Txt>

          <View style={styles.meta}>
            {title.imdbRating ? (
              <View style={styles.goldBadge}>
                <Txt weight="bold" size={11} color={colors.gold}>
                  ★ {title.imdbRating}
                </Txt>
              </View>
            ) : null}
            <Txt weight="medium" size={12} color={colors.textMuted}>
              {title.year}
            </Txt>
            <View style={styles.maturity}>
              <Txt weight="semibold" size={10} color={colors.textSoft}>
                {title.maturity}
              </Txt>
            </View>
            <Txt weight="medium" size={12} color={colors.textMuted}>
              {title.kind === 'series'
                ? title.seasons.length
                  ? seasonsLabel(title.seasons.length)
                  : 'TV Series'
                : title.runtime
                  ? formatRuntime(title.runtime)
                  : 'Movie'}
            </Txt>
            {title.quality.map((q) => (
              <View key={q} style={styles.qualityChip}>
                <Txt weight="bold" size={10} color={colors.magenta}>
                  {q}
                </Txt>
              </View>
            ))}
          </View>

          {title.genres.length > 0 ? (
            <Txt size={12} color={colors.textDim} style={{ marginTop: 6 }}>
              {title.genres.join('  ·  ')}
            </Txt>
          ) : null}

          {/* Primary Play + Download CTAs */}
          <View style={styles.ctaRow}>
            <Pressable onPress={() => play(target?.episode.id)} style={styles.playWrap}>
              <LinearGradient
                colors={[...GRADIENTS.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playBtn}
              >
                <Ionicons name="play" size={19} color="#FFFFFF" />
                <Txt weight="bold" size={15} color="#FFFFFF" style={{ marginLeft: 7 }}>
                  {playLabel} {epCode ? `(${epCode})` : ''}
                </Txt>
              </LinearGradient>
            </Pressable>

            <Pressable
              disabled={!activeDownload && !downloadable}
              onPress={() => {
                if (activeDownload && activeDownload.status !== 'failed') navigation.navigate('Downloads');
                else setDownloadOpen(true);
              }}
              style={[styles.dlBtn, !activeDownload && !downloadable ? { opacity: 0.45 } : null]}
            >
              <Ionicons
                name={activeDownload?.status === 'downloaded' ? 'checkmark-circle' : 'download-outline'}
                size={20}
                color={colors.cyan}
              />
              <Txt weight="bold" size={12} color={colors.cyan} style={{ marginLeft: 5 }}>
                {activeDownload?.status === 'downloaded'
                  ? 'Saved'
                  : activeDownload
                    ? `${Math.round(activeDownload.progress * 100)}%`
                    : 'Download'}
              </Txt>
            </Pressable>
          </View>

          {progress ? (
            <View style={styles.resume}>
              <ProgressBar value={progress.position / Math.max(1, progress.duration)} style={{ flex: 1 }} />
              <Txt size={11} color={colors.textMuted} style={{ marginLeft: 10 }}>
                {Math.max(1, Math.round((progress.duration - progress.position) / 60))}m left
              </Txt>
            </View>
          ) : null}

          {title.synopsis ? (
            <Pressable onPress={() => setExpanded((e) => !e)}>
              <Txt size={13} color={colors.text80} lineHeight={19} numberOfLines={expanded ? undefined : 3} style={{ marginTop: 12 }}>
                {title.synopsis}
              </Txt>
            </Pressable>
          ) : null}

          {title.cast.length > 0 ? (
            <Txt size={12} color={colors.textDim} numberOfLines={expanded ? undefined : 1} style={{ marginTop: 8 }}>
              <Txt weight="semibold" size={12} color={colors.textMuted}>
                Cast:{' '}
              </Txt>
              {title.cast.join(', ')}
            </Txt>
          ) : null}

          {/* Available on Other Servers (Ln8 AltSource Organizer) */}
          {title.alternatives && title.alternatives.length > 1 ? (
            <View style={styles.altBox}>
              <Txt weight="bold" size={12} color={colors.online}>
                AVAILABLE ON {title.alternatives.length} SERVERS
              </Txt>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
                {title.alternatives.map((alt) => (
                  <Pressable
                    key={alt.id}
                    onPress={() => {
                      if (alt.id !== title.id) navigation.replace('Title', { id: alt.id });
                      else play(target?.episode.id);
                    }}
                    style={[styles.altChip, alt.id === title.id ? styles.altChipActive : null]}
                  >
                    <MaterialCommunityIcons name="server-network" size={14} color={alt.id === title.id ? colors.cyan : colors.textMuted} />
                    <Txt weight="bold" size={11} color={alt.id === title.id ? colors.cyan : colors.text} style={{ marginLeft: 5 }}>
                      {alt.serverName}
                    </Txt>
                    <Txt size={10} color={colors.textDim} style={{ marginLeft: 4 }}>
                      {alt.quality[0] ?? 'HD'}
                    </Txt>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.actions}>
            <IconAction
              label={inList ? 'In My Ctent' : 'My Ctent'}
              icon={inList ? 'bookmark-check' : 'bookmark-plus-outline'}
              active={inList}
              onPress={() => {
                toggleMyList(title.id);
                showToast(inList ? 'Removed from My Ctent' : 'Saved to My Ctent');
              }}
            />
            <View>
              <IconAction
                label="Rate"
                icon={rating ? RATING_ICON[rating] : 'thumb-up-outline'}
                active={!!rating}
                onPress={() => setRatingOpen((o) => !o)}
              />
              {ratingOpen ? (
                <View style={styles.ratingPopover}>
                  {(['down', 'up', 'love'] as const).map((r) => (
                    <Pressable
                      key={r}
                      hitSlop={6}
                      onPress={() => setRating(r)}
                      style={[styles.ratingButton, rating === r ? styles.ratingActive : null]}
                    >
                      <MaterialCommunityIcons
                        name={r === 'down' ? 'thumb-down-outline' : r === 'up' ? 'thumb-up-outline' : 'thumbs-up-down-outline'}
                        size={24}
                        color={colors.text}
                      />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
            <IconAction
              label="Share"
              icon="share-variant-outline"
              onPress={() => Share.share({ message: `Watch "${title.name}" on Ctent` }).catch(() => undefined)}
            />
          </View>
        </View>

        {/* Episodes vs Verified Sources Tabs */}
        <View style={styles.tabs}>
          {title.kind === 'series' ? (
            <Pressable onPress={() => setTab('episodes')} style={styles.tab}>
              <View style={[styles.tabIndicator, tab === 'episodes' ? { backgroundColor: colors.magenta } : null]} />
              <Txt weight="bold" size={14} color={tab === 'episodes' ? colors.text : colors.textDim}>
                Episodes {season ? `(${season.episodes.length})` : ''}
              </Txt>
            </Pressable>
          ) : null}
          <Pressable onPress={() => setTab('servers')} style={styles.tab}>
            <View style={[styles.tabIndicator, tab === 'servers' ? { backgroundColor: colors.magenta } : null]} />
            <Txt weight="bold" size={14} color={tab === 'servers' ? colors.text : colors.textDim}>
              Verified Servers ({engine.results.length}/{serverCount})
            </Txt>
          </Pressable>
        </View>

        {tab === 'episodes' && !season ? (
          <View style={{ paddingVertical: 28, alignItems: 'center' }}>
            {title.detailed ? (
              <Txt size={14} color={colors.textMuted}>
                No episodes listed yet — switch to "Verified Servers" to stream directly.
              </Txt>
            ) : (
              <ActivityIndicator color={colors.violet} />
            )}
          </View>
        ) : null}

        {tab === 'episodes' && season ? (
          <View style={styles.tabBody}>
            {title.seasons.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonChips}>
                {title.seasons.map((sn) => {
                  const active = sn.number === season.number;
                  return (
                    <Pressable
                      key={sn.number}
                      onPress={() => setSeasonNumber(sn.number)}
                      style={[styles.seasonChip, active ? styles.seasonChipActive : null]}
                    >
                      <Txt weight="bold" size={12} color={active ? '#FFFFFF' : colors.text}>
                        {sn.number === 0 ? 'Specials' : `Season ${sn.number}`}
                      </Txt>
                      <Txt size={10} color={active ? 'rgba(255,255,255,0.8)' : colors.textDim}>
                        {sn.episodes.length} ep
                      </Txt>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {season.episodes.length > 8 ? (
              <View style={styles.epSearchBox}>
                <Ionicons name="search" size={15} color={colors.textDim} />
                <TextInput
                  value={epFilter}
                  onChangeText={setEpFilter}
                  placeholder={`Jump to episode (1–${season.episodes.length}) or title…`}
                  placeholderTextColor={colors.textDim}
                  style={styles.epInput}
                />
                {epFilter ? (
                  <Pressable onPress={() => setEpFilter('')}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {filteredEpisodes.map((e) => (
              <EpisodeRow key={e.id} title={title} episode={e} onPlay={() => play(e.id)} />
            ))}
          </View>
        ) : null}

        {tab === 'servers' ? (
          <View style={styles.tabBody}>
            {serverCount === 0 && !engine.done ? (
              <View style={{ paddingVertical: 28, alignItems: 'center' }}>
                <ActivityIndicator color={colors.violet} />
                <Txt size={13} color={colors.textMuted} style={{ marginTop: 10 }}>
                  Probing BDIX FTPs, CircleFTP, CyberFTP, Tokyo Insider & Nuvio plugins…
                </Txt>
              </View>
            ) : serverCount === 0 ? (
              <Txt size={13} color={colors.textMuted} style={{ paddingVertical: 20 }}>
                No active stream found yet. Pull to retry or browse BDIX folders directly in the Servers tab.
              </Txt>
            ) : (
              <>
                <Txt size={12} color={colors.textDim} style={{ marginBottom: 10 }}>
                  {engine.results.length} verified of {serverCount} servers{engine.done ? '' : ' · probing live…'}. Fastest high-res stream plays automatically.
                </Txt>
                {[...engine.servers]
                  .sort(
                    (a, b) =>
                      (engine.results.findIndex((r) => r.server.id === a.id) + 1 || 999) -
                        (engine.results.findIndex((r) => r.server.id === b.id) + 1 || 999) || b.rank - a.rank,
                  )
                  .slice(0, 45)
                  .map((sv) => {
                    const idx = engine.results.findIndex((r) => r.server.id === sv.id);
                    const hit = idx >= 0 ? engine.results[idx] : null;
                    return (
                      <Pressable key={sv.id} onPress={() => play(target?.episode.id)} style={styles.serverCard}>
                        <View
                          style={[
                            styles.serverIconWrap,
                            { backgroundColor: idx === 0 ? 'rgba(34,211,122,0.16)' : 'rgba(139,44,245,0.16)' },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="server-network"
                            size={22}
                            color={idx === 0 ? colors.online : colors.magenta}
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Txt weight="bold" size={13} numberOfLines={1}>
                            {sv.name}
                            {idx === 0 ? '  · FASTEST' : ''}
                          </Txt>
                          <Txt size={11} color={colors.textMuted} style={{ marginTop: 2 }}>
                            {[
                              sv.size,
                              sv.detail,
                              hit ? `${hit.ms} ms` : '',
                              idx >= 0 ? 'verified' : 'probing',
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </Txt>
                        </View>
                        <Ionicons name="play-circle" size={28} color={idx === 0 ? colors.online : colors.magenta} />
                      </Pressable>
                    );
                  })}
              </>
            )}
          </View>
        ) : null}
      </ScrollView>

      <DownloadSheet
        visible={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        title={title}
        episode={title.kind === 'series' ? target?.episode : undefined}
        onStart={(serverId) => startDownload(title.id, title.kind === 'series' ? target?.episode.id : undefined, serverId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  heroTopBar: {
    position: 'absolute',
    left: layout.gutter,
    right: layout.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverOriginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,16,25,0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.online,
    marginRight: 6,
  },
  body: { paddingHorizontal: layout.gutter, marginTop: -24 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  goldBadge: {
    backgroundColor: 'rgba(255,197,61,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,197,61,0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  maturity: {
    backgroundColor: colors.surface3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  qualityChip: {
    borderWidth: 1,
    borderColor: 'rgba(226,28,240,0.45)',
    backgroundColor: 'rgba(226,28,240,0.12)',
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  playWrap: {
    flex: 1.5,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  playBtn: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dlBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: 'rgba(61,220,255,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resume: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  altBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: 'rgba(34,211,122,0.28)',
  },
  altChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  altChipActive: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(61,220,255,0.12)',
  },
  actions: { flexDirection: 'row', gap: 28, marginTop: 18 },
  ratingPopover: {
    position: 'absolute',
    bottom: 52,
    left: -50,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.surface3,
    borderRadius: 40,
    padding: 6,
    elevation: 8,
  },
  ratingButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  ratingActive: { backgroundColor: colors.violet },
  tabs: {
    flexDirection: 'row',
    gap: 24,
    paddingHorizontal: layout.gutter,
    marginTop: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  tab: { paddingBottom: 12 },
  tabIndicator: { height: 3, borderRadius: 2, marginBottom: 10, backgroundColor: 'transparent' },
  tabBody: { paddingHorizontal: layout.gutter, paddingTop: 6 },
  seasonChips: { gap: 8, paddingBottom: 12 },
  seasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  seasonChipActive: {
    backgroundColor: colors.violet,
    borderColor: colors.magenta,
  },
  epSearchBox: {
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  epInput: {
    flex: 1,
    color: colors.text,
    fontFamily: font.regular,
    fontSize: 13,
    paddingVertical: 0,
  },
  episodeCard: {
    marginBottom: 10,
    padding: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  episodeTop: { flexDirection: 'row', alignItems: 'center' },
  still: {
    width: 120,
    height: 68,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stillPlay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(139,44,245,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stillProgress: { position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: 0 },
  serverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  serverIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
