'use client';

import { Droplets, Wind, Eye, Gauge, RefreshCw } from 'lucide-react';
import { useWeatherStore } from '@/stores/weatherStore';
import { WeatherIcon } from '@/components/common/WeatherIcon';
import { getWeatherDescription } from '@/utils/weatherFormatters';
import { formatTemperature, formatWind, formatPressure, formatVisibility } from '@/utils/unitConversion';

export function CurrentWeather() {
  const { weatherData, location, preferences, isLoading, error, lastFetched } = useWeatherStore();

  if (error && !weatherData) return null;
  if (!weatherData || !location) return null;

  const { current, daily } = weatherData;
  const today = daily[0];

  return (
    <section className="wi-card" aria-label="Current weather">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-[#F8FAFC]">{location.name}{location.admin1 ? `, ${location.admin1}` : ''}, {location.country}</h2>
          </div>
          <p className="text-xs text-[#64748B] mb-4">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {lastFetched && (
              <span className="ml-2 inline-flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22C55E]" aria-hidden="true" />
                Updated {new Date(lastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('wi:refresh'))}
                  disabled={isLoading}
                  className="ml-1 p-0.5 text-[#64748B] hover:text-[#F8FAFC] rounded transition-colors disabled:opacity-50"
                  aria-label="Refresh weather data"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </span>
            )}
          </p>

          <div className="flex items-end gap-3 mb-1">
            <span className="text-6xl font-light text-[#F8FAFC] leading-none">
              {formatTemperature(current.temperature, preferences.temperatureUnit)}
            </span>
            <div className="pb-2">
              <WeatherIcon code={current.weatherCode} isDay={current.isDay} size={40} />
            </div>
          </div>

          <p className="text-sm text-[#94A3B8] mb-1">{getWeatherDescription(current.weatherCode)}</p>
          <p className="text-xs text-[#64748B]">
            Feels like {formatTemperature(current.feelsLike, preferences.temperatureUnit)}
            {today && (
              <span className="ml-3">
                H: {formatTemperature(today.tempMax, preferences.temperatureUnit)}{' '}
                L: {formatTemperature(today.tempMin, preferences.temperatureUnit)}
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
          <MetricItem icon={Droplets} label="Humidity" value={`${current.humidity}%`} />
          <MetricItem icon={Wind} label="Wind" value={formatWind(current.windSpeed, preferences.windUnit)} />
          <MetricItem icon={Gauge} label="Pressure" value={formatPressure(current.pressure, preferences.pressureUnit)} />
          <MetricItem icon={Eye} label="Visibility" value={current.visibility != null ? formatVisibility(current.visibility, preferences.visibilityUnit) : '--'} />
        </div>
      </div>
    </section>
  );
}

function MetricItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[#64748B]">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-sm font-medium text-[#F8FAFC]">{value}</span>
    </div>
  );
}
