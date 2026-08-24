// Simple test runner - can be run with: npx tsx tests/weatherFormatters.test.ts
import { getWeatherDescription, getWeatherIcon, formatHour, formatDay, getWindDirection, getUvLevel, getUvRecommendation, getAqiLevel } from '../utils/weatherFormatters';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (e: any) {
    failed++;
    console.log(`  \u2717 ${name}`);
    console.log(`    ${e.message}`);
  }
}

function assert(condition: boolean, message?: string) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) throw new Error(`${message || ''} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// Weather description tests
test('returns Clear sky for code 0', () => {
  assertEqual(getWeatherDescription(0), 'Clear sky');
});

test('returns Heavy rain for code 65', () => {
  assertEqual(getWeatherDescription(65), 'Heavy rain');
});

test('returns Thunderstorm for code 95', () => {
  assertEqual(getWeatherDescription(95), 'Thunderstorm');
});

test('returns Unknown for invalid code', () => {
  assertEqual(getWeatherDescription(999), 'Unknown');
});

// Weather icon tests
test('returns sun for clear day', () => {
  assertEqual(getWeatherIcon(0, true), 'sun');
});

test('returns moon for clear night', () => {
  assertEqual(getWeatherIcon(0, false), 'moon');
});

test('returns cloud-rain for moderate rain', () => {
  assertEqual(getWeatherIcon(63, true), 'cloud-rain');
});

test('returns snowflake for snow', () => {
  assertEqual(getWeatherIcon(71, true), 'snowflake');
});

// Wind direction tests
test('returns N for 0 degrees', () => {
  assertEqual(getWindDirection(0), 'N');
});

test('returns E for 90 degrees', () => {
  assertEqual(getWindDirection(90), 'E');
});

test('returns SW for 225 degrees', () => {
  assertEqual(getWindDirection(225), 'SW');
});

test('returns NW for 315 degrees', () => {
  assertEqual(getWindDirection(315), 'NW');
});

// UV level tests
test('UV 1 returns Low', () => {
  assertEqual(getUvLevel(1).label, 'Low');
  assertEqual(getUvLevel(1).color, '#22C55E');
});

test('UV 4 returns Moderate', () => {
  assertEqual(getUvLevel(4).label, 'Moderate');
});

test('UV 8 returns Very High', () => {
  assertEqual(getUvLevel(8).label, 'Very High');
});

test('UV 12 returns Extreme', () => {
  assertEqual(getUvLevel(12).label, 'Extreme');
});

// AQI level tests
test('AQI 15 returns Good', () => {
  assertEqual(getAqiLevel(15).label, 'Good');
  assertEqual(getAqiLevel(15).color, '#22C55E');
});

test('AQI 50 returns Moderate', () => {
  assertEqual(getAqiLevel(50).label, 'Moderate');
});

test('AQI 90 returns Very Poor', () => {
  assertEqual(getAqiLevel(90).label, 'Very Poor');
});

test('AQI 110 returns Extremely Poor', () => {
  assertEqual(getAqiLevel(110).label, 'Extremely Poor');
});

// Format hour test
test('formats ISO time to HH:mm', () => {
  const result = formatHour('2024-06-15T14:30:00Z');
  assert(typeof result === 'string' && result.length === 5, `Expected HH:mm format, got ${result}`);
});

// Summary
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
