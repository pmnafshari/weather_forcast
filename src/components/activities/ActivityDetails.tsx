'use client';

import { X, Check, AlertTriangle } from 'lucide-react';
import type { ActivityScore as ActivityScoreType } from '@/types/weather';
import { useWeatherStore } from '@/stores/weatherStore';
import { formatTemperature, formatWind, formatPercent, formatVisibility } from '@/utils/unitConversion';
import { getUvLevel } from '@/utils/weatherFormatters';
import { Bike, Mountain, Activity, Footprints, Camera, HardHat, Umbrella, Tent } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  bike: Bike, mountain: Mountain, activity: Activity, footprints: Footprints,
  camera: Camera, 'hard-hat': HardHat, umbrella: Umbrella, tent: Tent,
};

interface ActivityDetailsProps {
  activity: ActivityScoreType;
  onClose: () => void;
}

export function ActivityDetails({ activity, onClose }: ActivityDetailsProps) {
  const { weatherData, preferences } = useWeatherStore();
  const Icon = ICON_MAP[activity.icon] ?? Activity;

  const current = weatherData?.current;
  const uvData = current?.uvIndex != null ? getUvLevel(current.uvIndex) : null;

  return (
    <div className="mt-4 wi-card-elevated" role="dialog" aria-label={`${activity.name} details`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#13243A] rounded-lg">
            <Icon className="h-5 w-5 text-[#60A5FA]" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-[#F8FAFC] uppercase tracking-wide">{activity.name}</h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-light text-[#F8FAFC]">{activity.score}</span>
              <span className="text-sm text-[#64748B]">/100</span>
              <span className="text-xs ml-2" style={{ color: getStatusColor(activity.status) }}>{activity.status}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-[#64748B] hover:text-[#F8FAFC] rounded-md hover:bg-[#1E3350] transition-colors"
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {current && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <DetailItem label="Temperature" value={formatTemperature(current.temperature, preferences.temperatureUnit)} />
          <DetailItem label="Wind" value={formatWind(current.windSpeed, preferences.windUnit)} />
          <DetailItem label="Humidity" value={`${current.humidity}%`} />
          <DetailItem label="Visibility" value={current.visibility != null ? formatVisibility(current.visibility, preferences.visibilityUnit) : '--'} />
          <DetailItem label="UV" value={uvData ? `${Math.round(current.uvIndex!)} ${uvData.label}` : '--'} />
          <DetailItem label="Cloud Cover" value={`${current.cloudCover}%`} />
        </div>
      )}

      <div className="mb-5">
        <h5 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-2">Assessment</h5>
        <div className="space-y-1.5">
          {activity.reasons.map((r, i) => {
            const ReasonIcon = r.type === 'positive' ? Check : r.type === 'warning' ? AlertTriangle : AlertTriangle;
            return (
              <div key={i} className="flex items-center gap-2">
                <ReasonIcon className={`h-3.5 w-3.5 flex-shrink-0 ${
                  r.type === 'positive' ? 'text-[#22C55E]' : 'text-[#F59E0B]'
                }`} aria-hidden="true" />
                <span className="text-xs text-[#94A3B8]">{r.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {activity.bestTime && (
          <div className="p-3 bg-[#13243A] rounded-lg">
            <p className="text-[10px] text-[#64748B] uppercase tracking-wide mb-1">Best Time Today</p>
            <p className="text-sm font-medium text-[#22C55E]">{activity.bestTime}</p>
          </div>
        )}
        {activity.avoidTime && (
          <div className="p-3 bg-[#13243A] rounded-lg">
            <p className="text-[10px] text-[#64748B] uppercase tracking-wide mb-1">Avoid</p>
            <p className="text-sm font-medium text-[#F59E0B]">{activity.avoidTime}</p>
            {activity.avoidReason && <p className="text-[10px] text-[#64748B] mt-0.5">{activity.avoidReason}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[#64748B] uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-[#F8FAFC]">{value}</p>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Excellent': return '#22C55E';
    case 'Good': return '#3B82F6';
    case 'Fair': return '#F59E0B';
    case 'Poor': return '#F97316';
    case 'Unsuitable': return '#EF4444';
    default: return '#94A3B8';
  }
}