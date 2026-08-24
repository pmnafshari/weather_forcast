import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ value, color, height = 6, style }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const fillColor = color ?? Colors.primary;

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedValue}%`,
            backgroundColor: fillColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.elevated,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
