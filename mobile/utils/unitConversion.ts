import type {
  TemperatureUnit,
  WindUnit,
  PressureUnit,
  VisibilityUnit,
} from '@/types/weather';

export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  if (unit === 'fahrenheit') return Math.round(celsius * 9 / 5 + 32);
  return Math.round(celsius);
}

export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
  return `${convertTemperature(celsius, unit)}°`;
}

export function convertWind(kmh: number, unit: WindUnit): number {
  if (unit === 'mph') return Math.round(kmh * 0.621371);
  return Math.round(kmh);
}

export function formatWind(kmh: number, unit: WindUnit): string {
  return `${convertWind(kmh, unit)} ${unit === 'mph' ? 'mph' : 'km/h'}`;
}

export function convertPressure(hpa: number, unit: PressureUnit): number {
  if (unit === 'inhg') return Math.round(hpa * 0.02953 * 100) / 100;
  return Math.round(hpa);
}

export function formatPressure(hpa: number, unit: PressureUnit): string {
  if (unit === 'inhg') return `${convertPressure(hpa, unit)} inHg`;
  return `${convertPressure(hpa, unit)} hPa`;
}

export function convertVisibility(km: number, unit: VisibilityUnit): number {
  if (unit === 'mi') return Math.round(km * 0.621371 * 10) / 10;
  return Math.round(km);
}

export function formatVisibility(km: number | null, unit: VisibilityUnit): string {
  if (km === null || km === undefined) return `-- ${unit === 'mi' ? 'mi' : 'km'}`;
  if (unit === 'mi') return `${convertVisibility(km, unit)} mi`;
  return `${convertVisibility(km, unit)} km`;
}

export function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return '--';
  return `${Math.round(value)}%`;
}
