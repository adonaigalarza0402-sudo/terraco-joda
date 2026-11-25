import { useState } from 'react';
import { pollStats } from '../../domain/reports';
import { hhmm, jornadaLabel, jornadaOf } from '../../domain/time';
import type { Poll, State } from '../../domain/types';
import { session, useSession } from '../../state/session';
import { useStore } from '../../state/store';
import { activeSession, nightMoments, type MomentView } from '../../ui/derive';
import { Link, useAction } from '../../ui/kit';
import { I, Note, Pill, Sun } from './ui';

export function Timeline({ moments }: { moments: MomentView[] }) {
  return (
    <ol className="cx-timeline">
      {moments.map((m) => (
        <li key={m.id} className={m.now ? 'now' : m.past ? 'past' : ''}>
          <span className="t cx-num">{m.inicio}</span>
          <span className="d" aria-hidden />
          <span>
            <span style={{ fontWeight: 700 }}>
              {m.titulo} {m.now && <Pill tone="accent">Ahora</Pill>}
              {m.past && <span className="sr-only"> (terminado)</span>}
            </span>
            {m.artista && (
              <span className="cx-sub" style={{ display: 'block' }}>
                {m.artista}
                {!m.confirmado && ' · a confirmar'}
              </span>
            )}
            <span className="cx-fine cx-num" style={{ display: 'block' }}>
              {m.inicio}–{m.fin}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function Tonight() {
  const s = useStore((x) => x);
  const moments = nightMoments(s);
  const ses = activeSession(s);
  const dj = ses ? s.djs.find((d) => d.id === ses.djId) : null;
  const jornada = jornadaOf(s.now);
  const night = s.nights.find((n) => n.jornada === jornada && n.publicada);
  const now = [...moments].reverse().find((m) => m.now && m.tipo !== 'cierre') ?? null;
  const next = moments.find((m) => !m.past && !m.now) ?? null;
  const sessionPolls = ses ? s.polls.filter((p) => p.sesionId === ses.id && p.estado !== 'borrador') : [];
  const current = sessionPolls.filter((p) => p.estado === 'abierta' || p.estado === 'pausada').at(-1);
  const last = sessionPolls.filter((p) => p.estado === 'cerrada' || p.estado === 'cancelada').at(-1);
  const pref = s.preferencePolls.find((p) => p.abierta);
  const upcoming = s.nights.filter((n) => n.publicada && n.jornada > jornada).sort((a, b) => a.jornada.localeCompare(b.jornada));

  return (
    <div className="cx-narrow cx-stack">
      <section className="cx-hero cx-stack-sm" aria-labelledby="ahora-t" style={{ marginTop: 8 }}>
        <Sun />
        <p className="cx-eyebrow">{now ? 'Ahora' : 'Esta noche'}</p>
        <h1 id="ahora-t" className="cx-title" style={{ fontSize: 'clamp(1.8rem,7vw,2.3rem)' }}>
          {now ? (now.artista ?? now.titulo) : night?.titulo ?? 'Sin programación publicada'}
        </h1>
        {now && (
          <p className="cx-sub" style={{ margin: 0 }}>
            {now.artista ? `${now.titulo} · ` : ''}
            {now.inicio}–{now.fin}
          </p>
        )}
        {next && (
          <p style={{ margin: '8px 0 0', fontWeight: 600 }}>
            Después, {next.inicio}: {next.artista ?? next.titulo}
            {!next.confirmado && ' (a confirmar)'}
          </p>
        )}
        <p className="cx-fine" style={{ margin: '6px 0 0', color: '#f0d9e3' }}>
          {jornadaLabel(jornada)} · fecha, horarios y artistas de demostración
        </p>
      </section>

      {current ? <PollCard poll={current} /> : last ? <PollResult s={s} poll={last} /> : (
        <p className="cx-sub" style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span aria-hidden>♪</span> Sin encuestas del DJ por ahora.
        </p>
      )}

      <section aria-labelledby="prog-t">
        <div className="cx-section-head">
          <h2 id="prog-t" className="cx-h2">
            Programación
          </h2>
        </div>
        {night ? <Timeline moments={moments} /> : <p className="cx-sub">Todavía no hay una fecha publicada para hoy.</p>}
      </section>

      {dj && (
        <section className="cx-card flat cx-stack-sm" aria-labelledby="dj-t">
          <p className="cx-eyebrow" style={{ margin: 0 }}>
            DJ de la noche · {ses!.inicio}
          </p>
          <h2 id="dj-t" className="cx-h2">
            {dj.nombre}
          </h2>
          <p style={{ margin: 0 }}>{dj.descripcion}</p>
          <div className="cx-wrap">
            {dj.generos.map((g) => (
              <Pill key={g}>{g}</Pill>
            ))}
          </div>
          <details className="cx-details">
            <summary>Playlists de referencia</summary>
            <div className="cx-stack-sm" style={{ paddingBottom: 8 }}>
              {dj.enlaces.map((e) => (
                <a key={e.id} href={e.url} target="_blank" rel="noreferrer noopener" className="cx-link u">
                  {e.etiqueta} ↗
                </a>
              ))}
              <p className="cx-fine" style={{ margin: 0 }}>
                Son referencias del DJ, no el repertorio confirmado. La app no reproduce música.
              </p>
            </div>
          </details>
        </section>
      )}

      <Link to="/reserva" className="cx-card cx-between" style={{ textDecoration: 'none', color: 'inherit' }}>
        <span className="cx-wrap" style={{ gap: 12 }}>
          <span className="cx-row-ico">
            <I.reserva />
          </span>
          <span>
            <span className="cx-h3" style={{ display: 'block' }}>
              Consultar reserva
            </span>
            <span className="cx-sub">Para hoy o una próxima fecha</span>
          </span>
        </span>
        <span className="cx-chev">
          <I.chev />
        </span>
      </Link>

      {upcoming.length > 0 && (
        <section aria-labelledby="prox-t" className="cx-stack-sm">
          <div className="cx-section-head">
            <h2 id="prox-t" className="cx-h2">
              Próximas fechas
            </h2>
          </div>
          {upcoming.map((n) => (
            <Link key={n.id} to={`/reserva?fecha=${n.jornada}`} className="cx-rowbtn cx-row" style={{ alignItems: 'flex-start' }}>
              <span style={{ flex: 1 }}>
                <span className="cx-h3" style={{ display: 'block', fontSize: '1rem' }}>
                  {jornadaLabel(n.jornada)}
                </span>
                <span className="cx-sub">
                  {n.publicada!.momentos
                    .filter((m) => m.tipo !== 'cierre')
                    .map((m) => `${m.inicio} ${m.artista ?? m.titulo}${m.confirmado ? '' : ' (a confirmar)'}`)
                    .join(' · ')}
                </span>
              </span>
              <span className="cx-link" style={{ minHeight: 0, padding: 0 }}>
                Reservar
              </span>
            </Link>
          ))}
          <p className="cx-fine" style={{ margin: 0 }}>
            Fechas y artistas ficticios de demostración: no son programación real de TERRACO.
          </p>
        </section>
      )}

      {pref && <PreferencePoll id={pref.id} />}
    </div>
  );
}

function NightAccess() {
  const { run, pending } = useAction();
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | undefined>();
  return (
    <form
      className="cx-stack-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await run({ type: 'night.access', identity: session.voter(), codigo: code }, { quiet: true });
        setErr(r.ok ? undefined : r.message);
      }}
    >
      <label htmlFor="codigo-noche" className="cx-h3" style={{ fontSize: '1rem' }}>
        Código de la noche
      </label>
      <div className="cx-wrap" style={{ flexWrap: 'nowrap' }}>
        <input id="codigo-noche" className="input" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" maxLength={12} aria-invalid={err ? true : undefined} aria-describedby="codigo-h" />
        <button className="cx-btn primary" disabled={pending || !code}>
          Participar
        </button>
      </div>
      <span id="codigo-h" className="cx-fine" style={{ color: err ? 'var(--bad)' : undefined }}>
        {err ?? 'Está en la pantalla del local y en las mesas (demo: SOL2111).'}
      </span>
    </form>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  const s = useStore((x) => x);
  useSession();
  const { run, pending } = useAction();
  const me = session.voter();
  const access = (s.nightAccess[jornadaOf(s.now)] ?? []).includes(me);
  const voted = poll.votos[me];
  const stats = pollStats(s, jornadaOf(s.now)).find((x) => x.poll.id === poll.id)!;
  return (
    <section className="cx-card cx-stack-sm" aria-labelledby="poll-t" style={{ borderColor: 'var(--accent)' }}>
      <div className="cx-between">
        <p className="cx-eyebrow" style={{ margin: 0 }}>
          Encuesta · opcional
        </p>
        {poll.estado === 'pausada' ? (
          <Pill tone="warn" glyph="‖">
            Pausada
          </Pill>
        ) : (
          <Pill tone="accent" glyph="●">
            Hasta {hhmm(poll.cierraEn!)}
          </Pill>
        )}
      </div>
      <h2 id="poll-t" className="cx-h2">
        {poll.pregunta}
      </h2>
      {!access && !voted ? (
        <NightAccess />
      ) : voted ? (
        <Results stats={stats} mine={voted} />
      ) : (
        <div className="cx-stack-sm">
          {poll.opciones.map((o) => (
            <button key={o.id} className="cx-btn lg block" disabled={pending || poll.estado !== 'abierta'} onClick={() => run({ type: 'poll.vote', pollId: poll.id, identity: me, opcionId: o.id })}>
              {o.label}
            </button>
          ))}
        </div>
      )}
      <p className="cx-fine" style={{ margin: 0 }}>
        {poll.politica}
      </p>
    </section>
  );
}

function Results({ stats, mine }: { stats: NonNullable<ReturnType<typeof pollStats>[number]>; mine?: string }) {
  return (
    <div className="cx-stack-sm" aria-live="polite">
      {stats.counts.map((c) => (
        <div key={c.id}>
          <div className="cx-between" style={{ fontSize: '0.95rem' }}>
            <span>
              {c.label} {mine === c.id && <Pill>tu voto</Pill>}
            </span>
            <span className="cx-num">{c.votos}</span>
          </div>
          <div className="cx-bar" aria-hidden style={{ marginTop: 4 }}>
            <span style={{ width: `${stats.total ? (c.votos / stats.total) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
      <p className="cx-fine" style={{ margin: 0 }}>
        {stats.total} voto(s) de {stats.universo} persona(s) con acceso de noche. No representa a todo el local.
        {stats.pocos && ' Pocos votos: resultado orientativo.'}
      </p>
    </div>
  );
}

function PollResult({ s, poll }: { s: State; poll: Poll }) {
  const stats = pollStats(s, jornadaOf(s.now)).find((x) => x.poll.id === poll.id);
  if (!stats) return null;
  const decided = poll.decisionDJ ? poll.opciones.find((o) => o.id === poll.decisionDJ!.opcionId) : null;
  return (
    <section className="cx-card flat cx-stack-sm">
      <p className="cx-eyebrow" style={{ margin: 0 }}>
        Última encuesta · {poll.estado === 'cancelada' ? 'cancelada' : 'cerrada'}
      </p>
      <h2 className="cx-h3">{poll.pregunta}</h2>
      {poll.estado === 'cancelada' ? <Note tone="warn">Cancelada: {poll.motivoCancelacion}</Note> : <Results stats={stats} mine={poll.votos[session.voter()]} />}
      {stats.empate && poll.estado === 'cerrada' && <Note>Empate: decide el DJ, como se anunció.</Note>}
      {decided ? <Note tone="ok">Eligió el DJ: {decided.label}. {poll.decisionDJ!.nota}</Note> : poll.estado === 'cerrada' && <p className="cx-fine" style={{ margin: 0 }}>El DJ toma la decisión final.</p>}
    </section>
  );
}

function PreferencePoll({ id }: { id: string }) {
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const p = s.preferencePolls.find((x) => x.id === id)!;
  const me = session.voter();
  const voted = p.votos[me];
  const total = Object.keys(p.votos).length;
  return (
    <section className="cx-stack-sm" aria-labelledby="pref-t">
      <p className="cx-eyebrow" style={{ margin: 0 }}>
        Para próximas fechas
      </p>
      <h2 id="pref-t" className="cx-h3">
        {p.pregunta}
      </h2>
      {voted ? (
        <div className="cx-stack-sm">
          {p.opciones.map((o) => (
            <div key={o.id} className="cx-between" style={{ fontSize: '0.95rem' }}>
              <span>
                {o.label} {voted === o.id && <Pill>tu elección</Pill>}
              </span>
              <span className="cx-num">{Object.values(p.votos).filter((v) => v === o.id).length}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="cx-wrap">
          {p.opciones.map((o) => (
            <button key={o.id} className="cx-chip" disabled={pending} onClick={() => run({ type: 'prefpoll.vote', pollId: p.id, identity: me, opcionId: o.id })}>
              {o.label}
            </button>
          ))}
        </div>
      )}
      <p className="cx-fine" style={{ margin: 0 }}>
        {total} respuestas. Es una consulta: TERRACO decide su programación.
      </p>
    </section>
  );
}
