import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AdultContentScreen from '../screens/AdultContentScreen';
import AppSettingsScreen from '../screens/AppSettingsScreen';
import BrowseScreen from '../screens/BrowseScreen';
import CatalogScreen from '../screens/CatalogScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import LivePlayerScreen from '../screens/LivePlayerScreen';
import MyListScreen from '../screens/MyListScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PlayerScreen from '../screens/PlayerScreen';
import SearchScreen from '../screens/SearchScreen';
import ServersScreen from '../screens/ServersScreen';
import SplashScreen from '../screens/SplashScreen';
import TitleScreen from '../screens/TitleScreen';
import { colors } from '../theme/tokens';
import { Tabs } from './Tabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        orientation: 'portrait_up',
        animation: 'slide_from_right',
        animationDuration: 220,
        freezeOnBlur: true,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="Main" component={Tabs} options={{ animation: 'fade' }} />
      <Stack.Screen name="Title" component={TitleScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{ orientation: 'landscape', animation: 'fade', navigationBarHidden: true, statusBarHidden: true }}
      />
      <Stack.Screen
        name="Live"
        component={LivePlayerScreen}
        options={{ orientation: 'landscape', animation: 'fade', navigationBarHidden: true, statusBarHidden: true }}
      />
      <Stack.Screen name="Browse" component={BrowseScreen} />
      <Stack.Screen name="Catalog" component={CatalogScreen} />
      <Stack.Screen name="ServersModal" component={ServersScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade' }} />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
      />
      <Stack.Screen name="MyList" component={MyListScreen} />
      <Stack.Screen name="Downloads" component={DownloadsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
      <Stack.Screen name="AdultContent" component={AdultContentScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}
