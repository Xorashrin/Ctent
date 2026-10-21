// Ctent BDIX Directory & Poster Organizer — reverse-engineered from app-release.apk (Ls8 BrowseScreen).
// Features:
// - Crawls Apache, Nginx, LiteSpeed, IIS & h5ai HTTP folder listings
// - Interactive Breadcrumb navigation (Crumb[])
// - Dual View Mode toggle: POSTERS (2-column poster/folder cards) vs FILES (detailed list with size & date)
// - Language filter chips: All, Bangla, Hindi, English
// - Sort organizer: NAME, DATE, SIZE
// - Tapping any VIDEO entry registers it and opens Ctent's Title / Player screen immediately!
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Chip } from '../components/Chip';
import { ScreenHeader } from '../components/ScreenHeader';
import { Txt } from '../components/Txt';
import type { RootStackParamList } from '../navigation/types';
import { register } from '../services/catalog';
import {
  browseDirectory,
  directoryEntryToTitle,
  type BrowseLangFilter,
  type BrowseSort,
  type BrowseViewMode,
  type DirectoryEntry,
  type ParsedListing,
} from '../services/directoryBrowser';
import { colors, font, layout, radius } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Browse'>;

const LANGS: BrowseLangFilter[] = ['All', 'Bangla', 'Hindi', 'English'];
const SORTS: { key: BrowseSort; label: string }[] = [
  { key: 'NAME', label: 'A–Z' },
  { key: 'DATE', label: 'Latest' },
  { key: 'SIZE', label: 'Size' },
];

export default function BrowseScreen({ navigation, route }: Props) {
  const serverName = route.params?.title ?? 'CircleFTP Index';
  const [currentUrl, setCurrentUrl] = useState(route.params?.url ?? 'http://index2.circleftp.net/FILE/');
  const [listing, setListing] = useState<ParsedListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<BrowseViewMode>('FILES');
  const [lang, setLang] = useState<BrowseLangFilter>('All');
  const [sort, setSort] = useState<BrowseSort>('NAME');
  const [search, setSearch] = useState('');

  const loadFolder = useCallback(
    async (targetUrl: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await browseDirectory(targetUrl, serverName);
        setListing(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Server folder did not respond on this network');
      } finally {
        setLoading(false);
      }
    },
    [serverName],
  );

  useEffect(() => {
    loadFolder(currentUrl);
  }, [currentUrl, loadFolder]);

  const entries = useMemo(() => {
    if (!listing) return [];
    const q = search.trim().toLowerCase();
    const filtered = listing.entries.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.cleanTitle.toLowerCase().includes(q)) return false;
      if (lang !== 'All' && e.language !== 'All' && e.language !== lang) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      // Always keep folders at the top
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      if (sort === 'SIZE') return b.sizeBytes - a.sizeBytes;
      if (sort === 'DATE') return b.modified.localeCompare(a.modified);
      return a.cleanTitle.localeCompare(b.cleanTitle);
    });
  }, [listing, search, lang, sort]);

  const handlePressEntry = (entry: DirectoryEntry) => {
    if (entry.isDir) {
      setCurrentUrl(entry.url);
      return;
    }
    if (entry.kind === 'VIDEO') {
      const title = directoryEntryToTitle(entry, entries, serverName);
      register([title]);
      navigation.navigate('Title', { id: title.id });
    }
  };

  const handlePlayDirect = (entry: DirectoryEntry) => {
    const title = directoryEntryToTitle(entry, entries, serverName);
    register([title]);
    navigation.navigate('Player', { id: title.id });
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        back
        title={listing?.title || serverName}
        subtitle={`${listing ? `${entries.length} items · ${listing.software}` : currentUrl}`}
      />

      {/* Interactive Breadcrumb Bar (Crumb[]) */}
      {listing && listing.breadcrumbs.length > 0 ? (
        <View style={styles.crumbBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: layout.gutter, alignItems: 'center', gap: 4 }}
          >
            {listing.breadcrumbs.map((c, idx) => {
              const isLast = idx === listing.breadcrumbs.length - 1;
              return (
                <React.Fragment key={c.url}>
                  <Pressable
                    onPress={() => setCurrentUrl(c.url)}
                    style={[styles.crumbPill, isLast ? styles.crumbPillActive : null]}
                  >
                    <Txt weight={isLast ? 'bold' : 'medium'} size={11} color={isLast ? colors.cyan : colors.textMuted}>
                      {c.label}
                    </Txt>
                  </Pressable>
                  {!isLast ? <Ionicons name="chevron-forward" size={12} color={colors.textFaint} /> : null}
                </React.Fragment>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Organizer Controls: Search + View Mode (POSTERS vs FILES) + Language & Sort */}
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={15} color={colors.textDim} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Filter folder items…"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            autoCapitalize="none"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setViewMode((m) => (m === 'FILES' ? 'POSTERS' : 'FILES'))}
          style={styles.modeBtn}
        >
          <Ionicons
            name={viewMode === 'POSTERS' ? 'grid' : 'list'}
            size={16}
            color={colors.magenta}
          />
          <Txt weight="bold" size={11} color={colors.magenta} style={{ marginLeft: 4 }}>
            {viewMode}
          </Txt>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 6, alignItems: 'center' }}
        >
          {LANGS.map((l) => (
            <Chip key={l} label={l} selected={lang === l} solid={lang === l} onPress={() => setLang(l)} />
          ))}
          <View style={styles.divider} />
          {SORTS.map((s) => (
            <Chip
              key={s.key}
              label={`Sort: ${s.label}`}
              selected={sort === s.key}
              onPress={() => setSort(s.key)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.violet} />
          <Txt size={12} color={colors.textMuted} style={{ marginTop: 10 }}>
            Reading BDIX index from {serverName}…
          </Txt>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="folder-alert-outline" size={44} color={colors.danger} />
          <Txt weight="bold" size={15} style={{ marginTop: 10 }}>
            Could not open directory
          </Txt>
          <Txt size={12} color={colors.textMuted} align="center" style={{ marginTop: 4, paddingHorizontal: 32 }}>
            {error}. Many BDIX file servers only answer on local Bangladeshi ISP routes.
          </Txt>
          <Pressable onPress={() => loadFolder(currentUrl)} style={styles.retryBtn}>
            <Txt weight="bold" size={13} color="#FFFFFF">
              Retry Folder
            </Txt>
          </Pressable>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={entries}
          numColumns={viewMode === 'POSTERS' ? 2 : 1}
          keyExtractor={(item) => item.url}
          columnWrapperStyle={viewMode === 'POSTERS' ? { gap: 10 } : undefined}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, paddingTop: 8, paddingBottom: 32, gap: 8 }}
          renderItem={({ item }) => {
            if (viewMode === 'POSTERS') {
              return (
                <Pressable onPress={() => handlePressEntry(item)} style={styles.gridCard}>
                  <View style={styles.gridIconArea}>
                    <MaterialCommunityIcons
                      name={item.isDir ? 'folder-multiple' : item.kind === 'VIDEO' ? 'movie-play' : 'file-outline'}
                      size={34}
                      color={item.isDir ? colors.cyan : item.kind === 'VIDEO' ? colors.magenta : colors.textDim}
                    />
                    {item.quality ? (
                      <View style={styles.gridQuality}>
                        <Txt weight="bold" size={9} color="#FFFFFF">
                          {item.quality}
                        </Txt>
                      </View>
                    ) : null}
                  </View>
                  <Txt weight="bold" size={12} numberOfLines={2} style={{ marginTop: 8 }}>
                    {item.cleanTitle}
                  </Txt>
                  <Txt size={10} color={colors.textDim} numberOfLines={1} style={{ marginTop: 2 }}>
                    {[item.year, item.sizeText, item.modified].filter(Boolean).join(' · ')}
                  </Txt>
                </Pressable>
              );
            }

            return (
              <Pressable onPress={() => handlePressEntry(item)} style={styles.fileRow}>
                <View
                  style={[
                    styles.fileIcon,
                    {
                      backgroundColor: item.isDir
                        ? 'rgba(61,220,255,0.14)'
                        : item.kind === 'VIDEO'
                          ? 'rgba(226,28,240,0.16)'
                          : colors.surface2,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      item.isDir
                        ? 'folder'
                        : item.kind === 'VIDEO'
                          ? 'play-circle'
                          : item.kind === 'SUBTITLE'
                            ? 'subtitles-outline'
                            : 'file-document-outline'
                    }
                    size={22}
                    color={item.isDir ? colors.cyan : item.kind === 'VIDEO' ? colors.magenta : colors.textMuted}
                  />
                </View>

                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Txt weight="semibold" size={13} numberOfLines={1}>
                    {item.cleanTitle || item.name}
                  </Txt>
                  <Txt size={11} color={colors.textDim} numberOfLines={1} style={{ marginTop: 2 }}>
                    {[item.isDir ? 'Folder' : item.kind, item.quality, item.sizeText, item.modified]
                      .filter(Boolean)
                      .join(' · ')}
                  </Txt>
                </View>

                {item.kind === 'VIDEO' ? (
                  <Pressable onPress={() => handlePlayDirect(item)} hitSlop={8} style={styles.directPlayBtn}>
                    <Ionicons name="play" size={15} color="#FFFFFF" />
                  </Pressable>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Txt weight="semibold" size={14} color={colors.textMuted}>
                No folders or playable videos in this directory
              </Txt>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  crumbBar: {
    height: 36,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  crumbPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surface1,
  },
  crumbPillActive: {
    backgroundColor: 'rgba(61,220,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(61,220,255,0.45)',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.gutter,
    marginTop: 8,
    gap: 8,
  },
  searchWrap: {
    flex: 1,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: font.regular,
    fontSize: 13,
    paddingVertical: 0,
  },
  modeBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(226,28,240,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(226,28,240,0.45)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterRow: {
    height: 44,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radius.md,
    backgroundColor: colors.violet,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCard: {
    flex: 1,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  gridIconArea: {
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridQuality: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.violet,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
