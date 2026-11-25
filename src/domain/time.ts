// Reloj y jornada operativa. Zona: America/Argentina/Buenos_Aires (UTC-3, sin horario de verano vigente).
export const TZ = 'America/Argentina/Buenos_Aires';
const AR_OFFSET_MS = -3 * 3600_000;
/** Una jornada operativa empieza a las 08:00 y termina a las 08:00 del día siguiente. */
export const JORNADA_CORTE_HORAS = 8;

export const MIN = 60_000;
export const HOUR = 3600_000;

/** Epoch ms a partir de fecha local de Argentina "YYYY-MM-DD" y "HH:MM". */
export function arDateTime(date: string, hhmm: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - AR_OFFSET_MS;
}

/** Fecha local de Argentina YYYY-MM-DD. */
export function arDate(ms: number): string {
  const d = new Date(ms + AR_OFFSET_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Jornada operativa: una noche que cruza medianoche cuenta como una sola fecha. */
export function jornadaOf(ms: number): string {
  return arDate(ms - JORNADA_CORTE_HORAS * HOUR);
}

/** Momento de una jornada: "HH:MM" que, si es antes del corte, pertenece al día siguiente. */
export function jornadaTime(jornada: string, hhmm: string): number {
  const [hh] = hhmm.split(':').map(Number);
  const base = arDateTime(jornada, hhmm);
  return hh < JORNADA_CORTE_HORAS ? base + 24 * HOUR : base;
}

const timeFmt = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
const dayFmt = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, weekday: 'short', day: '2-digit', month: '2-digit' });
const longDayFmt = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });

export const hhmm = (ms: number) => timeFmt.format(ms);
export const shortDay = (ms: number) => dayFmt.format(ms);
export const longDay = (ms: number) => longDayFmt.format(ms);
export const jornadaLabel = (j: string) => {
  const s = longDayFmt.format(arDateTime(j, '12:00'));
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function ago(now: number, then: number): string {
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}
