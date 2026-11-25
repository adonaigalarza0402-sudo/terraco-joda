import { useState } from 'react';
import { attribution, pollStats } from '../../domain/reports';
import { hhmm, jornadaOf } from '../../domain/time';
import type { Poll } from '../../domain/types';
import { useSession } from '../../state/session';
import { useStore } from '../../state/store';
import { Empty, Field, Notice, Seg, Stepper, Tag, Tabs, useAction } from '../../ui/kit';
import { StaffShell } from './Shell';

type Tab = 'sesion' | 'perfil' | 'delegar' | 'alcance';

export function DJView() {
  const ses = useSession();
  const s = useStore((x) => x);
  const me = s.staff.find((x) => x.id === ses.staffId);
  const isAsist = ses.role === 'dj_asistente';
  const sessions = s.sessions.filter((x) => (isAsist ? x.asistenteId === ses.staffId : !me?.djId || x.djId === me.djId));
  const [sid, setSid] = useState(sessions.find((x) => x.jornada === jornadaOf(s.now))?.id ?? sessions[0]?.id ?? '');
  const [tab, setTab] = useState<Tab>('sesion');
  const sesion = s.sessions.find((x) => x.id === sid);
  const dj = sesion ? s.djs.find((d) => d.id === sesion.djId) : s.djs.find((d) => d.id === me?.djId);
  const nav = (
    <Tabs
      label="DJ"
      value={tab}
      onChange={setTab}
      options={[
        { value: 'sesion', label: 'Sesión y encuesta' },
        ...(!isAsist ? [{ value: 'perfil' as Tab, label: 'Perfil y playlists' }, { value: 'delegar' as Tab, label: 'Delegar' }] : []),
        { value: 'alcance', label: 'Alcance (agregado)' },
      ]}
    />
  );
  return (
    <StaffShell title={isAsist ? 'Asistente del DJ' : 'DJ'} nav={nav}>
      {!sesion ? (
        <Empty title="Sin sesiones asignadas">{isAsist ? 'El DJ todavía no te delegó tareas.' : 'No hay sesiones para este perfil.'}</Empty>
      ) : (
        <div className="stack">
          {sessions.length > 1 && (
            <Seg label="Sesión" value={sid} onChange={setSid} options={sessions.map((x) => ({ value: x.id, label: `${x.jornada} ${x.inicio}` }))} />
          )}
          {tab === 'sesion' && <SessionTab sid={sid} />}
          {tab === 'perfil' && dj && <Profile djId={dj.id} />}
          {tab === 'delegar' && <Delegate sid={sid} />}
          {tab === 'alcance' && <Reach djId={sesion.djId} />}
        </div>
      )}
    </StaffShell>
  );
}

function SessionTab({ sid }: { sid: string }) {
  const s = useStore((x) => x);
  const sesion = s.sessions.find((x) => x.id === sid)!;
  const dj = s.djs.find((d) => d.id === sesion.djId)!;
  const polls = s.polls.filter((p) => p.sesionId === sid);
  const active = polls.find((p) => p.estado === 'abierta' || p.estado === 'pausada');
  const drafts = polls.filter((p) => p.estado === 'borrador');
  const done = polls.filter((p) => p.estado === 'cerrada' || p.estado === 'cancelada').reverse();
  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <div className="stack">
        <section className="card stack-xs">
          <p className="eyebrow">Sesión actual</p>
          <h2 className="display">{dj.nombre}</h2>
          <p className="small muted">
            {sesion.jornada} · {sesion.inicio}–{sesion.fin} · ahora {hhmm(s.now)}
          </p>
          <p className="xsmall muted">Participar es decisión tuya. Las opciones salen de tu repertorio aceptado; el resultado orienta, no reproduce nada.</p>
        </section>
        {active ? <ActivePoll p={active} /> : <Notice>No hay encuesta activa. Una sola activa por sesión.</Notice>}
        {drafts.map((p) => (
          <DraftPoll key={p.id} p={p} blocked={!!active} />
        ))}
        {done.length > 0 && (
          <section className="card flat stack-sm">
            <h3>Historial</h3>
            {done.map((p) => (
              <ClosedPoll key={p.id} p={p} />
            ))}
          </section>
        )}
      </div>
      <CreatePoll sid={sid} />
    </div>
  );
}

function useStats(p: Poll) {
  const s = useStore((x) => x);
  const j = s.sessions.find((x) => x.id === p.sesionId)!.jornada;
  return pollStats(s, j).find((x) => x.poll.id === p.id)!;
}

function ActivePoll({ p }: { p: Poll }) {
  const { run, pending } = useAction();
  const st = useStats(p);
  const [cancel, setCancel] = useState('');
  return (
    <section className="card stack-sm" style={{ borderColor: 'var(--accent)' }} aria-live="polite">
      <div className="row between">
        <p className="eyebrow">Encuesta activa</p>
        <Tag tone={p.estado === 'abierta' ? 'ok' : 'warn'} glyph={p.estado === 'abierta' ? '●' : '‖'}>
          {p.estado === 'abierta' ? `Cierra ${hhmm(p.cierraEn!)}` : 'Pausada'}
        </Tag>
      </div>
      <h2>{p.pregunta}</h2>
      {st.counts.map((c) => (
        <div key={c.id} className="stack-xs">
          <div className="row between small">
            <span>{c.label}</span>
            <span className="num">{c.votos}</span>
          </div>
          <div className="bar">
            <span style={{ width: `${st.total ? (c.votos / st.total) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
      <p className="xsmall muted">
        {st.total} votos de {st.universo} con acceso de noche. {p.politica}
      </p>
      <div className="row-wrap">
        {p.estado === 'abierta' ? (
          <button className="btn" disabled={pending} onClick={() => run({ type: 'poll.pause', pollId: p.id })}>
            Pausar
          </button>
        ) : (
          <button className="btn" disabled={pending} onClick={() => run({ type: 'poll.resume', pollId: p.id })}>
            Reanudar
          </button>
        )}
        <button className="btn btn-primary" disabled={pending} onClick={() => run({ type: 'poll.close', pollId: p.id })}>
          Cerrar ahora
        </button>
      </div>
      <div className="row">
        <input className="input" aria-label="Motivo de cancelación" placeholder="Motivo para cancelar (se muestra al público)" value={cancel} onChange={(e) => setCancel(e.target.value)} />
        <button className="btn btn-danger" disabled={pending || cancel.trim().length < 3} onClick={() => run({ type: 'poll.cancel', pollId: p.id, motivo: cancel })}>
          Cancelar
        </button>
      </div>
    </section>
  );
}

function DraftPoll({ p, blocked }: { p: Poll; blocked: boolean }) {
  const { run, pending } = useAction();
  return (
    <section className="card flat stack-xs">
      <div className="row between">
        <strong>{p.pregunta}</strong>
        <Tag className="dashed">borrador</Tag>
      </div>
      <span className="small muted">
        {p.opciones.map((o) => o.label).join(' · ')} · {p.duracionMin} min
      </span>
      <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={pending || blocked} onClick={() => run({ type: 'poll.open', pollId: p.id })}>
        {blocked ? 'Hay otra activa' : 'Abrir encuesta'}
      </button>
    </section>
  );
}

function ClosedPoll({ p }: { p: Poll }) {
  const { run, pending } = useAction();
  const st = useStats(p);
  const [nota, setNota] = useState('');
  return (
    <div className="stack-xs" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
      <div className="row between">
        <strong className="small">{p.pregunta}</strong>
        <Tag tone={p.estado === 'cancelada' ? 'bad' : undefined}>{p.estado}</Tag>
      </div>
      <span className="small">
        {st.counts.map((c) => `${c.label}: ${c.votos}`).join(' · ')} · {st.total}/{st.universo}
        {st.empate && ' · empate'}
        {st.pocos && ' · pocos votos'}
      </span>
      {p.motivoCancelacion && <span className="xsmall muted">Motivo: {p.motivoCancelacion}</span>}
      {p.estado === 'cerrada' &&
        (p.decisionDJ ? (
          <span className="small">Tu decisión: {p.opciones.find((o) => o.id === p.decisionDJ!.opcionId)?.label ?? 'otra'} {p.decisionDJ.nota}</span>
        ) : (
          <div className="row-wrap">
            {p.opciones.map((o) => (
              <button key={o.id} className="btn btn-sm" disabled={pending} onClick={() => run({ type: 'poll.decide', pollId: p.id, opcionId: o.id, nota })}>
                Elijo {o.label}
              </button>
            ))}
            <input className="input" style={{ maxWidth: 240 }} aria-label="Nota de la decisión" placeholder="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />
          </div>
        ))}
    </div>
  );
}

function CreatePoll({ sid }: { sid: string }) {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const sesion = s.sessions.find((x) => x.id === sid)!;
  const dj = s.djs.find((d) => d.id === sesion.djId)!;
  const [tplId, setTplId] = useState(s.pollTemplates[0].id);
  const tpl = s.pollTemplates.find((t) => t.id === tplId)!;
  const opciones = tpl.tipo === 'genero' ? tpl.opciones.filter((o) => dj.repertorioConfirmado.includes(o)) : tpl.opciones;
  const [sel, setSel] = useState<string[]>([]);
  const [dur, setDur] = useState(8);
  const [min, setMin] = useState(5);
  const valid = sel.length >= 2 && sel.length <= 4;
  return (
    <section className="card stack-sm" aria-labelledby="new-poll">
      <h2 id="new-poll">Crear encuesta desde plantilla</h2>
      <div className="chips" style={{ flexWrap: 'wrap' }}>
        {s.pollTemplates.map((t) => (
          <button key={t.id} className="chip" aria-pressed={tplId === t.id} onClick={() => { setTplId(t.id); setSel([]); }}>
            {t.titulo}
          </button>
        ))}
      </div>
      <p className="small">
        <strong>{tpl.pregunta}</strong>
      </p>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack-xs">
        <legend className="small muted" style={{ marginBottom: 6 }}>
          Elegí de 2 a 4 opciones que puedas cumplir {tpl.tipo === 'genero' && '(filtradas por tu repertorio aceptado)'}
        </legend>
        {opciones.map((o) => (
          <label key={o} className="check">
            <input type="checkbox" checked={sel.includes(o)} onChange={(e) => setSel(e.target.checked ? [...sel, o] : sel.filter((x) => x !== o))} disabled={!sel.includes(o) && sel.length >= 4} />
            <span>{o}</span>
          </label>
        ))}
      </fieldset>
      <div className="row between">
        <span className="small">Duración (min, reloj compartido)</span>
        <Stepper value={dur} min={2} max={30} onChange={setDur} label="Duración" />
      </div>
      <div className="row between">
        <span className="small">Mínimo de votos para considerar el resultado</span>
        <Stepper value={min} min={1} max={50} onChange={setMin} label="Mínimo de votos" />
      </div>
      <p className="xsmall muted">Política anunciada: empate o menos de {min} votos → decide el DJ. Sin comentarios libres ni pagos por prioridad.</p>
      <button className="btn btn-primary" disabled={pending || !valid} onClick={async () => { const r = await run({ type: 'poll.create', sesionId: sid, pregunta: tpl.pregunta, opciones: sel, duracionMin: dur, minVotos: min }); if (r.ok) setSel([]); }}>
        Crear (queda en borrador)
      </button>
    </section>
  );
}

function Profile({ djId }: { djId: string }) {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const dj = s.djs.find((d) => d.id === djId)!;
  const [desc, setDesc] = useState(dj.descripcion);
  const [gen, setGen] = useState(dj.generos.join(', '));
  const [rep, setRep] = useState(dj.repertorioConfirmado.join(', '));
  const [links, setLinks] = useState(dj.enlaces);
  return (
    <section className="card stack" style={{ maxWidth: 720 }}>
      <Notice>Perfil ficticio de prueba. Los enlaces son de ejemplo: la app no reproduce música ni copia catálogos.</Notice>
      <Field label="Descripción">{(p) => <textarea {...p} className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />}</Field>
      <Field label="Géneros (separados por coma)">{(p) => <input {...p} className="input" value={gen} onChange={(e) => setGen(e.target.value)} />}</Field>
      <Field label="Repertorio que aceptás para encuestas" hint="Distinto de las playlists: es lo que realmente te comprometés a tocar si gana.">
        {(p) => <input {...p} className="input" value={rep} onChange={(e) => setRep(e.target.value)} />}
      </Field>
      <div className="stack-sm">
        <span className="label">Enlaces</span>
        {links.map((l, i) => (
          <div key={l.id} className="row">
            <input className="input" aria-label="Etiqueta del enlace" value={l.etiqueta} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, etiqueta: e.target.value } : x)))} />
            <input className="input" aria-label="URL del enlace" value={l.url} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            <button className="btn btn-ghost icon-btn" aria-label="Quitar enlace" onClick={() => setLinks(links.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        ))}
        <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setLinks([...links, { id: `e${Date.now()}`, tipo: 'playlist', etiqueta: 'Nueva playlist (ejemplo)', url: 'https://example.com/' }])}>
          + Agregar enlace
        </button>
      </div>
      <button
        className="btn btn-primary"
        disabled={pending}
        onClick={() =>
          run({ type: 'dj.updateProfile', djId, patch: { descripcion: desc, generos: gen.split(',').map((x) => x.trim()).filter(Boolean), repertorioConfirmado: rep.split(',').map((x) => x.trim()).filter(Boolean), enlaces: links.filter((l) => /^https?:\/\//.test(l.url)) } })
        }
      >
        Guardar perfil
      </button>
    </section>
  );
}

function Delegate({ sid }: { sid: string }) {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const ses = s.sessions.find((x) => x.id === sid)!;
  const asistentes = s.staff.filter((x) => x.roles.includes('dj_asistente'));
  const [who, setWho] = useState(ses.asistenteId ?? asistentes[0]?.id ?? '');
  const [perm, setPerm] = useState<('crear' | 'abrir' | 'cerrar')[]>(ses.permisosAsistente.length ? ses.permisosAsistente : ['crear', 'abrir', 'cerrar']);
  return (
    <section className="card stack" style={{ maxWidth: 620 }}>
      <p className="small">Delegá expresamente tareas a un asistente autorizado de demostración. Podés retirarlas cuando quieras.</p>
      <Field label="Asistente">
        {(p) => (
          <select {...p} className="select input" value={who} onChange={(e) => setWho(e.target.value)}>
            {asistentes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        )}
      </Field>
      {(['crear', 'abrir', 'cerrar'] as const).map((k) => (
        <label key={k} className="check">
          <input type="checkbox" checked={perm.includes(k)} onChange={(e) => setPerm(e.target.checked ? [...perm, k] : perm.filter((x) => x !== k))} />
          <span>{k === 'crear' ? 'Crear encuestas desde plantilla' : k === 'abrir' ? 'Abrir y reanudar' : 'Pausar, cerrar, cancelar y registrar decisión'}</span>
        </label>
      ))}
      <p className="small">
        Estado actual: {ses.asistenteId ? <Tag tone="ok">delegado a {s.staff.find((x) => x.id === ses.asistenteId)?.nombre} · {ses.permisosAsistente.join(', ')}</Tag> : <Tag>sin delegación</Tag>}
      </p>
      <div className="row-wrap">
        <button className="btn btn-primary" disabled={pending || !who || !perm.length} onClick={() => run({ type: 'dj.delegate', sesionId: sid, asistenteId: who, permisos: perm })}>
          Delegar
        </button>
        <button className="btn" disabled={pending || !ses.asistenteId} onClick={() => run({ type: 'dj.delegate', sesionId: sid, asistenteId: null, permisos: [] })}>
          Retirar delegación
        </button>
      </div>
    </section>
  );
}

function Reach({ djId }: { djId: string }) {
  const s = useStore((x) => x);
  const dj = s.djs.find((d) => d.id === djId);
  const nombre = dj ? dj.nombre.replace(/ \(.*\)$/, '') : '';
  const rows = attribution(s).filter((r) => r.link.origen === 'dj' && !!nombre && r.link.etiqueta.includes(nombre));
  return (
    <section className="card stack-sm" style={{ maxWidth: 720 }}>
      <h2>Tu enlace de difusión</h2>
      <p className="small muted">Solo datos agregados, sin datos personales de reservas. Un enlace reenviado limita la interpretación y no demuestra causa.</p>
      {!rows.length && <Empty title="Sin enlace asignado" />}
      {rows.map((r) => (
        <div key={r.link.id} className="grid-3">
          <div className="kpi">
            <span className="k-val">{r.visitas}</span>
            <span className="k-lab">visitas al enlace</span>
          </div>
          <div className="kpi">
            <span className="k-val">{r.solicitudes}</span>
            <span className="k-lab">consultas de reserva</span>
          </div>
          <div className="kpi">
            <span className="k-val">{r.confirmadas}</span>
            <span className="k-lab">confirmadas por el local</span>
          </div>
          <div className="kpi">
            <span className="k-val">{r.asistencias}</span>
            <span className="k-lab">con llegada registrada</span>
          </div>
        </div>
      ))}
    </section>
  );
}
