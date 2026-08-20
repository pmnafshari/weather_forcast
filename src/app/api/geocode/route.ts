import { NextRequest, NextResponse } from 'next/server';
import { searchLocations } from '@/services/weatherApi';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';

  if (!query || query.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchLocations(query);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
