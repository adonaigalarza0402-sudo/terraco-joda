import { pollStats } from '../../domain/reports';
import { hhmm, jornadaOf } from '../../domain/time';
import { useStore } from '../../state/store';
import { activePoll, ISO } from '../../ui/derive';
import { readyByPoint } from './Entrega';

/** Pantalla pública opcional (TV). Sin nombres, teléfonos, importes ni credenciales. */
export function Pantalla() {
  const s = useStore((x) => x);
  const points = readyByPoint(s);
  const poll = activePoll(s);
  const stats = poll ? pollStats(s, jornadaOf(s.now)).find((x) => x.poll.id === poll.id) : null;
  const items = [...points.entries()].flatMap(([p, list]) => list.map((x) => ({ p, ...x }))).sort((a, b) => a.since - b.since);
  return (
    <div className="app-root theme-tv tv">
      <header className="row between">
        <div className="row" style={{ gap: 16 }}>
          <span style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', flex: 'none' }}>
            <img src={ISO} alt="TERRACO" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(2.1)' }} />
          </span>
          <div>
            <h1 className="display" style={{ fontSize: 'clamp(1.8rem, 3.4vw, 3rem)', color: 'var(--heading)' }}>
              Pedidos listos
            </h1>
            <p className="muted">Retirá con tu credencial privada. Este código solo identifica el pedido.</p>
          </div>
        </div>
        <div className="right">
          <p className="num" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.6rem)', fontWeight: 800 }}>
            {hhmm(s.now)}
          </p>
          <p className="xsmall muted">reloj de demo · datos de prueba</p>
        </div>
      </header>
      <main style={{ display: 'grid', gridTemplateColumns: poll ? 'minmax(0, 2.2fr) minmax(260px, 1fr)' : '1fr', gap: '2vw', alignItems: 'start' }}>
        <section aria-label="Códigos listos" aria-live="polite">
          {!items.length ? (
            <p className="muted" style={{ fontSize: '1.6rem' }}>
              Todavía no hay pedidos listos.
            </p>
          ) : (
            <div className="tv-codes">
              {items.map((x) => (
                <div key={x.o.id + x.estacion} className="tv-code fade-in">
                  <div className="c">{x.o.codigo}</div>
                  <div style={{ fontSize: 'clamp(1rem, 1.6vw, 1.4rem)', fontWeight: 700, color: 'var(--accent-2)', marginTop: 6 }}>{x.p}</div>
                  <div className="muted" style={{ fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)' }}>
                    {x.estacion === 'barra' ? 'Bebidas listas' : 'Comida lista'}
                    {x.o.lineas.some((l) => l.estacion !== x.estacion && l.unidades.some((u) => u.estado === 'pendiente' || u.estado === 'en_preparacion')) ? ' · resto en preparación' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        {poll && stats && (
          <aside className="tv-code stack-sm" aria-label="Encuesta del DJ">
            <p className="eyebrow">Encuesta del DJ · opcional</p>
            <h2 style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)' }}>{poll.pregunta}</h2>
            {stats.counts.map((c) => (
              <div key={c.id} className="stack-xs">
                <div className="row between">
                  <span style={{ fontSize: '1.2rem', fontWeight: 650 }}>{c.label}</span>
                  <span className="num">{c.votos}</span>
                </div>
                <div className="bar">
                  <span style={{ width: `${stats.total ? (c.votos / stats.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
            <p className="muted small">
              {stats.total} votos de {stats.universo} con acceso de noche. {poll.estado === 'pausada' ? 'Pausada.' : `Cierra ${hhmm(poll.cierraEn!)}.`} Decide el DJ.
            </p>
            <p className="small">
              Participá desde «Esta noche» con el código <strong style={{ letterSpacing: '0.12em' }}>{s.config.codigoNoche}</strong>
            </p>
          </aside>
        )}
      </main>
      <footer className="xsmall muted">La pantalla acompaña el aviso en el teléfono y la atención en persona. Demo: TERRACO Social Club · proyecto JODA.</footer>
    </div>
  );
}
