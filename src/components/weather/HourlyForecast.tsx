'use client';

import { useRef, useState, useEffect } from 'react';
import { useWeatherStore } from '@/stores/weatherStore';
import { WeatherIcon } from '@/components/common/WeatherIcon';
import { formatHour } from '@/utils/weatherFormatters';
import { formatTemperature, formatPercent } from '@/utils/unitConversion';

export function HourlyForecast() {
  const { weatherData, preferences } = useWeatherStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => { checkScroll(); }, [weatherData]);

  if (!weatherData) return null;
  const now = new Date();
  const next24h = weatherData.hourly.filter(h => new Date(h.time) >= new Date(now.getTime() - 3600000)).slice(0, 24);

  if (next24h.length === 0) return null;

  return (
    <section className="wi-card" aria-label="Hourly forecast">
      <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-4">Hourly Forecast</h3>
      <div className="relative">
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0F1D31] to-transparent z-10 pointer-events-none" />
        )}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin"
          role="list"
          aria-label="Hourly weather forecast"
        >
          {next24h.map((h, i) => {
            const isNow = i === 0;
            const isDay = h.isDay === 1;
            return (
              <div
                key={h.time}
                role="listitem"
                className={`flex-shrink-0 w-[4.5rem] flex flex-col items-center py-2.5 px-1 rounded-lg transition-colors ${
                  isNow ? 'bg-[#172A43] border border-[#1E3350]' : 'hover:bg-[#13243A]'
                }`}
                aria-label={`${isNow ? 'Now' : formatHour(h.time)}: ${formatTemperature(h.temperature, preferences.temperatureUnit)}, ${getWeatherDescription(h.weatherCode)}`}
              >
                <span className={`text-[11px] mb-1.5 ${isNow ? 'text-[#3B82F6] font-medium' : 'text-[#64748B]'}`}>
                  {isNow ? 'NOW' : formatHour(h.time)}
                </span>
                <WeatherIcon code={h.weatherCode} isDay={isDay} size={18} className="mb-1.5" />
                <span className="text-sm font-medium text-[#F8FAFC] mb-1">
                  {formatTemperature(h.temperature, preferences.temperatureUnit)}
                </span>
                <span className="text-[10px] text-[#64748B]">
                  Rain {formatPercent(h.precipitationProbability)}
                </span>
              </div>
            );
          })}
        </div>
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0F1D31] to-transparent z-10 pointer-events-none" />
        )}
      </div>
    </section>
  );
}

function getWeatherDescription(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Rime fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    61: 'Rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Snow', 73: 'Snow', 75: 'Heavy snow',
    80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 95: 'Thunderstorm',
  };
  return map[code] ?? 'Cloudy';
}
