import { getScene, SCENE_COLORS } from '../utils/weatherScene';
import { getWeatherDescription, getWeatherIcon, formatHour, formatDay, getWindDirection, getUvLevel, getAqiLevel, getDaylightDuration } from '../utils/weatherFormatters';
import { convertTemperature, formatTemperature, convertWind, formatWind, convertPressure, formatPressure, convertVisibility, formatVisibility, formatPercent } from '../utils/unitConversion';
import { calculateActivityScores } from '../utils/activityScore';
import type { CurrentWeather, HourlyData, DailyData } from '../types/weather';

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

// Integration: Full weather data flow
function createMockCurrent(overrides: Partial<CurrentWeather> = {}): CurrentWeather {
  return {
    temperature: 22,
    feelsLike: 21,
    humidity: 55,
    windSpeed: 10,
    windDirection: 180,
    windGusts: 15,
    weatherCode: 2,
    pressure: 1015,
    visibility: 15000,
    uvIndex: 5,
    isDay: true,
    precipitation: 0,
    cloudCover: 40,
    ...overrides,
  };
}

function createMockHourly(overrides: Partial<HourlyData> = {}): HourlyData[] {
  const base: HourlyData = {
    time: new Date().toISOString(),
    temperature: 22,
    feelsLike: 21,
    humidity: 55,
    windSpeed: 10,
    windDirection: 180,
    windGusts: 15,
    weatherCode: 2,
    precipitation: 0,
    precipitationProbability: 10,
    visibility: 15000,
    uvIndex: 5,
    cloudCover: 40,
    pressure: 1015,
    isDay: 1,
  };
  return Array.from({ length: 9 }, (_, i) => ({
    ...base,
    time: new Date(Date.now() + i * 3 * 3600000).toISOString(),
    ...overrides,
  }));
}

const mockDaily: DailyData[] = [{
  date: new Date().toISOString().split('T')[0],
  weatherCode: 2,
  tempMax: 26,
  tempMin: 18,
  precipitationProbability: 20,
  precipitationSum: 0.5,
  windSpeedMax: 15,
  windDirectionDominant: 180,
  sunrise: new Date().toISOString(),
  sunset: new Date().toISOString(),
  uvIndexMax: 7,
}];

test('integration: nice weather produces high activity scores', () => {
  const current = createMockCurrent({
    temperature: 22,
    humidity: 55,
    windSpeed: 8,
    precipitation: 0,
    uvIndex: 4,
    visibility: 20000,
    weatherCode: 2,
  });
  const hourly = createMockHourly({
    precipitationProbability: 5,
    temperature: 22,
    windSpeed: 8,
  });

  const scores = calculateActivityScores(current, hourly, mockDaily);
  assert(scores.length === 8, 'Should have 8 activities');

  // Walking and cycling should score very high in nice weather
  const walking = scores.find(a => a.id === 'walking');
  assert(walking !== undefined, 'Walking should exist');
  assert(walking!.score >= 70, `Walking score should be >= 70 in nice weather, got ${walking!.score}`);

  const cycling = scores.find(a => a.id === 'cycling');
  assert(cycling !== undefined, 'Cycling should exist');
  assert(cycling!.score >= 60, `Cycling score should be >= 60 in nice weather, got ${cycling!.score}`);
});

test('integration: stormy weather produces low scores', () => {
  const current = createMockCurrent({
    temperature: 15,
    humidity: 95,
    windSpeed: 45,
    precipitation: 5,
    uvIndex: 0,
    visibility: 2000,
    weatherCode: 95,
  });
  const hourly = createMockHourly({
    precipitationProbability: 80,
    windSpeed: 40,
    temperature: 14,
  });

  const scores = calculateActivityScores(current, hourly, mockDaily);

  // Most activities should score poorly
  const avgScore = scores.reduce((s, a) => s + a.score, 0) / scores.length;
  assert(avgScore < 50, `Average score should be < 50 in stormy weather, got ${avgScore}`);
});

test('integration: weather background scene matches weather code for all conditions', () => {
  // Verify the scene mapping is consistent with weather descriptions
  const clearCodes = [0, 1];
  const cloudyCodes = [2, 3];
  const fogCodes = [45, 48];
  const rainCodes = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82];
  const snowCodes = [71, 73, 75, 77, 85, 86];
  const stormCodes = [95, 96, 99];

  for (const code of clearCodes) {
    const scene = getScene(code, true);
    assert(scene === 'clear-day', `Code ${code} should be clear-day, got ${scene}`);
  }

  for (const code of cloudyCodes) {
    const scene = getScene(code, true);
    assert(scene === 'cloudy', `Code ${code} should be cloudy, got ${scene}`);
  }

  for (const code of fogCodes) {
    const scene = getScene(code, true);
    assert(scene === 'fog', `Code ${code} should be fog, got ${scene}`);
  }

  for (const code of rainCodes) {
    const scene = getScene(code, true);
    assert(scene === 'rain', `Code ${code} should be rain, got ${scene}`);
  }

  for (const code of snowCodes) {
    const scene = getScene(code, true);
    assert(scene === 'snow', `Code ${code} should be snow, got ${scene}`);
  }

  for (const code of stormCodes) {
    const scene = getScene(code, true);
    assert(scene === 'storm', `Code ${code} should be storm, got ${scene}`);
  }
});

test('integration: unit conversion chain produces correct formatted output', () => {
  // Simulate a real-world formatting chain
  const tempC = 25;
  const tempF = convertTemperature(tempC, 'fahrenheit');
  assert(Math.abs(tempF - 77) < 2, `25°C should be ~77°F, got ${tempF}`);
  assertEqual(formatTemperature(tempC, 'celsius'), '25°');
  assertEqual(formatTemperature(tempC, 'fahrenheit'), '77°');

  const windKmh = 50;
  const windMph = convertWind(windKmh, 'mph');
  assert(windMph > 30 && windMph < 32, `50 km/h should be ~31 mph, got ${windMph}`);
  assertEqual(formatWind(windKmh, 'kmh'), '50 km/h');
  assertEqual(formatWind(windKmh, 'mph'), `${windMph} mph`);

  const pressureHpa = 1013;
  const pressureInhg = convertPressure(pressureHpa, 'inhg');
  assert(pressureInhg > 29 && pressureInhg < 30, `1013 hPa should be ~29.9 inHg, got ${pressureInhg}`);

  const visKm = 10;
  const visMi = convertVisibility(visKm, 'mi');
  assert(visMi > 6 && visMi < 7, `10 km should be ~6.2 mi, got ${visMi}`);
  assertEqual(formatVisibility(visKm, 'km'), '10 km');
  assertEqual(formatVisibility(visKm, 'mi'), `${visMi} mi`);

  // Null handling
  assertEqual(formatVisibility(null, 'km'), '-- km');
  assertEqual(formatPercent(null), '--');
  assertEqual(formatPercent(0), '0%');
  assertEqual(formatPercent(100), '100%');
});

test('integration: wind direction + speed display is consistent', () => {
  const degrees = 0;
  assertEqual(getWindDirection(degrees), 'N');
  assertEqual(getWindDirection(45), 'NE');
  assertEqual(getWindDirection(90), 'E');
  assertEqual(getWindDirection(135), 'SE');
  assertEqual(getWindDirection(180), 'S');
  assertEqual(getWindDirection(225), 'SW');
  assertEqual(getWindDirection(270), 'W');
  assertEqual(getWindDirection(315), 'NW');
  assertEqual(getWindDirection(360), 'N');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
