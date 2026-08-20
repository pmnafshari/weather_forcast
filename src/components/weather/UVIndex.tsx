'use client';

import { useWeatherStore } from '@/stores/weatherStore';
import { getUvLevel, getUvRecommendation } from '@/utils/weatherFormatters';
import { EmptyState } from '@/components/common/EmptyState';

export function UVIndexCard() {
  const { weatherData } = useWeatherStore();

  if (!weatherData) return null;
  
  // Try to get current UV from hourly data (current hour)
  const now = new Date();
  const currentHour = weatherData.hourly.find(h => {
    const t = new Date(h.time);
    return Math.abs(t.getTime() - now.getTime()) < 1800000; // within 30 min
  });
  const uv = currentHour?.uvIndex ?? null;
  const maxUv = weatherData.daily[0]?.uvIndexMax ?? null;
  const displayUv = uv ?? maxUv;

  if (displayUv === null) return <EmptyState title="UV data unavailable" />;

  const { label, color } = getUvLevel(displayUv);
  const recommendation = getUvRecommendation(displayUv);
  const pct = Math.min((displayUv / 12) * 100, 100);

  return (
    <section className="wi-card" aria-label="UV Index">
      <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-3">UV Index</h3>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-4xl font-light text-[#F8FAFC]">{Math.round(displayUv)}</span>
        <div>
          <span className="text-sm font-medium" style={{ color }}>{label}</span>
          {maxUv !== null && uv === null && (
            <p className="text-[10px] text-[#64748B]">Today&apos;s max</p>
          )}
        </div>
      </div>
      <div className="mb-3">
        <div className="uv-scale w-full relative">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 shadow-lg"
            style={{ left: `calc(${pct}% - 5px)`, borderColor: color }}
            aria-hidden="true"
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {['Low', 'Moderate', 'High', 'Very High', 'Extreme'].map(l => (
            <span key={l} className="text-[9px] text-[#64748B]">{l}</span>
          ))}
        </div>
      </div>
      <p className="text-xs text-[#94A3B8] leading-relaxed">{recommendation}</p>
    </section>
  );
}
