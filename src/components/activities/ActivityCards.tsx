'use client';

import { Bike, Mountain, Activity, Footprints, Camera, HardHat, Umbrella, Tent, Check, AlertTriangle, X as XIcon } from 'lucide-react';
import type { ActivityScore as ActivityScoreType } from '@/types/weather';
import { ActivityDetails } from './ActivityDetails';

const ICON_MAP: Record<string, React.ElementType> = {
  bike: Bike, mountain: Mountain, activity: Activity, footprints: Footprints,
  camera: Camera, 'hard-hat': HardHat, umbrella: Umbrella, tent: Tent,
};

interface ActivityCardsProps {
  scores: ActivityScoreType[];
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}

export function ActivityCards({ scores, onSelect, selectedId }: ActivityCardsProps) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {scores.map(activity => {
          const Icon = ICON_MAP[activity.icon] ?? Activity;
          const isSelected = selectedId === activity.id;
          return (
            <button
              key={activity.id}
              onClick={() => onSelect(isSelected ? null : activity.id)}
              className={`wi-card text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3B82F6] ${
                isSelected ? 'border-[#3B82F6] bg-[#172A43]' : ''
              }`}
              aria-expanded={isSelected}
              aria-label={`${activity.name}: ${activity.score}/100, ${activity.status}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-[#60A5FA]" aria-hidden="true" />
                <span className="text-sm font-medium text-[#F8FAFC]">{activity.name}</span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-2xl font-light text-[#F8FAFC]">{activity.score}</span>
                <span className="text-xs text-[#64748B]">/100</span>
              </div>
              <span className={`text-xs font-medium ${getStatusColor(activity.status)}`}>{activity.status}</span>
              <div className="mt-2 space-y-1">
                {activity.reasons.slice(0, 3).map((r, i) => {
                  const ReasonIcon = r.type === 'positive' ? Check : r.type === 'warning' ? AlertTriangle : XIcon;
                  return (
                    <div key={i} className="flex items-start gap-1.5">
                      <ReasonIcon className={`h-3 w-3 mt-0.5 flex-shrink-0 ${
                        r.type === 'positive' ? 'text-[#22C55E]' : r.type === 'warning' ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                      }`} aria-hidden="true" />
                      <span className="text-[11px] text-[#94A3B8] leading-tight">{r.text}</span>
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
      {selectedId && (
        <ActivityDetails
          activity={scores.find(a => a.id === selectedId)!}
          onClose={() => onSelect(null)}
        />
      )}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Excellent': return 'text-[#22C55E]';
    case 'Good': return 'text-[#3B82F6]';
    case 'Fair': return 'text-[#F59E0B]';
    case 'Poor': return 'text-[#F97316]';
    case 'Unsuitable': return 'text-[#EF4444]';
    default: return 'text-[#94A3B8]';
  }
}