'use client';

import { useWeatherStore } from '@/stores/weatherStore';
import { calculateActivityScores } from '@/utils/activityScore';
import { ActivityComparison } from './ActivityComparison';
import { ActivityCards } from './ActivityCards';
import { EmptyState } from '@/components/common/EmptyState';

export function ActivityScore() {
  const { weatherData, selectedActivityId, setSelectedActivity } = useWeatherStore();

  if (!weatherData) return null;

  const scores = calculateActivityScores(weatherData.current, weatherData.hourly, weatherData.daily);
  if (scores.length === 0) return <EmptyState title="Activity data unavailable" />;

  const overallScore = Math.round(scores.reduce((s, a) => s + a.score, 0) / scores.length);
  const overallStatus = overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : overallScore >= 40 ? 'Fair' : 'Poor';
  const overallColor = overallScore >= 80 ? '#22C55E' : overallScore >= 60 ? '#3B82F6' : overallScore >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div className="space-y-4">
      <section className="wi-card" aria-label="Outdoor activity score">
        <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-3">Outdoor Activity Score</h3>
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#13243A" strokeWidth="4" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={overallColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(overallScore / 100) * 213.6} 213.6`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold text-[#F8FAFC]">{overallScore}</span>
              <span className="text-[9px] text-[#64748B]">/100</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[#F8FAFC]">{overallStatus} conditions for outdoor activities.</p>
            <p className="text-[11px] text-[#64748B] mt-1">Weather suitability score based on current available weather conditions.</p>
          </div>
        </div>
      </section>

      <ActivityComparison scores={scores} onSelect={setSelectedActivity} selectedId={selectedActivityId} />
      <ActivityCards scores={scores} onSelect={setSelectedActivity} selectedId={selectedActivityId} />
    </div>
  );
}
