/**
 * Pure logic for mapping WMO weather codes to animated background scenes.
 * Extracted from WeatherBackground so it can be tested without Reanimated.
 */

export type Scene =
  | 'clear-day'
  | 'clear-night'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'storm';

export const SCENE_COLORS: Record<Scene, string> = {
  'clear-day': '#0B1A30',
  'clear-night': '#050a15',
  'cloudy': '#0B1728',
  'rain': '#070e1a',
  'snow': '#0e1520',
  'fog': '#0B1520',
  'storm': '#08080f',
};

export function getScene(
  weatherCode: number | undefined,
  isDay: boolean | undefined,
): Scene {
  const code = weatherCode ?? 0;
  const day = isDay ?? true;

  if (code <= 1) return day ? 'clear-day' : 'clear-night';
  if (code <= 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'rain';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'storm';

  return day ? 'clear-day' : 'clear-night';
}
