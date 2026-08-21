import { create } from 'zustand';
import type {
  WeatherData,
  WeatherLocation,
  AirQualityData,
  UserPreferences,
  AirQualityResponse,
} from '@/types/weather';
import {
  loadPreferences,
  savePreferences,
  loadCachedWeather,
  saveCachedWeather,
  loadCachedAirQuality,
  saveCachedAirQuality,
  saveLastLocation,
} from '@/services/storage';


const DEFAULT_PREFERENCES: UserPreferences = {
  temperatureUnit: 'celsius',
  windUnit: 'kmh',
  pressureUnit: 'hpa',
  visibilityUnit: 'km',
};


interface WeatherState {
  weatherData: WeatherData | null;
  airQuality: AirQualityData | null;
  location: WeatherLocation | null;
  recentLocations: WeatherLocation[];
  preferences: UserPreferences;
  isLoading: boolean;
  isAirQualityLoading: boolean;
  error: string | null;
  lastFetched: string | null;
  selectedActivityId: string | null;

  // Mobile-specific fields
  cachedWeatherData: WeatherData | null;
  cachedAirQuality: AirQualityResponse | null;
  isOffline: boolean;

  // Actions
  setWeatherData: (data: WeatherData) => void;
  setAirQuality: (data: AirQualityData | null) => void;
  setLocation: (loc: WeatherLocation) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  setLoading: (loading: boolean) => void;
  setAirQualityLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedActivity: (id: string | null) => void;
  addRecentLocation: (loc: WeatherLocation) => void;
  clearError: () => void;
  setOffline: (offline: boolean) => void;

  // Async hydration
  hydratePreferences: () => Promise<void>;
  loadCachedData: () => Promise<void>;
}


export const useWeatherStore = create<WeatherState>((set, get) => ({
  weatherData: null,
  airQuality: null,
  location: null,
  recentLocations: [],
  preferences: { ...DEFAULT_PREFERENCES },
  isLoading: false,
  isAirQualityLoading: false,
  error: null,
  lastFetched: null,
  selectedActivityId: null,

  // Mobile-specific
  cachedWeatherData: null,
  cachedAirQuality: null,
  isOffline: false,


  setWeatherData: (data) => {
    set({ weatherData: data, lastFetched: new Date().toISOString(), error: null });
    // Persist to storage in background (fire-and-forget)
    saveCachedWeather(data).catch(() => {});
  },

  setAirQuality: (data) => {
    set({ airQuality: data });
    if (data) {
      // Persist raw AQI response shape to storage
      const raw: AirQualityResponse = {
        aqi: data.aqi,
        pm25: data.pm25,
        pm10: data.pm10,
        no2: data.no2,
        o3: data.o3,
        so2: data.so2,
        co: data.co,
      };
      saveCachedAirQuality(raw).catch(() => {});
    }
  },

  setLocation: (loc) => {
    set({ location: loc });
    saveLastLocation(loc).catch(() => {});
  },

  setPreferences: (prefs) => {
    const updated = { ...get().preferences, ...prefs };
    set({ preferences: updated });
    savePreferences(updated).catch(() => {});
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setAirQualityLoading: (loading) => set({ isAirQualityLoading: loading }),
  setError: (error) => set({ error }),
  setSelectedActivity: (id) => set({ selectedActivityId: id }),
  clearError: () => set({ error: null }),
  setOffline: (offline) => set({ isOffline: offline }),

  addRecentLocation: (loc) => {
    const current = get().recentLocations.filter(
      (r) => !(r.latitude === loc.latitude && r.longitude === loc.longitude),
    );
    const updated = [loc, ...current].slice(0, 5);
    set({ recentLocations: updated });
  },


  hydratePreferences: async () => {
    try {
      const prefs = await loadPreferences();
      set({ preferences: prefs });
    } catch {
      // Keep defaults
    }
  },

  loadCachedData: async () => {
    try {
      const [cachedWeather, cachedAq] = await Promise.all([
        loadCachedWeather(),
        loadCachedAirQuality(),
      ]);
      if (cachedWeather) {
        set({ cachedWeatherData: cachedWeather });
      }
      if (cachedAq) {
        set({ cachedAirQuality: cachedAq });
      }
    } catch {
      // Storage unavailable — stay offline
    }
  },
}));
