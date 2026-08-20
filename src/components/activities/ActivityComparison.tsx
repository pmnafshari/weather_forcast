'use client';

import type { ActivityScore as ActivityScoreType } from '@/types/weather';

interface ActivityComparisonProps {
  scores: ActivityScoreType[];
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  Excellent: '#22C55E',
  Good: '#3B82F6',
  Fair: '#F59E0B',
  Poor: '#F97316',
  Unsuitable: '#EF4444',
};

export function ActivityComparison({ scores, onSelect, selectedId }: ActivityComparisonProps) {
  return (
    <section className="wi-card" aria-label="Best activities today">
      <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-4">Best Activities Today</h3>
      <div className="space-y-2.5">
        {scores.map((activity, i) => (
          <button
            key={activity.id}
            onClick={() => onSelect(selectedId === activity.id ? null : activity.id)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3B82F6] ${
              selectedId === activity.id ? 'bg-[#172A43]' : 'hover:bg-[#13243A]'
            }`}
            aria-label={`${activity.name}: ${activity.score} out of 100, ${activity.status}`}
          >
            <span className="text-[11px] text-[#64748B] w-5 font-medium">{i + 1}</span>
            <span className="text-sm text-[#F8FAFC] w-24 flex-shrink-0">{activity.name}</span>
            <div className="flex-1 h-1.5 bg-[#13243A] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${activity.score}%`, backgroundColor: STATUS_COLORS[activity.status] ?? '#3B82F6' }}
              />
            </div>
            <span className="text-xs font-medium w-7 text-right" style={{ color: STATUS_COLORS[activity.status] ?? '#F8FAFC' }}>
              {activity.score}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}