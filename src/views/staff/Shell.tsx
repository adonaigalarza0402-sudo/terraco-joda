import type { ReactNode } from 'react';
import { ROLE_LABEL } from '../../domain/roles';
import { hhmm, shortDay } from '../../domain/time';
import { useSession } from '../../state/session';
import { useStore } from '../../state/store';
import { ISO } from '../../ui/derive';
import { Link } from '../../ui/kit';

export function StationPills() {
  const st = useStore((s) => s.stations);
  const now = useStore((s) => s.now);
  return (
    <div className="row-wrap">
      {(['cocina', 'barra'] as const).map((e) => (
        <span key={e} className={`station-pill ${st[e].online ? '' : 'off'}`} title={`Última sincronización ${hhmm(st[e].ultimaSync)}`}>
          <span className="dot" aria-hidden />
          {e === 'cocina' ? 'Cocina' : 'Barra'}: {st[e].online ? 'en línea' : `sin conexión desde ${hhmm(st[e].caidaDesde ?? now)}`}
        </span>
      ))}
    </div>
  );
}

export function DemoClock() {
  const now = useStore((s) => s.now);
  return (
    <Link to="/demo" className="station-pill" title="Reloj de demostración controlado: se avanza desde Herramientas de demostración" style={{ textDecoration: 'none', color: 'inherit' }}>
      <span aria-hidden>◷</span>
      <span className="num">
        {shortDay(now)} {hhmm(now)}
      </span>
      <span className="muted">· reloj demo</span>
    </Link>
  );
}

export function StaffShell({ title, children, nav, wide = true }: { title: string; children: ReactNode; nav?: ReactNode; wide?: boolean }) {
  const ses = useSession();
  const staff = useStore((s) => s.staff.find((x) => x.id === ses.staffId));
  return (
    <div className="app-root theme-ops staff">
      <a className="sr-only" href="#contenido">
        Saltar al contenido
      </a>
      <header className="staff-top">
        <div className="staff-top-inner">
          <Link to="/acceso" className="staff-brand" aria-label="Cambiar acceso de demostración">
            <span className="iso">
              <img src={ISO} alt="" />
            </span>
            <span className="stack-xs" style={{ gap: 0 }}>
              <strong>{title}</strong>
              <span className="xsmall muted">
                {staff ? `${staff.nombre} · ` : ''}
                {ROLE_LABEL[ses.role]} · acceso de demostración
              </span>
            </span>
          </Link>
          <span className="grow" />
          <StationPills />
          <DemoClock />
          <Link to="/limites" className="demo-flag">
            Demo · datos y pagos de prueba
          </Link>
        </div>
        {nav && <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 8px' }}>{nav}</div>}
      </header>
      <main id="contenido" className="staff-main" style={wide ? undefined : { maxWidth: 900 }}>
        {children}
      </main>
    </div>
  );
}
