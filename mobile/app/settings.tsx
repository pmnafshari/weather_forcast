import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import type { TemperatureUnit, WindUnit, PressureUnit, VisibilityUnit } from '@/types/weather';
import { useWeatherStore } from '@/store/weatherStore';
import { Card } from '@/components/common/Card';


interface ToggleOption {
  label: string;
  value: string;
  accessibilityLabel?: string;
}

function UnitToggle({
  options,
  value,
  onChange,
}: {
  options: ToggleOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.toggleBtn, isActive && styles.toggleBtnActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={opt.accessibilityLabel ?? opt.label}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[styles.toggleBtnText, isActive && styles.toggleBtnTextActive]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingControl}>{children}</View>
    </View>
  );
}


export default function SettingsScreen() {
  const preferences = useWeatherStore((s) => s.preferences);
  const setPreferences = useWeatherStore((s) => s.setPreferences);
  const location = useWeatherStore((s) => s.location);
  const recentLocations = useWeatherStore((s) => s.recentLocations);
  const setLocation = useWeatherStore((s) => s.setLocation);
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access in your device settings to use this feature.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation({
        id: `gps-${pos.coords.latitude.toFixed(4)}-${pos.coords.longitude.toFixed(4)}`,
        name: 'Current Location',
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        countryCode: '',
        country: '',
      });
    } catch (err: any) {
      Alert.alert('Location Error', err.message || 'Failed to get your current location.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text style={styles.headerTitle}>Settings</Text>

          {/* Units Section */}
          <Text style={styles.sectionLabel}>UNITS</Text>
          <Card>
            <SettingRow label="Temperature">
              <UnitToggle
                options={[
                  { label: '°C', value: 'celsius', accessibilityLabel: 'Celsius' },
                  { label: '°F', value: 'fahrenheit', accessibilityLabel: 'Fahrenheit' },
                ]}
                value={preferences.temperatureUnit}
                onChange={(v) => setPreferences({ temperatureUnit: v as TemperatureUnit })}
              />
            </SettingRow>

            <View style={styles.divider} />

            <SettingRow label="Wind">
              <UnitToggle
                options={[
                  { label: 'km/h', value: 'kmh', accessibilityLabel: 'Kilometers per hour' },
                  { label: 'mph', value: 'mph', accessibilityLabel: 'Miles per hour' },
                ]}
                value={preferences.windUnit}
                onChange={(v) => setPreferences({ windUnit: v as WindUnit })}
              />
            </SettingRow>

            <View style={styles.divider} />

            <SettingRow label="Pressure">
              <UnitToggle
                options={[
                  { label: 'hPa', value: 'hpa', accessibilityLabel: 'Hectopascals' },
                  { label: 'inHg', value: 'inhg', accessibilityLabel: 'Inches of mercury' },
                ]}
                value={preferences.pressureUnit}
                onChange={(v) => setPreferences({ pressureUnit: v as PressureUnit })}
              />
            </SettingRow>

            <View style={styles.divider} />

            <SettingRow label="Visibility">
              <UnitToggle
                options={[
                  { label: 'km', value: 'km', accessibilityLabel: 'Kilometers' },
                  { label: 'mi', value: 'mi', accessibilityLabel: 'Miles' },
                ]}
                value={preferences.visibilityUnit}
                onChange={(v) => setPreferences({ visibilityUnit: v as VisibilityUnit })}
              />
            </SettingRow>
          </Card>

          {/* Location Section */}
          <Text style={styles.sectionLabel}>LOCATION</Text>
          <Card>
            {/* Current location */}
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
              <View style={styles.locationTextCol}>
                <Text style={styles.locationLabel}>Current Location</Text>
                <Text style={styles.locationValue}>
                  {location
                    ? `${location.name}${location.admin1 ? `, ${location.admin1}` : ''}, ${location.country}`
                    : 'Not set'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Use current location button */}
            <TouchableOpacity
              style={[styles.gpsBtn, isLocating && { opacity: 0.5 }]}
              onPress={handleUseCurrentLocation}
              activeOpacity={isLocating ? 1 : 0.7}
              accessibilityRole="button"
              accessibilityLabel="Use current location"
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="navigate-outline" size={18} color={Colors.primary} />
              )}
              <Text style={styles.gpsBtnText}>Use Current Location</Text>
            </TouchableOpacity>

            {/* Recent locations */}
            {recentLocations.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.recentLabel}>Recent Locations</Text>
                {recentLocations.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={styles.recentRow}
                    activeOpacity={0.7}
                    onPress={() => setLocation(loc)}
                    accessibilityRole="button"
                    accessibilityLabel={`${loc.name}, ${loc.country}`}
                    accessibilityHint="Tap to select this location"
                  >
                    <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.recentText}>
                      {loc.name}, {loc.country}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </>
            )}
          </Card>

          {/* About Section */}
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <Card>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>App Name</Text>
              <Text style={styles.aboutValue}>Weather Intelligence</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Data Source</Text>
              <Text style={styles.aboutValue}>OpenWeather API</Text>
            </View>
          </Card>

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

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  settingLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
  },
  settingControl: {
    flexShrink: 0,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  toggleBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.elevated,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: Colors.text,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },

  // Location section
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  locationTextCol: {
    flex: 1,
  },
  locationLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  locationValue: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },

  // GPS button
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.elevated,
  },
  gpsBtnText: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
  },

  // Recent locations
  recentLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  recentText: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },

  // About section
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  aboutLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  aboutValue: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
  },

  // Bottom spacer
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
