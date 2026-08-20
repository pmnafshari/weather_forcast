'use client';

import { useWeatherStore } from '@/stores/weatherStore';
import { getAqiLevel } from '@/utils/weatherFormatters';
import { EmptyState } from '@/components/common/EmptyState';

interface PollutantItem {
  label: string;
  value: number | null;
  unit: string;
}

export function AirQualityCard({ detailed = false }: { detailed?: boolean }) {
  const { airQuality, isAirQualityLoading } = useWeatherStore();

  if (isAirQualityLoading) {
    return (
      <div className={detailed ? 'space-y-4' : ''}>
        <section className="wi-card">
          <div className="skeleton-shimmer h-4 w-32 rounded mb-3" />
          <div className="skeleton-shimmer h-16 w-24 rounded mb-3" />
          <div className="skeleton-shimmer h-4 w-full rounded" />
        </section>
      </div>
    );
  }

  if (!airQuality) return <EmptyState title="Air quality data unavailable" message="Not provided by the weather service." />;

  const { label, color } = getAqiLevel(airQuality.aqi);

  const pollutants: PollutantItem[] = [
    { label: 'PM2.5', value: airQuality.pm25, unit: 'µg/m³' },
    { label: 'PM10', value: airQuality.pm10, unit: 'µg/m³' },
    { label: 'NO₂', value: airQuality.no2, unit: 'µg/m³' },
    { label: 'O₃', value: airQuality.o3, unit: 'µg/m³' },
    { label: 'SO₂', value: airQuality.so2, unit: 'µg/m³' },
    { label: 'CO', value: airQuality.co, unit: 'µg/m³' },
  ].filter(p => p.value !== null);

  return (
    <div className={detailed ? 'space-y-4' : ''}>
      <section className="wi-card" aria-label="Air quality index">
        <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-3">Air Quality</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-light text-[#F8FAFC]">{airQuality.aqi}</span>
            <span className="text-xs font-medium mt-0.5" style={{ color }}>{label}</span>
          </div>
          <div className="flex-1">
            <div className="h-2 rounded-full overflow-hidden bg-gradient-to-r from-[#22C55E] via-[#F59E0B] to-[#EF4444] relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 shadow-lg"
                style={{ left: `calc(${Math.min(airQuality.aqi / 150, 1) * 100}% - 5px)`, borderColor: color }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>

      {detailed && pollutants.length > 0 && (
        <section className="wi-card" aria-label="Pollutant levels">
          <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-4">Pollutants</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pollutants.map(p => (
              <div key={p.label} className="p-3 bg-[#13243A] rounded-lg">
                <p className="text-[10px] text-[#64748B] uppercase tracking-wide">{p.label}</p>
                <p className="text-lg font-light text-[#F8FAFC] mt-0.5">{Math.round(p.value!)}</p>
                <p className="text-[10px] text-[#64748B]">{p.unit}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!detailed && pollutants.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {pollutants.slice(0, 4).map(p => (
            <span key={p.label} className="text-[11px] text-[#64748B] bg-[#13243A] px-2 py-0.5 rounded">
              {p.label}: <span className="text-[#F8FAFC]">{Math.round(p.value!)} {p.unit}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}