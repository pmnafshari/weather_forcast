/**
 * Integration tests: full weather data pipeline, scene mapping, and formatter chains.
 * Uses jest with describe/it/expect syntax (no Ionicons needed).
 */
import { getScene, SCENE_COLORS, type Scene } from '../../utils/weatherScene';
import {
  getWeatherDescription,
  getWeatherIcon,
  getWindDirection,
  getUvLevel,
  getAqiLevel,
} from '../../utils/weatherFormatters';
import { formatTemperature, formatWind, formatPercent, formatPressure } from '../../utils/unitConversion';
import { calculateActivityScores } from '../../utils/activityScore';
import type { CurrentWeather, HourlyData, DailyData } from '../../types/weather';

describe('Weather scene mapping', () => {
  const cases: { code: number; day: boolean; expected: Scene }[] = [
    { code: 0, day: true, expected: 'clear-day' },
    { code: 1, day: false, expected: 'clear-night' },
    { code: 2, day: true, expected: 'cloudy' },
    { code: 45, day: true, expected: 'fog' },
    { code: 61, day: true, expected: 'rain' },
    { code: 75, day: true, expected: 'snow' },
    { code: 95, day: true, expected: 'storm' },
  ];

  it.each(cases)('maps code $code (day=$day) to $expected', ({ code, day, expected }) => {
    expect(getScene(code, day)).toBe(expected);
  });

  it('every scene has a valid hex color', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    const scenes: Scene[] = ['clear-day', 'clear-night', 'cloudy', 'rain', 'snow', 'fog', 'storm'];
    for (const scene of scenes) {
      expect(hexRegex.test(SCENE_COLORS[scene])).toBe(true);
    }
  });
});

describe('Weather formatters integration', () => {
  it('weather description matches scene for rain codes', () => {
    const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
    for (const code of rainCodes) {
      const desc = getWeatherDescription(code);
      expect(desc).toBeTruthy();
      expect(getScene(code, true)).toBe('rain');
    }
  });

  it('icon name is returned for every weather code 0-99', () => {
    for (let code = 0; code <= 99; code++) {
      const icon = getWeatherIcon(code, true);
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('string');
    }
  });
});

describe('Full weather data pipeline', () => {
  function createMockCurrent(overrides: Partial<CurrentWeather> = {}): CurrentWeather {
    return {
      temperature: 22, feelsLike: 21, humidity: 55, windSpeed: 10,
      windDirection: 180, windGusts: 15, weatherCode: 2, pressure: 1015,
      visibility: 15000, uvIndex: 5, isDay: true, precipitation: 0, cloudCover: 40,
      ...overrides,
    };
  }

  function createMockHourly(overrides: Partial<HourlyData> = {}): HourlyData[] {
    const base: HourlyData = {
      time: new Date().toISOString(), temperature: 22, feelsLike: 21,
      humidity: 55, windSpeed: 10, windDirection: 180, windGusts: 15,
      weatherCode: 2, precipitation: 0, precipitationProbability: 10,
      visibility: 15000, uvIndex: 5, cloudCover: 40, pressure: 1015, isDay: 1,
    };
    return Array.from({ length: 9 }, (_, i) => ({
      ...base,
      time: new Date(Date.now() + i * 3 * 3600000).toISOString(),
      ...overrides,
    }));
  }

  const mockDaily: DailyData[] = [{
    date: new Date().toISOString().split('T')[0], weatherCode: 2,
    tempMax: 26, tempMin: 18, precipitationProbability: 20, precipitationSum: 0.5,
    windSpeedMax: 15, windDirectionDominant: 180,
    sunrise: new Date().toISOString(), sunset: new Date().toISOString(), uvIndexMax: 7,
  }];

  it('nice weather → high walking score + clear-day scene', () => {
    const current = createMockCurrent({ weatherCode: 0, isDay: true });
    const hourly = createMockHourly({ weatherCode: 0, precipitationProbability: 0 });

    const scores = calculateActivityScores(current, hourly, mockDaily);
    const walking = scores.find(a => a.id === 'walking');
    expect(walking).toBeDefined();
    expect(walking!.score).toBeGreaterThanOrEqual(70);
    expect(getScene(0, true)).toBe('clear-day');
  });

  it('stormy weather → low average score + storm scene', () => {
    const current = createMockCurrent({
      weatherCode: 95, temperature: 15, humidity: 95, windSpeed: 45,
      precipitation: 5, uvIndex: 0, visibility: 2000,
    });
    const hourly = createMockHourly({ weatherCode: 95, precipitationProbability: 80, windSpeed: 40 });

    const scores = calculateActivityScores(current, hourly, mockDaily);
    const avg = scores.reduce((s, a) => s + a.score, 0) / scores.length;
    expect(avg).toBeLessThan(50);
    expect(getScene(95, true)).toBe('storm');
  });

  it('formatting chain produces consistent output', () => {
    expect(formatTemperature(25, 'fahrenheit')).toBe('77°');
    expect(formatTemperature(25, 'celsius')).toBe('25°');
    expect(formatWind(50, 'kmh')).toBe('50 km/h');
    expect(formatWind(50, 'mph')).toContain('mph');
    expect(formatPercent(75)).toBe('75%');
    expect(formatPercent(null)).toBe('--');
    expect(formatPressure(1013, 'hpa')).toContain('hPa');
  });

  it('wind direction compass is correct', () => {
    expect(getWindDirection(0)).toBe('N');
    expect(getWindDirection(90)).toBe('E');
    expect(getWindDirection(180)).toBe('S');
    expect(getWindDirection(270)).toBe('W');
    expect(getWindDirection(360)).toBe('N');
  });

  it('UV and AQI level labels are correct', () => {
    expect(getUvLevel(0).label).toBe('Low');
    expect(getUvLevel(3).label).toBe('Moderate');
    expect(getUvLevel(8).label).toBe('Very High');
    expect(getUvLevel(12).label).toBe('Extreme');
    expect(getAqiLevel(30).label).toBe('Fair');
    expect(getAqiLevel(50).label).toBe('Moderate');
    expect(getAqiLevel(90).label).toBe('Very Poor');
    expect(getAqiLevel(150).label).toBe('Extremely Poor');
  });
});
