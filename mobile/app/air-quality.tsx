import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import type { AirQualityData } from '@/types/weather';
import { useWeatherStore } from '@/store/weatherStore';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';


function getAqiColor(aqi: number): string {
  if (aqi <= 50) return Colors.success;
  if (aqi <= 100) return Colors.warning;
  if (aqi <= 150) return Colors.orange;
  return Colors.danger;
}

function getAqiLevel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  return 'Very Unhealthy';
}

function getAqiInterpretation(aqi: number): string {
  if (aqi <= 50) return 'Outdoor activities are generally suitable.';
  if (aqi <= 100) return 'Acceptable air quality. Sensitive individuals should be cautious.';
  if (aqi <= 150) return 'Outdoor activities may be uncomfortable for sensitive groups.';
  return 'Reduce outdoor activity. Air quality is potentially hazardous.';
}

function getHealthGuidance(aqi: number): string[] {
  if (aqi <= 50) {
    return [
      'Outdoor activities safe for all groups',
      'No health precautions needed',
      'Air quality is satisfactory and poses little or no risk',
    ];
  }
  if (aqi <= 100) {
    return [
      'Generally safe for outdoor activities',
      'Sensitive individuals should consider reducing prolonged exertion',
      'Monitor symptoms if you have respiratory conditions',
    ];
  }
  if (aqi <= 150) {
    return [
      'Reduce prolonged outdoor exertion',
      'Sensitive groups should limit outdoor exposure',
      'Consider wearing a mask if outdoors for extended periods',
    ];
  }
  return [
    'Avoid prolonged outdoor activity',
    'Sensitive groups should stay indoors if possible',
    'Keep windows closed and use air purifiers',
  ];
}

// WHO guideline thresholds for color coding (μg/m³ except CO which is mg/m³)
const POLLUTANT_THRESHOLDS: Record<string, { good: number; moderate: number; unit: string }> = {
  pm25: { good: 15, moderate: 35, unit: 'μg/m³' },
  pm10: { good: 45, moderate: 100, unit: 'μg/m³' },
  no2: { good: 25, moderate: 75, unit: 'μg/m³' },
  o3: { good: 60, moderate: 120, unit: 'μg/m³' },
  so2: { good: 20, moderate: 75, unit: 'μg/m³' },
  co: { good: 4, moderate: 10, unit: 'mg/m³' },
};

function getPollutantColor(key: string, value: number | null): string {
  if (value === null) return Colors.textMuted;
  const t = POLLUTANT_THRESHOLDS[key];
  if (!t) return Colors.textMuted;
  if (value <= t.good) return Colors.success;
  if (value <= t.moderate) return Colors.warning;
  return Colors.danger;
}

const POLLUTANT_META: { key: keyof AirQualityData; label: string; icon: string }[] = [
  { key: 'pm25', label: 'PM2.5', icon: 'filter-outline' },
  { key: 'pm10', label: 'PM10', icon: 'cloudy-outline' },
  { key: 'no2', label: 'NO₂', icon: 'flask-outline' },
  { key: 'o3', label: 'O₃', icon: 'sunny-outline' },
  { key: 'so2', label: 'SO₂', icon: 'analytics-outline' },
  { key: 'co', label: 'CO', icon: 'fire-outline' },
];


export default function AirQualityScreen() {
  const airQuality = useWeatherStore((s) => s.airQuality);

  const aqiLevel = useMemo(
    () => (airQuality ? getAqiLevel(airQuality.aqi) : ''),
    [airQuality],
  );

  const guidance = useMemo(
    () => (airQuality ? getHealthGuidance(airQuality.aqi) : []),
    [airQuality],
  );

  // AQI bar position (percentage across 0–150+ scale)
  const aqiPercent = useMemo(() => {
    if (!airQuality) return 0;
    return Math.min(100, (airQuality.aqi / 150) * 100);
  }, [airQuality]);


  if (!airQuality) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.headerTitle}>Air Quality</Text>
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No air quality data</Text>
            <Text style={styles.emptySubtitle}>
              Load a location to see air quality information.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }


  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text style={styles.headerTitle}>Air Quality</Text>

          {/* AQI Hero Card */}
          <Card style={styles.heroCard} accessibilityLabel={`Air Quality Index ${airQuality.aqi}, ${aqiLevel}. ${getAqiInterpretation(airQuality.aqi)}`}>
            <Text style={styles.heroLabel}>Air Quality Index</Text>
            <View style={styles.heroRow}>
              <Text style={[styles.heroAqi, { color: getAqiColor(airQuality.aqi) }]}>
                {airQuality.aqi}
              </Text>
              <StatusBadge
                label={aqiLevel}
                color={getAqiColor(airQuality.aqi)}
              />
            </View>
            <Text style={styles.heroInterpretation}>
              {getAqiInterpretation(airQuality.aqi)}
            </Text>

            {/* AQI Scale Bar */}
            <View style={styles.scaleContainer}>
              <View style={styles.scaleTrack}>
                <View style={styles.scaleGradient}>
                  <View style={[styles.scaleSegment, { backgroundColor: Colors.success }]} />
                  <View style={[styles.scaleSegment, { backgroundColor: Colors.warning }]} />
                  <View style={[styles.scaleSegment, { backgroundColor: Colors.orange }]} />
                  <View style={[styles.scaleSegment, { backgroundColor: Colors.danger }]} />
                </View>
                {/* Position indicator */}
                <View
                  style={[
                    styles.scaleIndicator,
                    { left: `${Math.max(2, Math.min(96, aqiPercent))}%` },
                  ]}
                />
              </View>
              <View style={styles.scaleLabels}>
                <Text style={styles.scaleLabelText}>0</Text>
                <Text style={styles.scaleLabelText}>50</Text>
                <Text style={styles.scaleLabelText}>100</Text>
                <Text style={styles.scaleLabelText}>150+</Text>
              </View>
            </View>
          </Card>

          {/* Pollutant Grid */}
          <Text style={styles.sectionLabel}>POLLUTANTS</Text>
          <View style={styles.pollutantGrid}>
            {POLLUTANT_META.map((p) => {
              const value = airQuality[p.key] as number | null;
              const thresholds = POLLUTANT_THRESHOLDS[p.key];
              const color = getPollutantColor(p.key, value);

              return (
                <Card key={p.key} style={styles.pollutantCard}
                  accessibilityLabel={`${p.label}: ${value !== null ? value.toFixed(1) : 'not available'} ${thresholds.unit}`}
                >
                  <View style={styles.pollutantTop}>
                    <Ionicons name={p.icon as any} size={18} color={color} />
                    <Text style={styles.pollutantLabel}>{p.label}</Text>
                  </View>
                  <Text style={[styles.pollutantValue, { color }]}>
                    {value !== null ? value.toFixed(1) : '—'}{' '}
                    <Text style={styles.pollutantUnit}>{thresholds.unit}</Text>
                  </Text>
                  <View style={[styles.pollutantDot, { backgroundColor: color }]} />
                </Card>
              );
            })}
          </View>

          {/* Health Guidance Card */}
          <Text style={styles.sectionLabel}>HEALTH GUIDANCE</Text>
          <Card accessibilityLabel={`Health guidance: ${guidance.join('. ')}`}>
            {guidance.map((item, i) => (
              <View key={i} style={styles.guidanceRow} accessibilityLabel={item} accessibilityRole="text">
                <View style={[styles.guidanceBullet, { backgroundColor: getAqiColor(airQuality.aqi) }]} />
                <Text style={styles.guidanceText}>{item}</Text>
              </View>
            ))}
          </Card>

          {/* Last Updated */}
          <Text style={styles.lastUpdated}>
            Last updated: {new Date(airQuality.lastUpdated).toLocaleString()}
          </Text>

          {/* Bottom spacer */}
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },

  // Header
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },

  // Section label
  sectionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase' as any,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },

  // AQI Hero Card
  heroCard: {
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  heroAqi: {
    fontSize: 72,
    fontWeight: Typography.weights.bold,
    lineHeight: 80,
  },
  heroInterpretation: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: 20,
  },

  // AQI Scale Bar
  scaleContainer: {
    width: '100%',
    marginTop: Spacing.xl,
  },
  scaleTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  scaleGradient: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    height: '100%',
  },
  scaleSegment: {
    flex: 1,
  },
  scaleIndicator: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.text,
    borderWidth: 2,
    borderColor: Colors.bg,
    marginLeft: -8,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  scaleLabelText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },

  // Pollutant Grid
  pollutantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  pollutantCard: {
    width: '47%',
    padding: Spacing.md,
  },
  pollutantTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pollutantLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  pollutantValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.sm,
  },
  pollutantUnit: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.regular,
    color: Colors.textMuted,
  },
  pollutantDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: Spacing.sm,
  },

  // Health Guidance
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  guidanceBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  guidanceText: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },

  // Last Updated
  lastUpdated: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },

  // Bottom spacer
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
