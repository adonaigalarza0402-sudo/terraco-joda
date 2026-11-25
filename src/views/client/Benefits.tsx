import { ars } from '../../domain/money';
import { shortDay } from '../../domain/time';
import { useSession } from '../../state/session';
import { useStore } from '../../state/store';
import { Link } from '../../ui/kit';
import { EmptyState, I, Pill, Sun } from './ui';

export function Benefits() {
  const ses = useSession();
  const s = useStore((x) => x);
  const profile = s.profiles.find((p) => p.id === ses.profileId);
  const rule = s.benefitRule;
  const alcance = rule.aplicaA === 'comida_y_sin_alcohol' ? 'comida y bebidas sin alcohol' : 'toda la carta';

  if (!profile)
    return (
      <div className="cx-narrow">
        <div className="cx-hero-title">
          <h1 className="cx-title">Beneficios</h1>
          <Sun />
        </div>
        <EmptyState title="Identificate para ver tu progreso" action={<Link to="/acceso" className="cx-btn primary">Elegir perfil de prueba</Link>}>
          Para pedir no hace falta cuenta. Los beneficios necesitan reconocerte solo cuando quieras usarlos. En la demo se eligen perfiles ficticios.
        </EmptyState>
      </div>
    );

  const visits = s.visits.filter((v) => v.profileId === profile.id).sort((a, b) => a.validadaEn - b.validadaEn);
  const coupons = s.coupons.filter((c) => c.profileId === profile.id);
  const disponibles = coupons.filter((c) => c.estado === 'disponible' && c.venceEn >= s.now);
  const enCiclo = visits.length % rule.umbralVisitas;
  const completo = enCiclo === 0 && visits.length > 0;
  const marcadas = completo ? rule.umbralVisitas : enCiclo;
  const faltan = rule.umbralVisitas - marcadas;

  return (
    <div className="cx-narrow cx-stack">
      <div className="cx-hero-title">
        <p className="cx-eyebrow">{profile.alias}</p>
        <h1 className="cx-title" style={{ marginTop: 6 }}>
          Beneficios
        </h1>
        <Sun />
      </div>

      <section className="cx-card cx-stack-sm" aria-labelledby="prog-t">
        <div className="cx-between">
          <h2 id="prog-t" className="cx-h3">
            Visitas
          </h2>
          <span className="cx-num" style={{ fontWeight: 800, fontSize: '1.3rem' }}>
            {marcadas} de {rule.umbralVisitas}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rule.umbralVisitas}, 1fr)`, gap: 6 }} role="img" aria-label={`${marcadas} de ${rule.umbralVisitas} visitas`}>
          {Array.from({ length: rule.umbralVisitas }, (_, i) => (
            <span key={i} style={{ height: 10, borderRadius: 5, background: i < marcadas ? 'var(--accent)' : 'var(--line-strong)' }} />
          ))}
        </div>
        <p style={{ margin: 0 }}>
          {completo ? 'Completaste el ciclo: tu cupón ya está disponible.' : `Te ${faltan === 1 ? 'falta 1 visita' : `faltan ${faltan} visitas`} para un ${rule.porcentaje}% en ${alcance}.`}
        </p>
        {visits.length > 0 && <p className="cx-fine" style={{ margin: 0 }}>Últimas visitas: {visits.slice(-3).map((v) => shortDay(v.validadaEn)).join(' · ')}</p>}
      </section>

      {disponibles.length > 0 && (
        <section className="cx-hero cx-stack-sm" aria-labelledby="cup-t">
          <p className="cx-eyebrow" style={{ margin: 0 }}>
            Disponible
          </p>
          <h2 id="cup-t" className="cx-h2">
            {disponibles[0].porcentaje}% en {alcance}
          </h2>
          <p className="cx-sub" style={{ margin: 0 }}>
            Tope {ars(disponibles[0].tope)} · un solo uso · código <span style={{ whiteSpace: 'nowrap' }}>{disponibles[0].codigo}</span>
          </p>
          <Link to="/carrito" className="cx-btn primary lg" style={{ marginTop: 8 }}>
            Usar en mi pedido
          </Link>
        </section>
      )}

      {coupons.filter((c) => !disponibles.includes(c)).length > 0 && (
        <section className="cx-stack-sm" aria-label="Otros cupones">
          {coupons
            .filter((c) => !disponibles.includes(c))
            .map((c) => (
              <div key={c.id} className="cx-between">
                <span className="cx-num">{c.codigo}</span>
                <Pill tone={c.estado === 'reservado' ? 'warn' : undefined} glyph={c.estado === 'usado' ? '✓' : '◐'}>
                  {c.estado}
                </Pill>
              </div>
            ))}
        </section>
      )}

      <details className="cx-details cx-card flat">
        <summary>Condiciones</summary>
        <div className="cx-stack-sm" style={{ paddingBottom: 8 }}>
          <p style={{ margin: 0 }}>{rule.condiciones}</p>
          <p className="cx-fine" style={{ margin: 0 }}>
            La visita la valida el personal en el local, una por persona y noche. Comprar, pagar una ronda, reservar o escanear un QR no suman visitas. El cupón dura {rule.vigenciaDias} días y se aplica en el carrito.
          </p>
        </div>
      </details>

      <p className="cx-fine" style={{ display: 'flex', gap: 8, alignItems: 'center', margin: 0 }}>
        <span style={{ width: 18, height: 18, display: 'inline-block', flex: 'none' }}>
          <I.info />
        </span>
        Regla de ejemplo para evaluar con el dueño: no es una promoción vigente.
      </p>
    </div>
  );
}
