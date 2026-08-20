'use client';

import { useWeatherStore } from '@/stores/weatherStore';
import { formatHour } from '@/utils/weatherFormatters';
import { EmptyState } from '@/components/common/EmptyState';

export function PrecipitationChart() {
  const { weatherData } = useWeatherStore();

  if (!weatherData) return null;
  const now = new Date();
  const next6 = weatherData.hourly
    .filter(h => { const t = new Date(h.time); return t >= now && t <= new Date(now.getTime() + 6 * 3600000); })
    .slice(0, 6);

  if (next6.length === 0) return <EmptyState title="Precipitation data unavailable" />;

  const maxProb = Math.max(...next6.map(h => h.precipitationProbability ?? 0), 1);

  return (
    <section className="wi-card" aria-label="Precipitation forecast">
      <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-4">Precipitation — Next 6 Hours</h3>
      <div className="space-y-2.5">
        {next6.map(h => {
          const prob = h.precipitationProbability ?? 0;
          const isHigh = prob >= 40;
          return (
            <div key={h.time} className="flex items-center gap-3">
              <span className="text-xs text-[#64748B] w-12 flex-shrink-0">{formatHour(h.time)}</span>
              <div className="flex-1 h-2 bg-[#13243A] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-[#3B82F6]' : 'bg-[#1E3350]'}`}
                  style={{ width: `${(prob / 100) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={prob}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <span className={`text-xs w-10 text-right ${isHigh ? 'text-[#F8FAFC] font-medium' : 'text-[#64748B]'}`}>
                {prob}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
