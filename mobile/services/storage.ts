import type { UserPreferences, WeatherData, AirQualityResponse, WeatherLocation } from '@/types/weather';

interface CachedEntry<T> {
  timestamp: number;
  data: T;
}

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const KEYS = {
  PREFERENCES: 'wi-preferences',
  LAST_LOCATION: 'wi-last-location',
  CACHED_WEATHER: 'wi-cached-weather',
  CACHED_AIR_QUALITY: 'wi-cached-aq',
} as const;


let memoryStore: Record<string, string> = {};
let asyncStorage: typeof import('@react-native-async-storage/async-storage').default | null = null;
let asyncStorageReady = false;
let asyncStorageFailed = false;

async function getAsyncStorage(): Promise<typeof asyncStorage> {
  if (asyncStorageReady) return asyncStorage;
  if (asyncStorageFailed) return null;

  try {
    const mod = await import('@react-native-async-storage/async-storage');
    asyncStorage = mod.default;
    asyncStorageReady = true;
    return asyncStorage;
  } catch {
    asyncStorageFailed = true;
    return null;
  }
}


export async function getItem(key: string): Promise<string | null> {
  try {
    const storage = await getAsyncStorage();
    if (storage) return await storage.getItem(key);
  } catch { /* fall through to memory */ }
  return memoryStore[key] ?? null;
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    const storage = await getAsyncStorage();
    if (storage) {
      await storage.setItem(key, value);
    }
  } catch { /* fall through to memory */ }
  memoryStore[key] = value;
}

export async function removeItem(key: string): Promise<void> {
  try {
    const storage = await getAsyncStorage();
    if (storage) {
      await storage.removeItem(key);
    }
  } catch { /* fall through to memory */ }
  delete memoryStore[key];
}


const DEFAULT_PREFERENCES: UserPreferences = {
  temperatureUnit: 'celsius',
  windUnit: 'kmh',
  pressureUnit: 'hpa',
  visibilityUnit: 'km',
};


export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const raw = await getItem(KEYS.PREFERENCES);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserPreferences>;
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch { /* ignore corrupt data */ }
  return { ...DEFAULT_PREFERENCES };
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  await setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
}


export async function loadCachedWeather(): Promise<WeatherData | null> {
  try {
    const raw = await getItem(KEYS.CACHED_WEATHER);
    if (raw) {
      const entry = JSON.parse(raw) as CachedEntry<WeatherData>;
      if (Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data;
      }
      await removeItem(KEYS.CACHED_WEATHER);
    }
  } catch { /* ignore */ }
  return null;
}

export async function saveCachedWeather(data: WeatherData): Promise<void> {
  await setItem(KEYS.CACHED_WEATHER, JSON.stringify({ timestamp: Date.now(), data }));
}

export async function clearCachedWeather(): Promise<void> {
  await removeItem(KEYS.CACHED_WEATHER);
}


export async function loadCachedAirQuality(): Promise<AirQualityResponse | null> {
  try {
    const raw = await getItem(KEYS.CACHED_AIR_QUALITY);
    if (raw) {
      const entry = JSON.parse(raw) as CachedEntry<AirQualityResponse>;
      if (Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data;
      }
      await removeItem(KEYS.CACHED_AIR_QUALITY);
    }
  } catch { /* ignore */ }
  return null;
}

export async function saveCachedAirQuality(data: AirQualityResponse): Promise<void> {
  await setItem(KEYS.CACHED_AIR_QUALITY, JSON.stringify({ timestamp: Date.now(), data }));
}


export async function loadLastLocation(): Promise<WeatherLocation | null> {
  try {
    const raw = await getItem(KEYS.LAST_LOCATION);
    if (raw) return JSON.parse(raw) as WeatherLocation;
  } catch { /* ignore */ }
  return null;
}

export async function saveLastLocation(loc: WeatherLocation): Promise<void> {
  await setItem(KEYS.LAST_LOCATION, JSON.stringify(loc));
}
