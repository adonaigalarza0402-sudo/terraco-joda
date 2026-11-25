import { useState } from 'react';
import { presentationByKey } from '../../domain/catalog';
import { ars } from '../../domain/money';
import { ago, hhmm } from '../../domain/time';
import { session, useSession } from '../../state/session';
import { getState, useStore } from '../../state/store';
import { Confirm, Empty, Field, Link, Money, navigate, Notice, Stepper, Tag, toast, useAction, useRoute } from '../../ui/kit';

/** Simulación avanzada: varios pagadores con acuerdo congelado. */
export function NewRound() {
  const ses = useSession();
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const [n, setN] = useState(3);
  const [org, setOrg] = useState(ses.alias || '');
  const total = ses.cart.reduce((a, c) => a + c.precioVisto * c.cantidad, 0);
  if (!ses.cart.length)
    return (
      <div style={{ paddingTop: 16 }}>
        <Empty title="Primero armá el carrito" action={<Link to="/carta" className="btn btn-primary">Ir a la carta</Link>}>
          La ronda congela los productos del carrito.
        </Empty>
      </div>
    );
  return (
    <div className="cx-narrow stack" style={{ paddingTop: 8 }}>
      <Link to="/carrito" className="small">
        ← Carrito
      </Link>
      <p className="eyebrow">Simulación avanzada · para evaluar con el dueño</p>
      <h1 className="cx-title">Pagar entre varios</h1>
      <Notice tone="warn">Se congelan productos, total, reparto y plazo. Nadie prepara nada hasta completar el total. Si vence, cada aporte se devuelve a quien lo pagó (simulado).</Notice>
      <section className="card stack-sm">
        {ses.cart.map((c) => (
          <div key={c.key} className="row between small">
            <span>
              {c.cantidad}× {presentationByKey(c.presKey)?.product.nombre}
            </span>
            <Money cents={c.precioVisto * c.cantidad} />
          </div>
        ))}
        <hr />
        <div className="row between">
          <strong>Total</strong>
          <Money cents={total} />
        </div>
        <div className="row between">
          <span>Participantes</span>
          <Stepper value={n} min={2} max={12} onChange={setN} label="Participantes" />
        </div>
        <Field label="Tu nombre (organizador, ficticio)">
          {(p) => <input {...p} className="input" value={org} onChange={(e) => setOrg(e.target.value)} maxLength={24} />}
        </Field>
        <p className="xsmall muted">Plazo de la ronda: {Math.round(s.config.plazoRondaSeg / 60)} min del reloj de demo. El stock controlado queda reservado solo ese plazo.</p>
        <button
          className="btn btn-primary btn-lg"
          disabled={pending}
          onClick={async () => {
            const r = await run({ type: 'round.create', lines: ses.cart.map(({ key: _k, ...l }) => l), participantes: n, organizador: org || 'Organizador' }, { quiet: true });
            if (r.ok) {
              const round = getState().rounds.find((x) => x.id === r.data.roundId)!;
              session.set({ rondas: [...ses.rondas, r.data.roundId] });
              session.clearCart();
              navigate(`/ronda/${r.data.roundId}?inv=${round.invitacion}`);
            } else toast(r.message, 'bad');
          }}
        >
          Congelar acuerdo y crear ronda
        </button>
      </section>
    </div>
  );
}

export function RoundView({ id }: { id: string }) {
  const s = useStore((x) => x);
  const ses = useSession();
  const { query } = useRoute();
  const { run, pending } = useAction();
  const [pagador, setPagador] = useState(ses.alias || '');
  const [cover, setCover] = useState(false);
  const [cancel, setCancel] = useState(false);
  const r = s.rounds.find((x) => x.id === id);
  const isOrg = !!r && r.buyerId === ses.buyerId;
  if (!r || (!isOrg && (query.get('inv') !== r.invitacion || r.invitacionRevocada)))
    return (
      <div style={{ paddingTop: 16 }}>
        <Empty title="Invitación no válida">La invitación venció, fue revocada o el enlace está incompleto.</Empty>
      </div>
    );
  const pend = r.cuotas.filter((c) => c.estado === 'pendiente');
  const pagado = r.cuotas.filter((c) => c.estado === 'pagada' || c.estado === 'cubierta').reduce((a, c) => a + c.monto, 0);
  const link = `${location.origin}${location.pathname}#/ronda/${r.id}?inv=${r.invitacion}`;
  const order = r.orderId ? s.orders.find((o) => o.id === r.orderId) : null;
  return (
    <div className="cx-narrow stack" style={{ paddingTop: 8 }}>
      <p className="eyebrow">Simulación avanzada · ronda entre amigos</p>
      <h1 className="cx-title">Ronda de {r.organizador}</h1>
      <section className="card stack-sm" aria-live="polite">
        <div className="row between">
          <Tag tone={r.estado === 'abierta' ? 'warn' : r.estado === 'completa' ? 'ok' : 'bad'} glyph={r.estado === 'abierta' ? '◐' : r.estado === 'completa' ? '✓' : '✕'}>
            {r.estado === 'abierta' ? `Abierta · vence ${hhmm(r.venceEn)}` : r.estado}
          </Tag>
          <span className="num small">
            {ars(pagado)} de {ars(r.total)}
          </span>
        </div>
        <div className="bar" aria-hidden>
          <span style={{ width: `${(pagado / r.total) * 100}%` }} />
        </div>
        {r.lineas.map((l, i) => (
          <div key={i} className="row between small">
            <span>
              {l.cantidad}× {l.nombre} <span className="muted">({l.presentacion})</span>
            </span>
            <Money cents={l.precioUnitario * l.cantidad} />
          </div>
        ))}
        <p className="xsmall muted">Acuerdo congelado {ago(s.now, r.creadoEn)} atrás. Para cambiar productos hay que cancelar (con devoluciones) y crear otra ronda.</p>
      </section>
      <section className="card stack-sm">
        <h2>Partes</h2>
        {r.cuotas.map((c) => (
          <div key={c.id} className="row between">
            <span>
              Parte {c.indice} · <Money cents={c.monto} />
            </span>
            {c.estado === 'pendiente' && r.estado === 'abierta' ? (
              <button className="btn btn-sm btn-primary" disabled={pending || !pagador.trim()} onClick={() => run({ type: 'round.pay', roundId: r.id, cuotaId: c.id, pagador })}>
                Pagar esta parte (simulado)
              </button>
            ) : (
              <Tag tone={c.estado === 'pagada' || c.estado === 'cubierta' ? 'ok' : c.estado === 'pendiente' ? undefined : 'warn'}>
                {c.estado.replace('_', ' ')}
                {isOrg && c.pagador ? ` · ${c.pagador}` : ''}
              </Tag>
            )}
          </div>
        ))}
        {r.estado === 'abierta' && (
          <Field label="Pagás como (nombre ficticio)" hint="Se muestra solo al organizador.">
            {(p) => <input {...p} className="input" value={pagador} onChange={(e) => setPagador(e.target.value)} maxLength={24} />}
          </Field>
        )}
        {r.estado === 'abierta' && pend.length > 0 && pend.length < r.cuotas.length && (
          <button className="btn" onClick={() => setCover(true)} disabled={!pagador.trim()}>
            Cubrir el saldo ({ars(pend.reduce((a, c) => a + c.monto, 0))})
          </button>
        )}
      </section>
      {order && (
        <Notice tone="ok">
          Total completo: pedido <strong>{order.codigo}</strong> en preparación.{' '}
          {order.buyerId === ses.buyerId && <Link to={`/pedido/${order.id}`}>Ver pedido y credencial</Link>}
        </Notice>
      )}
      {s.refunds.filter((d) => d.rondaId === r.id).map((d) => (
        <Notice key={d.id} tone={d.estado === 'completada' ? 'ok' : 'warn'}>
          Devolución simulada {d.estado} a {isOrg ? d.pagador : 'pagador original'}: {ars(d.monto)}
        </Notice>
      ))}
      {isOrg && r.estado === 'abierta' && (
        <section className="card flat stack-sm">
          <h3>Invitación</h3>
          <p className="xsmall muted">El enlace no muestra datos personales del grupo. Para probar, abrilo en otra pestaña.</p>
          <div className="row-wrap">
            <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(link).then(() => toast('Enlace copiado', 'ok'))}>
              Copiar enlace
            </button>
            <button className="btn btn-sm" onClick={() => run({ type: 'round.revokeInvite', roundId: r.id })} disabled={r.invitacionRevocada}>
              {r.invitacionRevocada ? 'Invitación revocada' : 'Revocar invitación'}
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => setCancel(true)}>
              Cancelar ronda
            </button>
          </div>
        </section>
      )}
      <Confirm open={cover} onClose={() => setCover(false)} title="¿Cubrir el saldo?" confirmLabel="Sí, cubro el saldo" onConfirm={() => run({ type: 'round.cover', roundId: r.id, cuotaIds: pend.map((c) => c.id), pagador })}>
        <p>
          Vas a pagar (simulado) {pend.length} parte(s) pendiente(s) por {ars(pend.reduce((a, c) => a + c.monto, 0))}. Es voluntario.
        </p>
      </Confirm>
      <Confirm open={cancel} onClose={() => setCancel(false)} title="¿Cancelar la ronda?" confirmLabel="Cancelar ronda" tone="danger" onConfirm={() => run({ type: 'round.cancel', roundId: r.id, motivo: 'Cancelada por el organizador' })}>
        <p>Se crean devoluciones simuladas para cada aporte ya pagado, a nombre de quien lo pagó.</p>
      </Confirm>
    </div>
  );
}
