import QRCode from 'qrcode';
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Command } from '../domain/engine';
import { ars } from '../domain/money';
import type { Result } from '../domain/types';
import { dispatch, newId } from '../state/store';

// ------------------------------------------------------------------ router (hash)
function parse() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { path: path || '/', query: new URLSearchParams(qs ?? '') };
}
let route = parse();
const routeListeners = new Set<() => void>();
window.addEventListener('hashchange', () => {
  const prevPath = route.path;
  route = parse();
  routeListeners.forEach((l) => l());
  // Solo se vuelve arriba al cambiar de pantalla; abrir o cerrar un detalle conserva la posición.
  if (route.path !== prevPath) window.scrollTo({ top: 0 });
});
export function useRoute() {
  return useSyncExternalStore(
    (cb) => {
      routeListeners.add(cb);
      return () => routeListeners.delete(cb);
    },
    () => route,
  );
}
export function navigate(to: string) {
  location.hash = to;
}
export function Link({ to, children, className, ...rest }: { to: string; children: ReactNode; className?: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={`#${to}`} className={className} {...rest}>
      {children}
    </a>
  );
}

// ------------------------------------------------------------------ toasts
type Toast = { id: number; msg: string; tone: 'ok' | 'bad' | 'info' };
let toasts: Toast[] = [];
let tid = 0;
const toastListeners = new Set<() => void>();
export function toast(msg: string, tone: Toast['tone'] = 'info') {
  const t = { id: ++tid, msg, tone };
  toasts = [...toasts.slice(-2), t];
  toastListeners.forEach((l) => l());
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    toastListeners.forEach((l) => l());
  }, 4200);
}
export function Toasts() {
  const list = useSyncExternalStore(
    (cb) => {
      toastListeners.add(cb);
      return () => toastListeners.delete(cb);
    },
    () => toasts,
  );
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          <span aria-hidden>{t.tone === 'ok' ? '✓' : t.tone === 'bad' ? '!' : 'i'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ acciones
/** Ejecuta un comando con estado de espera y aviso. Mantiene el mismo cid mientras está en curso (doble toque). */
export function useAction() {
  const [pending, setPending] = useState(false);
  const inflight = useRef<string | null>(null);
  async function run(cmd: Command, opts: { quiet?: boolean; cid?: string; silentError?: boolean } = {}): Promise<Result> {
    const cid = opts.cid ?? inflight.current ?? newId();
    inflight.current = cid;
    setPending(true);
    try {
      const r = await dispatch(cmd, cid);
      if (!opts.quiet && (r.ok || !opts.silentError)) toast(r.message, r.ok ? (r.code === 'repetido' ? 'info' : 'ok') : 'bad');
      return r;
    } finally {
      inflight.current = null;
      setPending(false);
    }
  }
  return { run, pending };
}

// ------------------------------------------------------------------ piezas
export function Money({ cents, className }: { cents: number; className?: string }) {
  return <span className={`num ${className ?? ''}`}>{ars(cents)}</span>;
}

export function Notice({ tone = 'info', children, icon }: { tone?: 'info' | 'warn' | 'bad' | 'ok'; children: ReactNode; icon?: string }) {
  return (
    <div className={`notice ${tone}`} role={tone === 'bad' ? 'alert' : undefined}>
      <span className="n-icon" aria-hidden>
        {icon ?? (tone === 'ok' ? '✓' : tone === 'bad' ? '!' : tone === 'warn' ? '!' : 'i')}
      </span>
      <div className="grow">{children}</div>
    </div>
  );
}

export function Tag({ tone, glyph, children, className }: { tone?: 'ok' | 'warn' | 'bad' | 'info' | 'accent'; glyph?: string; children: ReactNode; className?: string }) {
  return (
    <span className={`tag ${tone ?? ''} ${className ?? ''}`}>
      {glyph && (
        <span className="glyph" aria-hidden>
          {glyph}
        </span>
      )}
      {children}
    </span>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p className="small">{children}</p>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

export function Field({ label, hint, error, children, id }: { label: string; hint?: string; error?: string; children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode; id?: string }) {
  const auto = useId();
  const fid = id ?? auto;
  const desc = [hint ? `${fid}-h` : '', error ? `${fid}-e` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={fid}>{label}</label>
      {children({ id: fid, 'aria-invalid': error ? true : undefined, 'aria-describedby': desc })}
      {hint && (
        <span id={`${fid}-h`} className="hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${fid}-e`} className="error">
          {error}
        </span>
      )}
    </div>
  );
}

export function Sheet({ open, onClose, title, children, labelledBy }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const hid = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    setTimeout(() => ref.current?.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus(), 30);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy ?? hid} ref={ref}>
        <div className="sheet-head">
          <h2 id={hid} className="display" style={{ fontSize: '1.6rem' }}>
            {title}
          </h2>
          <button className="btn btn-ghost icon-btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ open, title, children, confirmLabel, tone, onConfirm, onClose, requireText }: { open: boolean; title: string; children: ReactNode; confirmLabel: string; tone?: 'danger' | 'primary'; onConfirm: () => void; onClose: () => void; requireText?: string }) {
  const [txt, setTxt] = useState('');
  useEffect(() => setTxt(''), [open]);
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="stack">
        <div className="stack-sm">{children}</div>
        {requireText && (
          <Field label={`Escribí ${requireText} para confirmar`}>
            {(p) => <input className="input" {...p} value={txt} onChange={(e) => setTxt(e.target.value)} autoComplete="off" />}
          </Field>
        )}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>
            Volver
          </button>
          <button
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            disabled={!!requireText && txt.trim().toUpperCase() !== requireText}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

export function QR({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#291020', light: '#ffffff' } })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [value]);
  return <div className="qr-box" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 30, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Restar uno: ${label}`} disabled={value <= min}>
        −
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`Sumar uno: ${label}`} disabled={value >= max}>
        +
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ íconos (trazo simple)
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
export const Icon = {
  carta: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...P} d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path {...P} d="M9 9h6M9 13h6" />
    </svg>
  ),
  pedido: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...P} d="M6 7h12l-1 13H7z" />
      <path {...P} d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  ),
  noche: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...P} d="M4 18h16" />
      <path {...P} d="M7 18a5 5 0 0 1 10 0" />
      <path {...P} d="M12 4v3M5 8l2 2M19 8l-2 2" />
    </svg>
  ),
  beneficios: () => (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path {...P} d="M4 10h16v10H4z" />
      <path {...P} d="M12 10v10M4 14h16" />
      <path {...P} d="M12 10c-2-4-6-4-6-1.5S10 10 12 10c2 0 6 .5 6-1.5S14 6 12 10" />
    </svg>
  ),
};
