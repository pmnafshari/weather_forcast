'use client';

import { useWeatherStore } from '@/stores/weatherStore';
import { getWindDirection } from '@/utils/weatherFormatters';
import { formatWind } from '@/utils/unitConversion';
import { Compass } from 'lucide-react';

export function WindCard() {
  const { weatherData, preferences } = useWeatherStore();

  if (!weatherData) return null;
  const { current } = weatherData;

  const dir = getWindDirection(current.windDirection);
  const deg = current.windDirection;

  return (
    <section className="wi-card" aria-label="Wind information">
      <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-4">Wind</h3>
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0" aria-hidden="true">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1E3350" strokeWidth="1" />
            <circle cx="50" cy="50" r="2" fill="#3B82F6" />
            {['N', 'E', 'S', 'W'].map((l, i) => {
              const angle = i * 90 - 90;
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 38 * Math.cos(rad);
              const y = 50 + 38 * Math.sin(rad);
              return (
                <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="#64748B" fontSize="8" fontWeight="500">
                  {l}
                </text>
              );
            })}
            {['NE', 'SE', 'SW', 'NW'].map((l, i) => {
              const angle = i * 90 + 45 - 90;
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 38 * Math.cos(rad);
              const y = 50 + 38 * Math.sin(rad);
              return (
                <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="#1E3350" fontSize="6">
                  {l}
                </text>
              );
            })}
            <g transform={`rotate(${deg}, 50, 50)`}>
              <line x1="50" y1="50" x2="50" y2="14" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
              <line x1="50" y1="50" x2="50" y2="86" stroke="#1E3350" strokeWidth="1" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-2xl font-light text-[#F8FAFC]">{formatWind(current.windSpeed, preferences.windUnit)}</p>
            <p className="text-sm text-[#94A3B8]">{dir} ({Math.round(deg)}°)</p>
          </div>
          {current.windGusts != null && (
            <div>
              <p className="text-[11px] text-[#64748B] uppercase tracking-wide">Gusts</p>
              <p className="text-sm font-medium text-[#F8FAFC]">{formatWind(current.windGusts, preferences.windUnit)}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
