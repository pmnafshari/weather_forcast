import { calculateActivityScores } from '../utils/activityScore';
import type { CurrentWeather, HourlyData, DailyData } from '../types/weather';

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

function assertRange(val: number, min: number, max: number, message?: string) {
  if (val < min || val > max) throw new Error(`${message || ''} ${val} not in [${min}, ${max}]`);
}

const mockCurrent: CurrentWeather = {
  temperature: 22, feelsLike: 22, humidity: 55, windSpeed: 12,
  windDirection: 180, windGusts: null, weatherCode: 2, pressure: 1013,
  visibility: 15000, uvIndex: 4, isDay: true, precipitation: 0, cloudCover: 30,
};

const mockHourly: HourlyData[] = Array.from({ length: 8 }, (_, i) => ({
  time: new Date(Date.now() + i * 3600000).toISOString(),
  temperature: 20 + i, feelsLike: 20 + i, humidity: 50, windSpeed: 10,
  windDirection: 180, windGusts: null, weatherCode: 2,
  precipitation: 0, precipitationProbability: 10, visibility: 15000,
  uvIndex: 4, cloudCover: 30, pressure: 1013, isDay: 1,
}));

const mockDaily: DailyData[] = [{
  date: new Date().toISOString().split('T')[0],
  weatherCode: 2, tempMax: 25, tempMin: 18,
  precipitationProbability: 10, precipitationSum: 0,
  windSpeedMax: 15, windDirectionDominant: 180,
  sunrise: new Date().toISOString(), sunset: new Date().toISOString(),
  uvIndexMax: 5,
}];

test('returns 8 activities', () => {
  const scores = calculateActivityScores(mockCurrent, mockHourly, mockDaily);
  assertEqual(scores.length, 8);
});

test('scores are between 0 and 100', () => {
  const scores = calculateActivityScores(mockCurrent, mockHourly, mockDaily);
  for (const s of scores) {
    assertRange(s.score, 0, 100, `${s.name} score`);
  }
});

test('activities are sorted by score descending', () => {
  const scores = calculateActivityScores(mockCurrent, mockHourly, mockDaily);
  for (let i = 1; i < scores.length; i++) {
    assert(scores[i - 1].score >= scores[i].score, `${scores[i-1].name} (${scores[i-1].score}) >= ${scores[i].name} (${scores[i].score})`);
  }
});

test('each activity has valid status', () => {
  const scores = calculateActivityScores(mockCurrent, mockHourly, mockDaily);
  const validStatuses = ['Excellent', 'Good', 'Fair', 'Poor', 'Unsuitable'];
  for (const s of scores) {
    assert(validStatuses.includes(s.status), `${s.name} has invalid status: ${s.status}`);
  }
});

test('each activity has reasons', () => {
  const scores = calculateActivityScores(mockCurrent, mockHourly, mockDaily);
  for (const s of scores) {
    assert(s.reasons.length > 0, `${s.name} has no reasons`);
  }
});

test('poor weather conditions produce lower scores', () => {
  const badCurrent = { ...mockCurrent, temperature: 2, humidity: 95, windSpeed: 50, precipitation: 15 };
  const badHourly = mockHourly.map(h => ({ ...h, precipitationProbability: 80, temperature: 0, windSpeed: 45 }));
  const scores = calculateActivityScores(badCurrent, badHourly, mockDaily);
  for (const s of scores) {
    assert(s.score < 60, `${s.name} should score < 60 in bad weather, got ${s.score}`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
