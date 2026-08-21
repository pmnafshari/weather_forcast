import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface WeatherIconProps {
  name: string;
  size?: number;
  color?: string;
}

const ICON_MAP: Record<string, { ionicon: string; defaultColor: string }> = {
  'sun': { ionicon: 'sunny', defaultColor: '#F59E0B' },
  'moon': { ionicon: 'moon', defaultColor: '#94A3B8' },
  'cloud-sun': { ionicon: 'partly-sunny', defaultColor: '#94A3B8' },
  'cloud': { ionicon: 'cloud', defaultColor: '#94A3B8' },
  'cloud-fog': { ionicon: 'cloudy', defaultColor: '#94A3B8' },
  'cloud-drizzle': { ionicon: 'rainy-outline', defaultColor: '#60A5FA' },
  'cloud-rain': { ionicon: 'rainy', defaultColor: '#3B82F6' },
  'snowflake': { ionicon: 'snow', defaultColor: '#E2E8F0' },
  'cloud-rain-wind': { ionicon: 'thunderstorm', defaultColor: '#F97316' },
  'cloud-lightning': { ionicon: 'flash', defaultColor: '#F59E0B' },
};

const DEFAULT_ENTRY = { ionicon: 'cloud', defaultColor: '#94A3B8' };

export function WeatherIcon({ name, size = 24, color }: WeatherIconProps) {
  const entry = ICON_MAP[name] ?? DEFAULT_ENTRY;
  const resolvedColor = color ?? entry.defaultColor;

  return (
    <View style={styles.container}>
      <Ionicons
        name={entry.ionicon as any}
        size={size}
        color={resolvedColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
