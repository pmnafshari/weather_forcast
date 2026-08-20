import { NextRequest, NextResponse } from 'next/server';
import { fetchAirQuality } from '@/services/weatherApi';
import { generateMockAirQuality } from '@/services/mockWeatherData';
import type { AirQualityData } from '@/types/weather';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  try {
    const data = await fetchAirQuality(lat, lon);
    if (!data) {
      const mock = generateMockAirQuality();
      return NextResponse.json({
        aqi: mock.aqi,
        aqiLevel: '',
        pm25: mock.pm25,
        pm10: mock.pm10,
        no2: mock.no2,
        o3: mock.o3,
        so2: mock.so2,
        co: mock.co,
        lastUpdated: new Date().toISOString(),
        _isMock: true,
      });
    }
    const aqiData: AirQualityData = {
      aqi: data.aqi,
      aqiLevel: '',
      pm25: data.pm25,
      pm10: data.pm10,
      no2: data.no2,
      o3: data.o3,
      so2: data.so2,
      co: data.co,
      lastUpdated: new Date().toISOString(),
    };
    return NextResponse.json(aqiData);
  } catch {
    const mock = generateMockAirQuality();
    return NextResponse.json({
      aqi: mock.aqi,
      aqiLevel: '',
      pm25: mock.pm25,
      pm10: mock.pm10,
      no2: mock.no2,
      o3: mock.o3,
      so2: mock.so2,
      co: mock.co,
      lastUpdated: new Date().toISOString(),
      _isMock: true,
    });
  }
}
