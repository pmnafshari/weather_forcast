'use client';

import { Sunrise, Sunset } from 'lucide-react';
import { useWeatherStore } from '@/stores/weatherStore';
import { formatTime, getDaylightDuration, getSunPosition } from '@/utils/weatherFormatters';
import { EmptyState } from '@/components/common/EmptyState';

export function SunCard() {
  const { weatherData } = useWeatherStore();

  if (!weatherData?.daily[0]) return <EmptyState title="Sun data unavailable" />;

  const today = weatherData.daily[0];
  if (!today.sunrise || !today.sunset) return <EmptyState title="Sun data unavailable" />;

  const daylight = getDaylightDuration(today.sunrise, today.sunset);
  const sunPct = getSunPosition(today.sunrise, today.sunset);

  return (
    <section className="wi-card" aria-label="Sunrise and sunset">
      <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-4">Sun</h3>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
          <div>
            <p className="text-[10px] text-[#64748B] uppercase">Sunrise</p>
            <p className="text-sm font-medium text-[#F8FAFC]">{formatTime(today.sunrise)}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#64748B] uppercase">Daylight</p>
          <p className="text-sm font-medium text-[#F8FAFC]">{daylight}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] text-[#64748B] uppercase">Sunset</p>
            <p className="text-sm font-medium text-[#F8FAFC]">{formatTime(today.sunset)}</p>
          </div>
          <Sunset className="h-4 w-4 text-[#F97316]" aria-hidden="true" />
        </div>
      </div>
      <div className="relative h-8" aria-hidden="true">
        <svg viewBox="0 0 200 40" className="w-full h-full">
          <path d="M 10 35 Q 100 -10 190 35" fill="none" stroke="#1E3350" strokeWidth="1" strokeDasharray="3 2" />
          <circle
            cx={10 + (180 * sunPct / 100)}
            cy={35 - 40 * Math.sin((Math.PI * sunPct) / 100)}
            r="4"
            fill="#F59E0B"
          />
        </svg>
      </div>
    </section>
  );
}
