'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Search, Settings, RefreshCw, Menu, X, Clock, CloudSun } from 'lucide-react';
import { useWeatherStore } from '@/stores/weatherStore';
import type { ViewTab } from '@/types/weather';

const NAV_ITEMS: { id: ViewTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'activities', label: 'Activities' },
  { id: 'air-quality', label: 'Air Quality' },
  { id: 'history', label: 'History' },
];

export function Header() {
  const { activeView, setActiveView, location, lastFetched, isLoading } = useWeatherStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNavClick = useCallback((view: ViewTab) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  }, [setActiveView]);

  return (
    <header className="sticky top-0 z-50 bg-[#0B1728]/90 backdrop-blur-md border-b border-[#1E3350]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <CloudSun className="h-5 w-5 text-[#3B82F6]" aria-hidden="true" />
            <span className="font-semibold text-sm text-[#F8FAFC] hidden sm:block">Weather Forecast</span>
          </div>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6] ${
                  activeView === item.id
                    ? 'bg-[#172A43] text-[#F8FAFC]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#13243A]'
                }`}
                aria-current={activeView === item.id ? 'page' : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {location && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <MapPin className="h-3.5 w-3.5 text-[#3B82F6]" aria-hidden="true" />
                <span>{location.name}, {location.country}</span>
              </div>
            )}
            {lastFetched && !isLoading && (
              <span className="hidden lg:flex items-center gap-1 text-[10px] text-[#64748B]">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {new Date(lastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {isLoading && <RefreshCw className="h-3.5 w-3.5 text-[#3B82F6] animate-spin" aria-label="Loading" />}

            <SettingsButton settingsRef={settingsRef} open={settingsOpen} onToggle={() => setSettingsOpen(!settingsOpen)} />

            <button
              className="md:hidden p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] rounded-md hover:bg-[#13243A] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-[#1E3350] bg-[#0B1728]" aria-label="Mobile navigation">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`block w-full text-left px-6 py-3 text-sm transition-colors ${
                activeView === item.id
                  ? 'bg-[#172A43] text-[#F8FAFC]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#13243A]'
              }`}
              aria-current={activeView === item.id ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}

function SettingsButton({ settingsRef, open, onToggle }: { settingsRef: React.RefObject<HTMLDivElement | null>; open: boolean; onToggle: () => void }) {
  const { preferences, setPreferences } = useWeatherStore();

  return (
    <div ref={settingsRef} className="relative">
      <button
        onClick={onToggle}
        className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] rounded-md hover:bg-[#13243A] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
        aria-label="Settings"
        aria-expanded={open}
      >
        <Settings className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-[#0F1D31] border border-[#1E3350] rounded-lg p-3 shadow-xl z-50">
          <p className="text-xs font-medium text-[#F8FAFC] mb-3">Units</p>
          <div className="space-y-3">
            <UnitToggle label="Temperature" options={['°C', '°F']} value={preferences.temperatureUnit} onChange={(v) => setPreferences({ temperatureUnit: v as 'celsius' | 'fahrenheit' })} />
            <UnitToggle label="Wind" options={['km/h', 'mph']} value={preferences.windUnit} onChange={(v) => setPreferences({ windUnit: v as 'kmh' | 'mph' })} />
            <UnitToggle label="Pressure" options={['hPa', 'inHg']} value={preferences.pressureUnit} onChange={(v) => setPreferences({ pressureUnit: v as 'hpa' | 'inhg' })} />
            <UnitToggle label="Visibility" options={['km', 'mi']} value={preferences.visibilityUnit} onChange={(v) => setPreferences({ visibilityUnit: v as 'km' | 'mi' })} />
          </div>
        </div>
      )}
    </div>
  );
}

function UnitToggle({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const optValues: Record<string, string> = {
    '°C': 'celsius', '°F': 'fahrenheit',
    'km/h': 'kmh', 'mph': 'mph',
    'hPa': 'hpa', 'inHg': 'inhg',
    'km': 'km', 'mi': 'mi',
  };
  return (
    <div>
      <p className="text-[11px] text-[#64748B] mb-1">{label}</p>
      <div className="flex gap-1">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(optValues[opt])}
            className={`flex-1 text-[11px] py-1 px-2 rounded transition-colors ${
              value === optValues[opt]
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#13243A] text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}