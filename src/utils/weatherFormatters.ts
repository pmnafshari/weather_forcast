import type { WeatherCode } from '@/types/weather';
import { format, parseISO } from 'date-fns';

export function getWeatherDescription(code: WeatherCode | number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Dense drizzle',
    56: 'Freezing drizzle',
    57: 'Heavy freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] ?? 'Unknown';
}

export function getWeatherIcon(code: WeatherCode | number, isDay: boolean): string {
  if (!isDay && code <= 1) return 'moon';
  if (code === 0) return 'sun';
  if (code === 1) return isDay ? 'sun' : 'moon';
  if (code === 2) return 'cloud-sun';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'cloud-fog';
  if (code >= 51 && code <= 57) return 'cloud-drizzle';
  if (code >= 61 && code <= 67) return 'cloud-rain';
  if (code >= 71 && code <= 77) return 'snowflake';
  if (code >= 80 && code <= 82) return 'cloud-rain-wind';
  if (code >= 85 && code <= 86) return 'snowflake';
  if (code >= 95) return 'cloud-lightning';
  return 'cloud';
}

export function formatHour(timeStr: string): string {
  try {
    return format(parseISO(timeStr), 'HH:mm');
  } catch {
    return timeStr;
  }
}

export function formatDay(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return 'Today';
    if (format(d, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) return 'Tomorrow';
    return format(d, 'EEEE');
  } catch {
    return dateStr;
  }
}

export function formatShortDay(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    const today = new Date();
    if (format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return 'Today';
    return format(d, 'EEE');
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string): string {
  try {
    return format(parseISO(timeStr), 'HH:mm');
  } catch {
    return timeStr;
  }
}

export function getWindDirection(degrees: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return dirs[index];
}

export function getUvLevel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: 'Low', color: '#22C55E' };
  if (uv <= 5) return { label: 'Moderate', color: '#F59E0B' };
  if (uv <= 7) return { label: 'High', color: '#F97316' };
  if (uv <= 10) return { label: 'Very High', color: '#EF4444' };
  return { label: 'Extreme', color: '#A855F7' };
}

export function getUvRecommendation(uv: number): string {
  if (uv <= 2) return 'Low UV exposure. No protection needed.';
  if (uv <= 5) return 'Moderate UV exposure. Consider sunscreen during prolonged outdoor activity.';
  if (uv <= 7) return 'High UV exposure. Wear sunscreen, hat, and sunglasses.';
  if (uv <= 10) return 'Very high UV. Minimize sun exposure between 10am-4pm.';
  return 'Extreme UV. Avoid outdoor activity during midday hours.';
}

export function getAqiLevel(aqi: number): { label: string; color: string } {
  if (aqi <= 20) return { label: 'Good', color: '#22C55E' };
  if (aqi <= 40) return { label: 'Fair', color: '#84CC16' };
  if (aqi <= 60) return { label: 'Moderate', color: '#F59E0B' };
  if (aqi <= 80) return { label: 'Poor', color: '#F97316' };
  if (aqi <= 100) return { label: 'Very Poor', color: '#EF4444' };
  return { label: 'Extremely Poor', color: '#A855F7' };
}

export function getDaylightDuration(sunrise: string, sunset: string): string {
  try {
    const rise = parseISO(sunrise);
    const set = parseISO(sunset);
    const diffMs = set.getTime() - rise.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  } catch {
    return '--';
  }
}

export function getSunPosition(sunrise: string, sunset: string): number {
  try {
    const now = Date.now();
    const rise = parseISO(sunrise).getTime();
    const set = parseISO(sunset).getTime();
    if (now <= rise) return 0;
    if (now >= set) return 100;
    return Math.round(((now - rise) / (set - rise)) * 100);
  } catch {
    return 0;
  }
}
