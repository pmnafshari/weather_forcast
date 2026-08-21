/**
 * Component logic tests — pure functions extracted from UI components.
 * Uses the tsx test runner (same as other tests in this project).
 *
 * These test the logic that powers the components without needing React Native rendering.
 */

// StatusBadge hexToRgba logic
function hexToRgba(hex: string, alpha: number): string {
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

// ProgressBar clamping logic
function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

// WeatherIcon icon mapping logic
const ICON_MAP: Record<string, { ionicon: string }> = {
  'sun': { ionicon: 'sunny' },
  'moon': { ionicon: 'moon' },
  'cloud-sun': { ionicon: 'partly-sunny' },
  'cloud': { ionicon: 'cloud' },
  'cloud-fog': { ionicon: 'cloudy' },
  'cloud-drizzle': { ionicon: 'rainy-outline' },
  'cloud-rain': { ionicon: 'rainy' },
  'snowflake': { ionicon: 'snow' },
  'cloud-rain-wind': { ionicon: 'thunderstorm' },
  'cloud-lightning': { ionicon: 'flash' },
};

function resolveIcon(name: string): string {
  return ICON_MAP[name]?.ionicon ?? 'cloud';
}

// MetricCard accessibility label logic
function metricCardLabel(label: string, value: string, unit?: string): string {
  return `${label}: ${value}${unit ? ` ${unit}` : ''}`;
}

// Test framework
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e: any) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

function assert(condition: boolean, message?: string) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual: any, expected: any, msg?: string) {
  if (actual !== expected) throw new Error(`${msg || ''} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// hexToRgba tests
test('converts #ff0000 with alpha 0.15', () => {
  assertEqual(hexToRgba('#ff0000', 0.15), 'rgba(255, 0, 0, 0.15)');
});

test('converts #4ade80 with alpha 0.15', () => {
  assertEqual(hexToRgba('#4ade80', 0.15), 'rgba(74, 222, 128, 0.15)');
});

test('converts 3-digit hex #f00 with alpha 1', () => {
  assertEqual(hexToRgba('#f00', 1), 'rgba(255, 0, 0, 1)');
});

test('converts #000000 with alpha 0', () => {
  assertEqual(hexToRgba('#000000', 0), 'rgba(0, 0, 0, 0)');
});

test('converts white #ffffff with alpha 0.5', () => {
  assertEqual(hexToRgba('#ffffff', 0.5), 'rgba(255, 255, 255, 0.5)');
});

// ProgressBar clamping tests
test('clamps 75 to 75', () => {
  assertEqual(clampPercent(75), 75);
});

test('clamps 0 to 0', () => {
  assertEqual(clampPercent(0), 0);
});

test('clamps 100 to 100', () => {
  assertEqual(clampPercent(100), 100);
});

test('clamps -10 to 0', () => {
  assertEqual(clampPercent(-10), 0);
});

test('clamps 200 to 100', () => {
  assertEqual(clampPercent(200), 100);
});

test('clamps 0.5 to 0.5', () => {
  assertEqual(clampPercent(0.5), 0.5);
});

// WeatherIcon mapping tests
test('maps sun to sunny icon', () => {
  assertEqual(resolveIcon('sun'), 'sunny');
});

test('maps cloud-rain to rainy icon', () => {
  assertEqual(resolveIcon('cloud-rain'), 'rainy');
});

test('maps snowflake to snow icon', () => {
  assertEqual(resolveIcon('snowflake'), 'snow');
});

test('maps cloud-lightning to flash icon', () => {
  assertEqual(resolveIcon('cloud-lightning'), 'flash');
});

test('falls back to cloud for unknown icon', () => {
  assertEqual(resolveIcon('unknown-icon'), 'cloud');
});

test('all defined icons have non-empty ionicon names', () => {
  for (const [key, val] of Object.entries(ICON_MAP)) {
    assert(val.ionicon.length > 0, `${key} should have a non-empty ionicon name`);
  }
});

// MetricCard accessibility label tests
test('label without unit', () => {
  assertEqual(metricCardLabel('Wind', '10 km/h'), 'Wind: 10 km/h');
});

test('label with unit', () => {
  assertEqual(metricCardLabel('UV Index', '5', 'Moderate'), 'UV Index: 5 Moderate');
});

test('label with empty unit', () => {
  assertEqual(metricCardLabel('Humidity', '75%', ''), 'Humidity: 75%');
});

test('label with undefined unit', () => {
  assertEqual(metricCardLabel('Pressure', '1013 hPa', undefined), 'Pressure: 1013 hPa');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
