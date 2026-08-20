'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, X, Navigation, Loader2 } from 'lucide-react';
import { useWeatherStore } from '@/stores/weatherStore';
import type { WeatherLocation } from '@/types/weather';
import type { GeocodingResult } from '@/services/weatherApi';

type SearchResult = GeocodingResult;

export function LocationSearch() {
  const { location, addRecentLocation, recentLocations, setActiveView } = useWeatherStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowRecent(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q: string): Promise<SearchResult[]> => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    setShowRecent(false);
    setHighlightIndex(-1);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      doSearch(value).then(data => {
        setResults(data);
        setShowDropdown(true);
        setIsSearching(false);
      });
    }, 300);
  };

  const selectLocation = useCallback((result: SearchResult | WeatherLocation) => {
    const loc: WeatherLocation = {
      id: 'id' in result ? String(result.id) : result.id,
      name: result.name,
      country: result.country,
      countryCode: result.countryCode,
      latitude: result.latitude,
      longitude: result.longitude,
      admin1: 'admin1' in result ? result.admin1 : undefined,
    };
    addRecentLocation(loc);
    setQuery(loc.name);
    setResults([]);
    setShowDropdown(false);
    setShowRecent(false);
    setHighlightIndex(-1);
    window.dispatchEvent(new CustomEvent('wi:location-select', { detail: loc }));
  }, [addRecentLocation]);

  // Enter key: select highlighted result, or first result, or trigger search
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setShowRecent(false);
      setHighlightIndex(-1);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const maxIdx = showRecent ? recentLocations.length - 1 : results.length - 1;
      setHighlightIndex(prev => Math.min(prev + 1, maxIdx));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, -1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      // If dropdown is showing, select the highlighted or first result
      if (showDropdown && results.length > 0) {
        const idx = highlightIndex >= 0 ? highlightIndex : 0;
        selectLocation(results[idx]);
        return;
      }

      // If recent locations are showing, select highlighted or first
      if (showRecent && recentLocations.length > 0) {
        const idx = highlightIndex >= 0 ? highlightIndex : 0;
        selectLocation(recentLocations[idx]);
        return;
      }

      // Otherwise, trigger a search with the current query
      const q = query.trim();
      if (q.length >= 2) {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        setIsSearching(true);
        doSearch(q).then(data => {
          setIsSearching(false);
          if (data.length > 0) {
            selectLocation(data[0]);
          } else {
            setResults([]);
            setShowDropdown(true);
          }
        });
      }
    }
  }, [query, results, recentLocations, showDropdown, showRecent, highlightIndex, selectLocation, doSearch]);

  const handleGeo = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: WeatherLocation = {
          id: `geo-${pos.coords.latitude}-${pos.coords.longitude}`,
          name: 'Current Location',
          country: '',
          countryCode: '',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setQuery(loc.name);
        window.dispatchEvent(new CustomEvent('wi:location-select', { detail: loc }));
      },
      () => { /* denied */ },
      { timeout: 10000 }
    );
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (!query && recentLocations.length > 0) setShowRecent(true); }}
          placeholder="Search city... (press Enter to search)"
          className="w-full bg-[#0F1D31] border border-[#1E3350] rounded-lg pl-9 pr-20 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-colors"
          aria-label="Search for a city"
          aria-expanded={showDropdown || showRecent}
          aria-controls="wi-search-listbox"
          aria-haspopup="listbox"
          role="combobox"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <Loader2 className="h-3.5 w-3.5 text-[#3B82F6] animate-spin" aria-hidden="true" />
          )}
          {query && !isSearching && (
            <button onClick={() => { setQuery(''); setResults([]); setShowDropdown(false); inputRef.current?.focus(); }} className="p-1 text-[#64748B] hover:text-[#F8FAFC] rounded" aria-label="Clear search">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={handleGeo}
            className="p-1.5 text-[#64748B] hover:text-[#3B82F6] rounded transition-colors"
            aria-label="Use current location"
            title="Use current location"
          >
            <Navigation className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showDropdown && (
        <div id="wi-search-listbox" ref={dropdownRef} className="absolute z-50 w-full mt-1 bg-[#0F1D31] border border-[#1E3350] rounded-lg shadow-xl max-h-64 overflow-y-auto" role="listbox">
          {isSearching ? (
            <div className="p-4 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-[#64748B]">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-[10px] text-[#475569] mt-1">Try a different spelling or check the city name</p>
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                onClick={() => selectLocation(r)}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors focus-visible:bg-[#13243A] focus-visible:outline-none ${
                  highlightIndex === i ? 'bg-[#172A43]' : 'hover:bg-[#13243A]'
                }`}
                role="option"
                aria-selected={highlightIndex === i}
              >
                <MapPin className="h-3.5 w-3.5 text-[#3B82F6] flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-[#F8FAFC]">{r.name}</span>
                  <span className="text-xs text-[#64748B] ml-1.5">{r.admin1 ? `${r.admin1}, ` : ''}{r.country}</span>
                </div>
                <span className="text-[10px] text-[#475569] flex-shrink-0">{Math.round(r.latitude)}°, {Math.round(r.longitude)}°</span>
              </button>
            ))
          )}
        </div>
      )}

      {showRecent && !showDropdown && recentLocations.length > 0 && (
        <div id="wi-search-listbox" ref={dropdownRef} className="absolute z-50 w-full mt-1 bg-[#0F1D31] border border-[#1E3350] rounded-lg shadow-xl" role="listbox">
          <p className="px-4 py-2 text-[10px] text-[#64748B] uppercase tracking-wide">Recent</p>
          {recentLocations.map((loc, i) => (
            <button
              key={loc.id}
              onClick={() => selectLocation(loc)}
              onMouseEnter={() => setHighlightIndex(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                highlightIndex === i ? 'bg-[#172A43]' : 'hover:bg-[#13243A]'
              }`}
              role="option"
              aria-selected={highlightIndex === i}
            >
              <MapPin className="h-3.5 w-3.5 text-[#60A5FA] flex-shrink-0" aria-hidden="true" />
              <span className="text-sm text-[#F8FAFC]">{loc.name}</span>
              <span className="text-xs text-[#64748B]">{loc.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
