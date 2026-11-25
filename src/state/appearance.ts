// Apariencia del cliente: un único mecanismo centralizado.
// - Momento operativo (cena / joda): sale de la noche publicada, sus horarios (supuestos de demo),
//   la zona America/Argentina/Buenos_Aires, el reloj de demo y el ajuste del encargado si existe.
// - Preferencia de lectura de esta persona: Automático / Claro / Oscuro.
// Cambiar la apariencia NO modifica disponibilidad, pedidos, precios ni horarios.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { currentNight } from '../domain/engine';
import { jornadaTime } from '../domain/time';
import type { State } from '../domain/types';
import { useStore } from './store';

export type Preferencia = 'auto' | 'claro' | 'oscuro';
export type Tema = 'cena' | 'joda';

const KEY = 'terraco-demo:apariencia';
let pref: Preferencia = (() => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'claro' || v === 'oscuro' ? v : 'auto';
  } catch {
    return 'auto';
  }
})();
const listeners = new Set<() => void>();

export function setPreferencia(p: Preferencia) {
  pref = p;
  try {
    localStorage.setItem(KEY, p);
  } catch {
    /* sin almacenamiento: queda en memoria */
  }
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined')
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      pref = e.newValue === 'claro' || e.newValue === 'oscuro' ? e.newValue : 'auto';
      listeners.forEach((l) => l());
    }
  });

export function usePreferencia(): Preferencia {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => pref,
  );
}

export interface Momento {
  tema: Tema;
  /** Texto breve para el encabezado. */
  etiqueta: string;
  /** Horario del cambio de momento según la noche publicada (supuesto de demo). */
  cambio: string | null;
  fuente: 'encargado' | 'programacion' | 'sin_programacion';
}

/** Momento operativo a partir del estado compartido (reloj de demo incluido). */
export function momentoOperativo(s: State): Momento {
  const override = s.config.aparienciaOperativa ?? 'auto';
  const night = currentNight(s);
  const dj = night?.publicada?.momentos.find((m) => m.tipo === 'dj');
  const cambio = dj?.inicio ?? null;
  if (override !== 'auto') return { tema: override, etiqueta: override === 'cena' ? 'Modo cena' : 'Modo joda', cambio, fuente: 'encargado' };
  if (!night || !dj) return { tema: 'cena', etiqueta: 'Modo cena', cambio: null, fuente: 'sin_programacion' };
  const start = jornadaTime(night.jornada, dj.inicio);
  const tema: Tema = s.now >= start ? 'joda' : 'cena';
  return { tema, etiqueta: tema === 'cena' ? 'Modo cena' : 'Modo joda', cambio, fuente: 'programacion' };
}

/**
 * Tema efectivo del cliente. Se recalcula al iniciar, cuando cambia el reloj o la configuración,
 * al volver a la pestaña y al recuperar la app desde segundo plano.
 */
export function useClientTheme(): { tema: Tema; momento: Momento; pref: Preferencia } {
  const p = usePreferencia();
  const momento = useStore(momentoOperativo);
  const [, force] = useState(0);
  useEffect(() => {
    const re = () => force((n) => n + 1);
    document.addEventListener('visibilitychange', re);
    window.addEventListener('pageshow', re);
    window.addEventListener('focus', re);
    const t = window.setInterval(re, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', re);
      window.removeEventListener('pageshow', re);
      window.removeEventListener('focus', re);
      window.clearInterval(t);
    };
  }, []);
  const tema: Tema = p === 'claro' ? 'cena' : p === 'oscuro' ? 'joda' : momento.tema;
  return { tema, momento, pref: p };
}
