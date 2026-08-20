'use client';

import { AlertTriangle } from 'lucide-react';
import type { WeatherAlert } from '@/types/weather';

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
}

export function WeatherAlerts({ alerts }: WeatherAlertsProps) {
  if (!alerts || alerts.length === 0) return null;

  const severityColors: Record<string, string> = {
    minor: '#F59E0B',
    moderate: '#F97316',
    severe: '#EF4444',
    extreme: '#A855F7',
  };

  return (
    <section className="wi-card" aria-label="Weather alerts">
      <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-3">Weather Alerts</h3>
      <div className="space-y-2">
        {alerts.map((alert, i) => {
          const color = severityColors[alert.severity] ?? '#EF4444';
          return (
            <div
              key={i}
              className="p-3 bg-[#13243A] rounded-lg border-l-2"
              style={{ borderColor: color }}
              role="alert"
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color }} aria-hidden="true" />
                <span className="text-sm font-medium text-[#F8FAFC]">{alert.event}</span>
              </div>
              {alert.headline && <p className="text-xs text-[#94A3B8] mb-1">{alert.headline}</p>}
              {alert.description && <p className="text-xs text-[#94A3B8] leading-relaxed">{alert.description}</p>}
              {alert.start && alert.end && (
                <p className="text-[10px] text-[#64748B] mt-1.5">
                  {new Date(alert.start).toLocaleString()} — {new Date(alert.end).toLocaleString()}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
