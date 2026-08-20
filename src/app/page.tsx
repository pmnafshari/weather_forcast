'use client';

import { useCallback, useEffect, useRef } from 'react';
import { RefreshCw, MapPin, CloudSun, FlaskConical } from 'lucide-react';
import { useWeatherStore } from '@/stores/weatherStore';
import { Header } from '@/components/layout/Header';
import { LocationSearch } from '@/components/location/LocationSearch';
import { CurrentWeather } from '@/components/weather/CurrentWeather';
import { HourlyForecast } from '@/components/weather/HourlyForecast';
import { DailyForecast } from '@/components/weather/DailyForecast';
import { PrecipitationChart } from '@/components/weather/PrecipitationChart';
import { UVIndexCard } from '@/components/weather/UVIndex';
import { WindCard } from '@/components/weather/WindCard';
import { SunCard } from '@/components/weather/SunCard';
import { WeatherAlerts } from '@/components/weather/WeatherAlerts';
import { WeatherBackground } from '@/components/weather/WeatherBackground';
import { ActivityScore } from '@/components/activities/ActivityScore';
import { AirQualityCard } from '@/components/air-quality/AirQualityCard';
import { ErrorState } from '@/components/common/ErrorState';
import { SkeletonHeroCard, SkeletonHourly, SkeletonDaily, SkeletonCard } from '@/components/common/SkeletonCard';
import { EmptyState } from '@/components/common/EmptyState';
import type { WeatherLocation, AirQualityData } from '@/types/weather';

export default function Home() {
  const store = useWeatherStore();
  const {
    weatherData, airQuality, location, isLoading, isAirQualityLoading, error,
    setWeatherData, setAirQuality, setLocation, setActiveView, setLoading, setAirQualityLoading, setError, addRecentLocation, setMockData,
  } = store;

  const fetchRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (lat: number, lon: number, locName?: string, locCountry?: string) => {
    if (fetchRef.current) fetchRef.current.abort();
    fetchRef.current = new AbortController();

    setLoading(true);
    setAirQualityLoading(true);
    setError(null);

    try {
      const nameParam = locName ? `&name=${encodeURIComponent(locName)}` : '';
      const countryParam = locCountry ? `&country=${encodeURIComponent(locCountry)}` : '';
      const [weatherRes, aqRes] = await Promise.all([
        fetch(`/api/weather?lat=${lat}&lon=${lon}${nameParam}${countryParam}`, { signal: fetchRef.current.signal }),
        fetch(`/api/air-quality?lat=${lat}&lon=${lon}`, { signal: fetchRef.current.signal }).catch(() => null),
      ]);

      if (!weatherRes.ok) {
        const errBody = await weatherRes.json().catch(() => null);
        const msg = errBody?.error || 'Failed to fetch weather data';
        throw new Error(msg);
      }
      const weather = await weatherRes.json();
      const isMock = !!weather._isMock;

      // Merge location name into weather data
      weather.location.name = locName || weather.location.name || location?.name || '';
      weather.location.country = locCountry || weather.location.country || location?.country || '';

      setWeatherData(weather);
      setMockData(isMock);
      setLocation(weather.location);
      addRecentLocation(weather.location);
      setActiveView('overview');

      // Air quality (may fail - return 200 with error field)
      if (aqRes && aqRes.ok) {
        const aqBody: AirQualityData | { error: string } = await aqRes.json();
        if ('aqi' in aqBody) {
          const { getAqiLevel } = await import('@/utils/weatherFormatters');
          aqBody.aqiLevel = getAqiLevel(aqBody.aqi).label;
          setAirQuality(aqBody);
        } else {
          setAirQuality(null);
        }
      } else {
        setAirQuality(null);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unable to load weather data.');
    } finally {
      setLoading(false);
      setAirQualityLoading(false);
    }
  }, [location, setWeatherData, setAirQuality, setLocation, setActiveView, setLoading, setAirQualityLoading, setError, addRecentLocation, setMockData]);

  // Listen for location select events from LocationSearch
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<WeatherLocation>;
      const loc = ce.detail;
      fetchData(loc.latitude, loc.longitude, loc.name, loc.country);
    };
    window.addEventListener('wi:location-select', handler);
    return () => window.removeEventListener('wi:location-select', handler);
  }, [fetchData]);

  // Listen for refresh events
  useEffect(() => {
    const handler = () => {
      if (location) fetchData(location.latitude, location.longitude);
    };
    window.addEventListener('wi:refresh', handler);
    return () => window.removeEventListener('wi:refresh', handler);
  }, [fetchData, location]);

  // Load default city on mount
  useEffect(() => {
    fetchData(44.4056, 8.9463, 'Genova', 'Italy');
  }, []);

  // Only log once to avoid infinite re-renders in dep arrays
  const hasData = !!weatherData;

  return (
    <div className="min-h-screen flex flex-col relative">
      <WeatherBackground />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-20">
        <div className="mb-6 max-w-xl">
          <LocationSearch />
        </div>

        {/* Demo data banner */}
        {store.isMockData && weatherData && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-xl">
            <FlaskConical className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" aria-hidden="true" />
            <p className="text-xs text-amber-300/80">Showing demo data — live weather API is currently unavailable.</p>
          </div>
        )}

        {/* Content based on active view */}
        {store.activeView === 'overview' && <OverviewView />}
        {store.activeView === 'forecast' && <ForecastView />}
        {store.activeView === 'activities' && <ActivitiesView />}
        {store.activeView === 'air-quality' && <AirQualityView />}
        {store.activeView === 'history' && <HistoryView />}
      </main>

      <footer className="mt-auto border-t border-[#1E3350]/60 bg-[#0B1728]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-[#64748B]">
            Weather Forecast — Data from OpenWeather. Activity scores are weather suitability indicators, not scientific measurements.
          </p>
          <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function OverviewView() {
  const { weatherData, isLoading, error, location } = useWeatherStore();

  if (isLoading && !weatherData) {
    return (
      <div className="space-y-4">
        <SkeletonHeroCard />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonHourly />
          <SkeletonDaily />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (error && !weatherData) {
    return <ErrorState message={error} />;
  }

  if (!weatherData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CloudSun className="h-12 w-12 text-[#1E3350] mb-4" aria-hidden="true" />
        <h2 className="text-lg font-medium text-[#94A3B8] mb-2">Weather Forecast</h2>
        <p className="text-sm text-[#64748B] max-w-sm">Search for a city to get started. We&apos;ll show you current conditions, forecasts, and activity recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WeatherAlerts alerts={weatherData.alerts} />

      <CurrentWeather />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HourlyForecast />
        <DailyForecast />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UVIndexCard />
        <WindCard />
        <SunCard />
      </div>

      <ActivityScore />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PrecipitationChart />
        <AirQualityCard />
      </div>
    </div>
  );
}

function ForecastView() {
  const { weatherData, isLoading } = useWeatherStore();

  if (isLoading && !weatherData) {
    return (
      <div className="space-y-4">
        <SkeletonHeroCard />
        <SkeletonHourly />
        <SkeletonDaily />
      </div>
    );
  }

  if (!weatherData) return <EmptyState title="Load a location first" message="Search for a city to see forecast data." />;

  return (
    <div className="space-y-4">
      <CurrentWeather />
      <HourlyForecast />
      <DailyForecast />
      <PrecipitationChart />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UVIndexCard />
        <WindCard />
      </div>
      <SunCard />
    </div>
  );
}

function ActivitiesView() {
  const { weatherData, isLoading } = useWeatherStore();

  if (isLoading && !weatherData) {
    return (
      <div className="space-y-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  if (!weatherData) return <EmptyState title="Load a location first" message="Search for a city to see activity recommendations." />;

  return (
    <div className="space-y-4">
      <ActivityScore />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UVIndexCard />
        <WindCard />
        <PrecipitationChart />
      </div>
    </div>
  );
}

function AirQualityView() {
  const { airQuality, isAirQualityLoading, weatherData } = useWeatherStore();

  if (isAirQualityLoading && !airQuality) {
    return <SkeletonCard />;
  }

  if (!airQuality && !isAirQualityLoading && weatherData) {
    return <EmptyState title="Air quality data unavailable" message="Not provided by the weather service for this location." />;
  }

  return <AirQualityCard detailed />;
}

function HistoryView() {
  const { recentLocations, isLoading } = useWeatherStore();

  if (recentLocations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MapPin className="h-10 w-10 text-[#1E3350] mb-4" aria-hidden="true" />
        <h2 className="text-base font-medium text-[#94A3B8] mb-2">No Recent Searches</h2>
        <p className="text-sm text-[#64748B] max-w-sm">Locations you search for will appear here for quick access.</p>
      </div>
    );
  }

  const handleRecentClick = (loc: WeatherLocation) => {
    window.dispatchEvent(new CustomEvent('wi:location-select', { detail: loc }));
  };

  return (
    <div>
      <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-4">Recent Locations</h2>
      <div className="space-y-2">
        {recentLocations.map(loc => (
          <button
            key={loc.id}
            onClick={() => handleRecentClick(loc)}
            disabled={isLoading}
            className="w-full wi-card flex items-center gap-3 hover:border-[#3B82F6]/50 transition-colors text-left disabled:opacity-50"
            aria-label={`Load weather for ${loc.name}, ${loc.country}`}
          >
            <MapPin className="h-4 w-4 text-[#3B82F6] flex-shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#F8FAFC]">{loc.name}</p>
              <p className="text-xs text-[#64748B]">{loc.country} · {loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
