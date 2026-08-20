import { create } from 'zustand';
import type { WeatherData, WeatherLocation, AirQualityData, ViewTab, UserPreferences } from '@/types/weather';
import { loadPreferences, savePreferences } from '@/utils/unitConversion';

interface WeatherState {
  weatherData: WeatherData | null;
  airQuality: AirQualityData | null;
  location: WeatherLocation | null;
  recentLocations: WeatherLocation[];

  activeView: ViewTab;
  preferences: UserPreferences;
  isLoading: boolean;
  isAirQualityLoading: boolean;
  error: string | null;
  lastFetched: string | null;
  selectedActivityId: string | null;
  isMockData: boolean;

  setWeatherData: (data: WeatherData) => void;
  setAirQuality: (data: AirQualityData | null) => void;
  setLocation: (loc: WeatherLocation) => void;
  setActiveView: (view: ViewTab) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  setLoading: (loading: boolean) => void;
  setAirQualityLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedActivity: (id: string | null) => void;
  addRecentLocation: (loc: WeatherLocation) => void;
  clearError: () => void;
  setMockData: (v: boolean) => void;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  weatherData: null,
  airQuality: null,
  location: null,
  recentLocations: [],
  activeView: 'overview',
  preferences: loadPreferences(),
  isLoading: false,
  isAirQualityLoading: false,
  error: null,
  lastFetched: null,
  selectedActivityId: null,
  isMockData: false,

  setWeatherData: (data) => set({ weatherData: data, lastFetched: new Date().toISOString(), error: null }),
  setAirQuality: (data) => set({ airQuality: data }),
  setLocation: (loc) => set({ location: loc }),
  setActiveView: (view) => set({ activeView: view }),
  setPreferences: (prefs) => {
    const updated = { ...get().preferences, ...prefs };
    savePreferences(updated);
    set({ preferences: updated });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setAirQualityLoading: (loading) => set({ isAirQualityLoading: loading }),
  setError: (error) => set({ error }),
  setSelectedActivity: (id) => set({ selectedActivityId: id }),
  addRecentLocation: (loc) => {
    const current = get().recentLocations.filter(
      (r) => !(r.latitude === loc.latitude && r.longitude === loc.longitude)
    );
    const updated = [loc, ...current].slice(0, 5);
    set({ recentLocations: updated });
  },
  clearError: () => set({ error: null }),
  setMockData: (v) => set({ isMockData: v }),
}));
