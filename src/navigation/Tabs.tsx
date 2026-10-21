// Ctent 5-Tab Bottom Navigation — reverse-engineered from app-release.apk (Lu8 TabItem):
// 1. Home (home)
// 2. Anime (sparkles / AutoAwesome)
// 3. Search (search)
// 4. Servers (server-network / Dns)
// 5. My Ctent (library / VideoLibrary)
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CreditPopup } from '../components/CreditPopup';
import AnimeScreen from '../screens/AnimeScreen';
import HomeScreen from '../screens/HomeScreen';
import MyNetflixScreen from '../screens/MyNetflixScreen';
import SearchScreen from '../screens/SearchScreen';
import ServersScreen from '../screens/ServersScreen';
import { useServerEngine } from '../services/serverEngine';
import { colors, font, layout } from '../theme/tokens';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

function ServerTabIcon({ focused, color }: { focused: boolean; color: string }) {
  const { state } = useServerEngine();
  return (
    <View>
      <MaterialCommunityIcons
        name={focused ? 'server-network' : 'server-network-off'}
        size={23}
        color={color}
      />
      {state.onlineCount > 0 ? <View style={styles.onlineBadge} /> : null}
    </View>
  );
}

export function Tabs() {
  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
          tabBarActiveTintColor: colors.magenta,
          tabBarInactiveTintColor: colors.textDim,
          tabBarStyle: {
            backgroundColor: 'rgba(12,10,18,0.96)',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: 'rgba(139,44,245,0.28)',
            height: layout.tabBarHeight,
            paddingTop: 4,
            elevation: 0,
          },
          tabBarLabelStyle: { fontFamily: font.medium, fontSize: 10, marginBottom: 4 },
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Anime"
          component={AnimeScreen}
          options={{
            title: 'Anime',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="SearchTab"
          component={SearchScreen as React.ComponentType<any>}
          options={{
            title: 'Search',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Servers"
          component={ServersScreen}
          options={{
            title: 'Servers',
            tabBarIcon: ({ focused, color }) => <ServerTabIcon focused={focused} color={color} />,
          }}
        />
        <Tab.Screen
          name="MyNetflix"
          component={MyNetflixScreen}
          options={{
            title: 'My Ctent',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'library' : 'library-outline'} size={22} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <CreditPopup />
    </>
  );
}

const styles = StyleSheet.create({
  onlineBadge: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.online,
    borderWidth: 1,
    borderColor: colors.surface1,
  },
});
