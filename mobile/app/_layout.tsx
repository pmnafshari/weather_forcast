import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { useWeatherStore } from '@/store/weatherStore';
import { loadLastLocation } from '@/services/storage';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});


function TabIcon({
  name,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
}) {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? Colors.primary : Colors.textMuted}
    />
  );
}


function AppInitializer() {
  const weatherStore = useWeatherStore();

  useEffect(() => {
    // Hydrate preferences and load cached data on mount
    weatherStore.hydratePreferences();
    weatherStore.loadCachedData();

    // Load last known location from storage
    loadLastLocation().then((lastLocation) => {
      if (lastLocation) {
        weatherStore.setLocation(lastLocation);
      }
    });

    // Subscribe to network connectivity changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected ?? false;
      weatherStore.setOffline(!isConnected);

      // When coming back online, restore cached data if no fresh data exists
      if (isConnected && weatherStore.cachedWeatherData && !weatherStore.weatherData) {
        weatherStore.setWeatherData(weatherStore.cachedWeatherData);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
}


export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.root}>
        <AppInitializer />
        <StatusBar style="light" />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.textMuted,
            tabBarLabelStyle: styles.tabLabel,
            tabBarHideOnKeyboard: true,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ focused }) => (
                <TabIcon name="home" focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="forecast"
            options={{
              title: 'Forecast',
              tabBarIcon: ({ focused }) => (
                <TabIcon name="calendar" focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="activities"
            options={{
              title: 'Activities',
              tabBarIcon: ({ focused }) => (
                <TabIcon name="fitness" focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="air-quality"
            options={{
              title: 'Air Quality',
              tabBarIcon: ({ focused }) => (
                <TabIcon name="leaf" focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ focused }) => (
                <TabIcon name="settings" focused={focused} />
              ),
            }}
          />
        </Tabs>
      </View>
    </QueryClientProvider>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 60 + (Spacing.xs * 2), // tab bar + safe area padding
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  tabLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500' as any,
  },
});
