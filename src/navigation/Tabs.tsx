// MythTube 5-Tab Navigation Bar — Smooth spring icon bounce & glowing Aurora Mint top indicator:
// 1. Home (Movies, Series, BDIX & Live Hub)
// 2. Anime (Anime & Donghua Hub)
// 3. Search (Cross-Server Ranked & By-Server Search)
// 4. Servers (BDIX Pool, Live IPTV Playlists & Directory Browser)
// 5. My MythTube (Watchlist, Downloads, Continue Watching & Settings)
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

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
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function AnimatedIonTabIcon({
  focused,
  color,
  activeIcon,
  inactiveIcon,
}: {
  focused: boolean;
  color: string;
  activeIcon: IoniconName;
  inactiveIcon: IoniconName;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.12 : 1,
      speed: 24,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  return (
    <View style={styles.tabIconWrap}>
      {focused ? <View style={styles.activeBar} /> : null}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={focused ? activeIcon : inactiveIcon} size={21} color={color} />
      </Animated.View>
    </View>
  );
}

function ServerTabIcon({ focused, color }: { focused: boolean; color: string }) {
  const { state } = useServerEngine();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.12 : 1,
      speed: 24,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  return (
    <View style={styles.tabIconWrap}>
      {focused ? <View style={styles.activeBar} /> : null}
      <Animated.View style={{ transform: [{ scale }] }}>
        <MaterialCommunityIcons
          name={focused ? 'server-network' : 'server-network-off'}
          size={22}
          color={color}
        />
        {state.onlineCount > 0 ? <View style={styles.onlineBadge} /> : null}
      </Animated.View>
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
          tabBarActiveTintColor: colors.mint,
          tabBarInactiveTintColor: colors.textDim,
          tabBarStyle: {
            backgroundColor: 'rgba(9, 15, 24, 0.97)',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: 'rgba(0, 229, 176, 0.22)',
            height: layout.tabBarHeight,
            paddingTop: 4,
            elevation: 0,
          },
          tabBarLabelStyle: { fontFamily: font.medium, fontSize: 10, marginBottom: 5 },
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <AnimatedIonTabIcon
                focused={focused}
                color={color}
                activeIcon="home"
                inactiveIcon="home-outline"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Anime"
          component={AnimeScreen}
          options={{
            title: 'Anime',
            tabBarIcon: ({ focused, color }) => (
              <AnimatedIonTabIcon
                focused={focused}
                color={color}
                activeIcon="sparkles"
                inactiveIcon="sparkles-outline"
              />
            ),
          }}
        />
        <Tab.Screen
          name="SearchTab"
          component={SearchScreen as React.ComponentType<any>}
          options={{
            title: 'Search',
            tabBarIcon: ({ focused, color }) => (
              <AnimatedIonTabIcon
                focused={focused}
                color={color}
                activeIcon="search"
                inactiveIcon="search-outline"
              />
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
            title: 'My Space',
            tabBarIcon: ({ focused, color }) => (
              <AnimatedIonTabIcon
                focused={focused}
                color={color}
                activeIcon="library"
                inactiveIcon="library-outline"
              />
            ),
          }}
        />
      </Tab.Navigator>
      <CreditPopup />
    </>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 28,
  },
  activeBar: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.mint,
  },
  onlineBadge: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.surface0,
  },
});
