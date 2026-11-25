import { useEffect } from 'react';
import { ROLE_HOME, ROLE_LABEL } from '../domain/roles';
import type { Role } from '../domain/types';
import { session, useSession } from '../state/session';
import { useStore } from '../state/store';
import { ISO } from '../ui/derive';
import { Link, navigate, Notice, useRoute } from '../ui/kit';

export function enter(role: Role, staffId: string | null, profileId: string | null = null) {
  session.set({ role, staffId, profileId: role === 'cliente_id' ? profileId : role === 'cliente' ? null : session.get().profileId });
  navigate(ROLE_HOME[role]);
}

export function Access() {
  const s = useStore((x) => x);
  const ses = useSession();
  const { query } = useRoute();
  useEffect(() => {
    const rol = query.get('rol') as Role | null;
    if (rol && ROLE_LABEL[rol]) enter(rol, query.get('staff'), query.get('perfil'));
  }, [query]);
  return (
    <div className="app-root theme-ops" style={{ minHeight: '100dvh' }}>
      <main className="staff-main stack" style={{ maxWidth: 980 }}>
        <div className="row" style={{ gap: 14 }}>
          <span style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flex: 'none' }}>
            <img src={ISO} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(2.1)' }} />
          </span>
          <div>
            <h1 className="display">Acceso de demostración</h1>
            <p className="small muted">Elegí cómo querés usar la demo en esta pestaña. No es un inicio de sesión seguro: cualquiera puede elegir cualquier rol.</p>
          </div>
        </div>
        <Notice tone="warn">Los permisos de cada rol son reglas de esta demo en el navegador, no una autorización de servidor. Ver <Link to="/limites">Límites</Link>.</Notice>
        <section className="stack-sm">
          <h2>Público</h2>
          <div className="grid-3">
            <button className="card card-link stack-xs" style={{ textAlign: 'left', font: 'inherit', cursor: 'pointer' }} onClick={() => enter('cliente', null)}>
              <strong>Cliente invitado</strong>
              <span className="small muted">Carta, pedidos, reserva y encuesta sin cuenta.</span>
            </button>
            {s.profiles.map((p) => (
              <button key={p.id} className="card card-link stack-xs" style={{ textAlign: 'left', font: 'inherit', cursor: 'pointer' }} onClick={() => enter('cliente_id', null, p.id)}>
                <strong>{p.alias}</strong>
                <span className="small muted">Cliente identificado de prueba: beneficios y cupones.</span>
              </button>
            ))}
          </div>
        </section>
        <section className="stack-sm">
          <h2>Equipo de TERRACO (personas ficticias)</h2>
          <div className="grid-3">
            {s.staff.flatMap((st) =>
              st.roles.map((r) => (
                <button key={st.id + r} className="card card-link stack-xs" aria-current={ses.staffId === st.id && ses.role === r ? 'true' : undefined} style={{ textAlign: 'left', font: 'inherit', cursor: 'pointer' }} onClick={() => enter(r, st.id)}>
                  <strong>{ROLE_LABEL[r]}</strong>
                  <span className="small muted">{st.nombre}</span>
                </button>
              )),
            )}
            <Link to="/pantalla" className="card card-link stack-xs">
              <strong>Pantalla pública (TV)</strong>
              <span className="small muted">Códigos listos y encuesta, sin datos privados.</span>
            </Link>
            <Link to="/demo" className="card card-link stack-xs">
              <strong>Herramientas de demostración</strong>
              <span className="small muted">Reloj, escenarios, fallas, mesas y reinicio.</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
