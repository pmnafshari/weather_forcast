import { Sun, Moon, Cloud, CloudSun, CloudRain, Snowflake, CloudLightning, CloudFog, CloudDrizzle, CloudRainWind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  'cloud-sun': CloudSun,
  'cloud-rain': CloudRain,
  snowflake: Snowflake,
  'cloud-lightning': CloudLightning,
  'cloud-fog': CloudFog,
  'cloud-drizzle': CloudDrizzle,
  'cloud-rain-wind': CloudRainWind,
};

interface WeatherIconProps {
  code: number;
  isDay?: boolean;
  size?: number;
  className?: string;
}

export function getWeatherIconName(code: number, isDay: boolean): string {
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

export function WeatherIcon({ code, isDay = true, size = 20, className }: WeatherIconProps) {
  const name = getWeatherIconName(code, isDay);
  const Icon = iconMap[name] ?? Cloud;
  const isSun = name === 'sun' || name === 'moon';
  return <Icon size={size} className={`${isSun ? 'text-[#F59E0B]' : 'text-[#94A3B8]'} ${className ?? ''}`} aria-hidden="true" />;
}