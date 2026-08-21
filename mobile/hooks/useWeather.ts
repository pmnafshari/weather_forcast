import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWeatherData,
  fetchAirQuality,
  searchLocations,
  type GeocodingResult,
} from '@/services/weatherApi';

export function useWeather(lat: number, lon: number) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => fetchWeatherData(lat, lon),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: lat !== 0 || lon !== 0,
  });
}

export function useAirQuality(lat: number, lon: number) {
  return useQuery({
    queryKey: ['airQuality', lat, lon],
    queryFn: () => fetchAirQuality(lat, lon),
    staleTime: 10 * 60 * 1000,
    retry: 0,
    enabled: lat !== 0 || lon !== 0,
  });
}

export function useCitySearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (query: string) => searchLocations(query),
  });
}
