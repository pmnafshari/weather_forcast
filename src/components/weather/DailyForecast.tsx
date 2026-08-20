'use client';

import { useWeatherStore } from '@/stores/weatherStore';
import { WeatherIcon } from '@/components/common/WeatherIcon';
import { formatDay, getWeatherDescription } from '@/utils/weatherFormatters';
import { formatTemperature, formatPercent } from '@/utils/unitConversion';

export function DailyForecast() {
  const { weatherData, preferences } = useWeatherStore();

  if (!weatherData) return null;
  const { daily } = weatherData;
  if (!daily || daily.length === 0) return null;

  // Find the overall min/max for the bar range
  const allMin = Math.min(...daily.map(d => d.tempMin));
  const allMax = Math.max(...daily.map(d => d.tempMax));
  const range = allMax - allMin || 1;

  return (
    <section className="wi-card" aria-label="7-day forecast">
      <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-4">7-Day Forecast</h3>
      <div className="space-y-0" role="list">
        {daily.map((day, i) => {
          const lowPct = ((day.tempMin - allMin) / range) * 100;
          const highPct = ((day.tempMax - allMin) / range) * 100;
          return (
            <div
              key={day.date}
              role="listitem"
              className={`flex items-center justify-between py-2.5 ${i < daily.length - 1 ? 'border-b border-[#1E3350]/50' : ''}`}
            >
              <span className="w-24 text-sm text-[#F8FAFC] flex-shrink-0">{formatDay(day.date)}</span>
              <div className="flex items-center gap-2.5 flex-1 mx-3">
                <span className="text-[11px] text-[#64748B] w-10 hidden sm:block">{formatPercent(day.precipitationProbability)}</span>
                <WeatherIcon code={day.weatherCode} isDay={true} size={18} className="flex-shrink-0" />
                <span className="text-xs text-[#94A3B8] hidden md:block w-28 truncate">{getWeatherDescription(day.weatherCode)}</span>
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-xs text-[#64748B] w-8 text-right">{formatTemperature(day.tempMin, preferences.temperatureUnit)}</span>
                  <div className="flex-1 h-1 bg-[#13243A] rounded-full relative max-w-[120px]">
                    <div
                      className="absolute h-full rounded-full"
                      style={{
                        left: `${lowPct}%`,
                        width: `${Math.max(highPct - lowPct, 4)}%`,
                        background: 'linear-gradient(to right, #3B82F6, #60A5FA)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-[#F8FAFC] w-8">{formatTemperature(day.tempMax, preferences.temperatureUnit)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}