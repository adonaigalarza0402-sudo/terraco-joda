import { useMemo, useState } from 'react';
import { PRODUCTS, type Station } from '../../domain/catalog';
import { sellCheck } from '../../domain/engine';
import { ago, hhmm } from '../../domain/time';
import type { Order, OrderLine, State, Unit } from '../../domain/types';
import { useSession } from '../../state/session';
import { useStore } from '../../state/store';
import { pickupPoint, UNIT_LABEL } from '../../ui/derive';
import { Empty, Field, Notice, Sheet, Stepper, Tag, Tabs, useAction } from '../../ui/kit';
import { StaffShell } from './Shell';

type View = 'pedidos' | 'agrupada' | 'mesas' | 'disponibilidad';

function stationOrders(s: State, e: Station) {
  return s.orders
    .filter((o) => (o.estado === 'activo' || o.estado === 'completado') && o.lineas.some((l) => l.estacion === e))
    .sort((a, b) => (a.pagadoEn ?? a.creadoEn) - (b.pagadoEn ?? b.creadoEn));
}

function linesOf(o: Order, e: Station) {
  return o.lineas.filter((l) => l.estacion === e);
}

function columnOf(o: Order, e: Station): 'pendiente' | 'prep' | 'listo' | null {
  const us = linesOf(o, e).flatMap((l) => l.unidades).filter((u) => u.estado !== 'cancelada' && u.estado !== 'entregada');
  if (!us.length) return null;
  if (us.some((u) => u.estado === 'en_preparacion')) return 'prep';
  if (us.some((u) => u.estado === 'pendiente')) {
    const t = o.tickets.find((x) => x.estacion === e);
    return t?.tomadoPor ? 'prep' : 'pendiente';
  }
  return 'listo';
}

export function StationView({ estacion }: { estacion: Station }) {
  const s = useStore((x) => x);
  const [view, setView] = useState<View>('pedidos');
  const orders = stationOrders(s, estacion);
  const cols = { pendiente: [] as Order[], prep: [] as Order[], listo: [] as Order[] };
  for (const o of orders) {
    const c = columnOf(o, estacion);
    if (c) cols[c].push(o);
  }
  const unreceived = orders.filter((o) => o.estado === 'activo' && o.tickets.some((t) => t.estacion === estacion && !t.recibidoEn));
  const st = s.stations[estacion];
  const title = estacion === 'cocina' ? 'Cocina' : 'Barra';
  const unitsPending = cols.pendiente.concat(cols.prep).flatMap((o) => linesOf(o, estacion).flatMap((l) => l.unidades)).filter((u) => u.estado === 'pendiente' || u.estado === 'en_preparacion').length;

  const nav = (
    <Tabs
      label="Vistas de la estación"
      value={view}
      onChange={setView}
      options={[
        { value: 'pedidos', label: `Por pedido (${cols.pendiente.length + cols.prep.length})` },
        { value: 'agrupada', label: 'Producción agrupada' },
        ...(estacion === 'cocina' ? [{ value: 'mesas' as View, label: 'Coordinación de mesa' }] : []),
        { value: 'disponibilidad', label: 'Disponibilidad' },
      ]}
    />
  );

  return (
    <StaffShell title={title} nav={nav}>
      <div className="stack">
        {!st.online && (
          <Notice tone="bad">
            <strong>{title} sin conexión (simulado).</strong> Lo que ves puede estar desactualizado (última sincronización {hhmm(st.ultimaSync)}). Pedidos nuevos de {title.toLowerCase()} están pausados. Seguí con los pedidos anteriores y avisá al encargado.
          </Notice>
        )}
        {unreceived.length > 0 && (
          <Notice tone="warn">
            {unreceived.length} pedido(s) cobrados sin recepción en esta estación: {unreceived.map((o) => o.codigo).join(', ')}. Se registran una sola vez al reconectar{s.config.contingencia ? ' o con recepción manual de contingencia' : ''}.
          </Notice>
        )}
        <div className="row-wrap small muted">
          <span>
            Carga: <strong className="num">{unitsPending}</strong> unidad(es) por preparar · <strong className="num">{cols.listo.length}</strong> pedido(s) esperando retiro.
          </span>
          <span>Sin estimación de minutos: no hay una base medida (ver Límites).</span>
        </div>
        {view === 'pedidos' && <ByOrder s={s} estacion={estacion} cols={cols} />}
        {view === 'agrupada' && <Grouped s={s} estacion={estacion} orders={cols.pendiente.concat(cols.prep)} />}
        {view === 'mesas' && <Tables s={s} orders={cols.pendiente.concat(cols.prep, cols.listo)} />}
        {view === 'disponibilidad' && <Availability estacion={estacion} />}
      </div>
    </StaffShell>
  );
}

function ByOrder({ s, estacion, cols }: { s: State; estacion: Station; cols: Record<'pendiente' | 'prep' | 'listo', Order[]> }) {
  const heads: [keyof typeof cols, string, string][] = [
    ['pendiente', 'Pendientes', '○'],
    ['prep', 'En preparación', '◐'],
    ['listo', 'Listos para retirar', '●'],
  ];
  return (
    <div className="queue">
      {heads.map(([k, label, glyph]) => (
        <section key={k} className="q-col" aria-labelledby={`col-${k}`}>
          <header>
            <h2 id={`col-${k}`} className="row" style={{ fontSize: '1rem' }}>
              <span aria-hidden>{glyph}</span> {label}
            </h2>
            <span className="tag num">{cols[k].length}</span>
          </header>
          {!cols[k].length && <p className="small muted" style={{ padding: '4px 6px' }}>{k === 'pendiente' ? 'Sin pedidos nuevos.' : k === 'prep' ? 'Nada en preparación.' : 'Nada esperando retiro.'}</p>}
          {cols[k].map((o) => (
            <TicketCard key={o.id} s={s} o={o} estacion={estacion} col={k} />
          ))}
        </section>
      ))}
    </div>
  );
}

function TicketCard({ s, o, estacion, col }: { s: State; o: Order; estacion: Station; col: 'pendiente' | 'prep' | 'listo' }) {
  const ses = useSession();
  const { run, pending } = useAction();
  const [fix, setFix] = useState<null | 'revert' | 'cancel'>(null);
  const t = o.tickets.find((x) => x.estacion === estacion);
  const lines = linesOf(o, estacion);
  const waiting = o.pagadoEn ? ago(s.now, o.pagadoEn) : '';
  const takenBy = t?.tomadoPor ? s.staff.find((x) => x.id === t.tomadoPor)?.nombre ?? t.tomadoPor : null;
  const liveUnits = lines.flatMap((l) => l.unidades).filter((u) => u.estado === 'pendiente' || u.estado === 'en_preparacion');
  const readyUnits = lines.flatMap((l) => l.unidades).filter((u) => u.estado === 'lista');
  const received = !!t?.recibidoEn || !!t?.recepcionManual;
  const alert = o.alertas.includes('listo') && col === 'listo';
  const old = o.pagadoEn && s.now - o.pagadoEn > 15 * 60_000 && col !== 'listo';
  return (
    <article className={`ticket ${alert ? 'alert' : ''}`} aria-label={`Pedido ${o.codigo}`}>
      <div className="row between">
        <span className="t-code">{o.codigo}</span>
        <span className="row-wrap">
          {o.canal === 'caja' && <Tag className="square">Caja</Tag>}
          {o.modalidad === 'mesa' && estacion === 'cocina' && <Tag className="square" tone="info">{pickupPoint(s, o, 'cocina')}</Tag>}
          {o.contingencia && <Tag tone="warn" className="square">Contingencia</Tag>}
          <Tag tone={old ? 'warn' : undefined} glyph="◷">
            {waiting}
          </Tag>
        </span>
      </div>
      {!received && <Tag tone="bad" glyph="!">Sin recepción registrada</Tag>}
      <ul>
        {lines.map((l) => (
          <LineRow key={l.id} l={l} />
        ))}
      </ul>
      {takenBy && col !== 'listo' && <span className="xsmall muted">Tomado por {takenBy} · {hhmm(t!.tomadoEn!)}</span>}
      {col === 'listo' && <span className="xsmall muted">Retiro: {pickupPoint(s, o, estacion)}{alert ? ' · listo hace rato: revisar calidad y avisar en persona' : ''}</span>}
      <div className="row-wrap">
        {col === 'pendiente' && received && (
          <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => run({ type: 'station.take', orderId: o.id, estacion })}>
            Tomar pedido
          </button>
        )}
        {!received && s.config.contingencia && (
          <button className="btn btn-sm" disabled={pending} onClick={() => run({ type: 'station.manualReceipt', orderId: o.id, estacion })}>
            Registrar recepción manual
          </button>
        )}
        {col !== 'listo' && received && liveUnits.length > 0 && (
          <button className="btn btn-ok btn-sm" disabled={pending} onClick={() => run({ type: 'units.ready', unitIds: liveUnits.map((u) => u.id) })}>
            {col === 'pendiente' ? 'Marcar listo' : 'Todo listo'} ({liveUnits.length})
          </button>
        )}
        {col === 'listo' && readyUnits.length > 0 && (
          <button className="btn btn-sm" onClick={() => setFix('revert')}>
            Corregir estado
          </button>
        )}
        {col !== 'listo' && liveUnits.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFix('cancel')}>
            No se puede preparar
          </button>
        )}
      </div>
      <FixSheet open={!!fix} mode={fix} onClose={() => setFix(null)} o={o} estacion={estacion} actorRole={ses.role} />
    </article>
  );
}

function LineRow({ l }: { l: OrderLine }) {
  const { run, pending } = useAction();
  const live = l.unidades.filter((u) => u.estado !== 'cancelada');
  const counts = (['pendiente', 'en_preparacion', 'lista', 'entregada'] as const).map((k) => [k, l.unidades.filter((u) => u.estado === k).length] as const).filter(([, n]) => n);
  const next = l.unidades.find((u) => u.estado === 'pendiente' || u.estado === 'en_preparacion');
  return (
    <li style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
      <div className="row" style={{ alignItems: 'baseline' }}>
        <span className="qty">{live.length}×</span>
        <span className="grow">
          <strong>{l.nombre}</strong>
          {l.sabor && <strong style={{ color: 'var(--accent)' }}> · {l.sabor}</strong>}
          <span className="small muted"> · {l.presentacion}</span>
          {l.modificadores.map((m) => (
            <span key={m.id} className="small" style={{ color: 'var(--warn)' }}>
              {' '}
              · {m.etiqueta}
            </span>
          ))}
        </span>
        {next && live.length > 1 && (
          <button className="btn btn-sm" disabled={pending} onClick={() => run({ type: 'units.ready', unitIds: [next.id] })} aria-label={`Marcar una unidad de ${l.nombre} lista`}>
            +1 lista
          </button>
        )}
      </div>
      {l.nota && <span className="xsmall" style={{ background: 'var(--warn-bg)', padding: '2px 8px', borderRadius: 6 }}>Nota del cliente (no es garantía): {l.nota}</span>}
      <span className="row-wrap">
        {counts.map(([k, n]) => (
          <Tag key={k} tone={UNIT_LABEL[k].tone} glyph={UNIT_LABEL[k].glyph} className="xsmall">
            {n} {UNIT_LABEL[k].label.toLowerCase()}
          </Tag>
        ))}
      </span>
    </li>
  );
}

function FixSheet({ open, mode, onClose, o, estacion }: { open: boolean; mode: null | 'revert' | 'cancel'; onClose: () => void; o: Order; estacion: Station; actorRole: string }) {
  const { run, pending } = useAction();
  const [sel, setSel] = useState<string[]>([]);
  const [motivo, setMotivo] = useState('');
  const units = linesOf(o, estacion).flatMap((l) => l.unidades.map((u, i) => ({ u, l, i }))).filter(({ u }) => (mode === 'revert' ? u.estado === 'lista' : u.estado === 'pendiente' || u.estado === 'en_preparacion'));
  return (
    <Sheet open={open} onClose={onClose} title={mode === 'revert' ? `Corregir ${o.codigo}` : `No se puede preparar · ${o.codigo}`}>
      <div className="stack">
        <p className="small muted">{mode === 'revert' ? 'Vuelve a «en preparación» una unidad marcada lista por error. Queda registrado quién y por qué.' : 'Cancela las unidades elegidas y crea una devolución parcial simulada. No se sustituye nada sin consultar al cliente.'}</p>
        <div className="stack-xs">
          {units.map(({ u, l, i }) => (
            <label key={u.id} className="check">
              <input type="checkbox" checked={sel.includes(u.id)} onChange={(e) => setSel(e.target.checked ? [...sel, u.id] : sel.filter((x) => x !== u.id))} />
              <span>
                {l.nombre}
                {l.sabor && ` · ${l.sabor}`} <span className="muted small">(unidad {i + 1})</span>
              </span>
            </label>
          ))}
        </div>
        <Field label="Motivo">{(p) => <input {...p} className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder={mode === 'revert' ? 'Ej.: lo marqué sin terminar' : 'Ej.: se terminó la pulpa de maracuyá'} />}</Field>
        <button
          className={`btn ${mode === 'cancel' ? 'btn-danger' : 'btn-primary'}`}
          disabled={pending || !sel.length || motivo.trim().length < 3}
          onClick={async () => {
            const r = await run(mode === 'revert' ? { type: 'units.revert', unitIds: sel, motivo } : { type: 'units.cannotFulfill', unitIds: sel, motivo });
            if (r.ok) {
              setSel([]);
              setMotivo('');
              onClose();
            }
          }}
        >
          {mode === 'revert' ? 'Registrar corrección' : `Cancelar ${sel.length} unidad(es)`}
        </button>
      </div>
    </Sheet>
  );
}

interface Group {
  key: string;
  nombre: string;
  detalle: string;
  units: { u: Unit; o: Order; l: OrderLine }[];
}

function Grouped({ s, estacion, orders }: { s: State; estacion: Station; orders: Order[] }) {
  const { run, pending } = useAction();
  const [open, setOpen] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const groups = useMemo(() => {
    const m = new Map<string, Group>();
    for (const o of orders)
      for (const l of linesOf(o, estacion)) {
        if (!o.tickets.find((t) => t.estacion === estacion)?.recibidoEn && !o.tickets.find((t) => t.estacion === estacion)?.recepcionManual) continue;
        const key = [l.presKey, l.sabor ?? '', l.modificadores.map((x) => x.id).join('+'), l.nota ?? ''].join('|');
        const g = m.get(key) ?? { key, nombre: l.nombre, detalle: [l.presentacion, l.sabor, ...l.modificadores.map((x) => x.etiqueta), l.nota ? `Nota: ${l.nota}` : null].filter(Boolean).join(' · '), units: [] };
        for (const u of l.unidades) if (u.estado === 'pendiente' || u.estado === 'en_preparacion') g.units.push({ u, o, l });
        m.set(key, g);
      }
    return [...m.values()].filter((g) => g.units.length).sort((a, b) => (a.units[0].o.pagadoEn ?? 0) - (b.units[0].o.pagadoEn ?? 0));
  }, [orders, estacion]);
  if (!groups.length) return <Empty title="Nada para producir">La vista agrupada suma unidades pendientes por producto y variante exacta.</Empty>;
  return (
    <div className="stack-sm">
      <p className="small muted">Agrupa solo lo que ya está en cola, por producto y variantes exactas. No espera pedidos futuros. Al marcar N listas se toman las unidades más antiguas.</p>
      {groups.map((g) => {
        const n = Math.min(qty[g.key] ?? g.units.length, g.units.length);
        return (
          <div key={g.key} className="card tight stack-sm">
            <div className="row between" style={{ flexWrap: 'wrap' }}>
              <div className="row grow" style={{ minWidth: 220 }}>
                <span className="code-big num" style={{ fontSize: '1.8rem', minWidth: 52 }}>
                  {g.units.length}×
                </span>
                <div className="stack-xs">
                  <strong>{g.nombre}</strong>
                  <span className="small muted">{g.detalle}</span>
                  <span className="xsmall muted">Más antiguo: {g.units[0].o.codigo} · {ago(s.now, g.units[0].o.pagadoEn ?? s.now)}</span>
                </div>
              </div>
              <div className="row">
                <Stepper value={n} min={1} max={g.units.length} onChange={(v) => setQty({ ...qty, [g.key]: v })} label={`Unidades de ${g.nombre}`} />
                <button className="btn btn-ok" disabled={pending} onClick={() => run({ type: 'units.ready', unitIds: g.units.slice(0, n).map((x) => x.u.id) })}>
                  Marcar {n} lista{n > 1 ? 's' : ''}
                </button>
              </div>
            </div>
            <button className="link-btn small" style={{ alignSelf: 'flex-start' }} aria-expanded={open === g.key} onClick={() => setOpen(open === g.key ? null : g.key)}>
              {open === g.key ? 'Ocultar pedidos' : 'Ver qué pedidos lo componen'}
            </button>
            {open === g.key && (
              <ul className="small stack-xs" style={{ margin: 0, paddingLeft: 18 }}>
                {g.units.map((x, i) => (
                  <li key={x.u.id} style={{ fontWeight: i < n ? 700 : 400 }}>
                    {x.o.codigo} · unidad de {x.l.cantidad} · {UNIT_LABEL[x.u.estado].label.toLowerCase()} {i < n && '← se marca'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Tables({ s, orders }: { s: State; orders: Order[] }) {
  const bySession = new Map<string, Order[]>();
  for (const o of orders) if (o.mesaSesionId) bySession.set(o.mesaSesionId, [...(bySession.get(o.mesaSesionId) ?? []), o]);
  return (
    <div className="stack-sm">
      <Notice>Agrupación visual por ocupación de mesa. Cocina decide si coordina: no hay esperas automáticas ni se retienen bebidas. Cada compra mantiene su importe, pagador y comprobante.</Notice>
      {!bySession.size && <Empty title="Sin pedidos con mesa">Aparecen cuando alguien pide desde el QR de una mesa (Laboratorio → Mesas).</Empty>}
      <div className="grid-2">
        {[...bySession.entries()].map(([sid, os]) => {
          const ts = s.tableSessions.find((t) => t.id === sid);
          const mesa = s.tables.find((t) => t.id === ts?.mesaId);
          return (
            <div key={sid} className="card stack-sm">
              <div className="row between">
                <strong>{mesa?.nombre ?? 'Mesa'}</strong>
                <span className="xsmall muted">ocupación desde {ts ? hhmm(ts.abiertaEn) : '—'}</span>
              </div>
              {os.map((o) => (
                <div key={o.id} className="row between small">
                  <span>
                    {o.codigo} · {linesOf(o, 'cocina').map((l) => `${l.cantidad}× ${l.nombre}`).join(', ')}
                  </span>
                  <span className="muted">{ago(s.now, o.pagadoEn ?? o.creadoEn)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Availability({ estacion }: { estacion: Station }) {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const [q, setQ] = useState('');
  const list = PRODUCTS.filter((p) => p.estacion === estacion && p.nombre.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="stack-sm">
      <p className="small muted">Pausar o marcar agotado frena ventas nuevas en todos los canales. Los pedidos ya aceptados siguen su curso.</p>
      <Field label="Buscar producto">{(p) => <input {...p} className="input" value={q} onChange={(e) => setQ(e.target.value)} />}</Field>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Presentación</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {list.flatMap((p) =>
              p.presentaciones.map((pr) => {
                const est = s.config.disponibilidad[pr.key] ?? 'disponible';
                const chk = sellCheck(s, pr.key);
                return (
                  <tr key={pr.key}>
                    <td>{p.nombre}</td>
                    <td className="small">
                      {pr.etiqueta}
                      {pr.tipo !== 'publicado' && <span className="muted"> · {pr.tipo === 'consultable' ? 'consultable' : 'supuesto de demo'}</span>}
                    </td>
                    <td>
                      <select className="select input" style={{ minHeight: 38, padding: '4px 8px' }} value={est} disabled={pending} aria-label={`Disponibilidad de ${p.nombre} ${pr.etiqueta}`} onChange={(e) => run({ type: 'avail.set', presKey: pr.key, estado: e.target.value as 'disponible' })}>
                        <option value="disponible">Disponible</option>
                        <option value="pausado">Pausado</option>
                        <option value="agotado">Agotado</option>
                      </select>
                      {est === 'disponible' && !chk.ok && <span className="xsmall muted"> {chk.motivo}</span>}
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
