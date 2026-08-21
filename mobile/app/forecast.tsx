import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import type { HourlyData, DailyData } from '@/types/weather';
import { useWeatherStore } from '@/store/weatherStore';
import { useWeather } from '@/hooks/useWeather';
import {
  getWeatherDescription,
  getWeatherIcon,
  formatHour,
  formatDay,
  getWindDirection,
  getUvLevel,
  getUvRecommendation,
  getSunPosition,
  getDaylightDuration,
} from '@/utils/weatherFormatters';
import {
  formatTemperature,
  formatWind,
  formatPressure,
  formatVisibility,
  formatPercent,
} from '@/utils/unitConversion';
import { calculateActivityScores } from '@/utils/activityScore';
import { Card } from '@/components/common/Card';
import { WeatherIcon } from '@/components/common/WeatherIcon';
import { MetricCard } from '@/components/common/MetricCard';
import { ProgressBar } from '@/components/common/ProgressBar';
import { StatusBadge } from '@/components/common/StatusBadge';


export default function ForecastScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const router = useRouter();
  const dateParam = params.date ?? null;

  const location = useWeatherStore((s) => s.location);
  const weatherData = useWeatherStore((s) => s.weatherData);
  const preferences = useWeatherStore((s) => s.preferences);

  const lat = location?.latitude ?? 51.5074;
  const lon = location?.longitude ?? -0.1278;

  // Fetch latest data (uses stale cache when available)
  const weatherQuery = useWeather(lat, lon);

  // Use fresh data if available, fall back to store
  const data = weatherQuery.data ?? weatherData;

  const isLoading = weatherQuery.isLoading && !weatherData;

  // Find the selected day
  const selectedDay = useMemo<DailyData | null>(() => {
    if (!dateParam || !data?.daily) return null;
    return data.daily.find((d) => d.date === dateParam) ?? null;
  }, [dateParam, data?.daily]);

  // Get hourly data for the selected day
  const dayHourly = useMemo<HourlyData[]>(() => {
    if (!dateParam || !data?.hourly) return [];
    return data.hourly.filter((h) => h.time.startsWith(dateParam));
  }, [dateParam, data?.hourly]);

  // Activity scores for the selected day
  const activityScores = useMemo(() => {
    if (!selectedDay || !data) return [];
    // Build a mock current weather from the day's data
    const mockCurrent = {
      temperature: (selectedDay.tempMax + selectedDay.tempMin) / 2,
      feelsLike: (selectedDay.tempMax + selectedDay.tempMin) / 2,
      humidity: dayHourly.length > 0 ? Math.round(dayHourly.reduce((s, h) => s + h.humidity, 0) / dayHourly.length) : 60,
      windSpeed: selectedDay.windSpeedMax,
      windDirection: selectedDay.windDirectionDominant,
      windGusts: null,
      weatherCode: selectedDay.weatherCode,
      pressure: dayHourly.length > 0 ? dayHourly[0].pressure : 1013,
      visibility: dayHourly.length > 0 ? dayHourly[0].visibility : 10000,
      uvIndex: selectedDay.uvIndexMax,
      isDay: true,
      precipitation: selectedDay.precipitationSum,
      cloudCover: dayHourly.length > 0 ? Math.round(dayHourly.reduce((s, h) => s + h.cloudCover, 0) / dayHourly.length) : 50,
    };
    return calculateActivityScores(mockCurrent, dayHourly, [selectedDay]);
  }, [selectedDay, dayHourly, data]);


  if (isLoading || !data) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Forecast</Text>
            <View style={{ width: 44 }} />
          </View>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }


  if (selectedDay) {
    return <DayDetail day={selectedDay} hourly={dayHourly} activities={activityScores} />;
  }


  return <DayList days={data.daily} />;
}


function DayList({ days }: { days: DailyData[] }) {
  const router = useRouter();
  const preferences = useWeatherStore((s) => s.preferences);

  // Global min/max for range bars
  const allMin = Math.min(...days.map((d) => d.tempMin));
  const allMax = Math.max(...days.map((d) => d.tempMax));
  const range = allMax - allMin || 1;

  const renderItem = useCallback(
    ({ item }: { item: DailyData }) => {
      const iconName = getWeatherIcon(item.weatherCode, true);
      const offset = ((item.tempMin - allMin) / range) * 100;
      const width = ((item.tempMax - item.tempMin) / range) * 100;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push(`/forecast?date=${item.date}` as any)}
          accessibilityRole="button"
          accessibilityLabel={`${formatDay(item.date)}, ${getWeatherDescription(item.weatherCode)}, low ${formatTemperature(item.tempMin, preferences.temperatureUnit)}, high ${formatTemperature(item.tempMax, preferences.temperatureUnit)}`}
          accessibilityHint="Tap to view detailed forecast"
        >
          <Card style={styles.dayListCard}>
            <View style={styles.dayListRow}>
              <Text style={styles.dayListName}>{formatDay(item.date)}</Text>
              <WeatherIcon name={iconName} size={36} />
              <View style={styles.dayListInfo}>
                <Text style={styles.dayListCondition}>
                  {getWeatherDescription(item.weatherCode)}
                </Text>
                <View style={styles.dayListMeta}>
                  {item.precipitationProbability != null && item.precipitationProbability > 0 && (
                    <Text style={styles.dayListPrecip}>
                      {Math.round(item.precipitationProbability)}% precip
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.dayListBottom}>
              <Text style={styles.dayListLow}>
                L: {formatTemperature(item.tempMin, preferences.temperatureUnit)}
              </Text>
              <View style={styles.dayListTrack}>
                <View
                  style={[
                    styles.dayListFill,
                    { width: `${Math.max(8, width)}%`, marginLeft: `${Math.min(90, offset)}%` },
                  ]}
                />
              </View>
              <Text style={styles.dayListHigh}>
                H: {formatTemperature(item.tempMax, preferences.temperatureUnit)}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>
      );
    },
    [allMin, allMax, range, preferences.temperatureUnit],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>7-Day Forecast</Text>
          <View style={{ width: 44 }} />
        </View>

        <FlatList
          data={days}
          keyExtractor={(item) => item.date}
          renderItem={renderItem}
          contentContainerStyle={styles.dayListContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}


function DayDetail({
  day,
  hourly,
  activities,
}: {
  day: DailyData;
  hourly: HourlyData[];
  activities: ReturnType<typeof calculateActivityScores>;
}) {
  const router = useRouter();
  const preferences = useWeatherStore((s) => s.preferences);
  const sunPosition = getSunPosition(day.sunrise, day.sunset);
  const daylight = getDaylightDuration(day.sunrise, day.sunset);
  const uvInfo = day.uvIndexMax != null ? getUvLevel(day.uvIndexMax) : null;
  const uvRec = day.uvIndexMax != null ? getUvRecommendation(day.uvIndexMax) : null;

  // Find max wind gust in hourly
  const maxGust = hourly.length > 0
    ? Math.max(...hourly.map((h) => h.windGusts ?? 0))
    : 0;

  // Average humidity
  const avgHumidity = hourly.length > 0
    ? Math.round(hourly.reduce((s, h) => s + h.humidity, 0) / hourly.length)
    : 0;

  // Total precipitation
  const totalPrecip = hourly.reduce((s, h) => s + h.precipitation, 0);

  // Max precipitation probability
  const maxPrecipProb = hourly.length > 0
    ? Math.max(...hourly.map((h) => h.precipitationProbability ?? 0))
    : 0;

  // Avg visibility
  const avgVis = hourly.length > 0
    ? hourly.reduce((s, h) => s + (h.visibility ?? 0), 0) / hourly.filter((h) => h.visibility != null).length
    : 0;

  // Top 3 activities
  const topActivities = activities.slice(0, 3);

  const statusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return Colors.success;
      case 'Good': return Colors.lime;
      case 'Fair': return Colors.warning;
      case 'Poor': return Colors.orange;
      default: return Colors.danger;
    }
  };

  const renderHourlyItem = useCallback(
    ({ item }: { item: HourlyData }) => {
      const iconName = getWeatherIcon(item.weatherCode, item.isDay === 1);
      const precip = item.precipitationProbability;
      return (
        <View
          style={styles.detailHourlyItem}
          accessibilityLabel={`${formatHour(item.time)}, ${formatTemperature(item.temperature, preferences.temperatureUnit)}, ${getWeatherDescription(item.weatherCode)}${precip != null && precip > 0 ? `, ${Math.round(precip)}% precipitation` : ''}`}
          accessibilityRole="text"
        >
          <Text style={styles.detailHourlyTime}>{formatHour(item.time)}</Text>
          <WeatherIcon name={iconName} size={24} />
          <Text style={styles.detailHourlyTemp}>
            {formatTemperature(item.temperature, preferences.temperatureUnit)}
          </Text>
          {precip != null && precip > 0 && (
            <Text style={styles.detailHourlyPrecip}>{Math.round(precip)}%</Text>
          )}
        </View>
      );
    },
    [preferences.temperatureUnit],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.detailScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{formatDay(day.date)}</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Hero */}
          <View style={styles.detailHero}>
            <WeatherIcon name={getWeatherIcon(day.weatherCode, true)} size={48} />
            <Text style={styles.detailHeroCondition}>
              {getWeatherDescription(day.weatherCode)}
            </Text>
            <View style={styles.detailHeroTemps}>
              <Text style={styles.detailHeroHigh}>
                {formatTemperature(day.tempMax, preferences.temperatureUnit)}
              </Text>
              <Text style={styles.detailHeroSep}>/</Text>
              <Text style={styles.detailHeroLow}>
                {formatTemperature(day.tempMin, preferences.temperatureUnit)}
              </Text>
            </View>
          </View>

          {/* Hourly Forecast */}
          <Card>
            <Text style={styles.sectionLabel}>HOURLY FORECAST</Text>
            {hourly.length > 0 ? (
              <FlatList
                data={hourly}
                keyExtractor={(item, i) => `dh-${i}`}
                renderItem={renderHourlyItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourlyList}
              />
            ) : (
              <Text style={styles.emptyText}>No hourly data available</Text>
            )}
          </Card>

          {/* Detail Metric Cards */}
          <View style={styles.metricsGrid}>
            <MetricCard
              icon="wind"
              label="Wind"
              value={formatWind(day.windSpeedMax, preferences.windUnit)}
              unit={getWindDirection(day.windDirectionDominant)}
            />
            {maxGust > 0 && (
              <MetricCard
                icon="trending-up-outline"
                label="Wind Gusts"
                value={formatWind(maxGust, preferences.windUnit)}
              />
            )}
            <MetricCard
              icon="water-outline"
              label="Humidity"
              value={formatPercent(avgHumidity)}
            />
            <MetricCard
              icon="rainy-outline"
              label="Precipitation"
              value={`${totalPrecip.toFixed(1)} mm`}
              unit={maxPrecipProb > 0 ? `up to ${Math.round(maxPrecipProb)}%` : undefined}
            />
            {uvInfo && (
              <View style={styles.uvCard}>
                <View style={styles.uvHeader}>
                  <Ionicons name="sunny-outline" size={20} color={uvInfo.color} />
                  <Text style={styles.uvValue}>
                    {day.uvIndexMax}{' '}
                    <Text style={[styles.uvLabel, { color: uvInfo.color }]}>
                      {uvInfo.label}
                    </Text>
                  </Text>
                </View>
                <Text style={styles.uvRec}>{uvRec}</Text>
              </View>
            )}
            <Card style={styles.sunCard}>
              <View style={styles.sunRow}>
                <Ionicons name="sunny-outline" size={18} color={Colors.warning} />
                <Text style={styles.sunLabel}>Sunrise</Text>
                <Text style={styles.sunTime}>{formatHour(day.sunrise)}</Text>
              </View>
              <View style={styles.sunRow}>
                <Ionicons name="moon-outline" size={18} color={Colors.orange} />
                <Text style={styles.sunLabel}>Sunset</Text>
                <Text style={styles.sunTime}>{formatHour(day.sunset)}</Text>
              </View>
              <ProgressBar value={sunPosition} color={Colors.warning} height={4} style={styles.sunBar} />
              <Text style={styles.daylightText}>{daylight} daylight</Text>
            </Card>
            {avgVis > 0 && (
              <MetricCard
                icon="eye-outline"
                label="Visibility"
                value={formatVisibility(avgVis, preferences.visibilityUnit)}
              />
            )}
          </View>

          {/* Activity Suitability */}
          {topActivities.length > 0 && (
            <Card>
              <Text style={styles.sectionLabel}>ACTIVITY SUITABILITY</Text>
              {topActivities.map((act) => (
                <View key={act.id} style={styles.activityRow}>
                  <View style={styles.activityInfo}>
                    <Ionicons name={act.icon as any} size={20} color={Colors.textSecondary} />
                    <View style={styles.activityTextCol}>
                      <Text style={styles.activityName}>{act.name}</Text>
                      <Text style={styles.activityScoreText}>
                        Score: {act.score}/100
                      </Text>
                    </View>
                  </View>
                  <StatusBadge label={act.status} color={statusColor(act.status)} />
                </View>
              ))}
            </Card>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Empty
  emptyText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center' as any,
    paddingVertical: Spacing.lg,
  },

  dayListContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  dayListCard: {
    paddingVertical: Spacing.lg,
  },
  dayListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  dayListName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    width: 80,
  },
  dayListInfo: {
    flex: 1,
  },
  dayListCondition: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  dayListMeta: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  dayListPrecip: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryLight,
  },
  dayListBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingLeft: 80 + 36 + Spacing.lg, // align with temp text area
  },
  dayListLow: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    width: 50,
    textAlign: 'right' as any,
  },
  dayListHigh: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
    width: 50,
  },
  dayListTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.elevated,
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },
  dayListFill: {
    height: '100%',
    backgroundColor: Colors.primaryLight,
    borderRadius: 2,
  },

  detailScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Hero
  detailHero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  detailHeroCondition: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  detailHeroTemps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  detailHeroHigh: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  detailHeroSep: {
    fontSize: Typography.sizes.xl,
    color: Colors.textMuted,
    marginHorizontal: Spacing.sm,
  },
  detailHeroLow: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.regular,
    color: Colors.textMuted,
  },

  // Hourly
  hourlyList: {
    gap: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  detailHourlyItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    minWidth: 64,
    minHeight: 88,
    backgroundColor: Colors.elevated,
  },
  detailHourlyTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  detailHourlyTemp: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  detailHourlyPrecip: {
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

  // UV Card
  uvCard: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  uvHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  uvValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  uvLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  uvRec: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },

  // Sun Card
  sunCard: {
    width: '100%',
    marginTop: Spacing.md,
  },
  sunRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  sunLabel: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  sunTime: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  sunBar: {
    marginTop: Spacing.sm,
  },
  daylightText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },

  // Activity rows
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  activityTextCol: {
    flex: 1,
  },
  activityName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  activityScoreText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Bottom spacer
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
