'use client';

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useWeatherStore } from '@/stores/weatherStore';

type WeatherScene =
  | 'clear-day' | 'clear-night'
  | 'partly-cloudy-day' | 'partly-cloudy-night'
  | 'overcast-day' | 'overcast-night'
  | 'fog-day' | 'fog-night'
  | 'drizzle-day' | 'drizzle-night'
  | 'rain-light-day' | 'rain-light-night'
  | 'rain-moderate-day' | 'rain-moderate-night'
  | 'rain-heavy-day' | 'rain-heavy-night'
  | 'thunderstorm-day' | 'thunderstorm-night'
  | 'snow-day' | 'snow-night'
  | 'sunrise' | 'sunset'
  | 'idle';

type TimeOfDay = 'day' | 'night' | 'sunrise' | 'sunset';

function getTimeOfDay(weatherData: { daily?: { sunrise?: string; sunset?: string }[] } | null): TimeOfDay {
  if (!weatherData?.daily?.[0]?.sunrise || !weatherData?.daily?.[0]?.sunset) {
    return new Date().getHours() >= 6 && new Date().getHours() < 20 ? 'day' : 'night';
  }
  const now = Date.now();
  const sunrise = new Date(weatherData.daily[0].sunrise).getTime();
  const sunset = new Date(weatherData.daily[0].sunset).getTime();
  const sunriseEnd = sunrise + 45 * 60000;
  const sunsetStart = sunset - 45 * 60000;

  if (now >= sunrise && now <= sunriseEnd) return 'sunrise';
  if (now >= sunsetStart && now <= sunset) return 'sunset';
  if (now > sunrise && now < sunset) return 'day';
  return 'night';
}

function resolveScene(weatherCode: number, isDay: boolean, tod: TimeOfDay): WeatherScene {
  if (tod === 'sunrise') return 'sunrise';
  if (tod === 'sunset') return 'sunset';
  const d = isDay ? 'day' : 'night';
  if (weatherCode <= 1) return `clear-${d}` as WeatherScene;
  if (weatherCode === 2) return `partly-cloudy-${d}` as WeatherScene;
  if (weatherCode === 3) return `overcast-${d}` as WeatherScene;
  if (weatherCode === 45 || weatherCode === 48) return `fog-${d}` as WeatherScene;
  if (weatherCode >= 51 && weatherCode <= 57) return `drizzle-${d}` as WeatherScene;
  if (weatherCode >= 61 && weatherCode <= 62) return `rain-light-${d}` as WeatherScene;
  if (weatherCode >= 63 && weatherCode <= 64) return `rain-moderate-${d}` as WeatherScene;
  if (weatherCode === 65) return `rain-heavy-${d}` as WeatherScene;
  if (weatherCode >= 66 && weatherCode <= 67) return `rain-light-${d}` as WeatherScene;
  if (weatherCode >= 71 && weatherCode <= 77) return `snow-${d}` as WeatherScene;
  if (weatherCode >= 80 && weatherCode <= 81) return `rain-light-${d}` as WeatherScene;
  if (weatherCode === 82) return `rain-heavy-${d}` as WeatherScene;
  if (weatherCode >= 85 && weatherCode <= 86) return `snow-${d}` as WeatherScene;
  if (weatherCode >= 95) return `thunderstorm-${d}` as WeatherScene;
  return `overcast-${d}` as WeatherScene;
}

const SKY_GRADIENTS: Record<string, string> = {
  'clear-day':        'linear-gradient(180deg, #0c2d48 0%, #145da0 40%, #2e8bc0 70%, #b1d4e0 100%)',
  'clear-night':      'linear-gradient(180deg, #020111 0%, #0a0a2e 30%, #1a1a4e 60%, #16213e 100%)',
  'partly-cloudy-day':'linear-gradient(180deg, #0c2d48 0%, #1a5276 35%, #5d8aa8 65%, #aed9e0 100%)',
  'partly-cloudy-night':'linear-gradient(180deg, #020111 0%, #0d1b2a 35%, #1b2838 65%, #243447 100%)',
  'overcast-day':     'linear-gradient(180deg, #1a1a2e 0%, #2d3436 40%, #636e72 70%, #95a5a6 100%)',
  'overcast-night':   'linear-gradient(180deg, #0a0a15 0%, #151520 40%, #252530 70%, #35354a 100%)',
  'fog-day':          'linear-gradient(180deg, #4a5568 0%, #718096 30%, #a0aec0 60%, #cbd5e0 100%)',
  'fog-night':        'linear-gradient(180deg, #1a202c 0%, #2d3748 30%, #4a5568 60%, #718096 100%)',
  'drizzle-day':      'linear-gradient(180deg, #1a2634 0%, #2c3e50 35%, #546e7a 65%, #78909c 100%)',
  'drizzle-night':    'linear-gradient(180deg, #0d1117 0%, #1a2332 35%, #2d3d4f 65%, #37474f 100%)',
  'rain-light-day':   'linear-gradient(180deg, #1a2634 0%, #263238 35%, #455a64 65%, #607d8b 100%)',
  'rain-light-night': 'linear-gradient(180deg, #0a0e14 0%, #151d26 35%, #1e2d3d 65%, #263238 100%)',
  'rain-moderate-day':'linear-gradient(180deg, #151c26 0%, #1e2d3d 35%, #37474f 65%, #546e7a 100%)',
  'rain-moderate-night':'linear-gradient(180deg, #080c12 0%, #101820 35%, #1a2634 65%, #212d3b 100%)',
  'rain-heavy-day':   'linear-gradient(180deg, #0d1117 0%, #1a2332 35%, #263238 65%, #37474f 100%)',
  'rain-heavy-night': 'linear-gradient(180deg, #050810 0%, #0d1117 35%, #151c26 65%, #1a2332 100%)',
  'thunderstorm-day': 'linear-gradient(180deg, #0a0a14 0%, #1a1a2e 30%, #2d2d44 60%, #3d3d5c 100%)',
  'thunderstorm-night':'linear-gradient(180deg, #050508 0%, #0a0a14 30%, #151520 60%, #1a1a2a 100%)',
  'snow-day':         'linear-gradient(180deg, #2d3748 0%, #4a5568 30%, #718096 60%, #a0aec0 100%)',
  'snow-night':       'linear-gradient(180deg, #0d1117 0%, #1a202c 30%, #2d3748 60%, #4a5568 100%)',
  'sunrise':          'linear-gradient(180deg, #1a1a2e 0%, #4a2040 20%, #c0392b 45%, #e67e22 65%, #f5b041 85%, #fdebd0 100%)',
  'sunset':           'linear-gradient(180deg, #0d1b2a 0%, #1a1a4e 15%, #4a2040 35%, #c0392b 55%, #e67e22 75%, #f5b041 100%)',
  'idle':             'linear-gradient(180deg, #07111F 0%, #0F1D31 100%)',
};

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; opacity: number;
  life?: number; maxLife?: number;
  twinkleSpeed?: number;
  twinklePhase?: number;
}

class WeatherRenderer {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private particles: Particle[] = [];
  private scene: WeatherScene = 'idle';
  private rafId = 0;
  private lightningTimer = 0;
  private lightningFlash = 0;
  private lastTime = 0;
  private onLightning?: (flash: boolean) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  setLightningCallback(cb: (flash: boolean) => void) {
    this.onLightning = cb;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.ctx.canvas.width = this.w * dpr;
    this.ctx.canvas.height = this.h * dpr;
    this.ctx.canvas.style.width = `${this.w}px`;
    this.ctx.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setScene(scene: WeatherScene) {
    if (scene === this.scene) return;
    this.scene = scene;
    this.particles = [];
    this.initParticles();
  }

  private initParticles() {
    const s = this.scene;
    if (s === 'idle') return;

    // Rain particles
    if (s.includes('rain-light') || s.includes('drizzle')) {
      this.initRain(80, 0.4, 6, 0.8);
    } else if (s.includes('rain-moderate')) {
      this.initRain(200, 0.6, 8, 0.9);
    } else if (s.includes('rain-heavy') || s.includes('thunderstorm')) {
      this.initRain(400, 0.8, 10, 1.0);
    }

    // Snow particles
    if (s.includes('snow')) {
      this.initSnow(120);
    }

    // Stars
    if (s.includes('night') && !s.includes('rain') && !s.includes('thunderstorm') && !s.includes('drizzle') && !s.includes('fog')) {
      this.initStars(150);
    }

    // Fog particles (large, slow, semi-transparent blobs)
    if (s.includes('fog')) {
      this.initFog(15);
    }
  }

  private initRain(count: number, opacityBase: number, lengthMax: number, speedMax: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.w * 1.2 - this.w * 0.1,
        y: Math.random() * this.h,
        vx: -1 - Math.random() * 1.5,
        vy: 8 + Math.random() * 12 * speedMax,
        size: 1 + Math.random() * 1.2,
        opacity: 0.15 + Math.random() * opacityBase * 0.5,
        life: Math.random(),
        maxLife: 0.6 + Math.random() * 0.4,
      });
      // size stores the length multiplier
      this.particles[this.particles.length - 1].size = 8 + Math.random() * lengthMax;
    }
  }

  private initSnow(count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: -0.3 + Math.random() * 0.6,
        vy: 0.5 + Math.random() * 1.5,
        size: 1.5 + Math.random() * 3.5,
        opacity: 0.3 + Math.random() * 0.5,
        life: Math.random(),
        maxLife: 1,
      });
    }
  }

  private initStars(count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h * 0.7,
        vx: 0, vy: 0,
        size: 0.5 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private initFog(count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.w * 2 - this.w * 0.5,
        y: this.h * 0.2 + Math.random() * this.h * 0.7,
        vx: 0.1 + Math.random() * 0.3,
        vy: (Math.random() - 0.5) * 0.05,
        size: 200 + Math.random() * 400,
        opacity: 0.03 + Math.random() * 0.06,
      });
    }
  }

  start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    cancelAnimationFrame(this.rafId);
  }

  private loop = (now: number) => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this.ctx.clearRect(0, 0, this.w, this.h);
    this.updateAndDraw(dt);
    this.rafId = requestAnimationFrame(this.loop);
  };

  private updateAndDraw(dt: number) {
    const s = this.scene;
    if (s === 'idle') return;

    // Draw sun glow for clear/partly-cloudy day
    if (s === 'clear-day' || s === 'partly-cloudy-day') {
      this.drawSunGlow();
    }

    // Draw moon glow for clear/partly-cloudy night
    if (s === 'clear-night' || s === 'partly-cloudy-night') {
      this.drawMoonGlow();
    }

    // Draw sunrise/sunset glow
    if (s === 'sunrise' || s === 'sunset') {
      this.drawHorizonGlow(s === 'sunset' ? '#e67e22' : '#f39c12');
      if (s === 'sunset') this.drawMoonGlow();
    }

    // Update and draw particles
    for (const p of this.particles) {
      if (p.twinkleSpeed !== undefined && p.twinklePhase !== undefined) {
        // Stars: twinkle in place
        p.twinklePhase += p.twinkleSpeed * dt;
        this.drawStar(p);
      } else if (p.size > 50) {
        // Fog blobs
        p.x += p.vx * dt * 30;
        p.y += p.vy * dt * 30;
        if (p.x > this.w + p.size) p.x = -p.size;
        this.drawFogBlob(p);
      } else if (s.includes('snow')) {
        // Snow
        p.x += p.vx * dt * 30 + Math.sin(p.y * 0.01 + performance.now() * 0.001) * 0.3;
        p.y += p.vy * dt * 60;
        if (p.y > this.h + 10) { p.y = -10; p.x = Math.random() * this.w; }
        if (p.x < -10) p.x = this.w + 10;
        if (p.x > this.w + 10) p.x = -10;
        this.drawSnowflake(p);
      } else {
        // Rain
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        if (p.y > this.h + 20) {
          p.y = -20;
          p.x = Math.random() * this.w * 1.2 - this.w * 0.1;
        }
        this.drawRaindrop(p);
      }
    }

    // Thunderstorm lightning
    if (s.includes('thunderstorm')) {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningFlash = 1;
        this.lightningTimer = 3 + Math.random() * 8;
        this.onLightning?.(true);
        setTimeout(() => this.onLightning?.(false), 150);
      }
      if (this.lightningFlash > 0) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.15})`;
        this.ctx.fillRect(0, 0, this.w, this.h);
        this.lightningFlash *= 0.85;
        if (this.lightningFlash < 0.01) this.lightningFlash = 0;
      }
    }

    // Drizzle: draw a subtle mist overlay
    if (s.includes('drizzle')) {
      this.drawMistOverlay(0.04);
    }
  }

  private drawSunGlow() {
    const x = this.w * 0.8;
    const y = this.h * 0.12;
    const r = Math.max(1, Math.min(this.w, this.h) * 0.25);
    const grad = this.ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255, 220, 100, 0.35)');
    grad.addColorStop(0.3, 'rgba(255, 200, 80, 0.15)');
    grad.addColorStop(0.7, 'rgba(255, 180, 60, 0.05)');
    grad.addColorStop(1, 'rgba(255, 180, 60, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  private drawMoonGlow() {
    const x = this.w * 0.15;
    const y = this.h * 0.1;
    const r = Math.max(1, Math.min(this.w, this.h) * 0.18);
    const grad = this.ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(200, 210, 230, 0.25)');
    grad.addColorStop(0.3, 'rgba(180, 200, 230, 0.1)');
    grad.addColorStop(0.7, 'rgba(160, 180, 210, 0.03)');
    grad.addColorStop(1, 'rgba(160, 180, 210, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.w, this.h);

    // Moon disc
    this.ctx.beginPath();
    this.ctx.arc(x, y, 18, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(230, 235, 245, 0.8)';
    this.ctx.fill();
    // Crescent shadow
    this.ctx.beginPath();
    this.ctx.arc(x + 7, y - 3, 15, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(10, 15, 30, 0.6)';
    this.ctx.fill();
  }

  private drawHorizonGlow(color: string) {
    const y = this.h * 0.85;
    const r = Math.max(1, this.w * 0.8);
    const grad = this.ctx.createRadialGradient(this.w * 0.5, y, 0, this.w * 0.5, y, r);
    grad.addColorStop(0, color + '44');
    grad.addColorStop(0.4, color + '22');
    grad.addColorStop(1, color + '00');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  private drawRaindrop(p: Particle) {
    const len = p.size ?? 10;
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
    this.ctx.lineTo(p.x + p.vx * 0.4, p.y + len);
    this.ctx.strokeStyle = `rgba(174, 194, 224, ${p.opacity})`;
    this.ctx.lineWidth = 1;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    // Splash at bottom
    if (p.y > this.h - 30 && Math.random() < 0.1) {
      this.ctx.beginPath();
      this.ctx.ellipse(p.x, this.h - 5 + Math.random() * 10, 3, 1, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(174, 194, 224, ${p.opacity * 0.3})`;
      this.ctx.fill();
    }
  }

  private drawSnowflake(p: Particle) {
    const r = Math.max(0.5, p.size);
    const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    grad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
    grad.addColorStop(1, `rgba(255, 255, 255, 0)`);
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawStar(p: Particle) {
    const twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase!);
    const alpha = p.opacity * twinkle;
    const r = Math.max(0.3, p.size);
    const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(0.5, `rgba(200, 220, 255, ${alpha * 0.4})`);
    grad.addColorStop(1, 'rgba(200, 220, 255, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawFogBlob(p: Particle) {
    const r = Math.max(1, p.size);
    const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    grad.addColorStop(0, `rgba(180, 195, 210, ${p.opacity})`);
    grad.addColorStop(0.5, `rgba(160, 175, 190, ${p.opacity * 0.6})`);
    grad.addColorStop(1, 'rgba(160, 175, 190, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
  }

  private drawMistOverlay(alpha: number) {
    this.ctx.fillStyle = `rgba(140, 160, 180, ${alpha})`;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }
}

export function WeatherBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WeatherRenderer | null>(null);
  const { weatherData } = useWeatherStore();
   const [lightningFlash, setLightningFlash] = useState(false);

  const scene = useMemo(() => {
    if (!weatherData) return 'idle';
    const tod = getTimeOfDay(weatherData);
    return resolveScene(weatherData.current.weatherCode, weatherData.current.isDay, tod);
  }, [weatherData]);

  const gradient = useMemo(() => SKY_GRADIENTS[scene] ?? SKY_GRADIENTS.idle, [scene]);

  const handleLightning = useCallback((flash: boolean) => setLightningFlash(flash), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new WeatherRenderer(canvas);
    renderer.setLightningCallback(handleLightning);
    renderer.resize();
    renderer.setScene(scene);
    renderer.start();
    rendererRef.current = renderer;

    const onResize = () => renderer.resize();
    window.addEventListener('resize', onResize);

    return () => {
      renderer.stop();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.setScene(scene);
  }, [scene]);

  return (
    <div
      className="fixed inset-0 -z-10 transition-all duration-[2000ms] ease-in-out"
      style={{ background: gradient }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
      />
      {/* Lightning flash overlay */}
      {lightningFlash && (
        <div className="fixed inset-0 bg-white/10 pointer-events-none animate-pulse" />
      )}
      {/* Subtle vignette for depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
}

