import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, router } from 'expo-router';

import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import type { HourlyData, DailyData, WeatherLocation } from '@/types/weather';
import { useWeatherStore } from '@/store/weatherStore';
import { useWeather, useAirQuality } from '@/hooks/useWeather';
import type { GeocodingResult } from '@/services/weatherApi';
import {
  getWeatherDescription,
  getWeatherIcon,
  formatHour,
  formatDay,
  getWindDirection,
  getUvLevel,
  getDaylightDuration,
} from '@/utils/weatherFormatters';
import {
  formatTemperature,
  formatWind,
  formatPressure,
  formatVisibility,
  formatPercent,
} from '@/utils/unitConversion';
import { Card } from '@/components/common/Card';
import { WeatherIcon } from '@/components/common/WeatherIcon';
import { MetricCard } from '@/components/common/MetricCard';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { SearchModal } from '@/components/search/SearchModal';
import { WeatherBackground } from '@/components/weather/WeatherBackground';

const DEFAULT_LAT = 51.5074;
const DEFAULT_LON = -0.1278;


export default function HomeScreen() {
  const [searchVisible, setSearchVisible] = useState(false);

  const location = useWeatherStore((s) => s.location);
  const preferences = useWeatherStore((s) => s.preferences);
  const setWeatherData = useWeatherStore((s) => s.setWeatherData);
  const setAirQuality = useWeatherStore((s) => s.setAirQuality);
  const setLocation = useWeatherStore((s) => s.setLocation);
  const addRecentLocation = useWeatherStore((s) => s.addRecentLocation);

  const lat = location?.latitude ?? DEFAULT_LAT;
  const lon = location?.longitude ?? DEFAULT_LON;

  const weatherQuery = useWeather(lat, lon);
  const aqQuery = useAirQuality(lat, lon);

  // Sync fetched data into store on every successful fetch
  React.useEffect(() => {
    if (weatherQuery.data) {
      setWeatherData(weatherQuery.data);
      // Also update location from response
      setLocation(weatherQuery.data.location);
    }
  }, [weatherQuery.data, setWeatherData, setLocation]);

  React.useEffect(() => {
    if (aqQuery.data) {
      // Map AirQualityResponse → AirQualityData shape the store expects
      setAirQuality({
        aqi: aqQuery.data.aqi,
        aqiLevel: '',
        pm25: aqQuery.data.pm25,
        pm10: aqQuery.data.pm10,
        no2: aqQuery.data.no2,
        o3: aqQuery.data.o3,
        so2: aqQuery.data.so2,
        co: aqQuery.data.co,
        lastUpdated: new Date().toISOString(),
      });
    }
  }, [aqQuery.data, setAirQuality]);

  // Refetch on tab focus
  useFocusEffect(
    useCallback(() => {
      weatherQuery.refetch();
      aqQuery.refetch();
    }, [weatherQuery.refetch, aqQuery.refetch]),
  );


  const handleSearchSelect = useCallback(
    (result: GeocodingResult) => {
      const loc: WeatherLocation = {
        id: `${result.latitude}-${result.longitude}`,
        name: result.name,
        country: result.country,
        countryCode: result.countryCode,
        latitude: result.latitude,
        longitude: result.longitude,
        admin1: result.admin1,
      };
      setLocation(loc);
      addRecentLocation(loc);
    },
    [setLocation, addRecentLocation],
  );


  const data = weatherQuery.data;
  const isLoading = weatherQuery.isLoading && !data;
  const isError = weatherQuery.isError && !data;
  const isRefreshing = weatherQuery.isFetching && !!data;

  // Hourly items for today (next 24 hours)
  const hourlyItems = useMemo<HourlyData[]>(() => {
    if (!data?.hourly) return [];
    const now = new Date();
    const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return data.hourly.filter((h) => {
      const t = new Date(h.time);
      return t >= now && t <= cutoff;
    });
  }, [data?.hourly]);

  // Mini daily forecast (first 5 days)
  const dailyItems = useMemo<DailyData[]>(() => {
    if (!data?.daily) return [];
    return data.daily.slice(0, 5);
  }, [data?.daily]);


  const currentHourStr = new Date().toISOString().slice(0, 13); // e.g. "2025-01-15T14"

  const renderHourlyItem = useCallback(
    ({ item }: { item: HourlyData }) => {
      const isNow = item.time.slice(0, 13) === currentHourStr;
      const iconName = getWeatherIcon(item.weatherCode, item.isDay === 1);
      const precip = item.precipitationProbability;

      return (
        <View
          style={[
            styles.hourlyItem,
            isNow && styles.hourlyItemNow,
          ]}
          accessibilityLabel={`${isNow ? 'Now' : formatHour(item.time)}, ${formatTemperature(item.temperature, preferences.temperatureUnit)}, ${getWeatherDescription(item.weatherCode)}${precip != null && precip > 0 ? `, ${Math.round(precip)}% precipitation` : ''}`}
          accessibilityRole="text"
        >
          <Text style={styles.hourlyTime}>
            {isNow ? 'Now' : formatHour(item.time)}
          </Text>
          <WeatherIcon name={iconName} size={24} />
          <Text style={styles.hourlyTemp}>
            {formatTemperature(item.temperature, preferences.temperatureUnit)}
          </Text>
          {precip != null && precip > 0 && (
            <Text style={styles.hourlyPrecip}>{Math.round(precip)}%</Text>
          )}
        </View>
      );
    },
    [currentHourStr, preferences.temperatureUnit],
  );

  const renderDailyItem = useCallback(
    ({ item }: { item: DailyData }) => {
      const iconName = getWeatherIcon(item.weatherCode, true);
      return (
        <TouchableOpacity
          style={styles.dailyRow}
          activeOpacity={0.7}
          onPress={() => router.push(`/forecast?date=${item.date}` as any)}
          hitSlop={{ top: 4, bottom: 4 }}
          accessibilityRole="button"
          accessibilityLabel={`${formatDay(item.date)}, ${getWeatherDescription(item.weatherCode)}, high ${formatTemperature(item.tempMax, preferences.temperatureUnit)}, low ${formatTemperature(item.tempMin, preferences.temperatureUnit)}${item.precipitationProbability != null && item.precipitationProbability > 0 ? `, ${Math.round(item.precipitationProbability)}% precipitation` : ''}`}
          accessibilityHint="Tap to view detailed forecast"
        >
          <Text style={[styles.dailyDay, styles.dailyDayCol]}>{formatDay(item.date)}</Text>
          <WeatherIcon name={iconName} size={20} />
          <Text style={styles.dailyPrecipCol}>
            {item.precipitationProbability != null && item.precipitationProbability > 0
              ? `${Math.round(item.precipitationProbability)}%`
              : ''}
          </Text>
          <Text style={styles.dailyLow}>
            {formatTemperature(item.tempMin, preferences.temperatureUnit)}
          </Text>
          <View style={styles.dailyRangeTrack}>
            <View
              style={[
                styles.dailyRangeFill,
                {
                  width: `${getRangeWidth(item, dailyItems)}%`,
                  marginLeft: `${getRangeOffset(item, dailyItems)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.dailyHigh}>
            {formatTemperature(item.tempMax, preferences.temperatureUnit)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      );
    },
    [preferences.temperatureUnit, dailyItems],
  );


  return (
    <View style={styles.root}>
      <WeatherBackground
        weatherCode={data?.current.weatherCode}
        isDay={data?.current.isDay}
      />
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                weatherQuery.refetch();
                aqQuery.refetch();
              }}
              tintColor={Colors.primaryLight}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.locationCol}>
              <Text style={styles.locationName}>
                {data?.location.name ?? location?.name ?? 'Loading...'}
              </Text>
              {data?.location.country && (
                <Text style={styles.locationCountry}>{data.location.country}</Text>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setSearchVisible(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Search for a city"
              >
                <Ionicons name="search" size={22} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => router.push('/settings' as any)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
              >
                <Ionicons name="settings-outline" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Loading skeleton */}
          {isLoading && (
            <View style={styles.section}>
              <SkeletonCard height={120} />
              <View style={styles.spacing} />
              <SkeletonCard height={120} />
              <View style={styles.spacing} />
              <View style={styles.metricsGrid}>
                <SkeletonCard height={80} style={styles.metricCell} />
                <SkeletonCard height={80} style={styles.metricCell} />
                <SkeletonCard height={80} style={styles.metricCell} />
                <SkeletonCard height={80} style={styles.metricCell} />
              </View>
            </View>
          )}

          {/* Error state */}
          {isError && (
            <View style={styles.errorContainer}>
              <Ionicons name="cloud-offline-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.errorTitle}>Unable to load weather</Text>
              <Text style={styles.errorSubtitle}>
                {weatherQuery.error?.message || 'Check your connection and try again'}
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => weatherQuery.refetch()}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Retry loading weather"
              >
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Weather data */}
          {data && !isLoading && (
            <>
              {/* Current Weather Hero */}
              <View style={styles.heroContainer}>
                <View style={styles.heroContent}>
                  <Text style={styles.heroTemp}>
                    {formatTemperature(data.current.temperature, preferences.temperatureUnit)}
                  </Text>
                  <View style={styles.heroDetails}>
                    <Text style={styles.heroDesc}>
                      {getWeatherDescription(data.current.weatherCode)}
                    </Text>
                    <Text style={styles.heroFeelsLike}>
                      Feels like {formatTemperature(data.current.feelsLike, preferences.temperatureUnit)}
                    </Text>
                    <Text style={styles.heroHighLow}>
                      H {formatTemperature(data.daily[0]?.tempMax ?? data.current.temperature, preferences.temperatureUnit)}{' '}
                      / L {formatTemperature(data.daily[0]?.tempMin ?? data.current.temperature, preferences.temperatureUnit)}
                    </Text>
                  </View>
                </View>
                <WeatherIcon
                  name={getWeatherIcon(data.current.weatherCode, data.current.isDay)}
                  size={64}
                />
              </View>

              {/* Hourly Forecast */}
              <Card style={styles.hourlyCard}>
                <Text style={styles.sectionLabel}>HOURLY FORECAST</Text>
                <FlatList
                  data={hourlyItems}
                  keyExtractor={(item, i) => `h-${i}`}
                  renderItem={renderHourlyItem}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hourlyList}
                />
              </Card>

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                {data.current.uvIndex != null && (
                  <MetricCard
                    icon="sunny-outline"
                    label="UV Index"
                    value={String(data.current.uvIndex)}
                    unit={getUvLevel(data.current.uvIndex).label}
                    color={getUvLevel(data.current.uvIndex).color}
                  />
                )}
                <MetricCard
                  icon="wind"
                  label="Wind"
                  value={formatWind(data.current.windSpeed, preferences.windUnit)}
                  unit={getWindDirection(data.current.windDirection)}
                />
                <MetricCard
                  icon="water-outline"
                  label="Humidity"
                  value={formatPercent(data.current.humidity)}
                />
                <MetricCard
                  icon="speedometer-outline"
                  label="Pressure"
                  value={formatPressure(data.current.pressure, preferences.pressureUnit)}
                />
                {data.current.visibility != null && (
                  <MetricCard
                    icon="eye-outline"
                    label="Visibility"
                    value={formatVisibility(data.current.visibility, preferences.visibilityUnit)}
                  />
                )}
                {data.daily[0] && (
                  <MetricCard
                    icon="partly-sunny-outline"
                    label="Sunrise / Sunset"
                    value={`${formatHour(data.daily[0].sunrise)} / ${formatHour(data.daily[0].sunset)}`}
                    unit={getDaylightDuration(data.daily[0].sunrise, data.daily[0].sunset)}
                  />
                )}
              </View>

              {/* 7-Day Mini Forecast */}
              <Card>
                <Text style={styles.sectionLabel}>7-DAY FORECAST</Text>
                {dailyItems.map((day) => {
                  const iconName = getWeatherIcon(day.weatherCode, true);
                  return (
                    <TouchableOpacity
                      key={day.date}
                      style={styles.dailyRow}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/forecast?date=${day.date}` as any)}
                      hitSlop={{ top: 4, bottom: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel={`${formatDay(day.date)}, ${getWeatherDescription(day.weatherCode)}, high ${formatTemperature(day.tempMax, preferences.temperatureUnit)}, low ${formatTemperature(day.tempMin, preferences.temperatureUnit)}${day.precipitationProbability != null && day.precipitationProbability > 0 ? `, ${Math.round(day.precipitationProbability)}% precipitation` : ''}`}
                      accessibilityHint="Tap to view detailed forecast"
                    >
                      <Text style={[styles.dailyDay, styles.dailyDayCol]}>{formatDay(day.date)}</Text>
                      <WeatherIcon name={iconName} size={20} />
                      <Text style={styles.dailyPrecipCol}>
                        {day.precipitationProbability != null && day.precipitationProbability > 0
                          ? `${Math.round(day.precipitationProbability)}%`
                          : ''}
                      </Text>
                      <Text style={styles.dailyLow}>
                        {formatTemperature(day.tempMin, preferences.temperatureUnit)}
                      </Text>
                      <View style={styles.dailyRangeTrack}>
                        <View
                          style={[
                            styles.dailyRangeFill,
                            {
                              width: `${getRangeWidth(day, dailyItems)}%`,
                              marginLeft: `${getRangeOffset(day, dailyItems)}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.dailyHigh}>
                        {formatTemperature(day.tempMax, preferences.temperatureUnit)}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </Card>

              {/* Bottom spacer for scroll comfort */}
              <View style={styles.bottomSpacer} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Search Modal */}
      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSelect={handleSearchSelect}
      />
    </View>
  );
}


function getRangeWidth(day: DailyData, allDays: DailyData[]): number {
  if (allDays.length === 0) return 40;
  const allMin = Math.min(...allDays.map((d) => d.tempMin));
  const allMax = Math.max(...allDays.map((d) => d.tempMax));
  const range = allMax - allMin;
  if (range === 0) return 40;
  return Math.max(10, ((day.tempMax - day.tempMin) / range) * 100);
}

function getRangeOffset(day: DailyData, allDays: DailyData[]): number {
  if (allDays.length === 0) return 30;
  const allMin = Math.min(...allDays.map((d) => d.tempMin));
  const allMax = Math.max(...allDays.map((d) => d.tempMax));
  const range = allMax - allMin;
  if (range === 0) return 30;
  return Math.max(0, Math.min(90, ((day.tempMin - allMin) / range) * 100));
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  locationCol: {
    flex: 1,
  },
  locationName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  locationCountry: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section spacing
  section: {
    gap: Spacing.md,
  },
  spacing: {
    height: Spacing.md,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  errorSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  retryBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },

  // Hero
  heroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  heroContent: {
    flex: 1,
  },
  heroTemp: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    lineHeight: Typography.sizes.hero * 1.05,
  },
  heroDetails: {
    marginTop: Spacing.xs,
  },
  heroDesc: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
  },
  heroFeelsLike: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  heroHighLow: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Section label
  sectionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase' as any,
    marginBottom: Spacing.md,
  },

  // Hourly
  hourlyCard: {
    marginTop: Spacing.md,
  },
  hourlyList: {
    gap: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  hourlyItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    minWidth: 64,
    minHeight: 88,
  },
  hourlyItemNow: {
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  hourlyTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  hourlyTemp: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  hourlyPrecip: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryLight,
  },

  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  metricCell: {
    width: '47%',
  },

  // Daily forecast rows
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    minHeight: 44,
  },
  dailyDay: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
  },
  dailyDayCol: {
    width: 72,
  },
  dailyPrecipCol: {
    width: 36,
    fontSize: Typography.sizes.xs,
    color: Colors.primaryLight,
    textAlign: 'right' as any,
  },
  dailyLow: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    width: 32,
    textAlign: 'right' as any,
  },
  dailyHigh: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
    width: 32,
    textAlign: 'left' as any,
  },
  dailyRangeTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.elevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  dailyRangeFill: {
    height: '100%',
    backgroundColor: Colors.primaryLight,
    borderRadius: 2,
  },

  // Bottom spacer
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
