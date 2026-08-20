import { NextRequest, NextResponse } from 'next/server';
import { fetchWeatherData } from '@/services/weatherApi';
import { generateMockWeatherData } from '@/services/mockWeatherData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  try {
    const data = await fetchWeatherData(lat, lon);
    return NextResponse.json(data);
  } catch {
    const mock = generateMockWeatherData(lat, lon);
    return NextResponse.json({ ...mock, _isMock: true });
  }
}