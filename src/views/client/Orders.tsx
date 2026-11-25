import { useState } from 'react';
import { presentationByKey } from '../../domain/catalog';
import { allUnits, sellCheck, unitPrice } from '../../domain/engine';
import { ars } from '../../domain/money';
import { hhmm } from '../../domain/time';
import type { Order, State } from '../../domain/types';
import { session, useSession } from '../../state/session';
import { useStore } from '../../state/store';
import { clientStatus, pickupPoint, UNIT_LABEL } from '../../ui/derive';
import { Confirm, Link, navigate, QR, Sheet, useAction, useRoute } from '../../ui/kit';
import { EmptyState, I, Money, Note, Pill } from './ui';

const ACTIVE = ['esperando_pago', 'activo', 'incidencia'];

type StationState = { estacion: 'barra' | 'cocina'; titulo: string; label: string; glyph: string; tone: 'ok' | 'warn' | 'bad' | 'info' | undefined; lugar: string | null; items: string; ready: boolean };

/** Estado por estación (bebidas / comida), independiente entre sí. */
export function stationStates(s: State, o: Order): StationState[] {
  if (!o.pagadoEn) return [];
  const out: StationState[] = [];
  for (const e of ['barra', 'cocina'] as const) {
    const lines = o.lineas.filter((l) => l.estacion === e);
    if (!lines.length) continue;
    const us = allUnits(o).filter((u) => u.line.estacion === e);
    const vivas = us.filter((u) => u.estado !== 'cancelada');
    const t = o.tickets.find((x) => x.estacion === e);
    const items = lines.map((l) => `${l.cantidad}× ${l.nombre}${l.sabor ? ` (${l.sabor})` : ''}`).join(', ');
    const titulo = e === 'barra' ? 'Bebidas' : 'Comida';
    let st: Pick<StationState, 'label' | 'glyph' | 'tone' | 'ready'>;
    if (!vivas.length) st = { label: 'No se pudo preparar', glyph: '✕', tone: 'bad', ready: false };
    else if (vivas.every((u) => u.estado === 'entregada')) st = { label: 'Entregado', glyph: '✓', tone: 'info', ready: false };
    else if (vivas.some((u) => u.estado === 'lista')) {
      const listas = vivas.filter((u) => u.estado === 'lista').length;
      const pendientes = vivas.filter((u) => u.estado === 'pendiente' || u.estado === 'en_preparacion').length;
      st = { label: pendientes ? `${listas} de ${listas + pendientes} listas para retirar` : 'Listo para retirar', glyph: '●', tone: 'ok', ready: true };
    }
    else if (!t?.recibidoEn && !t?.recepcionManual) st = { label: 'Enviando al equipo', glyph: '…', tone: 'warn', ready: false };
    else if (vivas.some((u) => u.estado === 'en_preparacion')) st = { label: 'En preparación', glyph: '◐', tone: 'warn', ready: false };
    else st = { label: `Recibido en ${e}`, glyph: '○', tone: undefined, ready: false };
    out.push({ estacion: e, titulo, items, lugar: pickupPoint(s, o, e), ...st });
  }
  return out;
}

export function Orders() {
  const ses = useSession();
  const s = useStore((x) => x);
  const mine = s.orders.filter((o) => o.buyerId === ses.buyerId).sort((a, b) => b.creadoEn - a.creadoEn);
  const activos = mine.filter((o) => ACTIVE.includes(o.estado));
  const pasados = mine.filter((o) => !ACTIVE.includes(o.estado));
  const myRounds = s.rounds.filter((r) => ses.rondas.includes(r.id) && r.estado === 'abierta');
  return (
    <div className="cx-narrow cx-stack">
      <div className="cx-hero-title">
        <h1 className="cx-title">Mis pedidos</h1>
      </div>
      {ses.cart.length > 0 && (
        <Link to="/carrito" className="cx-card flat cx-between" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span>
            <strong>Tenés un pedido sin confirmar</strong>
            <span className="cx-sub"> · {ses.cart.reduce((a, c) => a + c.cantidad, 0)} productos</span>
          </span>
          <span className="cx-btn sm primary">Continuar</span>
        </Link>
      )}
      {myRounds.map((r) => (
        <Link key={r.id} to={`/ronda/${r.id}?inv=${r.invitacion}`} className="cx-card flat cx-between" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span>
            <strong>Ronda entre amigos</strong>
            <span className="cx-sub"> · vence {hhmm(r.venceEn)}</span>
          </span>
          <span className="cx-btn sm">Ver</span>
        </Link>
      ))}
      {!mine.length && !ses.cart.length && (
        <EmptyState title="Todavía no pediste nada" action={<Link to="/carta" className="cx-btn primary">Ver la carta</Link>}>
          Cuando hagas un pedido, acá vas a ver su estado y dónde retirarlo.
        </EmptyState>
      )}
      {activos.length > 0 && (
        <section className="cx-stack-sm" aria-label="En curso">
          <p className="cx-eyebrow">En curso</p>
          {activos.map((o) => (
            <OrderCard key={o.id} o={o} />
          ))}
        </section>
      )}
      {pasados.length > 0 && (
        <section className="cx-stack-sm" aria-label="Anteriores">
          <p className="cx-eyebrow">Anteriores</p>
          {pasados.map((o) => (
            <OrderCard key={o.id} o={o} compact />
          ))}
        </section>
      )}
      <Link to="/beneficios" className="cx-rowbtn cx-row" style={{ borderTop: '1px solid var(--line)' }}>
        <span className="cx-row-ico">
          <I.regalo />
        </span>
        <span style={{ flex: 1 }}>
          <span className="cx-h3" style={{ display: 'block', fontSize: '1rem' }}>
            Beneficios
          </span>
          <span className="cx-sub">Progreso y cupones de ejemplo</span>
        </span>
        <span className="cx-chev">
          <I.chev />
        </span>
      </Link>
    </div>
  );
}

function OrderCard({ o, compact }: { o: Order; compact?: boolean }) {
  const s = useStore((x) => x);
  const st = clientStatus(s, o);
  const stations = stationStates(s, o);
  const ready = stations.some((x) => x.ready);
  return (
    <Link to={`/pedido/${o.id}`} className="cx-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block', borderColor: ready ? 'var(--ok)' : undefined }}>
      <div className="cx-between">
        <span className="cx-code" style={{ fontSize: compact ? '1.2rem' : undefined }}>
          {o.codigo}
        </span>
        <span className="cx-price">
          <Money cents={o.total} />
        </span>
      </div>
      {compact || !stations.length ? (
        <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{st.title}</p>
      ) : (
        <div className="cx-stack-sm" style={{ marginTop: 8 }}>
          {stations.map((x) => (
            <div key={x.estacion} className="cx-between">
              <span style={{ fontWeight: 600 }}>{x.titulo}</span>
              <Pill tone={x.tone} glyph={x.glyph}>
                {x.label}
                {x.ready && x.lugar ? ` · ${x.lugar}` : ''}
              </Pill>
            </div>
          ))}
        </div>
      )}
      <p className="cx-fine" style={{ margin: '6px 0 0' }}>
        {o.lineas.map((l) => `${l.cantidad}× ${l.nombre}`).join(', ')} · {hhmm(o.creadoEn)}
      </p>
      {ready && !compact && (
        <span className="cx-btn primary block" style={{ marginTop: 12 }}>
          <I.qr /> Mostrar credencial para retirar
        </span>
      )}
    </Link>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const s = useStore((x) => x);
  const ses = useSession();
  const { run, pending } = useAction();
  const [cancel, setCancel] = useState(false);
  const [review, setReview] = useState<string[] | null>(null);
  const [cred, setCred] = useState(false);
  const o = s.orders.find((x) => x.id === id);
  const { query } = useRoute();
  if (!o || (o.buyerId !== ses.buyerId && !query.get('ver')))
    return (
      <div className="cx-narrow">
        <EmptyState title="Pedido no disponible" action={<Link to="/pedido" className="cx-btn">Mis pedidos</Link>}>
          Solo ves los pedidos hechos desde este teléfono (en la demo, desde esta pestaña).
        </EmptyState>
      </div>
    );
  const st = clientStatus(s, o);
  const stations = stationStates(s, o);
  const pi = s.intents.find((x) => x.id === o.intentId);
  const refunds = s.refunds.filter((r) => r.orderId === o.id);
  const showCred = o.estado === 'activo' && allUnits(o).some((u) => u.estado !== 'entregada' && u.estado !== 'cancelada');
  const ready = stations.some((x) => x.ready);
  // Cada paso se marca por su propio estado (pago, recepción, preparación y entrega son independientes).
  const vivas = allUnits(o).filter((u) => u.estado !== 'cancelada');
  const stepDone = [
    !!o.pagadoEn,
    !!o.pagadoEn && o.tickets.length > 0 && o.tickets.every((t) => t.recibidoEn || t.recepcionManual),
    !!o.pagadoEn && vivas.length > 0 && vivas.every((u) => u.estado === 'lista' || u.estado === 'entregada'),
    vivas.length > 0 && vivas.every((u) => u.estado === 'entregada'),
  ];
  const steps = ['Pago', 'Recibido', 'Preparado', 'Entregado'];

  function repeat() {
    const notes: string[] = [];
    const cart = [] as Parameters<typeof session.addToCart>[0][];
    for (const l of o!.lineas) {
      const now = unitPrice(s, l.presKey, l.modificadores.map((m) => m.id));
      const chk = sellCheck(s, l.presKey);
      if (!chk.ok || now === null) {
        notes.push(`${l.nombre}: no disponible ahora (${chk.motivo}). No se agrega.`);
        continue;
      }
      if (now !== l.precioUnitario) notes.push(`${l.nombre}: el precio cambió de ${ars(l.precioUnitario)} a ${ars(now)}.`);
      cart.push({ presKey: l.presKey, sabor: l.sabor, mods: l.modificadores.filter((m) => m.id !== 'frutos_rojos' || s.config.ginFrutosRojos.habilitado).map((m) => m.id), nota: l.nota, cantidad: l.cantidad, precioVisto: now });
    }
    const pend = s.orders.filter((x) => x.buyerId === ses.buyerId && ['esperando_pago', 'activo'].includes(x.estado));
    if (pend.length) notes.push(`Tenés ${pend.length} pedido(s) en curso. El nuevo se suma; no reemplaza al anterior.`);
    session.set({ cart: [], repiteDe: o!.id });
    cart.forEach((c) => session.addToCart(c));
    session.set({ repiteDe: o!.id });
    if (notes.length) setReview(notes);
    else navigate('/carrito');
  }

  return (
    <div className="cx-narrow cx-stack">
      <Link to="/pedido" className="cx-link" style={{ marginTop: 4 }}>
        <I.atras /> Mis pedidos
      </Link>

      <section className="cx-card cx-stack-sm" aria-live="polite">
        <div className="cx-between">
          <div>
            <p className="cx-eyebrow" style={{ margin: 0 }}>
              Pedido
            </p>
            <p className="cx-code" style={{ margin: 0 }}>
              {o.codigo}
            </p>
          </div>
          <span className="cx-price" style={{ fontSize: '1.3rem' }}>
            <Money cents={o.total} />
          </span>
        </div>
        <ol className="cx-steps" aria-label="Progreso del pedido">
          {steps.map((x, i) => (
            <li key={x} className={stepDone[i] ? 'done' : ''}>
              {x}
              {stepDone[i] && <span className="sr-only"> (completado)</span>}
            </li>
          ))}
        </ol>
        <div>
          <p className="cx-h3" style={{ margin: '4px 0 2px' }}>
            {st.title}
          </p>
          <p className="cx-sub" style={{ margin: 0 }}>
            {st.detail}
          </p>
        </div>
        {showCred && (
          <button className={`cx-btn ${ready ? 'primary' : ''} lg block`} onClick={() => setCred(true)}>
            <I.qr /> {ready ? 'Mostrar credencial para retirar' : 'Ver credencial de retiro'}
          </button>
        )}
      </section>

      {o.estado === 'esperando_pago' && pi && pi.estado === 'pendiente' && (
        <section className="cx-card flat cx-stack-sm" aria-labelledby="sim-t" style={{ borderStyle: 'dashed' }}>
          <p className="cx-eyebrow" style={{ margin: 0 }}>
            Pago simulado
          </p>
          <h2 id="sim-t" className="cx-h3">
            Elegí el resultado del pago de prueba
          </h2>
          <p className="cx-fine" style={{ margin: 0 }}>
            No pedimos tarjetas ni datos. La reserva de stock vence a las {hhmm(pi.venceEn)} (reloj de demo).
          </p>
          <button className="cx-btn primary lg block" disabled={pending} onClick={() => run({ type: 'payment.simulate', intentId: pi.id, resultado: 'aprobar' })}>
            Aprobar pago · {ars(pi.monto)}
          </button>
          <div className="cx-wrap">
            <button className="cx-btn sm" disabled={pending} onClick={() => run({ type: 'payment.simulate', intentId: pi.id, resultado: 'pendiente' })}>
              Dejar pendiente
            </button>
            <button className="cx-btn sm danger" disabled={pending} onClick={() => run({ type: 'payment.simulate', intentId: pi.id, resultado: 'rechazar' })}>
              Rechazar
            </button>
            <button className="cx-link" style={{ marginLeft: 'auto', fontSize: '0.9rem' }} onClick={() => setCancel(true)}>
              Cancelar pedido
            </button>
          </div>
        </section>
      )}

      {stations.length > 0 && (
        <section className="cx-card flat" aria-label="Estado por sector">
          {stations.map((x) => (
            <div key={x.estacion} className={`cx-station ${x.ready ? 'ready' : ''}`}>
              <span className="cx-station-ico">{x.estacion === 'barra' ? <I.copaBebida /> : <I.plato />}</span>
              <div className="cx-between">
                <strong>{x.titulo}</strong>
                <Pill tone={x.tone} glyph={x.glyph}>
                  {x.label}
                </Pill>
              </div>
              <span className="cx-sub">{x.items}</span>
              {x.lugar && x.label !== 'Entregado' && x.label !== 'No se pudo preparar' && (
                <span className="cx-fine" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ width: 16, height: 16, display: 'inline-block' }}>
                    <I.pin />
                  </span>
                  {x.ready ? `Retirá en ${x.lugar}` : `Se retira en ${x.lugar}`}
                </span>
              )}
            </div>
          ))}
        </section>
      )}

      {refunds.map((r) => (
        <Note key={r.id} tone={r.estado === 'fallida' ? 'bad' : r.estado === 'completada' ? 'ok' : 'warn'}>
          Devolución simulada {r.estado}: {ars(r.monto)} — {r.motivo}
        </Note>
      ))}

      <details className="cx-details cx-card flat">
        <summary>Detalle e importes</summary>
        <div className="cx-stack-sm" style={{ paddingBottom: 8 }}>
          {o.lineas.map((l) => (
            <div key={l.id}>
              <div className="cx-between">
                <span>
                  {l.cantidad}× <strong>{l.nombre}</strong>
                </span>
                <Money cents={l.precioUnitario * l.cantidad} />
              </div>
              <div className="cx-fine">
                {[l.sabor, l.presentacion, ...l.modificadores.map((m) => m.etiqueta), l.nota && `Nota: ${l.nota}`].filter(Boolean).join(' · ')}
              </div>
              {o.pagadoEn && l.cantidad > 1 && (
                <div className="cx-wrap" style={{ marginTop: 4 }}>
                  {l.unidades.map((u, i) => (
                    <Pill key={u.id} tone={UNIT_LABEL[u.estado].tone} glyph={UNIT_LABEL[u.estado].glyph}>
                      {i + 1}: {UNIT_LABEL[u.estado].label}
                    </Pill>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="cx-totals" style={{ paddingBottom: 0 }}>
            <span>Subtotal</span>
            <Money cents={o.subtotal} />
            {o.descuento > 0 && (
              <>
                <span>Descuento de ejemplo</span>
                <span className="cx-num">−{ars(o.descuento)}</span>
              </>
            )}
            <span style={{ fontWeight: 800 }}>Total</span>
            <strong>
              <Money cents={o.total} />
            </strong>
          </div>
          <p className="cx-fine" style={{ margin: 0 }}>
            Comprobante de demostración: no es una factura fiscal.
          </p>
        </div>
      </details>

      <details className="cx-details cx-card flat">
        <summary>Historial</summary>
        <ol className="cx-fine cx-stack-sm" style={{ paddingLeft: 20, margin: '0 0 8px' }}>
          {o.log.map((e, i) => (
            <li key={i}>
              <span className="cx-num">{hhmm(e.at)}</span> {e.msg}
            </li>
          ))}
        </ol>
      </details>

      <button className="cx-btn block" onClick={repeat}>
        Volver a pedir
      </button>

      <Sheet open={cred} onClose={() => setCred(false)} title={`Credencial · ${o.codigo}`}>
        <div className="cx-stack" style={{ alignItems: 'center', textAlign: 'center', paddingBottom: 16 }}>
          <div className="cx-qr">
            <QR value={`TERRACO-DEMO:${o.credencial}`} label={`Código QR de la credencial ${o.credencial}`} />
          </div>
          <span className="cx-cred">
            {o.credencial.slice(0, 3)}·{o.credencial.slice(3)}
          </span>
          {stations
            .filter((x) => x.ready)
            .map((x) => (
              <Pill key={x.estacion} tone="ok" glyph="●">
                {x.titulo}: retirá en {x.lugar}
              </Pill>
            ))}
          <p className="cx-sub" style={{ margin: 0, maxWidth: 360 }}>
            Mostrala solo al retirar. El código {o.codigo} de la pantalla identifica tu pedido, pero no sirve para retirarlo.
          </p>
          <p className="cx-fine" style={{ margin: 0 }}>
            Subí el brillo del teléfono si cuesta leerla.
          </p>
        </div>
      </Sheet>
      <Confirm open={cancel} onClose={() => setCancel(false)} title="¿Cancelar el pedido?" confirmLabel="Cancelar pedido" tone="danger" onConfirm={() => run({ type: 'order.cancel', orderId: o.id, motivo: 'Cancelado por el cliente antes del pago' })}>
        <p>Todavía no hay un cobro aprobado. Se libera el stock reservado.</p>
      </Confirm>
      <Sheet open={!!review} onClose={() => setReview(null)} title="Antes de repetir">
        <div className="cx-stack">
          <ul className="cx-stack-sm" style={{ margin: 0, paddingLeft: 18 }}>
            {review?.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="cx-sub" style={{ margin: 0 }}>
            Armamos un pedido nuevo con precios actuales. Nada se cobra hasta que confirmes.
          </p>
          <button className="cx-btn primary lg block" onClick={() => { setReview(null); navigate('/carrito'); }}>
            Revisar pedido
          </button>
        </div>
      </Sheet>
    </div>
  );
}

export function cartLabel(presKey: string) {
  const pp = presentationByKey(presKey);
  return pp ? `${pp.product.nombre} · ${pp.pres.etiqueta}` : presKey;
}
