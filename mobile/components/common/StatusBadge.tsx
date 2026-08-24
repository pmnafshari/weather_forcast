import { View, Text, StyleSheet } from 'react-native';
import { Spacing, Radius, Typography } from '@/constants/theme';

interface StatusBadgeProps {
  label: string;
  color: string;
}

export function StatusBadge({ label, color }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: hexToRgba(color, 0.15) }] }>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  // Handle shorthand hex (#RGB)
  let r = 0, g = 0, b = 0;
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  text: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
});
