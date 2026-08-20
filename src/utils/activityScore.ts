import type { ActivityScore, ActivityReason, CurrentWeather, HourlyData, DailyData } from '@/types/weather';

interface ActivityConfig {
  id: string;
  name: string;
  icon: string;
  weights: {
    temperature: number;
    rain: number;
    wind: number;
    humidity: number;
    uv: number;
    visibility: number;
  };
  tempRange: [number, number];
  maxWind: number;
  maxRain: number;
  maxHumidity: number;
}

const ACTIVITIES: ActivityConfig[] = [
  {
    id: 'cycling', name: 'Cycling', icon: 'bike',
    weights: { temperature: 25, rain: 30, wind: 25, humidity: 10, uv: 5, visibility: 5 },
    tempRange: [15, 28], maxWind: 25, maxRain: 20, maxHumidity: 80,
  },
  {
    id: 'hiking', name: 'Hiking', icon: 'mountain',
    weights: { temperature: 25, rain: 30, wind: 15, humidity: 10, uv: 15, visibility: 5 },
    tempRange: [12, 26], maxWind: 30, maxRain: 20, maxHumidity: 80,
  },
  {
    id: 'running', name: 'Running', icon: 'activity',
    weights: { temperature: 30, rain: 25, wind: 15, humidity: 25, uv: 5, visibility: 0 },
    tempRange: [10, 22], maxWind: 30, maxRain: 30, maxHumidity: 70,
  },
  {
    id: 'walking', name: 'Walking', icon: 'footprints',
    weights: { temperature: 30, rain: 30, wind: 20, humidity: 10, uv: 5, visibility: 5 },
    tempRange: [5, 30], maxWind: 35, maxRain: 30, maxHumidity: 85,
  },
  {
    id: 'photography', name: 'Photography', icon: 'camera',
    weights: { temperature: 10, rain: 40, wind: 15, humidity: 10, uv: 10, visibility: 15 },
    tempRange: [5, 30], maxWind: 25, maxRain: 10, maxHumidity: 80,
  },
  {
    id: 'outdoor-work', name: 'Outdoor Work', icon: 'hard-hat',
    weights: { temperature: 25, rain: 35, wind: 20, humidity: 10, uv: 10, visibility: 0 },
    tempRange: [10, 28], maxWind: 30, maxRain: 20, maxHumidity: 80,
  },
  {
    id: 'beach', name: 'Beach', icon: 'umbrella',
    weights: { temperature: 30, rain: 35, wind: 15, humidity: 10, uv: 10, visibility: 0 },
    tempRange: [22, 32], maxWind: 20, maxRain: 15, maxHumidity: 75,
  },
  {
    id: 'camping', name: 'Camping', icon: 'tent',
    weights: { temperature: 15, rain: 40, wind: 25, humidity: 10, uv: 0, visibility: 10 },
    tempRange: [8, 25], maxWind: 25, maxRain: 25, maxHumidity: 85,
  },
];

function scoreFactor(value: number | null, good: [number, number], weight: number): number {
  if (value === null || value === undefined) return weight * 0.7;
  const [lo, hi] = good;
  if (value >= lo && value <= hi) return weight;
  if (value < lo) {
    const deficit = lo - value;
    return Math.max(0, weight - (deficit / lo) * weight);
  }
  const excess = value - hi;
  return Math.max(0, weight - (excess / Math.max(1, hi)) * weight);
}

function buildReasons(config: ActivityConfig, current: CurrentWeather, hourly: HourlyData[]): ActivityReason[] {
  const reasons: ActivityReason[] = [];
  const avgRain = getAvgRainNext6h(hourly);

  if (avgRain < 15) reasons.push({ type: 'positive', text: 'Low rain probability' });
  else if (avgRain < 40) reasons.push({ type: 'warning', text: 'Moderate rain probability' });
  else reasons.push({ type: 'negative', text: 'High rain probability' });

  if (current.temperature >= config.tempRange[0] && current.temperature <= config.tempRange[1]) {
    reasons.push({ type: 'positive', text: 'Comfortable temperature' });
  } else if (current.temperature > config.tempRange[1]) {
    reasons.push({ type: 'warning', text: 'Temperature may be too high' });
  } else {
    reasons.push({ type: 'warning', text: 'Temperature may be too low' });
  }

  if (current.windSpeed <= config.maxWind * 0.7) {
    reasons.push({ type: 'positive', text: 'Low wind' });
  } else if (current.windSpeed <= config.maxWind) {
    reasons.push({ type: 'positive', text: 'Moderate wind' });
  } else {
    reasons.push({ type: 'negative', text: 'Strong wind' });
  }

  if (current.visibility !== null && current.visibility >= 10000) {
    reasons.push({ type: 'positive', text: 'Good visibility' });
  } else if (current.visibility !== null && current.visibility < 5000) {
    reasons.push({ type: 'warning', text: 'Reduced visibility' });
  }

  if (current.uvIndex !== null && current.uvIndex > 6 && config.weights.uv > 0) {
    reasons.push({ type: 'warning', text: `UV index ${current.uvIndex} (high)` });
  }

  if (current.humidity < 70) {
    reasons.push({ type: 'positive', text: 'Moderate humidity' });
  } else {
    reasons.push({ type: 'warning', text: 'High humidity' });
  }

  return reasons;
}

function getAvgRainNext6h(hourly: HourlyData[]): number {
  const now = new Date();
  const next6 = hourly
    .filter(h => {
      const t = new Date(h.time);
      return t >= now && t <= new Date(now.getTime() + 6 * 3600000);
    })
    .map(h => h.precipitationProbability ?? 0);
  if (next6.length === 0) return 0;
  return next6.reduce((a, b) => a + b, 0) / next6.length;
}

function findBestTime(hourly: HourlyData[], config: ActivityConfig): { best: string | null; avoid: string | null; avoidReason: string | null } {
  const now = new Date();
  const remaining = hourly.filter(h => new Date(h.time) >= now);
  if (remaining.length === 0) return { best: null, avoid: null, avoidReason: null };

  let bestStart = -1;
  let bestScore = -1;
  let worstStart = -1;
  let worstScore = Infinity;

  for (let i = 0; i <= remaining.length - 3; i++) {
    const window = remaining.slice(i, i + 3);
    const avgTemp = window.reduce((s, h) => s + h.temperature, 0) / 3;
    const avgRain = window.reduce((s, h) => s + (h.precipitationProbability ?? 0), 0) / 3;
    const avgWind = window.reduce((s, h) => s + h.windSpeed, 0) / 3;

    let score = 100;
    if (avgTemp < config.tempRange[0]) score -= (config.tempRange[0] - avgTemp) * 3;
    if (avgTemp > config.tempRange[1]) score -= (avgTemp - config.tempRange[1]) * 3;
    score -= avgRain * 1.5;
    if (avgWind > config.maxWind) score -= (avgWind - config.maxWind) * 2;

    if (score > bestScore) { bestScore = score; bestStart = i; }
    if (score < worstScore) { worstScore = score; worstStart = i; }
  }

  const format = (idx: number) => {
    const start = new Date(remaining[idx].time);
    const end = new Date(remaining[Math.min(idx + 2, remaining.length - 1)].time);
    return `${start.getHours().toString().padStart(2, '0')}:00 – ${end.getHours().toString().padStart(2, '0')}:00`;
  };

  const avoidReason = worstScore < 50
    ? 'because of unfavorable conditions'
    : null;

  return {
    best: bestStart >= 0 ? format(bestStart) : null,
    avoid: worstStart >= 0 && worstScore < 50 ? format(worstStart) : null,
    avoidReason,
  };
}

function getStatus(score: number): ActivityScore['status'] {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Unsuitable';
}

export function calculateActivityScores(current: CurrentWeather, hourly: HourlyData[], _daily: DailyData[]): ActivityScore[] {
  return ACTIVITIES.map(config => {
    const w = config.weights;
    let score = 0;
    let totalWeight = 0;

    score += scoreFactor(current.temperature, config.tempRange, w.temperature);
    totalWeight += w.temperature;

    const avgRain = getAvgRainNext6h(hourly);
    score += scoreFactor(avgRain, [0, config.maxRain], w.rain);
    totalWeight += w.rain;

    score += scoreFactor(current.windSpeed, [0, config.maxWind], w.wind);
    totalWeight += w.wind;

    score += scoreFactor(current.humidity, [30, 65], w.humidity);
    totalWeight += w.humidity;

    if (current.uvIndex !== null) {
      score += scoreFactor(current.uvIndex, [0, 5], w.uv);
      totalWeight += w.uv;
    }

    if (current.visibility !== null) {
      score += scoreFactor(current.visibility, [10000, 50000], w.visibility);
      totalWeight += w.visibility;
    }

    const finalScore = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
    const reasons = buildReasons(config, current, hourly);
    const { best, avoid, avoidReason } = findBestTime(hourly, config);

    return {
      id: config.id,
      name: config.name,
      icon: config.icon,
      score: Math.min(100, Math.max(0, finalScore)),
      status: getStatus(finalScore),
      reasons,
      bestTime: best,
      avoidTime: avoid,
      avoidReason,
    };
  }).sort((a, b) => b.score - a.score);
}
