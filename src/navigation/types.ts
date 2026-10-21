import { useNavigation, type NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type TabParamList = {
  Home: { genre?: string } | undefined;
  Anime: undefined;
  SearchTab: { genre?: string; kind?: 'movie' | 'series' | 'anime'; live?: boolean } | undefined;
  Servers: undefined;
  MyNetflix: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Title: { id: string; season?: number };
  Player: { id: string; episodeId?: string };
  Live: { channelId: string; filter?: string };
  Browse: { serverId?: string; url: string; title?: string };
  Catalog: { rowKey?: string; title: string; genre?: string; anime?: boolean };
  ServersModal: undefined;
  Search: { genre?: string; kind?: 'movie' | 'series' | 'anime'; live?: boolean } | undefined;
  Categories: { current?: string } | undefined;
  MyList: undefined;
  Downloads: undefined;
  Notifications: undefined;
  AppSettings: undefined;
  AdultContent: undefined;
};

export type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function useRootNav(): RootNav {
  return useNavigation<RootNav>();
}
