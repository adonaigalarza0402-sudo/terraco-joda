import { useMemo, useState } from 'react';
import { CATEGORIES, PRODUCTS, searchProducts } from '../../domain/catalog';
import { sellCheck, unitPrice } from '../../domain/engine';
import { ars } from '../../domain/money';
import { ROLE_LABEL, STAFF_ROLES } from '../../domain/roles';
import { hhmm, jornadaLabel, jornadaOf } from '../../domain/time';
import type { Moment, NightConfig, Reservation, ReservationState, Role, State } from '../../domain/types';
import { useStore } from '../../state/store';
import { Empty, Field, Notice, Seg, Sheet, Tag, Tabs, useAction } from '../../ui/kit';
import { RES_LABEL } from '../client/Reserve';
import { Incidents, OrderSheet } from './Caja';
import { Visitas } from './Entrega';
import { DetailedReports, Summary } from './Reports';
import { StaffShell } from './Shell';

type Tab = 'operacion' | 'preparar' | 'reservas' | 'carta' | 'equipo' | 'incidencias' | 'beneficios' | 'enlaces' | 'informes';

export function Encargado() {
  const s = useStore((x) => x);
  const [tab, setTab] = useState<Tab>('operacion');
  const incs = s.incidents.filter((i) => i.estado === 'abierta').length;
  const nav = (
    <Tabs
      label="Encargado"
      value={tab}
      onChange={setTab}
      options={[
        { value: 'operacion', label: 'Operación de esta noche' },
        { value: 'preparar', label: 'Preparar la noche' },
        { value: 'reservas', label: 'Reservas' },
        { value: 'carta', label: 'Carta y disponibilidad' },
        { value: 'incidencias', label: `Incidencias${incs ? ` (${incs})` : ''}` },
        { value: 'equipo', label: 'Equipo' },
        { value: 'beneficios', label: 'Beneficios' },
        { value: 'enlaces', label: 'Enlaces' },
        { value: 'informes', label: 'Informes' },
      ]}
    />
  );
  return (
    <StaffShell title="Encargado" nav={nav}>
      {tab === 'operacion' && <Operacion s={s} go={setTab} />}
      {tab === 'preparar' && <Preparar />}
      {tab === 'reservas' && <Reservas />}
      {tab === 'carta' && <Carta />}
      {tab === 'incidencias' && <Incidents />}
      {tab === 'equipo' && <Equipo />}
      {tab === 'beneficios' && <Beneficios />}
      {tab === 'enlaces' && <Enlaces />}
      {tab === 'informes' && <DetailedReports />}
    </StaffShell>
  );
}

function Signal({ n, label, tone, action, onClick }: { n: number; label: string; tone?: 'bad' | 'warn'; action: string; onClick: () => void }) {
  return (
    <div className="signal">
      <span className="s-count" style={{ color: n ? (tone === 'bad' ? 'var(--bad)' : tone === 'warn' ? 'var(--warn)' : 'var(--heading)') : 'var(--muted)' }}>
        {n}
      </span>
      <span className="grow small">{label}</span>
      <button className="btn btn-sm" onClick={onClick} disabled={!n}>
        {action}
      </button>
    </div>
  );
}

function Operacion({ s, go }: { s: State; go: (t: Tab) => void }) {
  const { run, pending } = useAction();
  const [open, setOpen] = useState<string | null>(null);
  const j = jornadaOf(s.now);
  const night = s.nights.find((n) => n.jornada === j)?.publicada;
  const transf = s.orders.filter((o) => o.estado === 'esperando_pago' && o.pago === 'esperando_verificacion');
  const tardias = s.orders.filter((o) => o.estado === 'incidencia');
  const sinRecepcion = s.orders.filter((o) => o.estado === 'activo' && o.tickets.some((t) => !t.recibidoEn));
  const listosViejos = s.orders.filter((o) => o.alertas.includes('listo') && o.estado === 'activo');
  const resHoy = s.reservations.filter((r) => r.jornada === j && ['consulta_creada', 'contacto_realizado', 'cambio_propuesto'].includes(r.estado));
  const incs = s.incidents.filter((i) => i.estado === 'abierta');
  const refunds = s.refunds.filter((r) => r.estado !== 'completada');
  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <div className="stack">
        <section className="stack-sm" aria-labelledby="sig-t">
          <h2 id="sig-t">Señales que piden acción</h2>
          {transf.map((o) => (
            <div key={o.id} className="signal">
              <span className="s-count" style={{ color: 'var(--warn)' }}>
                $
              </span>
              <span className="grow small">
                Transferencia por verificar: <strong>{o.codigo}</strong> · {ars(o.total)} · {o.alias}
              </span>
              <button className="btn btn-sm btn-primary" onClick={() => setOpen(o.id)}>
                Verificar
              </button>
            </div>
          ))}
          {tardias.map((o) => (
            <div key={o.id} className="signal">
              <span className="s-count" style={{ color: 'var(--bad)' }}>
                !
              </span>
              <span className="grow small">
                Aprobación tardía en <strong>{o.codigo}</strong>: decidir cumplir o devolver
              </span>
              <button className="btn btn-sm btn-primary" onClick={() => setOpen(o.id)}>
                Resolver
              </button>
            </div>
          ))}
          <Signal n={sinRecepcion.length} tone="bad" label="Pedidos cobrados sin recepción en estación" action="Ver incidencias" onClick={() => go('incidencias')} />
          <Signal n={listosViejos.length} tone="warn" label={`Listos sin retirar hace más de ${s.config.alertaListoMin} min (regla de demo)`} action="Ver" onClick={() => go('incidencias')} />
          <Signal n={incs.length} tone="warn" label="Incidencias abiertas" action="Ver" onClick={() => go('incidencias')} />
          <Signal n={refunds.length} tone="warn" label="Devoluciones sin completar" action="Ver" onClick={() => go('incidencias')} />
          <Signal n={resHoy.length} label="Consultas de reserva de hoy sin cerrar" action="Gestionar" onClick={() => go('reservas')} />
        </section>
        <section className="card stack-sm">
          <h3>Estaciones y contingencia</h3>
          {(['cocina', 'barra'] as const).map((e) => (
            <div key={e} className="row between">
              <span>
                {e === 'cocina' ? 'Cocina' : 'Barra'}: {s.stations[e].online ? <Tag tone="ok" glyph="●">en línea</Tag> : <Tag tone="bad" glyph="■">sin conexión</Tag>}
              </span>
              <span className="xsmall muted">última sync {hhmm(s.stations[e].ultimaSync)}</span>
            </div>
          ))}
          <label className="check">
            <input type="checkbox" checked={s.config.contingencia} disabled={pending} onChange={(e) => run({ type: 'config.set', patch: { contingencia: e.target.checked } })} />
            <span className="small">
              <strong>Procedimiento de contingencia</strong>: caja puede tomar pedidos numerados para una estación sin conexión, comunicarlos en papel y registrar recepción manual. Se concilian al reconectar.
            </span>
          </label>
          <p className="xsmall muted">Dos puestos desconectados no pueden garantizar que no haya doble retiro: durante la contingencia, una sola persona responsable valida entregas con lista.</p>
        </section>
        <section className="card stack-sm">
          <h3>Apariencia de la app de clientes</h3>
          <Seg
            label="Apariencia operativa"
            value={s.config.aparienciaOperativa ?? 'auto'}
            onChange={(v) => run({ type: 'config.set', patch: { aparienciaOperativa: v } })}
            options={[
              { value: 'auto', label: 'Según horario' },
              { value: 'cena', label: 'Cena (claro)' },
              { value: 'joda', label: 'Joda (oscuro)' },
            ]}
          />
          <p className="xsmall muted">Solo cambia los colores que ven los clientes en «Automático». No abre ni cierra cocina, no cambia precios ni pedidos. Cada persona puede elegir Claro u Oscuro en su menú.</p>
        </section>
      </div>
      <div className="stack">
        <Summary />
        {night && (
          <section className="card stack-sm">
            <h3>Pausas operativas (pedidos nuevos)</h3>
            <p className="xsmall muted">Pausar no borra pedidos aceptados. Cocina toma pedidos nuevos hasta las {night.cocinaNuevasHasta}; barra hasta las {night.barraNuevasHasta}.</p>
            <div className="row-wrap">
              {CATEGORIES.map((c) => {
                const paused = !!s.config.categoriasPausadas[c.nombre];
                return (
                  <button key={c.nombre} className="chip" aria-pressed={paused} disabled={pending} onClick={() => run({ type: 'category.pause', categoria: c.nombre, pausada: !paused })} title={paused ? 'Pausada: tocá para reanudar' : 'Activa: tocá para pausar'}>
                    {paused ? '‖ ' : ''}
                    {c.nombre}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
      <OrderSheet id={open} onClose={() => setOpen(null)} />
    </div>
  );
}

// ------------------------------------------------------------------ Preparar la noche
function diffConfigs(a: NightConfig | null, b: NightConfig): string[] {
  if (!a) return ['Primera publicación de esta fecha.'];
  const out: string[] = [];
  const ma = new Map(a.momentos.map((m) => [m.id, m]));
  for (const m of b.momentos) {
    const o = ma.get(m.id);
    if (!o) out.push(`Nuevo momento: ${m.titulo} ${m.inicio}–${m.fin}`);
    else {
      if (o.inicio !== m.inicio || o.fin !== m.fin) out.push(`${m.titulo}: horario ${o.inicio}–${o.fin} → ${m.inicio}–${m.fin}`);
      if ((o.artista ?? '') !== (m.artista ?? '')) out.push(`${m.titulo}: artista «${o.artista ?? '—'}» → «${m.artista ?? '—'}»`);
      if (o.confirmado !== m.confirmado) out.push(`${m.titulo}: ${m.confirmado ? 'pasa a confirmado' : 'pasa a «a confirmar»'}`);
      if (o.titulo !== m.titulo) out.push(`Momento renombrado: ${o.titulo} → ${m.titulo}`);
    }
  }
  for (const m of a.momentos) if (!b.momentos.some((x) => x.id === m.id)) out.push(`Se quita: ${m.titulo}`);
  for (const c of Object.keys(b.categoriasActivas)) if (a.categoriasActivas[c] !== b.categoriasActivas[c]) out.push(`${c}: ${b.categoriasActivas[c] ? 'se ofrece' : 'no se ofrece'}`);
  if (a.cocinaNuevasHasta !== b.cocinaNuevasHasta) out.push(`Cocina toma pedidos hasta ${a.cocinaNuevasHasta} → ${b.cocinaNuevasHasta}`);
  if (a.barraNuevasHasta !== b.barraNuevasHasta) out.push(`Barra toma pedidos hasta ${a.barraNuevasHasta} → ${b.barraNuevasHasta}`);
  if (a.modalidadComida !== b.modalidadComida) out.push(`Comida: ${a.modalidadComida} → ${b.modalidadComida}`);
  for (const k of Object.keys(b.responsables) as (keyof NightConfig['responsables'])[]) if (a.responsables[k] !== b.responsables[k]) out.push(`Responsable de ${k}: ${a.responsables[k]} → ${b.responsables[k]}`);
  for (const k of ['cocina', 'barra'] as const) if (a.puntosRetiro[k] !== b.puntosRetiro[k]) out.push(`Retiro ${k}: ${a.puntosRetiro[k]} → ${b.puntosRetiro[k]}`);
  if (a.notas !== b.notas) out.push('Notas actualizadas');
  if (a.pendientes.join() !== b.pendientes.join()) out.push('Pendientes actualizados');
  if (a.reservasHorarios.join() !== b.reservasHorarios.join()) out.push(`Horarios de reserva: ${b.reservasHorarios.join(', ')}`);
  return out.length ? out : ['Sin cambios respecto de lo publicado.'];
}

function Preparar() {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const nights = [...s.nights].sort((a, b) => a.jornada.localeCompare(b.jornada));
  const [nid, setNid] = useState(nights.find((n) => n.jornada === jornadaOf(s.now))?.id ?? nights[0].id);
  const night = s.nights.find((n) => n.id === nid)!;
  const base = night.borrador ?? night.publicada!;
  const [draft, setDraft] = useState<NightConfig>(() => structuredClone(base));
  const [loadedFor, setLoadedFor] = useState(`${nid}:${night.historial.length}`);
  const [review, setReview] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [newDate, setNewDate] = useState('2026-12-05');
  const [tplId, setTplId] = useState(s.templates[0]?.id ?? '');
  const key = `${nid}:${night.historial.length}`;
  if (key !== loadedFor) {
    setLoadedFor(key);
    setDraft(structuredClone(night.borrador ?? night.publicada!));
  }
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  const setM = (i: number, patch: Partial<Moment>) => setDraft({ ...draft, momentos: draft.momentos.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
  const changes = diffConfigs(night.publicada, draft);
  return (
    <div className="stack">
      <div className="row-wrap">
        <Seg label="Fecha" value={nid} onChange={setNid} options={nights.map((n) => ({ value: n.id, label: `${n.jornada}${n.publicada ? '' : ' (borrador)'}` }))} />
        <button className="btn btn-sm" onClick={() => setTplOpen(true)}>
          Plantillas…
        </button>
      </div>
      <div className="row-wrap">
        <h2 className="display">
          {jornadaLabel(night.jornada)}
        </h2>
        {night.publicada ? <Tag tone="ok" glyph="✓">Publicada {night.publicadaEn ? hhmm(night.publicadaEn) : ''}</Tag> : <Tag tone="warn" glyph="○">No publicada</Tag>}
        {night.borrador && <Tag tone="warn" className="dashed">Hay un borrador guardado</Tag>}
        {dirty && <Tag tone="info">Cambios sin guardar</Tag>}
      </div>
      <Notice>Flujo: borrador → revisar cambios → publicar. La portada, la carta y los resúmenes del equipo leen solo lo publicado. Copiar una plantilla no copia ventas, aportes, votos, asistencias ni reservas.</Notice>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="card stack-sm">
          <h3>Momentos</h3>
          {draft.momentos.map((m, i) => (
            <div key={m.id} className="stack-xs" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
              <div className="row-wrap">
                <input className="input" style={{ maxWidth: 180 }} aria-label="Título del momento" value={m.titulo} onChange={(e) => setM(i, { titulo: e.target.value })} />
                <input className="input" style={{ maxWidth: 100 }} aria-label="Inicio" type="time" value={m.inicio} onChange={(e) => setM(i, { inicio: e.target.value })} />
                <input className="input" style={{ maxWidth: 100 }} aria-label="Fin" type="time" value={m.fin} onChange={(e) => setM(i, { fin: e.target.value })} />
              </div>
              {m.tipo !== 'cena' && m.tipo !== 'cierre' && (
                <div className="row-wrap">
                  <input className="input grow" aria-label="Artista" value={m.artista ?? ''} onChange={(e) => setM(i, { artista: e.target.value || null })} placeholder="Artista (ficticio en la demo)" />
                  <label className="check">
                    <input type="checkbox" checked={m.confirmado} onChange={(e) => setM(i, { confirmado: e.target.checked })} />
                    <span className="small">Confirmado</span>
                  </label>
                </div>
              )}
            </div>
          ))}
          <p className="xsmall muted">Los horarios después de medianoche pertenecen a la misma jornada. Un artista tentativo se muestra «a confirmar».</p>
        </section>
        <section className="card stack-sm">
          <h3>Operación</h3>
          <div className="row-wrap">
            <Field label="Cocina: pedidos nuevos hasta">{(p) => <input {...p} type="time" className="input" value={draft.cocinaNuevasHasta} onChange={(e) => setDraft({ ...draft, cocinaNuevasHasta: e.target.value })} />}</Field>
            <Field label="Barra: pedidos nuevos hasta">{(p) => <input {...p} type="time" className="input" value={draft.barraNuevasHasta} onChange={(e) => setDraft({ ...draft, barraNuevasHasta: e.target.value })} />}</Field>
          </div>
          <div className="row-wrap">
            <Field label="Retiro de bebidas">{(p) => <input {...p} className="input" value={draft.puntosRetiro.barra} onChange={(e) => setDraft({ ...draft, puntosRetiro: { ...draft.puntosRetiro, barra: e.target.value } })} />}</Field>
            <Field label="Retiro de comida">{(p) => <input {...p} className="input" value={draft.puntosRetiro.cocina} onChange={(e) => setDraft({ ...draft, puntosRetiro: { ...draft.puntosRetiro, cocina: e.target.value } })} />}</Field>
          </div>
          <div className="stack-xs">
            <span className="label">Comida</span>
            <Seg label="Modalidad de comida" value={draft.modalidadComida} onChange={(v) => setDraft({ ...draft, modalidadComida: v })} options={[{ value: 'retiro', label: 'Retiro' }, { value: 'mesa', label: 'A la mesa (prueba)' }]} />
          </div>
          <div className="grid-3">
            {(Object.keys(draft.responsables) as (keyof NightConfig['responsables'])[]).map((k) => (
              <Field key={k} label={`Responsable ${k}`}>
                {(p) => <input {...p} className="input" value={draft.responsables[k]} onChange={(e) => setDraft({ ...draft, responsables: { ...draft.responsables, [k]: e.target.value } })} />}
              </Field>
            ))}
          </div>
          <Field label="Horarios para consultas de reserva (coma)">{(p) => <input {...p} className="input" value={draft.reservasHorarios.join(', ')} onChange={(e) => setDraft({ ...draft, reservasHorarios: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />}</Field>
          <Field label="Notas">{(p) => <textarea {...p} className="input" value={draft.notas} onChange={(e) => setDraft({ ...draft, notas: e.target.value })} />}</Field>
          <Field label="Pendientes (uno por línea)">{(p) => <textarea {...p} className="input" value={draft.pendientes.join('\n')} onChange={(e) => setDraft({ ...draft, pendientes: e.target.value.split('\n') })} />}</Field>
        </section>
      </div>
      <section className="card stack-sm">
        <h3>Categorías que se ofrecen esta fecha</h3>
        <div className="row-wrap">
          {CATEGORIES.map((c) => (
            <label key={c.nombre} className="chip" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={draft.categoriasActivas[c.nombre] !== false} onChange={(e) => setDraft({ ...draft, categoriasActivas: { ...draft.categoriasActivas, [c.nombre]: e.target.checked } })} />
              {c.nombre}
            </label>
          ))}
        </div>
      </section>
      <div className="row-wrap" style={{ position: 'sticky', bottom: 0, background: 'var(--bg)', padding: '10px 0', borderTop: '1px solid var(--line)' }}>
        <button className="btn" disabled={pending || !dirty} onClick={() => run({ type: 'night.saveDraft', nightId: nid, config: draft })}>
          Guardar borrador
        </button>
        <button className="btn btn-primary" disabled={pending || (!dirty && !night.borrador)} onClick={() => setReview(true)}>
          Revisar cambios y publicar
        </button>
        {night.borrador && (
          <button className="btn btn-ghost" disabled={pending} onClick={() => run({ type: 'night.discardDraft', nightId: nid })}>
            Descartar borrador
          </button>
        )}
      </div>
      <Sheet open={review} onClose={() => setReview(false)} title="Revisar antes de publicar">
        <div className="stack">
          <ul className="stack-xs" style={{ margin: 0, paddingLeft: 18 }}>
            {changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="small muted">Al publicar, la portada, la carta y el equipo usan esta configuración. Los pedidos ya aceptados no cambian.</p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setReview(false)}>
              Volver
            </button>
            <button
              className="btn btn-primary"
              disabled={pending}
              onClick={async () => {
                if (dirty) await run({ type: 'night.saveDraft', nightId: nid, config: draft }, { quiet: true });
                await run({ type: 'night.publish', nightId: nid });
                setReview(false);
              }}
            >
              Publicar
            </button>
          </div>
        </div>
      </Sheet>
      <Sheet open={tplOpen} onClose={() => setTplOpen(false)} title="Plantillas de noche">
        <div className="stack">
          <button className="btn" disabled={pending} onClick={() => run({ type: 'night.saveTemplate', nightId: nid, nombre: `Plantilla desde ${night.jornada}` })}>
            Guardar esta fecha como plantilla
          </button>
          <hr />
          <Field label="Plantilla">
            {(p) => (
              <select {...p} className="select input" value={tplId} onChange={(e) => setTplId(e.target.value)}>
                {s.templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Nueva fecha (jornada)">{(p) => <input {...p} type="date" className="input" value={newDate} onChange={(e) => setNewDate(e.target.value)} />}</Field>
          <button
            className="btn btn-primary"
            disabled={pending || !tplId}
            onClick={async () => {
              const r = await run({ type: 'night.createFromTemplate', templateId: tplId, jornada: newDate, titulo: 'Fecha de demostración desde plantilla' });
              if (r.ok) setTplOpen(false);
            }}
          >
            Crear fecha como borrador
          </button>
          <p className="xsmall muted">Se copia solo configuración. Los artistas quedan «a confirmar» y no se copia la sesión del DJ.</p>
        </div>
      </Sheet>
    </div>
  );
}

// ------------------------------------------------------------------ Reservas
function Reservas() {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const fechas = [...new Set(s.reservations.map((r) => r.jornada).concat(s.nights.filter((n) => n.publicada).map((n) => n.jornada)))].sort();
  const [j, setJ] = useState(jornadaOf(s.now));
  const [assist, setAssist] = useState(false);
  const [f, setF] = useState({ nombre: '', contacto: '', personas: 2, horario: '21:30', origen: 'whatsapp_directo' as Reservation['origen'], notas: '' });
  const list = s.reservations.filter((r) => r.jornada === j).sort((a, b) => a.horario.localeCompare(b.horario));
  const night = s.nights.find((n) => n.jornada === j)?.publicada;
  const personasConf = list.filter((r) => ['confirmada', 'llegada'].includes(r.estado)).reduce((a, r) => a + r.personas, 0);
  return (
    <div className="stack">
      <div className="row-wrap">
        <label className="small">
          Fecha{' '}
          <select className="select input" style={{ width: 'auto', minHeight: 38 }} value={j} onChange={(e) => setJ(e.target.value)}>
            {fechas.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary btn-sm" onClick={() => setAssist(true)}>
          + Cargar consulta recibida por WhatsApp
        </button>
      </div>
      <Notice>
        Registro único para consultas web y directas. Confirmadas: {personasConf} personas{night ? ` de un cupo de ejemplo de ${night.reservasCupoPersonas}` : ''}. El cupo es un supuesto de demo: la disponibilidad real depende de la composición de mesas.
      </Notice>
      {!list.length && <Empty title="Sin consultas para esta fecha" />}
      <div className="stack-sm">
        {list.map((r) => (
          <ResRow key={r.id} r={r} s={s} run={run} pending={pending} />
        ))}
      </div>
      <Sheet open={assist} onClose={() => setAssist(false)} title="Carga asistida">
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await run({ type: 'reservation.create', jornada: j, horario: f.horario, personas: f.personas, nombre: f.nombre, contacto: f.contacto, notas: f.notas, origen: f.origen });
            if (r.ok) setAssist(false);
          }}
        >
          <Seg label="Origen" value={f.origen} onChange={(v) => setF({ ...f, origen: v })} options={[{ value: 'whatsapp_directo', label: 'WhatsApp directo' }, { value: 'presencial', label: 'Presencial' }]} />
          <Field label="Nombre">{(p) => <input {...p} className="input" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />}</Field>
          <Field label="Teléfono">{(p) => <input {...p} className="input" value={f.contacto} onChange={(e) => setF({ ...f, contacto: e.target.value })} />}</Field>
          <div className="row-wrap">
            <Field label="Personas">{(p) => <input {...p} type="number" min={1} max={30} className="input" value={f.personas} onChange={(e) => setF({ ...f, personas: Number(e.target.value) })} />}</Field>
            <Field label="Horario">{(p) => <input {...p} type="time" className="input" value={f.horario} onChange={(e) => setF({ ...f, horario: e.target.value })} />}</Field>
          </div>
          <p className="xsmall muted">Se marca «contacto realizado». Si el teléfono ya tiene una consulta para la fecha, se avisa como posible duplicado.</p>
          <button className="btn btn-primary" disabled={pending}>
            Guardar en el registro
          </button>
        </form>
      </Sheet>
    </div>
  );
}

function ResRow({ r, s, run, pending }: { r: Reservation; s: State; run: ReturnType<typeof useAction>['run']; pending: boolean }) {
  const [prop, setProp] = useState('');
  const [mesa, setMesa] = useState(r.mesaAsignada ?? '');
  const lab = RES_LABEL[r.estado];
  const link = r.linkId ? s.links.find((l) => l.id === r.linkId) : null;
  const act = (estado: ReservationState, extra: { propuesta?: string; mesa?: string | null } = {}) => run({ type: 'reservation.setState', id: r.id, estado, ...extra });
  return (
    <div className="card stack-xs">
      <div className="row between" style={{ flexWrap: 'wrap' }}>
        <span>
          <strong>{r.horario}</strong> · {r.nombre} · {r.personas} p. <span className="muted small">· {r.ref} · {r.origen === 'web' ? 'web' : r.origen === 'whatsapp_directo' ? 'WhatsApp directo' : 'presencial'}</span>
        </span>
        <Tag tone={lab.tone} glyph={lab.glyph}>
          {lab.label}
        </Tag>
      </div>
      <span className="small muted">
        {r.contacto}
        {r.notas && ` · «${r.notas}»`}
        {link && ` · llegó por ${link.etiqueta}`}
        {r.origen === 'web' && ` · borrador ${r.borradorVisto ? 'visto' : 'no visto'}${r.enlaceWhatsAppAbierto ? ', enlace de WhatsApp abierto (no prueba envío)' : ''}`}
      </span>
      {r.posibleDuplicado && <Tag tone="warn" glyph="!">Posible duplicado de {r.posibleDuplicado}</Tag>}
      {r.estado === 'cambio_propuesto' && <span className="small">Propuesta: {r.propuesta}</span>}
      <div className="row-wrap">
        {['consulta_creada', 'incompleta'].includes(r.estado) && (
          <button className="btn btn-sm" disabled={pending} onClick={() => act('contacto_realizado')}>
            Registrar contacto
          </button>
        )}
        {['consulta_creada', 'contacto_realizado', 'cambio_propuesto', 'incompleta'].includes(r.estado) && (
          <>
            <select className="select input" style={{ width: 'auto', minHeight: 36, padding: '4px 8px' }} aria-label="Mesa de ejemplo" value={mesa} onChange={(e) => setMesa(e.target.value)}>
              <option value="">Sin mesa asignada</option>
              {s.tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} ({t.plazas})
                </option>
              ))}
            </select>
            <button className="btn btn-sm btn-ok" disabled={pending} onClick={() => act('confirmada', { mesa: mesa || null })}>
              Confirmar
            </button>
          </>
        )}
        {['consulta_creada', 'contacto_realizado', 'incompleta', 'confirmada'].includes(r.estado) && (
          <span className="row">
            <input className="input" style={{ maxWidth: 200, minHeight: 36 }} aria-label="Propuesta de cambio" placeholder="Propuesta (ej. 22:30)" value={prop} onChange={(e) => setProp(e.target.value)} />
            <button className="btn btn-sm" disabled={pending || !prop.trim()} onClick={() => act('cambio_propuesto', { propuesta: prop })}>
              Proponer cambio
            </button>
          </span>
        )}
        {r.estado === 'confirmada' && (
          <>
            <button className="btn btn-sm btn-ok" disabled={pending} onClick={() => act('llegada')}>
              Llegó
            </button>
            <button className="btn btn-sm" disabled={pending} onClick={() => act('ausente')}>
              Ausente
            </button>
          </>
        )}
        {r.estado === 'ausente' && (
          <button className="btn btn-sm" disabled={pending} onClick={() => act('llegada')}>
            Llegó tarde
          </button>
        )}
        {['consulta_creada', 'contacto_realizado'].includes(r.estado) && (
          <button className="btn btn-sm" disabled={pending} onClick={() => act('incompleta')}>
            Marcar incompleta
          </button>
        )}
        {!['cancelada', 'llegada'].includes(r.estado) && (
          <button className="btn btn-sm btn-ghost" disabled={pending} onClick={() => act('cancelada')}>
            Cancelar
          </button>
        )}
      </div>
      <details>
        <summary className="xsmall">Historial</summary>
        <ol className="xsmall" style={{ paddingLeft: 18 }}>
          {r.historial.map((h, i) => (
            <li key={i}>
              {hhmm(h.at)} {h.msg} · {h.by}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

// ------------------------------------------------------------------ Carta
function Carta() {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const [q, setQ] = useState('');
  const [onlyFlags, setOnlyFlags] = useState(false);
  const [price, setPrice] = useState<{ key: string; val: string } | null>(null);
  const list = useMemo(() => searchProducts(q).filter((p) => !onlyFlags || p.observaciones || p.presentaciones.some((x) => x.tipo !== 'publicado')), [q, onlyFlags]);
  return (
    <div className="stack">
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="card stack-sm">
          <h3>Supuestos de demo</h3>
          <label className="check">
            <input type="checkbox" checked={s.config.supuestos.pizzas_precio_encabezado} disabled={pending} onChange={(e) => run({ type: 'config.set', patch: { supuestos: { ...s.config.supuestos, pizzas_precio_encabezado: e.target.checked } } })} />
            <span className="small">Pizzas: usar $20.000 del encabezado para cada variedad (a confirmar)</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={s.config.supuestos.empanadas_docena} disabled={pending} onChange={(e) => run({ type: 'config.set', patch: { supuestos: { ...s.config.supuestos, empanadas_docena: e.target.checked } } })} />
            <span className="small">Empanadas: vender docena de un mismo sabor a $20.000 (presentación de prueba; x4 sigue consultable)</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={s.config.supuestos.whisky_vasos} disabled={pending} onChange={(e) => run({ type: 'config.set', patch: { supuestos: { ...s.config.supuestos, whisky_vasos: e.target.checked } } })} />
            <span className="small">Whisky: habilitar los dos íconos de vaso (sin volumen confirmado)</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={s.config.ginFrutosRojos.habilitado} disabled={pending} onChange={(e) => run({ type: 'config.set', patch: { ginFrutosRojos: { ...s.config.ginFrutosRojos, habilitado: e.target.checked } } })} />
            <span className="small">Gin: frutos rojos como modificador ficticio con recargo de demo de {ars(s.config.ginFrutosRojos.recargo)} (la carta no publica recargo)</span>
          </label>
        </section>
        <section className="card stack-sm">
          <h3>Stock ficticio controlado</h3>
          {Object.entries(s.insumos).map(([k, v]) => (
            <div key={k} className="row between">
              <span className="small">{v.nombre}</span>
              <input className="input" style={{ maxWidth: 90 }} type="number" min={0} aria-label={`Stock de ${v.nombre}`} value={v.stock} disabled={pending} onChange={(e) => run({ type: 'insumo.set', insumo: k, stock: Math.max(0, Number(e.target.value) || 0) }, { quiet: true })} />
            </div>
          ))}
          <p className="xsmall muted">Solo estos insumos tienen conteo en la demo (combo de fernet con 5 latas, latas de Coca, la última botella de Moet y rabas). El resto no tiene stock cargado.</p>
        </section>
      </div>
      <div className="row-wrap">
        <input className="input" style={{ maxWidth: 320 }} aria-label="Buscar producto" placeholder="Buscar producto" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="check">
          <input type="checkbox" checked={onlyFlags} onChange={(e) => setOnlyFlags(e.target.checked)} />
          <span className="small">Solo con dudas para el local</span>
        </label>
        <span className="small muted">{list.length} de {PRODUCTS.length} referencias</span>
      </div>
      <div className="table-wrap card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Presentación</th>
              <th className="num">Precio</th>
              <th>Disponibilidad</th>
              <th>Fuente y dudas</th>
            </tr>
          </thead>
          <tbody>
            {list.flatMap((p) =>
              p.presentaciones.map((pr, i) => {
                const chk = sellCheck(s, pr.key);
                const cur = unitPrice(s, pr.key, []);
                const demo = s.config.preciosDemo[pr.key] !== undefined;
                return (
                  <tr key={pr.key}>
                    <td>{i === 0 && <strong>{p.nombre}</strong>}{i === 0 && <div className="xsmall muted">{p.categoria}</div>}</td>
                    <td className="small">
                      {pr.etiqueta}
                      <div className="xsmall muted">{pr.tipo === 'publicado' ? 'publicado' : pr.tipo === 'supuesto' ? 'supuesto de demo' : 'consultable'}</div>
                    </td>
                    <td className="num">
                      {cur === null ? '—' : ars(cur)}
                      {demo && <div className="xsmall" style={{ color: 'var(--warn)' }}>demo (carta {pr.precio !== null ? ars(pr.precio) : '—'})</div>}
                      {pr.precio !== null && (
                        <div>
                          <button className="link-btn xsmall" onClick={() => setPrice({ key: pr.key, val: String((cur ?? pr.precio ?? 0) / 100) })}>
                            cambiar
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <select className="select input" style={{ minHeight: 34, padding: '2px 6px' }} aria-label={`Disponibilidad de ${p.nombre} ${pr.etiqueta}`} value={s.config.disponibilidad[pr.key] ?? 'disponible'} disabled={pending} onChange={(e) => run({ type: 'avail.set', presKey: pr.key, estado: e.target.value as 'disponible' })}>
                        <option value="disponible">Disponible</option>
                        <option value="pausado">Pausado</option>
                        <option value="agotado">Agotado</option>
                      </select>
                      {!chk.ok && <div className="xsmall muted">{chk.motivo}</div>}
                    </td>
                    <td className="xsmall">
                      {i === 0 && (
                        <>
                          {p.fuenteCodigo} · «{p.precioTexto}»{p.observaciones && <div style={{ color: 'var(--warn)' }}>{p.observaciones}</div>}
                        </>
                      )}
                      {pr.motivo && <div className="muted">{pr.motivo}</div>}
                      {pr.extraPendiente && <div className="muted">{pr.extraPendiente}</div>}
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
      <Sheet open={!!price} onClose={() => setPrice(null)} title="Precio de demostración">
        {price && (
          <div className="stack">
            <p className="small muted">Cambia el precio solo dentro de la demo (por ejemplo, para probar la revisión al repetir un pedido). No modifica la carta fuente. Los pedidos confirmados conservan su precio.</p>
            <Field label="Precio en pesos">{(p) => <input {...p} className="input" type="number" min={1} value={price.val} onChange={(e) => setPrice({ ...price, val: e.target.value })} />}</Field>
            <div className="row-wrap">
              <button className="btn btn-primary" disabled={pending || !(Number(price.val) > 0)} onClick={async () => { const r = await run({ type: 'price.set', presKey: price.key, precio: Math.round(Number(price.val) * 100) }); if (r.ok) setPrice(null); }}>
                Guardar precio de demo
              </button>
              <button className="btn" disabled={pending} onClick={async () => { await run({ type: 'price.set', presKey: price.key, precio: null }); setPrice(null); }}>
                Volver al precio de carta
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

// ------------------------------------------------------------------ Equipo
function Equipo() {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  return (
    <div className="stack" style={{ maxWidth: 900 }}>
      <Notice>Roles de demostración combinables: una persona puede cubrir varios puestos. No es una dotación real ni una autorización de servidor.</Notice>
      {s.staff.map((st) => (
        <div key={st.id} className="card stack-xs">
          <strong>{st.nombre}</strong>
          <div className="row-wrap">
            {STAFF_ROLES.map((r) => {
              const on = st.roles.includes(r);
              return (
                <button key={r} className="chip" aria-pressed={on} disabled={pending} onClick={() => run({ type: 'staff.setRoles', staffId: st.id, roles: (on ? st.roles.filter((x) => x !== r) : [...st.roles, r]) as Role[] })}>
                  {ROLE_LABEL[r]}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ Beneficios
function Beneficios() {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const [rule, setRule] = useState(s.benefitRule);
  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <section className="card stack-sm">
        <h3>Regla de ejemplo</h3>
        <Notice tone="warn">No hay política comercial aprobada. Esta regla es editable y se muestra como ejemplo.</Notice>
        <div className="row-wrap">
          <Field label="Visitas validadas">{(p) => <input {...p} type="number" min={2} className="input" value={rule.umbralVisitas} onChange={(e) => setRule({ ...rule, umbralVisitas: Number(e.target.value) })} />}</Field>
          <Field label="Descuento %">{(p) => <input {...p} type="number" min={1} max={50} className="input" value={rule.porcentaje} onChange={(e) => setRule({ ...rule, porcentaje: Number(e.target.value) })} />}</Field>
          <Field label="Tope ($)">{(p) => <input {...p} type="number" min={0} className="input" value={rule.tope / 100} onChange={(e) => setRule({ ...rule, tope: Math.round(Number(e.target.value) * 100) })} />}</Field>
          <Field label="Vigencia (días)">{(p) => <input {...p} type="number" min={1} className="input" value={rule.vigenciaDias} onChange={(e) => setRule({ ...rule, vigenciaDias: Number(e.target.value) })} />}</Field>
        </div>
        <Seg label="Aplica a" value={rule.aplicaA} onChange={(v) => setRule({ ...rule, aplicaA: v })} options={[{ value: 'comida_y_sin_alcohol', label: 'Comida y sin alcohol' }, { value: 'toda_la_carta', label: 'Toda la carta' }]} />
        <Field label="Condiciones visibles">{(p) => <textarea {...p} className="input" value={rule.condiciones} onChange={(e) => setRule({ ...rule, condiciones: e.target.value })} />}</Field>
        <button className="btn btn-primary" disabled={pending} onClick={() => run({ type: 'benefit.setRule', rule })}>
          Guardar regla de ejemplo
        </button>
        <p className="xsmall muted">Costo de ejemplo no calculado: definir con el dueño cuánto cuesta el incentivo antes de un piloto.</p>
      </section>
      <section className="stack-sm">
        <h3>Validar visitas</h3>
        <Visitas />
        <h3>Cupones emitidos</h3>
        {s.coupons.map((c) => (
          <div key={c.id} className="card tight row between">
            <span className="small">
              <strong>{c.codigo}</strong> · {s.profiles.find((p) => p.id === c.profileId)?.alias} · hito {c.hito}
            </span>
            <Tag>{c.estado}</Tag>
          </div>
        ))}
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ Enlaces
function Enlaces() {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const [origen, setOrigen] = useState<'instagram' | 'dj' | 'otro' | 'desconocido'>('instagram');
  const [etiqueta, setEtiqueta] = useState('');
  const base = `${location.origin}${location.pathname}#/?ref=`;
  return (
    <div className="stack" style={{ maxWidth: 1000 }}>
      <Notice>Función opcional. Genera enlaces internos de demo por fecha y origen. Regla visible: último enlace identificado dentro del recorrido de consulta de reserva. No hay comisiones ni pagos a promotores.</Notice>
      <section className="card stack-sm">
        <h3>Nuevo enlace</h3>
        <div className="row-wrap">
          <Seg label="Origen" value={origen} onChange={setOrigen} options={[{ value: 'instagram', label: 'Instagram TERRACO' }, { value: 'dj', label: 'Difusión del DJ' }, { value: 'otro', label: 'Otro' }]} />
          <input className="input" style={{ maxWidth: 280 }} aria-label="Etiqueta" placeholder="Etiqueta (ej. historia del viernes)" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} />
          <button className="btn btn-primary" disabled={pending} onClick={() => run({ type: 'link.create', origen, etiqueta, jornada: jornadaOf(s.now) })}>
            Crear
          </button>
        </div>
      </section>
      <div className="stack-sm">
        {s.links.map((l) => (
          <div key={l.id} className="card tight row between" style={{ flexWrap: 'wrap' }}>
            <span className="small">
              <strong>{l.etiqueta}</strong> · {l.origen} · {l.jornada}
              <br />
              <code className="xsmall">{base + l.codigo}</code>
            </span>
            <a className="btn btn-sm" href={`#/?ref=${l.codigo}`} target="_blank" rel="noreferrer">
              Abrir como visitante ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
