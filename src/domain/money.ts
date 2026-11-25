// Dinero en centavos enteros (ARS). Nunca usar decimales para cálculos.

const fmt0 = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmt2 = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Formato argentino como en la carta: $8.000, o $8.571,43 si hay centavos. */
const SIGNO_CON_ESPACIO = new RegExp('\\$[\\u00a0\\u202f ]');

export function ars(cents: number): string {
  const v = cents / 100;
  return (cents % 100 === 0 ? fmt0 : fmt2).format(v).replace(SIGNO_CON_ESPACIO, '$');
}


/**
 * Reparto determinista: las partes suman exactamente el total.
 * El sobrante de centavos se asigna, de a uno, a las primeras partes.
 */
export function splitCents(total: number, parts: number): number[] {
  if (!Number.isInteger(total) || total < 0) throw new Error('El total debe ser un entero de centavos');
  if (!Number.isInteger(parts) || parts < 1) throw new Error('Cantidad de partes inválida');
  const base = Math.floor(total / parts);
  const rem = total - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < rem ? 1 : 0));
}

/**
 * Distribuye un descuento entre importes (proporcional, determinista).
 * Devuelve el descuento asignado a cada importe; la suma coincide con `discount`.
 */
export function allocateProportional(amounts: number[], discount: number): number[] {
  const total = amounts.reduce((a, b) => a + b, 0);
  if (total === 0 || discount === 0) return amounts.map(() => 0);
  const raw = amounts.map((a) => (a * discount) / total);
  const floors = raw.map(Math.floor);
  let rem = discount - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const o of order) {
    if (rem <= 0) break;
    floors[o.i] += 1;
    rem -= 1;
  }
  return floors;
}
