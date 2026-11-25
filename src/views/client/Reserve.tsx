import { useState } from 'react';
import { hhmm, jornadaLabel, jornadaOf } from '../../domain/time';
import type { ReservationState } from '../../domain/types';
import { session, useSession } from '../../state/session';
import { useStore } from '../../state/store';
import { Field, Link, navigate, Notice, Stepper, Tag, toast, useAction, useRoute } from '../../ui/kit';
import { CONTACT } from './Home';

export const RES_LABEL: Record<ReservationState, { label: string; tone?: 'ok' | 'warn' | 'bad' | 'info'; glyph: string }> = {
  consulta_creada: { label: 'Consulta creada · pendiente de confirmación', tone: 'warn', glyph: '○' },
  contacto_realizado: { label: 'El local te contactó · pendiente', tone: 'info', glyph: '◐' },
  cambio_propuesto: { label: 'El local propuso un cambio', tone: 'warn', glyph: '⇄' },
  confirmada: { label: 'Confirmada por el local', tone: 'ok', glyph: '✓' },
  cancelada: { label: 'Cancelada', tone: 'bad', glyph: '✕' },
  llegada: { label: 'Llegada registrada', tone: 'ok', glyph: '✓✓' },
  ausente: { label: 'Ausente', tone: 'bad', glyph: '–' },
  incompleta: { label: 'Consulta incompleta (sin contacto)', glyph: '…' },
};

export function draftText(r: { jornada: string; horario: string; personas: number; ref: string }) {
  return `Hola, quiero consultar una reserva en TERRACO para el ${jornadaLabel(r.jornada).toLowerCase()} a las ${r.horario}. Somos ${r.personas} personas. Mi referencia es ${r.ref}.`;
}

export function Reserve() {
  const s = useStore((x) => x);
  const ses = useSession();
  const { query } = useRoute();
  const { run, pending } = useAction();
  const today = jornadaOf(s.now);
  const nights = s.nights.filter((n) => n.publicada && n.jornada >= today).sort((a, b) => a.jornada.localeCompare(b.jornada));
  const [fecha, setFecha] = useState(query.get('fecha') ?? nights[0]?.jornada ?? '');
  const night = nights.find((n) => n.jornada === fecha);
  const horarios = night?.publicada?.reservasHorarios ?? [];
  const [horario, setHorario] = useState('');
  const [personas, setPersonas] = useState(2);
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [notas, setNotas] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mine = s.reservations.filter((r) => ses.reservas.includes(r.id));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await run({ type: 'reservation.create', jornada: fecha, horario, personas, nombre, contacto, notas, origen: 'web', linkCodigo: ses.lastLink }, { quiet: true });
    if (r.ok) {
      session.set({ reservas: [...ses.reservas, r.data.id] });
      navigate(`/reserva/${r.data.id}`);
    } else {
      setErrors(r.data?.errors ?? {});
      toast(r.message, 'bad');
    }
  }

  return (
    <div className="cx-narrow stack" style={{ paddingTop: 8 }}>
      <h1 className="cx-title">Consultar reserva</h1>
      <p className="small muted">Creás una consulta con referencia y la continuás por WhatsApp. La reserva solo queda confirmada cuando el local la confirma.</p>
      {mine.length > 0 && (
        <div className="stack-xs">
          {mine.map((r) => (
            <Link key={r.id} to={`/reserva/${r.id}`} className="card flat row between" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span>
                <strong>{r.ref}</strong> <span className="small muted">· {r.horario} · {r.personas} p.</span>
              </span>
              <Tag tone={RES_LABEL[r.estado].tone} glyph={RES_LABEL[r.estado].glyph}>
                {RES_LABEL[r.estado].label}
              </Tag>
            </Link>
          ))}
        </div>
      )}
      <form className="card stack" onSubmit={submit} noValidate>
        <Field label="Fecha" error={errors.jornada}>
          {(p) => (
            <select {...p} className="select input" value={fecha} onChange={(e) => { setFecha(e.target.value); setHorario(''); }}>
              {nights.map((n) => (
                <option key={n.id} value={n.jornada}>
                  {jornadaLabel(n.jornada)} — {n.titulo}
                </option>
              ))}
            </select>
          )}
        </Field>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack-sm">
          <legend className="label" style={{ marginBottom: 8 }}>
            Horario propuesto
          </legend>
          <div className="chips" style={{ flexWrap: 'wrap' }}>
            {horarios.map((h) => (
              <button key={h} type="button" className="chip" aria-pressed={horario === h} onClick={() => setHorario(h)}>
                {h}
              </button>
            ))}
          </div>
          {errors.horario && <span className="error small" style={{ color: 'var(--bad)', fontWeight: 600 }}>{errors.horario}</span>}
          <span className="xsmall muted">Horarios de ejemplo de la demo. El local confirma disponibilidad según sus mesas.</span>
        </fieldset>
        <div className="row between">
          <span className="label">Personas</span>
          <Stepper value={personas} min={1} max={30} onChange={setPersonas} label="Personas" />
        </div>
        <Field label="Nombre" error={errors.nombre}>
          {(p) => <input {...p} className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />}
        </Field>
        <Field label="Teléfono de contacto" hint="Solo para responder esta consulta. No lo usamos para publicidad." error={errors.contacto}>
          {(p) => <input {...p} className="input" type="tel" inputMode="tel" value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="+54 9 3725 …" autoComplete="tel" />}
        </Field>
        <Field label="Comentario (opcional)">
          {(p) => <textarea {...p} className="input" maxLength={200} value={notas} onChange={(e) => setNotas(e.target.value)} />}
        </Field>
        <p className="xsmall muted">Una reserva de cena no incluye beneficios, entrada ni mesa durante el baile salvo que el local lo indique.</p>
        <button className="btn btn-primary btn-lg" disabled={pending || !fecha}>
          Crear consulta
        </button>
      </form>
    </div>
  );
}

export function ReservationDetail({ id }: { id: string }) {
  const s = useStore((x) => x);
  const ses = useSession();
  const { run } = useAction();
  const r = s.reservations.find((x) => x.id === id);
  const [showDraft, setShowDraft] = useState(true);
  if (!r || !ses.reservas.includes(r.id))
    return (
      <div className="empty" style={{ marginTop: 16 }}>
        <h3>Consulta no disponible</h3>
        <p className="small">Solo ves las consultas creadas en esta pestaña.</p>
      </div>
    );
  const text = draftText(r);
  const url = `${CONTACT.whatsappUrl}?text=${encodeURIComponent(text)}`;
  const st = RES_LABEL[r.estado];
  return (
    <div className="cx-narrow stack" style={{ paddingTop: 8 }}>
      <Link to="/reserva" className="small">
        ← Consultas
      </Link>
      <section className="card stack-sm" aria-live="polite">
        <p className="eyebrow">Referencia</p>
        <p className="code-big">{r.ref}</p>
        <Tag tone={st.tone} glyph={st.glyph}>
          {st.label}
        </Tag>
        <p className="small">
          {jornadaLabel(r.jornada)} · {r.horario} · {r.personas} personas
        </p>
        {r.estado === 'cambio_propuesto' && <Notice tone="warn">Propuesta del local: {r.propuesta}</Notice>}
        {r.estado === 'consulta_creada' && <Notice tone="warn">Todavía no es una reserva. Continuá por WhatsApp para que el local la confirme.</Notice>}
      </section>
      {['consulta_creada', 'incompleta', 'contacto_realizado', 'cambio_propuesto'].includes(r.estado) && (
        <section className="card stack-sm" aria-labelledby="wa-t">
          <h2 id="wa-t">Continuar por WhatsApp</h2>
          <button className="btn" aria-expanded={showDraft} onClick={() => { setShowDraft(!showDraft); run({ type: 'reservation.mark', id: r.id, accion: 'borrador_visto' }, { quiet: true }); }}>
            {showDraft ? 'Ocultar borrador' : 'Ver borrador del mensaje'}
          </button>
          {showDraft && (
            <>
              <blockquote className="card flat" style={{ margin: 0 }}>
                {text}
              </blockquote>
              <div className="row-wrap">
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(text);
                      toast('Borrador copiado. Nada se envió.', 'ok');
                    } catch {
                      toast('No se pudo copiar: seleccioná el texto manualmente.', 'bad');
                    }
                  }}
                >
                  Copiar borrador
                </button>
                <a className="btn" href={url} target="_blank" rel="noreferrer noopener" onClick={() => run({ type: 'reservation.mark', id: r.id, accion: 'enlace_abierto' }, { quiet: true })}>
                  Abrir WhatsApp ↗
                </a>
              </div>
              <p className="xsmall muted">Abrir el enlace no envía el mensaje ni prueba que el local lo haya leído. Vos decidís enviarlo. Número: {CONTACT.whatsapp}.</p>
            </>
          )}
        </section>
      )}
      <section className="card flat stack-xs">
        <h3>Historial</h3>
        <ol className="small stack-xs" style={{ margin: 0, paddingLeft: 18 }}>
          {r.historial.map((h, i) => (
            <li key={i}>
              <span className="num muted">{hhmm(h.at)}</span> {h.msg}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
