import { getScene, SCENE_COLORS, type Scene } from '../utils/weatherScene';

// Unit tests for getScene mapping
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

// Clear sky tests
test('clear day maps to clear-day scene', () => {
  assertEqual(getScene(0, true), 'clear-day');
});

test('mainly clear day maps to clear-day scene', () => {
  assertEqual(getScene(1, true), 'clear-day');
});

test('clear night maps to clear-night scene', () => {
  assertEqual(getScene(0, false), 'clear-night');
});

test('mainly clear night maps to clear-night scene', () => {
  assertEqual(getScene(1, false), 'clear-night');
});

// Cloud tests
test('partly cloudy maps to cloudy', () => {
  assertEqual(getScene(2, true), 'cloudy');
});

test('overcast maps to cloudy', () => {
  assertEqual(getScene(3, true), 'cloudy');
});

// Fog tests
test('fog maps to fog', () => {
  assertEqual(getScene(45, true), 'fog');
});

test('rime fog maps to fog', () => {
  assertEqual(getScene(48, true), 'fog');
});

// Rain tests
test('drizzle maps to rain', () => {
  assertEqual(getScene(53, true), 'rain');
});

test('moderate rain maps to rain', () => {
  assertEqual(getScene(63, true), 'rain');
});

test('heavy rain maps to rain', () => {
  assertEqual(getScene(65, true), 'rain');
});

test('freezing rain maps to rain', () => {
  assertEqual(getScene(66, true), 'rain');
});

test('rain showers map to rain', () => {
  assertEqual(getScene(80, true), 'rain');
  assertEqual(getScene(81, true), 'rain');
  assertEqual(getScene(82, true), 'rain');
});

// Snow tests
test('slight snow maps to snow', () => {
  assertEqual(getScene(71, true), 'snow');
});

test('heavy snow maps to snow', () => {
  assertEqual(getScene(75, true), 'snow');
});

test('snow grains map to snow', () => {
  assertEqual(getScene(77, true), 'snow');
});

test('snow showers map to snow', () => {
  assertEqual(getScene(85, true), 'snow');
  assertEqual(getScene(86, true), 'snow');
});

// Storm tests
test('thunderstorm maps to storm', () => {
  assertEqual(getScene(95, true), 'storm');
});

test('thunderstorm with hail maps to storm', () => {
  assertEqual(getScene(96, true), 'storm');
  assertEqual(getScene(99, true), 'storm');
});

// Edge cases
test('undefined weatherCode defaults to clear-day', () => {
  assertEqual(getScene(undefined, true), 'clear-day');
});

test('undefined isDay defaults to clear-day', () => {
  assertEqual(getScene(0, undefined), 'clear-day');
});

test('all 7 scene colors are valid hex', () => {
  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  for (const [scene, color] of Object.entries(SCENE_COLORS)) {
    assert(hexRegex.test(color), `${scene} color ${color} is not a valid hex color`);
  }
});

test('all 7 scenes have different colors', () => {
  const colors = new Set(Object.values(SCENE_COLORS));
  assertEqual(colors.size, 7, 'All scenes should have unique colors');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
