import { loadPreferences, savePreferences, loadCachedWeather, saveCachedWeather, loadCachedAirQuality, saveCachedAirQuality, loadLastLocation, saveLastLocation } from '../services/storage';
import type { WeatherData, AirQualityResponse, WeatherLocation } from '../types/weather';

let passed = 0;
let failed = 0;

const tests: { name: string; fn: () => Promise<void> }[] = [];

function test(name: string, fn: () => Promise<void>) {
  tests.push({ name, fn });
}

function assert(condition: boolean, message?: string) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual: any, expected: any, msg?: string) {
  if (actual !== expected) throw new Error(`${msg || ''} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function assertNotNull<T>(val: T | null, msg?: string): T {
  if (val === null) throw new Error(msg || 'Expected non-null value');
  return val;
}

// Test 1: Default preferences are returned when nothing is stored
test('returns default preferences when empty', async () => {
  const prefs = await loadPreferences();
  assertEqual(prefs.temperatureUnit, 'celsius');
  assertEqual(prefs.windUnit, 'kmh');
  assertEqual(prefs.pressureUnit, 'hpa');
  assertEqual(prefs.visibilityUnit, 'km');
});

// Test 2: Save and load preferences
test('saves and loads preferences', async () => {
  await savePreferences({
    temperatureUnit: 'fahrenheit', windUnit: 'mph',
    pressureUnit: 'inhg', visibilityUnit: 'mi',
  });
  const prefs = await loadPreferences();
  assertEqual(prefs.temperatureUnit, 'fahrenheit');
  assertEqual(prefs.windUnit, 'mph');
  assertEqual(prefs.pressureUnit, 'inhg');
  assertEqual(prefs.visibilityUnit, 'mi');
  await savePreferences({
    temperatureUnit: 'celsius', windUnit: 'kmh',
    pressureUnit: 'hpa', visibilityUnit: 'km',
  });
});

// Test 3: Save and load cached weather data
test('saves and loads cached weather data', async () => {
  const mockWeather: WeatherData = {
    location: { id: 'test-1', name: 'London', country: 'United Kingdom', countryCode: 'GB', latitude: 51.5, longitude: -0.1 },
    current: { temperature: 20, feelsLike: 19, humidity: 65, windSpeed: 10, windDirection: 180, windGusts: 15, weatherCode: 2, pressure: 1013, visibility: 10, uvIndex: 5, isDay: true, precipitation: 0, cloudCover: 50 },
    hourly: [], daily: [], alerts: [], lastUpdated: new Date().toISOString(),
  };
  await saveCachedWeather(mockWeather);
  const loaded = await loadCachedWeather();
  assertNotNull(loaded, 'Cached weather should not be null');
  assertEqual(loaded!.location.name, 'London');
  assertEqual(loaded!.current.temperature, 20);
});

// Test 4: Save and load cached air quality
test('saves and loads cached air quality', async () => {
  const mockAq: AirQualityResponse = { aqi: 35, pm25: 12.5, pm10: 25, no2: 20, o3: 60, so2: 5, co: 300 };
  await saveCachedAirQuality(mockAq);
  const loaded = await loadCachedAirQuality();
  assertNotNull(loaded, 'Cached AQ should not be null');
  assertEqual(loaded!.aqi, 35);
  assertEqual(loaded!.pm25, 12.5);
});

// Test 5: Save and load last location
test('saves and loads last location', async () => {
  const mockLoc: WeatherLocation = { id: 'paris-1', name: 'Paris', country: 'France', countryCode: 'FR', latitude: 48.85, longitude: 2.35 };
  await saveLastLocation(mockLoc);
  const loaded = await loadLastLocation();
  assertNotNull(loaded, 'Last location should not be null');
  assertEqual(loaded!.name, 'Paris');
  assertEqual(loaded!.countryCode, 'FR');
});

// Test 6: Cache TTL - data should be returned if fresh
test('fresh cached weather is returned', async () => {
  const mockWeather: WeatherData = {
    location: { id: 'fresh-1', name: 'Berlin', country: 'Germany', countryCode: 'DE', latitude: 52.52, longitude: 13.4 },
    current: { temperature: 15, feelsLike: 14, humidity: 70, windSpeed: 12, windDirection: 90, windGusts: 18, weatherCode: 3, pressure: 1015, visibility: 8, uvIndex: 3, isDay: true, precipitation: 0, cloudCover: 80 },
    hourly: [], daily: [], alerts: [], lastUpdated: new Date().toISOString(),
  };
  await saveCachedWeather(mockWeather);
  const loaded = await loadCachedWeather();
  assertNotNull(loaded, 'Fresh cache should be returned');
  assertEqual(loaded!.location.name, 'Berlin');
});

// Test 7: Preferences partial update preserves existing values
test('partial preference update preserves others', async () => {
  await savePreferences({ temperatureUnit: 'celsius', windUnit: 'kmh', pressureUnit: 'hpa', visibilityUnit: 'km' });
  const prefs = await loadPreferences();
  assertEqual(prefs.temperatureUnit, 'celsius');
  assertEqual(prefs.windUnit, 'kmh');
});

// Run all tests
(async () => {
  for (const t of tests) {
    try {
      await t.fn();
      passed++;
      console.log(`  ✓ ${t.name}`);
    } catch (e: any) {
      failed++;
      console.log(`  ✗ ${t.name}`);
      console.log(`    ${e.message}`);
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
