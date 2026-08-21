export interface WeatherLocation {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number | null;
  weatherCode: number;
  pressure: number;
  visibility: number | null;
  uvIndex: number | null;
  isDay: boolean;
  precipitation: number;
  cloudCover: number;
}

export interface HourlyData {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number | null;
  weatherCode: number;
  precipitation: number;
  precipitationProbability: number | null;
  visibility: number | null;
  uvIndex: number | null;
  cloudCover: number;
  pressure: number;
  isDay: number;
}

export interface DailyData {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number | null;
  precipitationSum: number;
  windSpeedMax: number;
  windDirectionDominant: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number | null;
}

export interface WeatherAlert {
  event: string;
  headline: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  start: string;
  end: string;
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  hourly: HourlyData[];
  daily: DailyData[];
  alerts: WeatherAlert[];
  lastUpdated: string;
}

export interface AirQualityResponse {
  aqi: number;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  so2: number | null;
  co: number | null;
}

export interface AirQualityData {
  aqi: number;
  aqiLevel: string;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  so2: number | null;
  co: number | null;
  lastUpdated: string;
}

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindUnit = 'kmh' | 'mph';
export type PressureUnit = 'hpa' | 'inhg';
export type VisibilityUnit = 'km' | 'mi';

export interface UserPreferences {
  temperatureUnit: TemperatureUnit;
  windUnit: WindUnit;
  pressureUnit: PressureUnit;
  visibilityUnit: VisibilityUnit;
}

export interface ActivityScore {
  id: string;
  name: string;
  icon: string;
  score: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Unsuitable';
  reasons: ActivityReason[];
  bestTime: string | null;
  avoidTime: string | null;
  avoidReason: string | null;
}

export interface ActivityReason {
  type: 'positive' | 'warning' | 'negative';
  text: string;
}

export type WeatherCode =
  | 0 | 1 | 2 | 3
  | 45 | 48
  | 51 | 53 | 55
  | 56 | 57
  | 61 | 63 | 65
  | 66 | 67
  | 71 | 73 | 75
  | 77
  | 80 | 81 | 82
  | 85 | 86
  | 95 | 96 | 99;
