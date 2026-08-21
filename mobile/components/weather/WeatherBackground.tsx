import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { getScene, SCENE_COLORS } from '@/utils/weatherScene';
export type { Scene } from '@/utils/weatherScene';

export interface WeatherBackgroundProps {
  weatherCode?: number;
  isDay?: boolean;
}

// Deterministic pseudo-random helper (GLSL hash adapted for JS)

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Particle config types

interface CloudConfig {
  index: number;
  top: number;
  duration: number;
  startDelay: number;
}

interface RainConfig {
  index: number;
  x: number;
  delay: number;
  duration: number;
}

interface SnowConfig {
  index: number;
  x: number;
  delay: number;
  duration: number;
  driftAmplitude: number;
  driftDuration: number;
}

interface FogConfig {
  index: number;
  top: number;
  driftDuration: number;
  oscillateAmplitude: number;
  oscillateDuration: number;
}

// Sub-components

/** Twinkling star for the clear-night scene. */
function Star({ index }: { index: number }) {
  const { width, height } = Dimensions.get('window');
  const opacity = useSharedValue(0);

  const position = useMemo(
    () => ({
      x: 20 + seededRandom(index * 7 + 1) * (width - 40),
      y: 30 + seededRandom(index * 13 + 3) * (height * 0.25),
    }),
    [index, width, height],
  );

  const cycleDuration = useMemo(
    () => 2000 + seededRandom(index * 19 + 7) * 3000,
    [index],
  );

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, {
          duration: cycleDuration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.15, {
          duration: cycleDuration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
    );
  }, [cycleDuration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.star, { left: position.x, top: position.y }, animatedStyle]}
    />
  );
}

/** Drifting cloud for the cloudy scene. */
function Cloud({ config }: { config: CloudConfig }) {
  const { width } = Dimensions.get('window');
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      config.startDelay,
      withRepeat(
        withTiming(width + 200, {
          duration: config.duration,
          easing: Easing.linear,
        }),
        -1,
      ),
    );
  }, [width, config.duration, config.startDelay, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.cloud,
        { left: -150, top: config.top },
        animatedStyle,
      ]}
    />
  );
}

/** Single falling rain drop. */
function RainDrop({ config }: { config: RainConfig }) {
  const { height } = Dimensions.get('window');
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(height + 50, {
          duration: config.duration,
          easing: Easing.linear,
        }),
        -1,
      ),
    );
  }, [height, config.delay, config.duration, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.rainDrop,
        { left: config.x, top: -30 },
        animatedStyle,
      ]}
    />
  );
}

/** Single drifting snowflake with sinusoidal horizontal oscillation. */
function SnowFlake({ config }: { config: SnowConfig }) {
  const { height } = Dimensions.get('window');
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Vertical fall
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(height + 30, {
          duration: config.duration,
          easing: Easing.linear,
        }),
        -1,
      ),
    );

    // Horizontal sinusoidal drift
    translateX.value = withRepeat(
      withSequence(
        withTiming(config.driftAmplitude, {
          duration: config.driftDuration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-config.driftAmplitude, {
          duration: config.driftDuration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
    );
  }, [height, config, translateY, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.snowFlake,
        { left: config.x, top: -20 },
        animatedStyle,
      ]}
    />
  );
}

/** Slowly drifting fog layer with slight vertical oscillation. */
function FogLayer({ config }: { config: FogConfig }) {
  const { width } = Dimensions.get('window');
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Horizontal drift
    translateX.value = withRepeat(
      withTiming(width + 250, {
        duration: config.driftDuration,
        easing: Easing.linear,
      }),
      -1,
    );

    // Vertical oscillation
    translateY.value = withRepeat(
      withSequence(
        withTiming(config.oscillateAmplitude, {
          duration: config.oscillateDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-config.oscillateAmplitude, {
          duration: config.oscillateDuration,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
    );
  }, [width, config, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.fogLayer,
        { left: -200, top: config.top },
        animatedStyle,
      ]}
    />
  );
}

/** Occasional lightning flash for the storm scene. */
function LightningFlash() {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 100 }),
        withTiming(0, { duration: 200 }),
        withDelay(3000, withTiming(0)),
      ),
      -1,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.lightning, animatedStyle]} />;
}

// Main component

export function WeatherBackground({ weatherCode, isDay }: WeatherBackgroundProps) {
  const scene = getScene(weatherCode, isDay);
  const bgColor = SCENE_COLORS[scene];
  const { width, height } = Dimensions.get('window');

  // ---- Deterministic particle configs (computed once per mount) ----

  const cloudConfigs = useMemo<CloudConfig[]>(
    () => [
      {
        index: 0,
        top: 40 + seededRandom(1) * 60,
        duration: 15000,
        startDelay: 0,
      },
      {
        index: 1,
        top: 100 + seededRandom(2) * 80,
        duration: 22000,
        startDelay: 3000,
      },
      {
        index: 2,
        top: 160 + seededRandom(3) * 70,
        duration: 18000,
        startDelay: 6000,
      },
    ],
    [],
  );

  const rainConfigs = useMemo<RainConfig[]>(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        index: i,
        x: seededRandom(i * 17 + 3) * width,
        delay: i * 100,
        duration: 600 + seededRandom(i * 23 + 7) * 600,
      })),
    [width],
  );

  const snowConfigs = useMemo<SnowConfig[]>(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        index: i,
        x: seededRandom(i * 31 + 5) * width,
        delay: i * 300,
        duration: 4000 + seededRandom(i * 37 + 11) * 4000,
        driftAmplitude: 10 + seededRandom(i * 41 + 13) * 20,
        driftDuration: 2000 + seededRandom(i * 43 + 17) * 2000,
      })),
    [width],
  );

  const fogConfigs = useMemo<FogConfig[]>(
    () => [
      {
        index: 0,
        top: height * 0.15,
        driftDuration: 28000,
        oscillateAmplitude: 8,
        oscillateDuration: 6000,
      },
      {
        index: 1,
        top: height * 0.4,
        driftDuration: 32000,
        oscillateAmplitude: 12,
        oscillateDuration: 8000,
      },
      {
        index: 2,
        top: height * 0.65,
        driftDuration: 25000,
        oscillateAmplitude: 6,
        oscillateDuration: 5000,
      },
    ],
    [height],
  );

  const stormRainConfigs = useMemo<RainConfig[]>(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        index: i,
        x: seededRandom(i * 53 + 19) * width,
        delay: i * 60,
        duration: 350 + seededRandom(i * 59 + 23) * 350,
      })),
    [width],
  );

  // ---- Render ----

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* clear-day: static background, no particles */}

      {scene === 'clear-night' && (
        <>
          <Star index={0} />
          <Star index={1} />
          <Star index={2} />
          <Star index={3} />
        </>
      )}

      {(scene === 'clear-day' || scene === 'clear-night') && (
        <View style={styles.gradientOverlay} />
      )}

      {scene === 'cloudy' &&
        cloudConfigs.map((c) => <Cloud key={c.index} config={c} />)}

      {scene === 'rain' &&
        rainConfigs.map((c) => <RainDrop key={c.index} config={c} />)}

      {scene === 'snow' &&
        snowConfigs.map((c) => <SnowFlake key={c.index} config={c} />)}

      {scene === 'fog' &&
        fogConfigs.map((c) => <FogLayer key={c.index} config={c} />)}

      {scene === 'storm' && (
        <>
          {stormRainConfigs.map((c) => (
            <RainDrop key={`storm-${c.index}`} config={c} />
          ))}
          <LightningFlash />
        </>
      )}
    </View>
  );
}

// Styles

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  cloud: {
    position: 'absolute',
    width: 160,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  rainDrop: {
    position: 'absolute',
    width: 1.5,
    height: 20,
    backgroundColor: 'rgba(150,180,255,0.4)',
  },
  snowFlake: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  fogLayer: {
    position: 'absolute',
    width: 200,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(200,210,220,0.04)',
  },
  lightning: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'white',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(30, 80, 160, 0.06)',
  },
});
