import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, type ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface SkeletonCardProps {
  height?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ height = 80, style }: SkeletonCardProps) {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerValue]);

  const shimmerOpacity = shimmerValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <View style={[styles.card, { height }, style]}>
      <Animated.View style={[styles.line1, { opacity: shimmerOpacity }]} />
      <Animated.View style={[styles.line2, { opacity: shimmerOpacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.elevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    justifyContent: 'center',
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  line1: {
    width: '60%',
    height: 14,
    backgroundColor: Colors.border,
    borderRadius: 4,
  },
  line2: {
    width: '40%',
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: 4,
  },
});