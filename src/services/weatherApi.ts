import type { WeatherData, CurrentWeather, HourlyData, DailyData, AirQualityResponse, WeatherCode } from '@/types/weather';

const OW_API_KEY = process.env.OPENWEATHER_API_KEY!;
const OW_BASE = 'https://api.openweathermap.org/data/2.5';
const OW_GEO_BASE = 'https://api.openweathermap.org/geo/1.0';

// ─── Country code → name mapping (ISO 3166-1 alpha-2) ─────────────────────
const COUNTRY_NAMES: Record<string, string> = {
  AF:'Afghanistan',AL:'Albania',DZ:'Algeria',AS:'American Samoa',AD:'Andorra',AO:'Angola',AG:'Antigua and Barbuda',AR:'Argentina',AM:'Armenia',AU:'Australia',AT:'Austria',AZ:'Azerbaijan',BS:'Bahamas',BH:'Bahrain',BD:'Bangladesh',BB:'Barbados',BY:'Belarus',BE:'Belgium',BZ:'Belize',BJ:'Benin',BM:'Bermuda',BT:'Bhutan',BO:'Bolivia',BA:'Bosnia and Herzegovina',BW:'Botswana',BR:'Brazil',BN:'Brunei',BG:'Bulgaria',BF:'Burkina Faso',BI:'Burundi',KH:'Cambodia',CM:'Cameroon',CA:'Canada',CV:'Cape Verde',CF:'Central African Republic',TD:'Chad',CL:'Chile',CN:'China',CO:'Colombia',KM:'Comoros',CG:'Congo',CD:'DR Congo',CR:'Costa Rica',CI:'Ivory Coast',HR:'Croatia',CU:'Cuba',CY:'Cyprus',CZ:'Czech Republic',DK:'Denmark',DJ:'Djibouti',DM:'Dominica',DO:'Dominican Republic',EC:'Ecuador',EG:'Egypt',SV:'El Salvador',GQ:'Equatorial Guinea',ER:'Eritrea',EE:'Estonia',ET:'Ethiopia',FJ:'Fiji',FI:'Finland',FR:'France',GA:'Gabon',GM:'Gambia',GE:'Georgia',DE:'Germany',GH:'Ghana',GR:'Greece',GD:'Grenada',GT:'Guatemala',GN:'Guinea',GW:'Guinea-Bissau',GY:'Guyana',HT:'Haiti',HN:'Honduras',HK:'Hong Kong',HU:'Hungary',IS:'Iceland',IN:'India',ID:'Indonesia',IR:'Iran',IQ:'Iraq',IE:'Ireland',IL:'Israel',IT:'Italy',JM:'Jamaica',JP:'Japan',JO:'Jordan',KZ:'Kazakhstan',KE:'Kenya',KI:'Kiribati',KP:'North Korea',KR:'South Korea',KW:'Kuwait',KG:'Kyrgyzstan',LA:'Laos',LV:'Latvia',LB:'Lebanon',LS:'Lesotho',LR:'Liberia',LY:'Libya',LI:'Liechtenstein',LT:'Lithuania',LU:'Luxembourg',MO:'Macao',MK:'North Macedonia',MG:'Madagascar',MW:'Malawi',MY:'Malaysia',MV:'Maldives',ML:'Mali',MT:'Malta',MH:'Marshall Islands',MR:'Mauritania',MU:'Mauritius',MX:'Mexico',FM:'Micronesia',MD:'Moldova',MC:'Monaco',MN:'Mongolia',ME:'Montenegro',MA:'Morocco',MZ:'Mozambique',MM:'Myanmar',NA:'Namibia',NR:'Nauru',NP:'Nepal',NL:'Netherlands',NZ:'New Zealand',NI:'Nicaragua',NE:'Niger',NG:'Nigeria',NO:'Norway',OM:'Oman',PK:'Pakistan',PW:'Palau',PS:'Palestine',PA:'Panama',PG:'Papua New Guinea',PY:'Paraguay',PE:'Peru',PH:'Philippines',PL:'Poland',PT:'Portugal',PR:'Puerto Rico',QA:'Qatar',RO:'Romania',RU:'Russia',RW:'Rwanda',KN:'Saint Kitts and Nevis',LC:'Saint Lucia',VC:'Saint Vincent',WS:'Samoa',SM:'San Marino',ST:'Sao Tome and Principe',SA:'Saudi Arabia',SN:'Senegal',RS:'Serbia',SC:'Seychelles',SL:'Sierra Leone',SG:'Singapore',SK:'Slovakia',SI:'Slovenia',SB:'Solomon Islands',SO:'Somalia',ZA:'South Africa',SS:'South Sudan',ES:'Spain',LK:'Sri Lanka',SD:'Sudan',SR:'Suriname',SE:'Sweden',CH:'Switzerland',SY:'Syria',TW:'Taiwan',TJ:'Tajikistan',TZ:'Tanzania',TH:'Thailand',TL:'Timor-Leste',TG:'Togo',TO:'Tonga',TT:'Trinidad and Tobago',TN:'Tunisia',TR:'Turkey',TM:'Turkmenistan',TV:'Tuvalu',UG:'Uganda',UA:'Ukraine',AE:'UAE',GB:'United Kingdom',US:'United States',UY:'Uruguay',UZ:'Uzbekistan',VU:'Vanuatu',VE:'Venezuela',VN:'Vietnam',YE:'Yemen',ZM:'Zambia',ZW:'Zimbabwe',
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

async function fetchWithRetry(url: string, retries = 1, delay = 2000): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.status === 429 && i < retries) {
        await new Promise(r => setTimeout(r, delay * (i + 1)));
        continue;
      }
      return res;
    } catch (e) {
      if (i < retries) {
        await new Promise(r => setTimeout(r, delay * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  return fetch(url);
}

/**
 * Map OpenWeather condition IDs to WMO weather codes used by our UI.
 * See: https://openweathermap.org/weather-conditions
 */
function owToWmo(owId: number): WeatherCode {
  if (owId === 800) return 0;                       // Clear sky
  if (owId === 801) return 1;                       // Mainly clear
  if (owId === 802) return 2;                       // Partly cloudy
  if (owId >= 803 && owId <= 804) return 3;         // Overcast
  // Fog / mist / haze
  if ([701, 721, 741, 751, 761, 771].includes(owId)) return 45;
  if ([711, 731, 751, 762].includes(owId)) return 48;
  // Drizzle
  if ([300, 301, 302, 310, 311, 312, 313, 314, 321, 500].includes(owId)) return 53;
  // Rain
  if ([501, 502, 520, 521].includes(owId)) return 63;
  if ([503, 504, 522, 531].includes(owId)) return 65;
  // Freezing rain
  if ([511, 611, 612, 613, 615, 616].includes(owId)) return 66;
  // Snow
  if ([600, 601, 620, 621].includes(owId)) return 71;
  if ([602, 622].includes(owId)) return 75;
  if (owId === 615 || owId === 616) return 73;
  // Snow grains / showers
  if ([604, 605, 606].includes(owId)) return 77;
  if (owId === 85) return 85;
  if (owId === 86) return 86;
  // Thunderstorm
  if ([200, 210, 230].includes(owId)) return 95;
  if ([201, 211, 202, 212, 221, 231, 232].includes(owId)) return 96;
  return 3; // fallback overcast
}

function isDaytime(sunrise: number, sunset: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= sunrise && now < sunset;
}

// ─── Weather Data ─────────────────────────────────────────────────────────

interface OWCurrent {
  coord: { lon: number; lat: number };
  weather: { id: number; main: string; description: string; icon: string }[];
  main: {
    temp: number; feels_like: number; pressure: number; humidity: number;
    temp_min: number; temp_max: number;
  };
  visibility: number;           // metres
  wind: { speed: number; deg: number; gust?: number };
  clouds: { all: number };
  dt: number;                   // unix timestamp
  sys: { country: string; sunrise: number; sunset: number };
  timezone: number;
  name: string;
  rain?: { '1h'?: number; '3h'?: number };
  snow?: { '1h'?: number; '3h'?: number };
}

interface OWForecastItem {
  dt: number;
  main: { temp: number; feels_like: number; pressure: number; humidity: number; temp_min: number; temp_max: number };
  weather: { id: number; main: string; description: string; icon: string }[];
  clouds: { all: number };
  wind: { speed: number; deg: number; gust?: number };
  visibility: number;
  pop: number;
  dt_txt: string;
  rain?: { '3h'?: number };
  snow?: { '3h'?: number };
}

interface OWForecastResponse {
  list: OWForecastItem[];
  city: { name: string; country: string; timezone: number; sunrise: number; sunset: number };
}

export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const common = `lat=${lat}&lon=${lon}&appid=${OW_API_KEY}&units=metric`;

  const [currentRes, forecastRes] = await Promise.all([
    fetchWithRetry(`${OW_BASE}/weather?${common}`),
    fetchWithRetry(`${OW_BASE}/forecast?${common}`),
  ]);

  if (!currentRes.ok) throw new Error(`Weather API error: ${currentRes.status}`);
  if (!forecastRes.ok) throw new Error(`Forecast API error: ${forecastRes.status}`);

  const current: OWCurrent = await currentRes.json();
  const forecast: OWForecastResponse = await forecastRes.json();

  return mapOpenWeatherResponse(current, forecast);
}

function mapOpenWeatherResponse(current: OWCurrent, forecast: OWForecastResponse): WeatherData {
  const { sunrise, sunset } = current.sys;
  const day = isDaytime(sunrise, sunset);
  const wmoCode = owToWmo(current.weather[0]?.id ?? 800);

  const currentWeather: CurrentWeather = {
    temperature: Math.round(current.main.temp * 10) / 10,
    feelsLike: Math.round(current.main.feels_like * 10) / 10,
    humidity: current.main.humidity,
    windSpeed: Math.round(current.wind.speed * 3.6 * 10) / 10,  // m/s → km/h
    windDirection: current.wind.deg,
    windGusts: current.wind.gust ? Math.round(current.wind.gust * 3.6 * 10) / 10 : null,
    weatherCode: wmoCode,
    pressure: current.main.pressure,
    visibility: current.visibility > 0 ? Math.round(current.visibility / 1000 * 10) / 10 : null, // m → km
    uvIndex: null, // Not available on OpenWeather free plan
    isDay: day,
    precipitation: current.rain?.['1h'] ?? current.snow?.['1h'] ?? 0,
    cloudCover: current.clouds.all,
  };

  // Build hourly from forecast (3-hour intervals)
  // Prepend current weather as "now"
  const hourly: HourlyData[] = [{
    time: new Date(current.dt * 1000).toISOString(),
    temperature: Math.round(current.main.temp * 10) / 10,
    feelsLike: Math.round(current.main.feels_like * 10) / 10,
    humidity: current.main.humidity,
    windSpeed: Math.round(current.wind.speed * 3.6 * 10) / 10,
    windDirection: current.wind.deg,
    windGusts: current.wind.gust ? Math.round(current.wind.gust * 3.6 * 10) / 10 : null,
    weatherCode: wmoCode,
    precipitation: current.rain?.['1h'] ?? current.snow?.['1h'] ?? 0,
    precipitationProbability: null,
    visibility: current.visibility > 0 ? Math.round(current.visibility / 1000 * 10) / 10 : null,
    uvIndex: null,
    cloudCover: current.clouds.all,
    pressure: current.main.pressure,
    isDay: day ? 1 : 0,
  }];

  for (const item of forecast.list) {
    const itemDay = isDaytime(forecast.city.sunrise, forecast.city.sunset);
    hourly.push({
      time: new Date(item.dt * 1000).toISOString(),
      temperature: Math.round(item.main.temp * 10) / 10,
      feelsLike: Math.round(item.main.feels_like * 10) / 10,
      humidity: item.main.humidity,
      windSpeed: Math.round(item.wind.speed * 3.6 * 10) / 10,
      windDirection: item.wind.deg,
      windGusts: item.wind.gust ? Math.round(item.wind.gust * 3.6 * 10) / 10 : null,
      weatherCode: owToWmo(item.weather[0]?.id ?? 800),
      precipitation: item.rain?.['3h'] ?? item.snow?.['3h'] ?? 0,
      precipitationProbability: Math.round(item.pop * 100),
      visibility: item.visibility > 0 ? Math.round(item.visibility / 1000 * 10) / 10 : null,
      uvIndex: null,
      cloudCover: item.clouds.all,
      pressure: item.main.pressure,
      isDay: itemDay ? 1 : 0,
    });
  }

  // Aggregate forecast into daily data
  const dailyMap = new Map<string, {
    temps: number[]; maxWind: number; windDir: number[];
    weatherCodes: number[]; popMax: number; precipSum: number;
    sunrise: number; sunset: number;
  }>();

  // Add today's sunrise/sunset from current weather
  const todayStr = new Date(current.dt * 1000).toISOString().split('T')[0];
  dailyMap.set(todayStr, {
    temps: [current.main.temp],
    maxWind: current.wind.speed * 3.6,
    windDir: [current.wind.deg],
    weatherCodes: [wmoCode],
    popMax: 0,
    precipSum: current.rain?.['1h'] ?? current.snow?.['1h'] ?? 0,
    sunrise: sunrise,
    sunset: sunset,
  });

  for (const item of forecast.list) {
    const dateStr = item.dt_txt.split(' ')[0];
    const existing = dailyMap.get(dateStr) ?? {
      temps: [], maxWind: 0, windDir: [],
      weatherCodes: [], popMax: 0, precipSum: 0,
      sunrise: forecast.city.sunrise,
      sunset: forecast.city.sunset,
    };
    existing.temps.push(item.main.temp);
    existing.maxWind = Math.max(existing.maxWind, item.wind.speed * 3.6);
    existing.windDir.push(item.wind.deg);
    existing.weatherCodes.push(owToWmo(item.weather[0]?.id ?? 800));
    existing.popMax = Math.max(existing.popMax, item.pop);
    existing.precipSum += item.rain?.['3h'] ?? item.snow?.['3h'] ?? 0;
    dailyMap.set(dateStr, existing);
  }

  const daily: DailyData[] = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, d]) => {
    // Pick dominant weather code (most common)
    const codeCounts = new Map<number, number>();
    for (const c of d.weatherCodes) codeCounts.set(c, (codeCounts.get(c) ?? 0) + 1);
    const dominantCode = [...codeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;

    // Average wind direction
    const avgWindDir = d.windDir.reduce((s, v) => s + v, 0) / d.windDir.length;

    return {
      date,
      weatherCode: dominantCode as WeatherCode,
      tempMax: Math.round(Math.max(...d.temps) * 10) / 10,
      tempMin: Math.round(Math.min(...d.temps) * 10) / 10,
      precipitationProbability: Math.round(d.popMax * 100),
      precipitationSum: Math.round(d.precipSum * 10) / 10,
      windSpeedMax: Math.round(d.maxWind * 10) / 10,
      windDirectionDominant: Math.round(avgWindDir),
      sunrise: new Date(d.sunrise * 1000).toISOString(),
      sunset: new Date(d.sunset * 1000).toISOString(),
      uvIndexMax: null,
    };
  });

  return {
    location: {
      id: `${current.coord.lat}-${current.coord.lon}`,
      name: current.name || forecast.city.name,
      country: countryName(current.sys.country || forecast.city.country),
      countryCode: current.sys.country || forecast.city.country,
      latitude: current.coord.lat,
      longitude: current.coord.lon,
    },
    current: currentWeather,
    hourly,
    daily,
    alerts: [],
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Geocoding ───────────────────────────────────────────────────────────

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  admin1?: string;
}

interface OWGeocodingItem {
  name: string;
  lat: number;
  lon: number;
  country: string;
  country_code?: string;
  state?: string;
}

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  try {
    if (!query || query.trim().length < 2) return [];
    const params = new URLSearchParams({
      q: query.trim(),
      limit: '8',
      appid: OW_API_KEY,
    });
    const res = await fetchWithRetry(`${OW_GEO_BASE}/direct?${params}`);
    if (!res.ok) return [];
    const data: OWGeocodingItem[] = await res.json();
    // Deduplicate by name+country (OpenWeather may return same city at slightly different coords)
    const seen = new Set<string>();
    const unique: OWGeocodingItem[] = [];
    for (const r of data) {
      const key = `${r.name},${r.country}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    }
    return unique.map((r, i) => ({
      id: i,
      name: r.name,
      latitude: r.lat,
      longitude: r.lon,
      country: countryName(r.country),
      countryCode: r.country_code ?? r.country.slice(0, 2).toUpperCase(),
      admin1: r.state,
    }));
  } catch {
    return [];
  }
}

// ─── Air Quality ─────────────────────────────────────────────────────────

interface OWAirPollution {
  list: [{
    main: { aqi: number };
    components: {
      pm2_5: number; pm10: number; no2: number;
      o3: number; so2: number; co: number;
    };
  }];
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityResponse | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      appid: OW_API_KEY,
    });
    const res = await fetchWithRetry(`${OW_BASE}/air_pollution?${params}`);
    if (!res.ok) return null;
    const data: OWAirPollution = await res.json();
    const c = data.list?.[0];
    if (!c) return null;
    // OpenWeather AQI: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
    // Map to approximate European AQI scale (0-100+)
    const aqiMap: Record<number, number> = { 1: 15, 2: 35, 3: 60, 4: 85, 5: 110 };
    return {
      aqi: aqiMap[c.main.aqi] ?? 50,
      pm25: c.components.pm2_5 ?? null,
      pm10: c.components.pm10 ?? null,
      no2: c.components.no2 ?? null,
      o3: c.components.o3 ?? null,
      so2: c.components.so2 ?? null,
      co: c.components.co ?? null,
    };
  } catch {
    return null;
  }
}
