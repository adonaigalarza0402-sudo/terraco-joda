// Componentes compartidos del apartado de clientes (mismos componentes para cena y joda).
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ars } from '../../domain/money';
import { LOGO } from '../../ui/derive';
import logoAlpha from '../../../recursos/marca/derivados/terraco_logo_crema_alfa.png';

// ------------------------------------------------------------------ íconos
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
export const I = {
  menu: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  copa: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} d="M5 4h14l-7 8z" />
      <path {...S} d="M12 12v7M8 20h8M8.5 8h7" />
    </svg>
  ),
  ticket: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z" />
      <path {...S} d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  ),
  calendario: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect {...S} x="4" y="5" width="16" height="15" rx="2" />
      <path {...S} d="M4 10h16M8 3v4M16 3v4" />
    </svg>
  ),
  buscar: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle {...S} cx="11" cy="11" r="6.5" />
      <path {...S} d="M16 16l4 4" />
    </svg>
  ),
  mas: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} strokeWidth={2.2} d="M12 6v12M6 12h12" />
    </svg>
  ),
  info: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle {...S} cx="12" cy="12" r="8.5" />
      <path {...S} d="M12 11v5M12 8h.01" />
    </svg>
  ),
  x: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  chev: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} strokeWidth={2} d="M9 6l6 6-6 6" />
    </svg>
  ),
  flecha: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} strokeWidth={2} d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  atras: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} strokeWidth={2} d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  ),
  carrito: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} d="M3 4h2l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" />
      <circle {...S} cx="9.5" cy="19.5" r="1.3" />
      <circle {...S} cx="17" cy="19.5" r="1.3" />
    </svg>
  ),
  pin: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z" />
      <circle {...S} cx="12" cy="10" r="2.2" />
    </svg>
  ),
  calculadora: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect {...S} x="5" y="3" width="14" height="18" rx="2" />
      <path {...S} d="M8 7h8M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01" />
    </svg>
  ),
  regalo: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" />
      <path {...S} d="M12 7c-1.5-3-5-3-5-1s3 1 5 1c2 0 5 0 5-1s-3.5-2-5 1" />
    </svg>
  ),
  reserva: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect {...S} x="4" y="5" width="16" height="15" rx="2" />
      <path {...S} d="M4 10h16M8 3v4M16 3v4M9 15l2 2 4-4" />
    </svg>
  ),
  ojo: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle {...S} cx="12" cy="12" r="3" />
    </svg>
  ),
  ayuda: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle {...S} cx="12" cy="12" r="8.5" />
      <path {...S} d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.4M12 17h.01" />
    </svg>
  ),
  llave: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle {...S} cx="8" cy="15" r="3.5" />
      <path {...S} d="M10.5 12.5L19 4M16 7l2 2M14 9l1.5 1.5" />
    </svg>
  ),
  casa: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} d="M4 11l8-6 8 6v9H4z" />
      <path {...S} d="M10 20v-5h4v5" />
    </svg>
  ),
  qr: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2" />
    </svg>
  ),
  copaBebida: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...S} d="M7 3h10l-1 8a4 4 0 0 1-8 0z" />
      <path {...S} d="M12 15v5M8.5 20h7" />
    </svg>
  ),
  plato: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle {...S} cx="12" cy="13" r="7" />
      <circle {...S} cx="12" cy="13" r="3.5" />
      <path {...S} d="M12 3v2" />
    </svg>
  ),
};

/** Arco y rayos dibujados como detalle decorativo (no es el logotipo). */
export function Sun({ className = 'cx-sun' }: { className?: string }) {
  const rays = Array.from({ length: 11 }, (_, i) => {
    const a = Math.PI * (0.06 + (0.88 * i) / 10);
    const r1 = 30;
    const r2 = i % 2 ? 44 : 52;
    return { x1: 60 - Math.cos(a) * r1, y1: 60 - Math.sin(a) * r1, x2: 60 - Math.cos(a) * r2, y2: 60 - Math.sin(a) * r2 };
  });
  return (
    <svg className={className} viewBox="0 0 120 64" aria-hidden>
      <path d="M38 60a22 22 0 0 1 44 0" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {rays.map((r, i) => (
        <line key={i} {...r} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/**
 * Logotipo original recortado (sin redibujar ni deformar): se muestra la zona del arco, el wordmark
 * y «SOCIAL CLUB» sobre su propio fondo de gradiente, en una pastilla con esquinas redondeadas.
 */
export function LogoCrop({ width = 120, label = 'TERRACO Social Club' }: { width?: number; label?: string }) {
  // Región del archivo original (1008×1280) que contiene el logotipo completo.
  const region = { x: 180, y: 410, w: 660, h: 420 };
  const k = width / region.w;
  return (
    <span className="cx-brand" style={{ width, height: Math.round(region.h * k) }} role="img" aria-label={label}>
      <img src={LOGO} alt="" style={{ width: 1008 * k, height: 1280 * k, left: -region.x * k, top: -region.y * k }} />
    </span>
  );
}

/**
 * Versión de trabajo DERIVADA del logotipo original: se calculó la transparencia de cada píxel
 * respecto del gradiente de fondo del archivo (sin redibujar ni deformar). Color crema original.
 * Reemplazar por el archivo transparente o vectorial oficial cuando exista.
 */
export function LogoAlpha({ width = 130, label = 'TERRACO Social Club' }: { width?: number; label?: string }) {
  const height = Math.round((width * 408) / 651);
  // La forma sale del archivo derivado (máscara); el color lo define el tema (borgoña o crema).
  return (
    <span
      className="cx-logo"
      role="img"
      aria-label={`${label} (logotipo · versión de trabajo derivada)`}
      title="Logotipo: versión de trabajo derivada del archivo original, pendiente del archivo oficial"
      data-recurso="logo-derivado-de-trabajo"
      style={{ width, height, ['--logo-src' as string]: `url(${logoAlpha})` }}
    />
  );
}

export function Pill({ tone, glyph, children, className }: { tone?: 'ok' | 'warn' | 'bad' | 'info' | 'accent'; glyph?: string; children: ReactNode; className?: string }) {
  return (
    <span className={`cx-pill ${tone ?? ''} ${className ?? ''}`}>
      {glyph && (
        <span className="g" aria-hidden>
          {glyph}
        </span>
      )}
      {children}
    </span>
  );
}

export function Note({ tone, children }: { tone?: 'warn' | 'bad' | 'ok' | 'info'; children: ReactNode }) {
  return (
    <div className={`cx-note ${tone ?? ''}`} role={tone === 'bad' ? 'alert' : undefined}>
      <div>{children}</div>
    </div>
  );
}

export function Qty({ value, onChange, min = 0, max = 30, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) {
  const [bump, setBump] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 300);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <div className="cx-qty" role="group" aria-label={`Cantidad de ${label}`}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={value - 1 <= 0 && min === 0 ? `Quitar ${label}` : `Restar uno`}>
        −
      </button>
      <output aria-live="polite" className={bump ? 'changed' : ''}>
        {value}
      </output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Sumar uno">
        +
      </button>
    </div>
  );
}

export function Money({ cents }: { cents: number }) {
  return <span className="cx-num">{ars(cents)}</span>;
}

/** Rail horizontal de categorías: sin barra visible, con flecha de «hay más» y teclado. */
export function CategoryRail({ items, active, onSelect, label }: { items: { id: string; label: string }[]; active: string | null; onSelect: (id: string) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);
  const check = () => {
    const el = ref.current;
    if (!el) return;
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };
  useLayoutEffect(check);
  useEffect(() => {
    const el = ref.current;
    el?.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      el?.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-current="true"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [active]);
  return (
    <div className="cx-rail-inner">
      <div ref={ref} className={`cx-rail ${atEnd ? 'at-end' : ''}`} role="toolbar" aria-label={label}>
        {items.map((it) => (
          <button key={it.id} type="button" className="cx-chip" aria-current={active === it.id ? 'true' : undefined} onClick={() => onSelect(it.id)}>
            {it.label}
          </button>
        ))}
      </div>
      <button type="button" className="cx-rail-more" hidden={atEnd} aria-label="Ver más categorías" onClick={() => ref.current?.scrollBy({ left: ref.current.clientWidth * 0.7, behavior: 'smooth' })}>
        <I.chev />
      </button>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="cx-empty">
      <Sun className="" />
      <h2 className="cx-h2">{title}</h2>
      {children && <p className="cx-sub">{children}</p>}
      {action}
    </div>
  );
}
