import { convertTemperature, formatTemperature, convertWind, formatWind, convertPressure, formatPressure, convertVisibility, formatVisibility, formatPercent } from '../utils/unitConversion';

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

function assertEqual(actual: any, expected: any, msg?: string) {
  if (actual !== expected) throw new Error(`${msg || ''} Expected ${expected}, got ${actual}`);
}

test('converts 0\u00b0C to 32\u00b0F', () => {
  assertEqual(convertTemperature(0, 'fahrenheit'), 32);
});

test('converts 100\u00b0C to 212\u00b0F', () => {
  assertEqual(convertTemperature(100, 'fahrenheit'), 212);
});

test('keeps celsius as-is', () => {
  assertEqual(convertTemperature(25, 'celsius'), 25);
});

test('formats temperature with degree', () => {
  assertEqual(formatTemperature(22, 'celsius'), '22\u00b0');
  assertEqual(formatTemperature(22, 'fahrenheit'), '72\u00b0');
});

test('converts km/h to mph', () => {
  const mph = convertWind(100, 'mph');
  assert(mph > 60 && mph < 63, `Expected ~62 mph, got ${mph}`);
});

test('formats wind with unit', () => {
  assertEqual(formatWind(10, 'kmh'), '10 km/h');
});

test('converts hPa to inHg', () => {
  const inhg = convertPressure(1013, 'inhg');
  assert(inhg > 29 && inhg < 30, `Expected ~29.9 inHg, got ${inhg}`);
});

test('formats percent', () => {
  assertEqual(formatPercent(75), '75%');
  assertEqual(formatPercent(null), '--');
});

test('formats null visibility', () => {
  assertEqual(formatVisibility(null as any, 'km'), '-- km');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
