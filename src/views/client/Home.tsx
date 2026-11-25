import { useState } from 'react';
import { useStore } from '../../state/store';
import { activePoll, activeSession, nightMoments } from '../../ui/derive';
import { Link, Sheet } from '../../ui/kit';
import { I } from './ui';

export const CONTACT = {
  whatsapp: '+54 9 3725 50-2750',
  whatsappUrl: 'https://wa.me/5493725502750',
  instagram: '@terracosocialclub',
  instagramUrl: 'https://www.instagram.com/terracosocialclub/',
  correo: 'terracosocialclub@gmail.com',
  direccion: 'Passo 222, H3509, Gral. José de San Martín, Chaco, Argentina',
};

/**
 * Sol de la portada medido sobre la referencia (unidades = píxeles de la referencia de 863 px de ancho).
 * Origen (0,0): centro común de los rayos. 12 rayos trazados con sus extremos medidos (no una grilla genérica).
 * El arco tiene su propio centro (16,5; 56,1) y radio 171,5. Proporciones fijas: se escala solo con el ancho.
 */
// Extremos de cada rayo medidos uno por uno sobre la referencia (interior → exterior), relativos al centro común.
// Se conservan las diferencias reales de longitud, separación y orientación.
const SUN_RAYS = [
  { x1: -22, y1: -142, x2: -39.5, y2: -264 },
  { x1: -43.5, y1: -137, x2: -62, y2: -203 },
  { x1: -64, y1: -130.5, x2: -116, y2: -243 },
  { x1: -84, y1: -120.5, x2: -118.5, y2: -179 },
  { x1: -102, y1: -109, x2: -179, y2: -205 },
  { x1: -118, y1: -95.5, x2: -164.5, y2: -139 },
  { x1: -132, y1: -79.5, x2: -232, y2: -147 },
  { x1: -144.5, y1: -62, x2: -194.5, y2: -86.5 },
  { x1: -153.5, y1: -44, x2: -262, y2: -76 },
  { x1: -160, y1: -23.5, x2: -210.5, y2: -32.5 },
  { x1: -165, y1: -3, x2: -261.5, y2: -3 },
  { x1: -166, y1: 18.5, x2: -210.5, y2: 24 },
];

function SunBig() {
  return (
    <svg className="cx-home-sun" viewBox="-280 -280 340 340" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <path d="M -155 52 A 171.5 171.5 0 0 1 46.3 -112.8" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
      {SUN_RAYS.map((r, i) => (
        <line key={i} {...r} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/** Ondas decorativas para la tarjeta de música (estáticas). */
function Wave() {
  const h = [6, 12, 20, 10, 28, 16, 36, 22, 44, 30, 52, 40, 30, 46, 24, 34, 14, 22, 10, 14, 6];
  return (
    <svg className="cx-home-wave" viewBox="0 0 120 60" aria-hidden>
      {h.map((v, i) => (
        <rect key={i} x={i * 5.7} y={30 - v / 2} width="1.8" height={v} rx="0.9" fill="currentColor" opacity={0.45 + (v / 52) * 0.55} />
      ))}
    </svg>
  );
}

/** Portada del cliente: una sola marca (en el encabezado) y la información de la fecha activa. */
export function Home() {
  const s = useStore((x) => x);
  const [lugar, setLugar] = useState(false);
  const moments = nightMoments(s);
  const ahora = [...moments].reverse().find((m) => m.now && m.tipo !== 'cierre') ?? null;
  const proximo = moments.find((m) => !m.past && !m.now && m.tipo !== 'cierre') ?? null;
  const ses = activeSession(s);
  const dj = ses ? s.djs.find((d) => d.id === ses.djId) : null;
  const poll = activePoll(s);
  const tipo = ahora?.tipo === 'dj' ? 'DJ' : ahora?.tipo === 'show' ? 'Show' : ahora?.tipo === 'cena' ? 'Cena' : null;
  const titulo = ahora ? (ahora.tipo === 'dj' && dj ? dj.nombre.replace(' (perfil ficticio)', '') : ahora.artista?.replace(/ \(.*\)$/, '') ?? ahora.titulo) : 'Sin programación activa';
  const musica = ahora?.tipo === 'dj' || ahora?.tipo === 'show';
  const sub = poll
    ? poll.estado === 'pausada'
      ? 'Encuesta en pausa'
      : 'Encuesta disponible'
    : proximo
      ? `Después, ${proximo.inicio}: ${(proximo.artista ?? proximo.titulo).replace(/ \(.*\)$/, '')}`
      : ahora
        ? `Hasta las ${ahora.fin}`
        : 'Mirá las próximas fechas';

  return (
    <div className="cx-home">
      <section className="cx-home-hero" aria-labelledby="home-t">
        <p className="cx-home-kicker">Cena · Shows · Baile</p>
        <div className="cx-home-title-wrap">
          <SunBig />
          <h1 id="home-t" className="cx-home-title">
            Tu noche
            <br />
            empieza acá.
          </h1>
        </div>
        <div className="cx-home-actions">
          <Link to="/carta" className="cx-home-cta primary">
            <span>Ver la carta</span>
            <I.flecha />
          </Link>
          <Link to="/reserva" className="cx-home-cta">
            <span>Consultar reserva</span>
          </Link>
        </div>
      </section>

      <hr className="cx-home-rule" />

      <section aria-labelledby="noche-t">
        <div className="cx-between" style={{ alignItems: 'baseline' }}>
          <h2 id="noche-t" className="cx-home-h2">
            Esta noche
          </h2>
          <Link to="/noche" className="cx-home-more">
            Ver agenda <I.flecha />
          </Link>
        </div>
        <div className={`cx-home-now ${musica ? 'music' : ''}`}>
          <div className="cx-home-now-text">
            <p className="cx-home-kicker small">{tipo ? `Ahora · ${tipo}` : 'Esta noche'}</p>
            <p className="cx-home-now-title">{titulo}</p>
            <p className="cx-home-now-sub">{sub}</p>
            {poll && (
              <Link to="/noche" className="cx-home-pill">
                Participar <I.flecha />
              </Link>
            )}
          </div>
          {musica && <Wave />}
        </div>
        <p className="cx-home-note">Programación de demostración</p>
      </section>

      <hr className="cx-home-rule" />

      <nav className="cx-home-links" aria-label="Accesos">
        <button type="button" className="cx-home-link" onClick={() => setLugar(true)}>
          <I.pin /> Cómo llegar
        </button>
        <span className="cx-home-sep" aria-hidden />
        <Link to="/beneficios" className="cx-home-link">
          <I.regalo /> Mis beneficios
        </Link>
      </nav>

      <Sheet open={lugar} onClose={() => setLugar(false)} title="Cómo llegar">
        <div className="cx-rows" style={{ paddingBottom: 16 }}>
          <div className="cx-row" style={{ alignItems: 'flex-start' }}>
            <span className="cx-row-ico">
              <I.pin />
            </span>
            <span>
              {CONTACT.direccion}
              <br />
              <a className="cx-link u" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Passo 222, Gral. José de San Martín, Chaco')}`} target="_blank" rel="noreferrer noopener">
                Abrir en el mapa ↗
              </a>
            </span>
          </div>
          <div className="cx-row" style={{ alignItems: 'flex-start' }}>
            <span className="cx-row-ico">
              <I.reserva />
            </span>
            <span>
              Reservas por WhatsApp {CONTACT.whatsapp}. La confirmación la da el local. <Link to="/reserva">Consultar reserva</Link>
            </span>
          </div>
          <div className="cx-row" style={{ alignItems: 'flex-start' }}>
            <span className="cx-row-ico">
              <I.calendario />
            </span>
            <span>Viernes y sábados según Instagram ({CONTACT.instagram}). Los horarios se confirman por fecha.</span>
          </div>
          <p className="cx-fine" style={{ margin: '8px 0 0' }}>
            Datos transcriptos del material recibido. La demo no envía mensajes ni contacta al local.
          </p>
        </div>
      </Sheet>
    </div>
  );
}
