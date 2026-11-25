import { useMemo, useState } from 'react';
import { normalize, PRODUCTS, searchProducts } from '../../domain/catalog';
import { allUnits, sellCheck, unitPrice, type CartLine } from '../../domain/engine';
import { ars } from '../../domain/money';
import { ago, hhmm } from '../../domain/time';
import type { Metodo, Order, State } from '../../domain/types';
import { useSession } from '../../state/session';
import { newId, useStore } from '../../state/store';
import { clientStatus } from '../../ui/derive';
import { Confirm, Empty, Field, Money, Notice, QR, Seg, Sheet, Stepper, Tag, Tabs, useAction } from '../../ui/kit';
import { StaffShell } from './Shell';
import { Visitas } from './Entrega';

const METODO: Record<Metodo, string> = { efectivo: 'Efectivo', transferencia_manual: 'Transferencia manual', digital_demo: 'Pago digital simulado' };

type Tab = 'nuevo' | 'pendientes' | 'buscar' | 'incidencias' | 'visitas';

export function Caja() {
  const s = useStore((x) => x);
  const [tab, setTab] = useState<Tab>('nuevo');
  const [open, setOpen] = useState<string | null>(null);
  const pend = s.orders.filter((o) => o.estado === 'esperando_pago' || o.estado === 'incidencia');
  const incs = s.incidents.filter((i) => i.estado === 'abierta');
  const nav = (
    <Tabs
      label="Caja"
      value={tab}
      onChange={setTab}
      options={[
        { value: 'nuevo', label: 'Nuevo pedido' },
        { value: 'pendientes', label: `Pendientes de cobro (${pend.length})` },
        { value: 'buscar', label: 'Buscar pedido' },
        { value: 'incidencias', label: `Incidencias (${incs.length})` },
        { value: 'visitas', label: 'Visitas' },
      ]}
    />
  );
  return (
    <StaffShell title="Caja" nav={nav}>
      {tab === 'nuevo' && <NewOrder onCreated={setOpen} />}
      {tab === 'pendientes' && (
        <div className="stack-sm">
          {!pend.length && <Empty title="No hay cobros pendientes" />}
          {pend.map((o) => (
            <OrderRow key={o.id} s={s} o={o} onOpen={() => setOpen(o.id)} />
          ))}
        </div>
      )}
      {tab === 'buscar' && <Search onOpen={setOpen} />}
      {tab === 'incidencias' && <Incidents />}
      {tab === 'visitas' && <Visitas />}
      <OrderSheet id={open} onClose={() => setOpen(null)} />
    </StaffShell>
  );
}

function OrderRow({ s, o, onOpen }: { s: State; o: Order; onOpen: () => void }) {
  const st = clientStatus(s, o);
  return (
    <button className="card row between" style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', width: '100%' }} onClick={onOpen}>
      <span className="stack-xs">
        <span>
          <strong className="num">{o.codigo}</strong> · {o.alias} · <span className="muted small">{o.canal === 'caja' ? 'caja' : 'web'} · {METODO[o.metodo]}</span>
        </span>
        <span className="small muted">{o.lineas.map((l) => `${l.cantidad}× ${l.nombre}`).join(', ')}</span>
      </span>
      <span className="stack-xs right">
        <Money cents={o.total} />
        <Tag tone={st.tone === 'accent' ? 'accent' : st.tone} className="xsmall">
          {o.estado.replace('_', ' ')}
        </Tag>
      </span>
    </button>
  );
}

function NewOrder({ onCreated }: { onCreated: (id: string) => void }) {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const [q, setQ] = useState('');
  const [lines, setLines] = useState<(CartLine & { key: string; nombre: string; pres: string })[]>([]);
  const [metodo, setMetodo] = useState<Metodo>('efectivo');
  const [alias, setAlias] = useState('');
  const [pick, setPick] = useState<string | null>(null);
  const [cid, setCid] = useState(() => newId('caja'));
  const results = useMemo(() => searchProducts(q).slice(0, q ? 30 : 12), [q]);
  const total = lines.reduce((a, l) => a + l.precioVisto * l.cantidad, 0);
  const pickP = pick ? PRODUCTS.find((p) => p.id === pick) : null;

  function add(presKey: string, sabor: string | null) {
    const price = unitPrice(s, presKey, [])!;
    const p = PRODUCTS.find((x) => presKey.startsWith(x.id + ':'))!;
    const pres = p.presentaciones[Number(presKey.split(':')[1])];
    const same = lines.find((l) => l.presKey === presKey && l.sabor === sabor);
    if (same) setLines(lines.map((l) => (l === same ? { ...l, cantidad: l.cantidad + 1 } : l)));
    else setLines([...lines, { key: newId('l'), presKey, sabor, mods: [], nota: null, cantidad: 1, precioVisto: price, nombre: p.nombre, pres: pres.etiqueta }]);
    setPick(null);
  }

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <section className="card stack-sm" aria-labelledby="prod-t">
        <h2 id="prod-t">Productos</h2>
        <Field label="Buscar">{(p) => <input {...p} className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o categoría" autoFocus />}</Field>
        <div className="stack-xs">
          {results.map((p) => {
            const ok = p.presentaciones.some((pr) => sellCheck(s, pr.key, 'caja').ok);
            return (
              <button key={p.id} className="btn btn-square" style={{ justifyContent: 'space-between' }} disabled={!ok} onClick={() => (p.presentaciones.filter((pr) => sellCheck(s, pr.key, 'caja').ok).length === 1 && !p.sabores.length ? add(p.presentaciones.find((pr) => sellCheck(s, pr.key, 'caja').ok)!.key, null) : setPick(p.id))}>
                <span>
                  {p.nombre} <span className="muted small">· {p.categoria}</span>
                </span>
                <span className="small num">{ok ? ars(Math.min(...p.presentaciones.filter((pr) => sellCheck(s, pr.key, 'caja').ok).map((pr) => unitPrice(s, pr.key, [])!))) : sellCheck(s, p.presentaciones[0].key, 'caja').motivo}</span>
              </button>
            );
          })}
          {!results.length && <p className="small muted">Sin resultados para «{q}».</p>}
        </div>
      </section>
      <section className="card stack-sm" aria-labelledby="ped-t">
        <h2 id="ped-t">Pedido asistido</h2>
        {!lines.length && <p className="small muted">Agregá productos. Entra a la misma cola que los pedidos digitales.</p>}
        {lines.map((l) => (
          <div key={l.key} className="row between">
            <span className="grow small">
              <strong>{l.nombre}</strong> · {l.pres}
              {l.sabor && ` · ${l.sabor}`}
            </span>
            <Stepper value={l.cantidad} min={0} onChange={(n) => setLines(n ? lines.map((x) => (x === l ? { ...x, cantidad: n } : x)) : lines.filter((x) => x !== l))} label={l.nombre} />
            <Money cents={l.precioVisto * l.cantidad} />
          </div>
        ))}
        <hr />
        <div className="row between">
          <strong>Total</strong>
          <Money cents={total} className="code-big" />
        </div>
        <Seg label="Método de cobro" value={metodo} onChange={setMetodo} options={(Object.keys(METODO) as Metodo[]).map((m) => ({ value: m, label: METODO[m] }))} />
        {metodo === 'transferencia_manual' && <Notice tone="warn">Queda esperando verificación del encargado. Una captura de comprobante no acredita el pago.</Notice>}
        {s.config.contingencia && <Notice tone="warn">Modo contingencia activo: los pedidos para una estación sin conexión se comunican en papel y se concilian al reconectar.</Notice>}
        <Field label="Nombre o referencia (opcional)">{(p) => <input {...p} className="input" value={alias} onChange={(e) => setAlias(e.target.value)} maxLength={24} />}</Field>
        <button
          className="btn btn-primary btn-lg"
          disabled={pending || !lines.length}
          onClick={async () => {
            const r = await run({ type: 'caja.createOrder', lines: lines.map(({ key: _k, nombre: _n, pres: _p, ...l }) => l), metodo, alias, modalidad: 'retiro' }, { cid });
            setCid(newId('caja'));
            if (r.ok) {
              setLines([]);
              setAlias('');
              onCreated(r.data.orderId);
            }
          }}
        >
          Crear pedido · {ars(total)}
        </button>
      </section>
      <Sheet open={!!pickP} onClose={() => setPick(null)} title={pickP?.nombre ?? ''}>
        {pickP && <PickOptions s={s} p={pickP} onAdd={add} />}
      </Sheet>
    </div>
  );
}

function PickOptions({ s, p, onAdd }: { s: State; p: (typeof PRODUCTS)[number]; onAdd: (k: string, sabor: string | null) => void }) {
  const [sabor, setSabor] = useState<string | null>(p.sabores[0] ?? null);
  return (
    <div className="stack">
      {p.sabores.length > 0 && (
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          {p.sabores.map((x) => (
            <button key={x} className="chip" aria-pressed={sabor === x} onClick={() => setSabor(x)}>
              {x}
            </button>
          ))}
        </div>
      )}
      {p.presentaciones.map((pr) => {
        const c = sellCheck(s, pr.key, 'caja');
        return (
          <button key={pr.key} className="btn btn-square" style={{ justifyContent: 'space-between' }} disabled={!c.ok} onClick={() => onAdd(pr.key, sabor)}>
            <span>{pr.etiqueta}</span>
            <span className="num small">{c.ok ? ars(unitPrice(s, pr.key, [])!) : c.motivo}</span>
          </button>
        );
      })}
    </div>
  );
}

function Search({ onOpen }: { onOpen: (id: string) => void }) {
  const s = useStore((x) => x);
  const [q, setQ] = useState('');
  const n = normalize(q);
  const list = s.orders.filter((o) => !n || normalize(`${o.codigo} ${o.alias}`).includes(n)).sort((a, b) => b.creadoEn - a.creadoEn).slice(0, 40);
  return (
    <div className="stack-sm">
      <Field label="Buscar por código público o nombre">{(p) => <input {...p} className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="T-105" />}</Field>
      {list.map((o) => (
        <OrderRow key={o.id} s={s} o={o} onOpen={() => onOpen(o.id)} />
      ))}
      {!list.length && <Empty title="Sin resultados" />}
    </div>
  );
}

export function OrderSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const [cancel, setCancel] = useState(false);
  const [motivo, setMotivo] = useState('');
  const o = id ? s.orders.find((x) => x.id === id) : null;
  const pi = o ? s.intents.find((x) => x.id === o.intentId) : null;
  return (
    <Sheet open={!!o} onClose={onClose} title={o ? `Pedido ${o.codigo}` : ''}>
      {o && (
        <div className="stack">
          <div className="row-wrap">
            <Tag>{o.canal === 'caja' ? 'Caja' : 'Web'}</Tag>
            <Tag>{METODO[o.metodo]}</Tag>
            <Tag tone={o.estado === 'activo' ? 'ok' : o.estado === 'esperando_pago' ? 'warn' : o.estado === 'completado' ? 'info' : 'bad'}>{o.estado.replace('_', ' ')}</Tag>
            <span className="muted small">creado {hhmm(o.creadoEn)} · hace {ago(s.now, o.creadoEn)}</span>
          </div>
          {o.lineas.map((l) => (
            <div key={l.id} className="row between small">
              <span>
                {l.cantidad}× {l.nombre} {l.sabor && `· ${l.sabor}`} <span className="muted">({l.presentacion})</span>
              </span>
              <Money cents={l.precioUnitario * l.cantidad} />
            </div>
          ))}
          <div className="row between">
            <strong>Total</strong>
            <Money cents={o.total} />
          </div>
          {o.estado === 'esperando_pago' && o.metodo === 'efectivo' && (
            <button className="btn btn-ok btn-lg" disabled={pending} onClick={() => run({ type: 'caja.registerCash', orderId: o.id })}>
              Registrar efectivo recibido · {ars(o.total)}
            </button>
          )}
          {o.estado === 'esperando_pago' && o.metodo === 'transferencia_manual' && <ManualVerify orderId={o.id} />}
          {o.estado === 'esperando_pago' && pi?.estado === 'pendiente' && (
            <div className="stack-xs">
              <span className="small muted">Proveedor de pago simulado (vence {hhmm(pi.venceEn)}):</span>
              <div className="row-wrap">
                <button className="btn btn-ok" disabled={pending} onClick={() => run({ type: 'payment.simulate', intentId: pi.id, resultado: 'aprobar' })}>
                  Aprobar
                </button>
                <button className="btn" disabled={pending} onClick={() => run({ type: 'payment.simulate', intentId: pi.id, resultado: 'pendiente' })}>
                  Pendiente
                </button>
                <button className="btn btn-danger" disabled={pending} onClick={() => run({ type: 'payment.simulate', intentId: pi.id, resultado: 'rechazar' })}>
                  Rechazar
                </button>
              </div>
            </div>
          )}
          {o.estado === 'incidencia' && (
            <div className="stack-xs">
              <Notice tone="warn">Aprobación tardía: el pedido vencido no se reactiva solo. Decidí si se cumple (se revisa disponibilidad) o se devuelve.</Notice>
              <div className="row-wrap">
                <button className="btn btn-primary" disabled={pending} onClick={() => run({ type: 'late.resolve', orderId: o.id, accion: 'cumplir' })}>
                  Cumplir pedido
                </button>
                <button className="btn btn-danger" disabled={pending} onClick={() => run({ type: 'late.resolve', orderId: o.id, accion: 'devolver' })}>
                  Devolver
                </button>
              </div>
            </div>
          )}
          {o.canal === 'caja' && o.estado === 'activo' && allUnits(o).some((u) => u.estado !== 'entregada' && u.estado !== 'cancelada') && (
            <div className="card flat row" style={{ gap: 16, flexWrap: 'wrap' }}>
              <QR value={`TERRACO-DEMO:${o.credencial}`} label={`QR de la credencial ${o.credencial}`} />
              <div className="stack-xs">
                <strong>Ticket para el cliente</strong>
                <span>
                  Código público <strong>{o.codigo}</strong>
                </span>
                <span className="cred">{o.credencial.slice(0, 3)}·{o.credencial.slice(3)}</span>
                <span className="xsmall muted">Credencial privada para retirar. Comprobante de demo, no fiscal.</span>
              </div>
            </div>
          )}
          {s.refunds
            .filter((r) => r.orderId === o.id)
            .map((r) => (
              <RefundRow key={r.id} id={r.id} />
            ))}
          {(o.estado === 'activo' || o.estado === 'esperando_pago') && (
            <button className="btn btn-danger" onClick={() => setCancel(true)}>
              Cancelar pedido…
            </button>
          )}
          <details>
            <summary className="small">Historial</summary>
            <ol className="small stack-xs" style={{ paddingLeft: 18 }}>
              {o.log.map((e, i) => (
                <li key={i}>
                  <span className="num muted">{hhmm(e.at)}</span> {e.msg} <span className="muted">· {e.by}</span>
                </li>
              ))}
            </ol>
          </details>
          <Confirm open={cancel} onClose={() => setCancel(false)} title={`¿Cancelar ${o.codigo}?`} confirmLabel="Cancelar pedido" tone="danger" onConfirm={() => run({ type: 'order.cancel', orderId: o.id, motivo: motivo || 'Cancelado en caja' })}>
            <p>Se cancelan las unidades no entregadas. Si hubo cobro, se crea una devolución simulada por lo no entregado. No se borra ningún movimiento.</p>
            <Field label="Motivo">{(p) => <input {...p} className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} />}</Field>
          </Confirm>
        </div>
      )}
    </Sheet>
  );
}

function ManualVerify({ orderId }: { orderId: string }) {
  const { run, pending } = useAction();
  const [m, setM] = useState('');
  const role = useSession().role;
  if (role !== 'encargado')
    return <Notice tone="warn">Esperando verificación del encargado (Operación de esta noche → Verificar). Una captura de comprobante no acredita el pago.</Notice>;
  return (
    <div className="stack-xs">
      <Notice tone="warn">Solo el encargado registra la verificación manual con el motivo (por ejemplo, acreditación vista en la cuenta). Una captura no acredita el pago.</Notice>
      <Field label="Cómo se verificó">{(p) => <input {...p} className="input" value={m} onChange={(e) => setM(e.target.value)} placeholder="Ej.: acreditación vista en home banking 22:10" />}</Field>
      <button className="btn btn-primary" disabled={pending || m.trim().length < 5} onClick={() => run({ type: 'payment.verifyManual', orderId, motivo: m })}>
        Registrar verificación
      </button>
    </div>
  );
}

export function RefundRow({ id }: { id: string }) {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const r = s.refunds.find((x) => x.id === id)!;
  return (
    <div className="card flat stack-xs">
      <div className="row between">
        <span className="small">
          Devolución {ars(r.monto)} a {r.pagador} · <span className="muted">{r.motivo}</span>
        </span>
        <Tag tone={r.estado === 'completada' ? 'ok' : r.estado === 'fallida' ? 'bad' : 'warn'}>{r.estado}</Tag>
      </div>
      {r.estado === 'pendiente' && (
        <div className="row-wrap">
          <span className="xsmall muted">Proveedor simulado:</span>
          <button className="btn btn-sm" disabled={pending} onClick={() => run({ type: 'refund.simulate', refundId: r.id, resultado: 'completada' })}>
            Marcar completada
          </button>
          <button className="btn btn-sm btn-danger" disabled={pending} onClick={() => run({ type: 'refund.simulate', refundId: r.id, resultado: 'fallida' })}>
            Simular falla
          </button>
        </div>
      )}
      {r.estado === 'fallida' && (
        <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} disabled={pending} onClick={() => run({ type: 'refund.retry', refundId: r.id })}>
          Reintentar devolución
        </button>
      )}
    </div>
  );
}

export function Incidents({ compact }: { compact?: boolean }) {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const [filter, setFilter] = useState<'abierta' | 'todas'>('abierta');
  const [res, setRes] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const list = s.incidents.filter((i) => filter === 'todas' || i.estado === 'abierta').sort((a, b) => b.creadaEn - a.creadaEn);
  const refunds = s.refunds.filter((r) => r.estado !== 'completada');
  return (
    <div className="stack-sm">
      <Seg label="Filtro" value={filter} onChange={setFilter} options={[{ value: 'abierta', label: 'Abiertas' }, { value: 'todas', label: 'Todas' }]} />
      {!list.length && <Empty title="Sin incidencias abiertas">Las fallas de pago, recepción, entrega y devoluciones aparecen acá.</Empty>}
      {list.map((i) => (
        <div key={i.id} className="card stack-xs">
          <div className="row between">
            <strong>{i.titulo}</strong>
            <Tag tone={i.estado === 'abierta' ? 'warn' : 'ok'} glyph={i.estado === 'abierta' ? '!' : '✓'}>
              {i.estado}
            </Tag>
          </div>
          <span className="small">{i.detalle}</span>
          <span className="xsmall muted">
            {hhmm(i.creadaEn)} {i.resolucion && `· Resolución: ${i.resolucion} (${i.resueltaPor})`}
          </span>
          {i.orderId && (
            <button className="link-btn small" style={{ alignSelf: 'flex-start' }} onClick={() => setOpen(i.orderId)}>
              Ver pedido
            </button>
          )}
          {i.estado === 'abierta' && !compact && (
            <div className="row">
              <input className="input" aria-label={`Resolución de ${i.titulo}`} placeholder="Cómo se resolvió" value={res[i.id] ?? ''} onChange={(e) => setRes({ ...res, [i.id]: e.target.value })} />
              <button className="btn" disabled={pending || (res[i.id] ?? '').trim().length < 3} onClick={() => run({ type: 'incident.resolve', incidentId: i.id, resolucion: res[i.id] })}>
                Resolver
              </button>
            </div>
          )}
        </div>
      ))}
      {!compact && refunds.length > 0 && (
        <>
          <h3 style={{ marginTop: 12 }}>Devoluciones sin completar</h3>
          {refunds.map((r) => (
            <RefundRow key={r.id} id={r.id} />
          ))}
        </>
      )}
      <OrderSheet id={open} onClose={() => setOpen(null)} />
    </div>
  );
}
