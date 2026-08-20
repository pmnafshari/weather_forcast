import type { WeatherData, AirQualityResponse } from '@/types/weather';

/**
 * Generates realistic mock weather data for any lat/lon.
 * Used as fallback when the Open-Meteo API is rate-limited or unreachable.
 */
export function generateMockWeatherData(
  lat: number,
  lon: number,
  name?: string,
  country?: string,
): WeatherData {
  const now = new Date();
  const hour = now.getUTCHours();
  const isDaytime = hour >= 6 && hour < 20;

  // Simulate temperature based on latitude (warmer near equator)
  const baseTemp = 30 - Math.abs(lat) * 0.5;
  const currentTemp = Math.round(baseTemp + (Math.sin((hour - 6) * Math.PI / 12) * 6) + (Math.random() * 2 - 1));

  const weatherCodes = isDaytime ? [0, 1, 2, 3, 45, 61, 80] : [0, 1, 2, 45, 48];
  const currentCode = weatherCodes[Math.floor(Math.random() * (isDaytime ? 7 : 5))];

  // Generate hourly data (24 hours)
  const hourly = Array.from({ length: 24 }, (_, i) => {
    const h = (hour + i) % 24;
    const isDay = h >= 6 && h < 20 ? 1 : 0;
    const tempVariation = Math.sin((h - 6) * Math.PI / 12) * 6;
    const temp = Math.round((baseTemp + tempVariation + (Math.random() * 2 - 1)) * 10) / 10;
    const code = isDay
      ? [0, 1, 2, 3, 45, 61, 80][Math.floor(Math.random() * 7)]
      : [0, 1, 2, 45, 48][Math.floor(Math.random() * 5)];

    const timeStr = new Date(now.getTime() + i * 3600000).toISOString();
    return {
      time: timeStr,
      temperature: temp,
      feelsLike: Math.round((temp - 1 + Math.random() * 2) * 10) / 10,
      humidity: Math.round(50 + Math.random() * 30),
      windSpeed: Math.round((5 + Math.random() * 20) * 10) / 10,
      windDirection: Math.round(Math.random() * 360),
      windGusts: Math.round((10 + Math.random() * 25) * 10) / 10,
      weatherCode: code,
      precipitation: code >= 61 ? Math.round(Math.random() * 3 * 10) / 10 : 0,
      precipitationProbability: code >= 61 ? Math.round(30 + Math.random() * 60) : Math.round(Math.random() * 15),
      visibility: code >= 45 ? Math.round(2 + Math.random() * 5) : Math.round(10 + Math.random() * 15),
      uvIndex: isDay ? Math.round(Math.random() * 8 * 10) / 10 : 0,
      cloudCover: code <= 2 ? Math.round(Math.random() * 30) : Math.round(40 + Math.random() * 55),
      pressure: Math.round(1010 + Math.random() * 20),
      isDay,
    };
  });

  // Generate daily data (7 days)
  const daily = Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() + i);
    dayDate.setHours(0, 0, 0, 0);

    const dayVariation = (Math.random() - 0.5) * 4;
    const maxTemp = Math.round((baseTemp + 5 + dayVariation) * 10) / 10;
    const minTemp = Math.round((baseTemp - 4 + dayVariation) * 10) / 10;
    const dailyCode = [0, 1, 2, 3, 45, 61, 80, 95][Math.floor(Math.random() * 8)];

    const sunriseHour = 5 + Math.floor(Math.abs(lat) * 0.02);
    const sunsetHour = 19 - Math.floor(Math.abs(lat) * 0.02);

    return {
      date: dayDate.toISOString().split('T')[0],
      weatherCode: dailyCode,
      tempMax: maxTemp,
      tempMin: minTemp,
      precipitationProbability: dailyCode >= 61 ? Math.round(40 + Math.random() * 50) : Math.round(Math.random() * 20),
      precipitationSum: dailyCode >= 61 ? Math.round(Math.random() * 10 * 10) / 10 : 0,
      windSpeedMax: Math.round((10 + Math.random() * 25) * 10) / 10,
      windDirectionDominant: Math.round(Math.random() * 360),
      sunrise: `${dayDate.toISOString().split('T')[0]}T${String(sunriseHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      sunset: `${dayDate.toISOString().split('T')[0]}T${String(sunsetHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      uvIndexMax: Math.round(Math.random() * 10 * 10) / 10,
    };
  });

  return {
    location: {
      id: `${lat.toFixed(2)}-${lon.toFixed(2)}`,
      name: name || '',
      country: country || '',
      countryCode: '',
      latitude: lat,
      longitude: lon,
    },
    current: {
      temperature: currentTemp,
      feelsLike: Math.round((currentTemp - 1 + Math.random() * 2) * 10) / 10,
      humidity: Math.round(50 + Math.random() * 30),
      windSpeed: Math.round((8 + Math.random() * 15) * 10) / 10,
      windDirection: Math.round(Math.random() * 360),
      windGusts: Math.round((15 + Math.random() * 20) * 10) / 10,
      weatherCode: currentCode,
      pressure: Math.round(1010 + Math.random() * 20),
      visibility: currentCode >= 45 ? 5 : Math.round(10 + Math.random() * 15),
      uvIndex: isDaytime ? Math.round(Math.random() * 7 * 10) / 10 : 0,
      isDay: isDaytime,
      precipitation: currentCode >= 61 ? Math.round(Math.random() * 2 * 10) / 10 : 0,
      cloudCover: currentCode <= 2 ? Math.round(Math.random() * 25) : Math.round(50 + Math.random() * 45),
    },
    hourly,
    daily,
    alerts: [],
    lastUpdated: now.toISOString(),
  };
}

export function generateMockAirQuality(): AirQualityResponse {
  const aqi = Math.round(20 + Math.random() * 80);
  return {
    aqi,
    pm25: Math.round((5 + Math.random() * 40) * 10) / 10,
    pm10: Math.round((10 + Math.random() * 50) * 10) / 10,
    no2: Math.round(Math.random() * 60 * 10) / 10,
    o3: Math.round(30 + Math.random() * 80),
    so2: Math.round(Math.random() * 20 * 10) / 10,
    co: Math.round(Math.random() * 500) / 10,
  };
}
