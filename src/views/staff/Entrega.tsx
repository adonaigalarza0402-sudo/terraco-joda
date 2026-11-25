import { useState } from 'react';
import { allUnits, normCred } from '../../domain/engine';
import { ago, hhmm } from '../../domain/time';
import type { Order, State } from '../../domain/types';
import { useStore } from '../../state/store';
import { pickupPoint, UNIT_LABEL } from '../../ui/derive';
import { Empty, Field, Notice, Sheet, Tag, Tabs, useAction } from '../../ui/kit';
import { StaffShell } from './Shell';

export function readyByPoint(s: State) {
  const map = new Map<string, { o: Order; n: number; since: number; estacion: 'cocina' | 'barra' }[]>();
  for (const o of s.orders) {
    if (o.estado !== 'activo') continue;
    for (const e of ['barra', 'cocina'] as const) {
      const us = allUnits(o).filter((u) => u.line.estacion === e && u.estado === 'lista');
      if (!us.length) continue;
      const p = pickupPoint(s, o, e);
      map.set(p, [...(map.get(p) ?? []), { o, n: us.length, since: Math.min(...us.map((u) => u.listaEn ?? s.now)), estacion: e }]);
    }
  }
  return map;
}

export function Entrega() {
  const s = useStore((x) => x);
  const [tab, setTab] = useState<'retiro' | 'mesa' | 'visitas'>('retiro');
  const nav = (
    <Tabs
      label="Entrega"
      value={tab}
      onChange={setTab}
      options={[
        { value: 'retiro', label: 'Validar y entregar' },
        { value: 'mesa', label: 'Servicio a mesa' },
        { value: 'visitas', label: 'Validar visita' },
      ]}
    />
  );
  return (
    <StaffShell title="Entrega" nav={nav}>
      {tab === 'retiro' && <Retiro s={s} />}
      {tab === 'mesa' && <Mesa s={s} />}
      {tab === 'visitas' && <Visitas />}
    </StaffShell>
  );
}

function Retiro({ s }: { s: State }) {
  const { run, pending } = useAction();
  const [code, setCode] = useState('');
  const [found, setFound] = useState<string | null>(null);
  const [err, setErr] = useState<string | undefined>();
  const [sel, setSel] = useState<string[]>([]);
  const [dispute, setDispute] = useState<Order | null>(null);
  const [motivo, setMotivo] = useState('');
  const points = readyByPoint(s);
  const o = found ? s.orders.find((x) => x.id === found) : null;

  function validate(e?: React.FormEvent) {
    e?.preventDefault();
    const c = normCred(code.replace(/^TERRACO-DEMO:/i, ''));
    const match = s.orders.find((x) => x.credencial === c);
    if (!match) {
      const pub = s.orders.find((x) => normCred(x.codigo) === c);
      setErr(pub ? `${pub.codigo} es el código público: no autoriza el retiro. Pedí la credencial privada.` : 'No encontramos esa credencial. Revisá el código.');
      setFound(null);
      return;
    }
    setErr(undefined);
    setFound(match.id);
    setSel(allUnits(match).filter((u) => u.estado === 'lista' && !(match.modalidad === 'mesa' && u.line.estacion === 'cocina')).map((u) => u.id));
  }

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <section className="card stack" aria-labelledby="val-t">
        <h2 id="val-t">Validar credencial</h2>
        <form className="stack-sm" onSubmit={validate}>
          <Field label="Credencial privada del cliente" hint="Escribila o pegá el contenido del QR. La cámara es una mejora opcional no incluida en la demo." error={err}>
            {(p) => <input {...p} className="input input-lg" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" spellCheck={false} placeholder="ABC·DEF" />}
          </Field>
          <button className="btn btn-primary btn-lg">Validar</button>
        </form>
        {o && (
          <div className="stack-sm fade-in" aria-live="polite">
            <div className="row between">
              <span className="code-big">{o.codigo}</span>
              <Tag tone={o.estado === 'completado' ? 'info' : o.estado === 'activo' ? 'ok' : 'bad'}>{o.estado === 'completado' ? 'Ya entregado por completo' : o.estado}</Tag>
            </div>
            {o.estado !== 'activo' && o.estado !== 'completado' && <Notice tone="bad">Este pedido está {o.estado}: no se entrega.</Notice>}
            {o.lineas.map((l) => (
              <div key={l.id} className="stack-xs">
                <strong>
                  {l.nombre}
                  {l.sabor && ` · ${l.sabor}`} <span className="small muted">({l.presentacion})</span>
                </strong>
                {l.unidades.map((u, i) => {
                  const mesaFood = o.modalidad === 'mesa' && l.estacion === 'cocina';
                  return (
                    <label key={u.id} className="check" style={{ paddingLeft: 8 }}>
                      <input type="checkbox" disabled={u.estado !== 'lista' || mesaFood} checked={sel.includes(u.id)} onChange={(e) => setSel(e.target.checked ? [...sel, u.id] : sel.filter((x) => x !== u.id))} />
                      <span className="row-wrap">
                        <span className="small">Unidad {i + 1}</span>
                        <Tag tone={UNIT_LABEL[u.estado].tone} glyph={UNIT_LABEL[u.estado].glyph} className="xsmall">
                          {UNIT_LABEL[u.estado].label}
                          {u.entregadaEn && ` ${hhmm(u.entregadaEn)}`}
                        </Tag>
                        {mesaFood && <span className="xsmall muted">va a la mesa</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}
            <div className="row-wrap">
              <button
                className="btn btn-ok btn-lg"
                disabled={pending || !sel.length || o.estado !== 'activo'}
                onClick={async () => {
                  const r = await run({ type: 'delivery.deliver', orderId: o.id, credencial: o.credencial === normCred(code.replace(/^TERRACO-DEMO:/i, '')) ? code.replace(/^TERRACO-DEMO:/i, '') : '', unitIds: sel });
                  if (r.ok) setSel([]);
                }}
              >
                Entregar {sel.length} unidad(es)
              </button>
              <button className="btn btn-ghost" onClick={() => setDispute(o)}>
                Entrega discutida
              </button>
            </div>
            <p className="xsmall muted">Se registra solo lo entregado. Las unidades pendientes quedan para otro retiro. Los controles presenciales siguen a cargo del local.</p>
          </div>
        )}
      </section>
      <section className="stack-sm" aria-labelledby="pend-t">
        <h2 id="pend-t">Listos por punto de retiro</h2>
        {!points.size && <Empty title="Nada listo para retirar">Cuando barra o cocina marquen unidades listas aparecen acá.</Empty>}
        {[...points.entries()].map(([p, list]) => (
          <div key={p} className="card stack-sm">
            <div className="row between">
              <strong>{p}</strong>
              <span className="tag num">{list.length}</span>
            </div>
            {list
              .sort((a, b) => a.since - b.since)
              .map((x) => (
                <div key={x.o.id + x.estacion} className="row between small">
                  <span>
                    <strong className="num">{x.o.codigo}</strong> · {x.n} unidad(es)
                  </span>
                  <span className={s.now - x.since > s.config.alertaListoMin * 60_000 ? '' : 'muted'} style={s.now - x.since > s.config.alertaListoMin * 60_000 ? { color: 'var(--bad)', fontWeight: 700 } : undefined}>
                    lista hace {ago(s.now, x.since)}
                  </span>
                </div>
              ))}
          </div>
        ))}
        <p className="xsmall muted">Para entregar hay que validar la credencial privada; el código público solo identifica el pedido.</p>
      </section>
      <Sheet open={!!dispute} onClose={() => setDispute(null)} title={`Entrega discutida ${dispute?.codigo ?? ''}`}>
        <div className="stack">
          <Field label="Qué pasó">{(p) => <textarea {...p} className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: dice que faltó un trago" />}</Field>
          <button
            className="btn btn-primary"
            disabled={motivo.trim().length < 3}
            onClick={async () => {
              const r = await run({ type: 'delivery.dispute', orderId: dispute!.id, motivo });
              if (r.ok) {
                setDispute(null);
                setMotivo('');
              }
            }}
          >
            Registrar para el encargado
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function Mesa({ s }: { s: State }) {
  const { run, pending } = useAction();
  const list = s.orders.filter((o) => o.estado === 'activo' && o.modalidad === 'mesa' && allUnits(o).some((u) => u.line.estacion === 'cocina' && u.estado === 'lista'));
  return (
    <div className="stack-sm">
      <Notice>Servicio a mesa es una configuración de prueba hasta que el dueño confirme cómo se entrega la comida. Se confirma la entrega en la mesa sin credencial.</Notice>
      {!list.length && <Empty title="Nada para llevar a mesa" />}
      {list.map((o) => {
        const us = allUnits(o).filter((u) => u.line.estacion === 'cocina' && u.estado === 'lista');
        return (
          <div key={o.id} className="card row between">
            <div>
              <strong>{pickupPoint(s, o, 'cocina')}</strong> · <span className="num">{o.codigo}</span>
              <p className="small muted">{us.map((u) => u.line.nombre).join(', ')}</p>
            </div>
            <button className="btn btn-ok" disabled={pending} onClick={() => run({ type: 'delivery.deliver', orderId: o.id, credencial: null, unitIds: us.map((u) => u.id), mesa: true })}>
              Confirmar entrega en mesa
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function Visitas() {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  return (
    <div className="stack-sm" style={{ maxWidth: 640 }}>
      <Notice>Validación presencial simulada: una por persona y jornada operativa (antes y después de medianoche cuenta como la misma noche). Un QR escaneado o una compra no crean visitas.</Notice>
      {s.profiles.map((p) => {
        const n = s.visits.filter((v) => v.profileId === p.id).length;
        return (
          <div key={p.id} className="card row between">
            <div>
              <strong>{p.alias}</strong>
              <p className="small muted">{n} visita(s) validadas</p>
            </div>
            <button className="btn btn-primary" disabled={pending} onClick={() => run({ type: 'visit.validate', profileId: p.id })}>
              Validar visita de hoy
            </button>
          </div>
        );
      })}
    </div>
  );
}
