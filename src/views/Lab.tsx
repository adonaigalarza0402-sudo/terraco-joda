import { useState } from 'react';
import { SCENARIOS } from '../domain/scenarios';
import { DEMO_JORNADA } from '../domain/seed';
import { arDateTime, hhmm, shortDay } from '../domain/time';
import { dispatch, resetDemo, syncInfo, useStore } from '../state/store';
import { Confirm, Link, Notice, QR, Tag, toast } from '../ui/kit';
import { StaffShell } from './staff/Shell';

const ROLE_LINKS: { label: string; href: string }[] = [
  { label: 'Cliente invitado', href: '#/acceso?rol=cliente' },
  { label: 'Caja (Sofía)', href: '#/acceso?rol=caja&staff=st-sofia' },
  { label: 'Cocina (Martín)', href: '#/acceso?rol=cocina&staff=st-martin' },
  { label: 'Barra (Ana)', href: '#/acceso?rol=barra&staff=st-ana' },
  { label: 'Barra 2 (Leo)', href: '#/acceso?rol=barra&staff=st-leo' },
  { label: 'Entrega (Juli)', href: '#/acceso?rol=entrega&staff=st-juli' },
  { label: 'Encargado (Nico)', href: '#/acceso?rol=encargado&staff=st-nico' },
  { label: 'Dueño', href: '#/acceso?rol=dueno&staff=st-duenio' },
  { label: 'DJ ZETA', href: '#/acceso?rol=dj&staff=st-aurora' },
  { label: 'Asistente del DJ (Fede)', href: '#/acceso?rol=dj_asistente&staff=st-fede' },
  { label: 'Pantalla pública (TV)', href: '#/pantalla' },
];

/** Herramientas de demostración: fuera de la navegación del cliente. */
export function Lab() {
  const s = useStore((x) => x);
  const pending = false;
  const [reset, setReset] = useState<string | null>(null);
  const info = syncInfo();
  // Las herramientas actúan como el encargado de demostración para no depender del rol de la pestaña.
  const asLab = async (cmd: Parameters<typeof dispatch>[0]) => {
    const r = await dispatch(cmd, undefined, { role: 'encargado', staffId: 'st-nico' });
    toast(r.message, r.ok ? 'ok' : 'bad');
  };
  const jump = (hh: string) => {
    const t = arDateTime(DEMO_JORNADA, hh) + (Number(hh.slice(0, 2)) < 8 ? 24 * 3600_000 : 0);
    if (t <= s.now) return toast('El reloj no retrocede. Reiniciá un escenario para volver atrás.', 'bad');
    asLab({ type: 'clock.set', at: t });
  };
  return (
    <StaffShell title="Herramientas de demostración">
      <div className="stack">
        <Notice tone="warn">
          Estas herramientas existen solo para evaluar la demo: cambiar de rol, mover el reloj, cargar escenarios y simular fallas. No forman parte de la operación diaria. {s.escenario && <Tag tone="info">Escenario: {s.escenario}</Tag>}
        </Notice>
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <section className="card stack-sm">
            <h2>Reloj de demo</h2>
            <p className="code-big num">
              {shortDay(s.now)} {hhmm(s.now)}
            </p>
            <p className="xsmall muted">Reloj controlado y compartido por todas las pestañas. Está detenido: avanza solo con estos botones. Vencimientos, cierres de encuesta y alertas se evalúan al avanzar.</p>
            <div className="row-wrap">
              {[1, 5, 15, 30, 60].map((m) => (
                <button key={m} className="btn btn-sm" disabled={pending} onClick={() => asLab({ type: 'clock.advance', minutes: m })}>
                  +{m} min
                </button>
              ))}
            </div>
            <div className="row-wrap">
              {['22:30', '00:20', '00:30', '01:00', '03:00'].map((h) => (
                <button key={h} className="btn btn-sm btn-ghost" onClick={() => jump(h)}>
                  Ir a {h}
                </button>
              ))}
            </div>
          </section>
          <section className="card stack-sm">
            <h2>Abrir vistas en pestañas</h2>
            <p className="xsmall muted">Cada pestaña guarda su propio rol y carrito. Abrí varias para ver cómo se actualizan juntas.</p>
            <div className="row-wrap">
              {ROLE_LINKS.map((l) => (
                <a key={l.href} className="btn btn-sm" href={l.href} target="_blank" rel="noreferrer">
                  {l.label} ↗
                </a>
              ))}
            </div>
          </section>
          <section className="card stack-sm">
            <h2>Fallas simuladas</h2>
            {(['cocina', 'barra'] as const).map((e) => (
              <div key={e} className="row between">
                <span>
                  {e === 'cocina' ? 'Cocina' : 'Barra'}: {s.stations[e].online ? <Tag tone="ok">en línea</Tag> : <Tag tone="bad">sin conexión</Tag>}
                </span>
                <button className={`btn btn-sm ${s.stations[e].online ? 'btn-danger' : 'btn-ok'}`} onClick={() => asLab({ type: 'station.setOnline', estacion: e, online: !s.stations[e].online })}>
                  {s.stations[e].online ? 'Cortar recepción' : 'Reconectar'}
                </button>
              </div>
            ))}
            <label className="check">
              <input type="checkbox" checked={s.config.contingencia} onChange={(e) => asLab({ type: 'config.set', patch: { contingencia: e.target.checked } })} />
              <span className="small">Procedimiento de contingencia (caja numerada + recepción manual)</span>
            </label>
            <p className="xsmall muted">Pagos pendientes, rechazos y aprobaciones tardías se simulan desde el pedido (cliente o caja). Devoluciones fallidas, desde Incidencias.</p>
          </section>
          <section className="card stack-sm">
            <h2>Mesas (QR permanente)</h2>
            <p className="xsmall muted">Cada QR identifica la mesa. La ocupación cambia al reutilizarla: un QR viejo no muestra pedidos anteriores.</p>
            <div className="grid-3">
              {s.tables.map((t) => {
                const ts = s.tableSessions.filter((x) => x.mesaId === t.id && !x.cerradaEn).at(-1);
                const url = `${location.origin}${location.pathname}#/mesa/${t.id}`;
                return (
                  <div key={t.id} className="card tight stack-xs" style={{ alignItems: 'center', textAlign: 'center' }}>
                    <strong>{t.nombre}</strong>
                    <QR value={url} label={`QR de ${t.nombre}`} />
                    <span className="xsmall muted">ocupación desde {ts ? hhmm(ts.abiertaEn) : '—'}</span>
                    <div className="row-wrap" style={{ justifyContent: 'center' }}>
                      <a className="btn btn-sm" href={`#/mesa/${t.id}`} target="_blank" rel="noreferrer">
                        Abrir ↗
                      </a>
                      <button className="btn btn-sm btn-ghost" onClick={() => asLab({ type: 'table.newSession', mesaId: t.id })}>
                        Nueva ocupación
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
        <section className="card stack-sm">
          <h2>Escenarios</h2>
          <p className="xsmall muted">Cargar un escenario reemplaza todos los datos de la demo en este navegador (todas las pestañas) por la semilla más el escenario. Pide confirmación.</p>
          <div className="grid-3">
            {SCENARIOS.map((sc) => (
              <div key={sc.id} className="card tight stack-xs">
                <strong>{sc.titulo}</strong>
                <span className="small muted">{sc.descripcion}</span>
                <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setReset(sc.id)}>
                  Cargar
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="card stack-sm">
          <h2>Estado técnico de la demo</h2>
          <ul className="small stack-xs" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Revisión del estado: {s.rev} · persistencia local: {info.storageOk ? 'activa' : 'no disponible (solo memoria)'}</li>
            <li>Autoridad única entre pestañas (Web Locks): {info.locks ? 'disponible' : 'no disponible en este navegador'}</li>
            <li>Sincronización entre pestañas (BroadcastChannel): {info.broadcast ? 'disponible' : 'no disponible'}</li>
            <li>No sincroniza teléfonos de distintas personas ni reemplaza un servidor. Ver <Link to="/limites">Límites</Link>.</li>
          </ul>
          <button className="btn btn-danger" style={{ alignSelf: 'flex-start' }} onClick={() => setReset('base')}>
            Reiniciar demo…
          </button>
        </section>
      </div>
      <Confirm
        open={!!reset}
        onClose={() => setReset(null)}
        title="¿Reemplazar los datos de la demo?"
        confirmLabel="Reiniciar"
        tone="danger"
        requireText="REINICIAR"
        onConfirm={async () => {
          await resetDemo(reset!);
          toast('Demo reiniciada', 'ok');
        }}
      >
        <p>Se borran pedidos, reservas, votos y cambios hechos en este navegador y se carga «{SCENARIOS.find((x) => x.id === reset)?.titulo}». Las demás pestañas se actualizan. No afecta a nada externo.</p>
      </Confirm>
    </StaffShell>
  );
}
