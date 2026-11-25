import { useState } from 'react';
import { FOOD_CATEGORIES, presentationByKey } from '../../domain/catalog';
import { couponDiscount, currentNight, sellCheck, unitPrice } from '../../domain/engine';
import { ars, splitCents } from '../../domain/money';
import { session, useSession, type CartItem } from '../../state/session';
import { newId, useStore } from '../../state/store';
import { Link, navigate, Sheet, toast, useAction } from '../../ui/kit';
import { EmptyState, I, Money, Note, Pill, Qty, Sun } from './ui';

interface Cambio {
  index: number;
  nombre: string;
  tipo: 'precio' | 'no_disponible';
  antes: number;
  ahora: number | null;
  motivo: string | null;
}

export function Cart() {
  const ses = useSession();
  const s = useStore((x) => x);
  const { run, pending } = useAction();
  const [split, setSplit] = useState(2);
  const [showSplit, setShowSplit] = useState(false);
  const [alias, setAlias] = useState(ses.alias);
  const [showAlias, setShowAlias] = useState(!!ses.alias);
  const [cid, setCid] = useState(() => newId('checkout'));
  const [cambios, setCambios] = useState<{ list: Cambio[]; total: number } | null>(null);
  const cart = ses.cart;
  const night = currentNight(s)?.publicada;
  const hasFood = cart.some((c) => presentationByKey(c.presKey)?.product.estacion === 'cocina');
  const hasDrinks = cart.some((c) => presentationByKey(c.presKey)?.product.estacion === 'barra');
  const mesaMode = night?.modalidadComida === 'mesa';
  const [modalidad, setModalidad] = useState<'retiro' | 'mesa'>(mesaMode && ses.mesaSesionId ? 'mesa' : 'retiro');
  const coupons = s.coupons.filter((c) => c.profileId === ses.profileId && c.estado === 'disponible' && c.venceEn >= s.now);
  const coupon = coupons.find((c) => c.id === ses.couponId) ?? null;
  const subtotal = cart.reduce((a, c) => a + c.precioVisto * c.cantidad, 0);
  const descuento = coupon ? couponDiscount(s, coupon, cart.map((c) => ({ categoria: presentationByKey(c.presKey)!.product.categoria, precioUnitario: c.precioVisto, cantidad: c.cantidad }))) : 0;
  const total = subtotal - descuento;
  const parts = total > 0 ? splitCents(total, split) : [];
  const pendientes = s.orders.filter((o) => o.buyerId === ses.buyerId && ['esperando_pago', 'activo'].includes(o.estado));
  const repite = ses.repiteDe ? s.orders.find((o) => o.id === ses.repiteDe) : null;
  const puntos = [hasDrinks && (night?.puntosRetiro.barra ?? 'Barra principal'), hasFood && (modalidad === 'mesa' ? 'tu mesa' : night?.puntosRetiro.cocina ?? 'Ventana de cocina')].filter(Boolean) as string[];

  if (!cart.length)
    return (
      <div className="cx-narrow">
        <BackToMenu />
        <EmptyState title="Tu pedido está vacío" action={<Link to="/carta" className="cx-btn primary">Ver la carta</Link>}>
          Elegí algo de la carta. No hace falta cuenta para pedir.
        </EmptyState>
      </div>
    );

  async function pay() {
    session.set({ alias });
    const lines = cart.map(({ key: _k, ...l }) => l);
    const r = await run({ type: 'checkout.start', lines, modalidad, mesaSesionId: ses.mesaSesionId, couponId: coupon?.id ?? null, alias: alias || undefined, repiteDe: ses.repiteDe }, { cid, quiet: true });
    if (r.ok) {
      session.clearCart();
      navigate(`/pedido/${r.data.orderId}`);
    } else if (r.code === 'revalidar') {
      setCambios({ list: r.data.cambios, total: r.data.nuevoTotal });
      setCid(newId('checkout'));
    } else {
      setCid(newId('checkout'));
      toast(r.message, 'bad');
    }
  }

  function acceptChanges() {
    if (!cambios) return;
    const next: CartItem[] = [];
    cart.forEach((c, i) => {
      const ch = cambios.list.find((x) => x.index === i);
      if (ch?.tipo === 'no_disponible') return;
      next.push(ch?.ahora ? { ...c, precioVisto: ch.ahora } : c);
    });
    session.set({ cart: next });
    setCambios(null);
  }

  return (
    <div className="cx-narrow">
      <BackToMenu />
      <div className="cx-hero-title" style={{ paddingTop: 0 }}>
        <h1 className="cx-title">Tu pedido</h1>
        <Sun />
      </div>
      {repite && <Note tone="info">Copia editable de {repite.codigo}: se revisan precio y disponibilidad de nuevo. No se repite el cobro.</Note>}
      {pendientes.length > 0 && (
        <p className="cx-fine" style={{ margin: '8px 0 0' }}>
          Tenés {pendientes.length === 1 ? 'otro pedido en curso' : `${pendientes.length} pedidos en curso`} ({pendientes.map((o) => o.codigo).join(', ')}). Este se suma; no lo reemplaza.
        </p>
      )}

      <section aria-label="Productos">
        {cart.map((c) => {
          const pp = presentationByKey(c.presKey)!;
          const chk = sellCheck(s, c.presKey);
          const now = unitPrice(s, c.presKey, c.mods);
          const variante = [c.sabor, pp.pres.etiqueta !== 'Presentación de carta' ? pp.pres.etiqueta : null, c.mods.includes('frutos_rojos') ? 'frutos rojos (ficticio)' : null].filter(Boolean).join(' · ');
          return (
            <div key={c.key} className="cx-cart-line">
              <div style={{ minWidth: 0 }}>
                <div className="cx-name">{pp.product.nombre}</div>
                {variante && <div className="cx-meta">{variante}</div>}
                {c.nota && <div className="cx-fine">Nota: {c.nota}</div>}
                {!chk.ok && (
                  <Pill tone="bad" glyph="!">
                    {chk.motivo}
                  </Pill>
                )}
                {chk.ok && now !== null && now !== c.precioVisto && (
                  <Pill tone="warn" glyph="!">
                    Cambió el precio: se revisa al continuar
                  </Pill>
                )}
              </div>
              <span className="cx-price" style={{ fontSize: '1.05rem' }}>
                <Money cents={c.precioVisto * c.cantidad} />
                {c.cantidad > 1 && <small>{ars(c.precioVisto)} c/u</small>}
              </span>
              <button className="cx-x" aria-label={`Quitar ${pp.product.nombre}`} onClick={() => session.setQty(c.key, 0)}>
                <I.x />
              </button>
              <Qty value={c.cantidad} min={1} onChange={(n) => session.setQty(c.key, n)} label={pp.product.nombre} />
            </div>
          );
        })}
      </section>

      <div className="cx-rows" style={{ marginTop: 4 }}>
        <div className="cx-row">
          <span className="cx-row-ico">
            <I.pin />
          </span>
          <div style={{ flex: 1 }}>
            <div className="cx-h3">{modalidad === 'mesa' && hasFood ? 'Comida a la mesa' : `Retiro en ${puntos[0] ?? 'barra'}`}</div>
            <div className="cx-sub">
              {puntos.length > 1 ? `Bebidas en ${puntos[0]}; comida en ${puntos[1]}. ` : ''}Te avisamos cuando esté listo.
            </div>
            {hasFood && mesaMode && (
              <div className="cx-wrap" role="radiogroup" aria-label="Entrega de la comida" style={{ marginTop: 8 }}>
                <button role="radio" aria-checked={modalidad === 'retiro'} className="cx-chip" onClick={() => setModalidad('retiro')}>
                  Retiro
                </button>
                <button role="radio" aria-checked={modalidad === 'mesa'} className="cx-chip" onClick={() => setModalidad('mesa')}>
                  A la mesa
                </button>
              </div>
            )}
            {modalidad === 'mesa' && !ses.mesaSesionId && <p className="cx-fine" style={{ color: 'var(--warn)' }}>Para servicio a mesa escaneá el QR de tu mesa.</p>}
          </div>
        </div>

        <button className="cx-rowbtn cx-row" aria-expanded={showSplit} onClick={() => setShowSplit(!showSplit)}>
          <span className="cx-row-ico">
            <I.calculadora />
          </span>
          <span className="cx-h3" style={{ flex: 1 }}>
            Dividir la ronda
          </span>
          <span className="cx-chev" style={{ transform: showSplit ? 'rotate(90deg)' : undefined, transition: 'transform 140ms' }}>
            <I.chev />
          </span>
        </button>
        {showSplit && (
          <div className="cx-stack-sm cx-enter" style={{ padding: '4px 0 16px 36px', borderBottom: '1px solid var(--line)' }}>
            <div className="cx-between">
              <span>Somos</span>
              <Qty value={split} min={2} max={12} onChange={setSplit} label="personas" />
            </div>
            <p className="cx-num" style={{ margin: 0, fontWeight: 700 }}>
              {[...new Set(parts)].map((p) => `${parts.filter((x) => x === p).length} × ${ars(p)}`).join('  +  ')}
            </p>
            <p className="cx-fine" style={{ margin: 0 }}>
              Es solo un cálculo para repartir entre ustedes: pagás una sola vez abajo. Suma exacta {ars(total)}.
            </p>
            <Link to="/ronda/nueva" className="cx-link u" style={{ fontSize: '0.9rem' }}>
              Que cada uno pague su parte (simulación avanzada)
            </Link>
          </div>
        )}

        {ses.profileId && coupons.length > 0 && (
          <div className="cx-row">
            <span className="cx-row-ico">
              <I.regalo />
            </span>
            <div style={{ flex: 1 }}>
              <div className="cx-h3">{coupon ? `Cupón ${coupon.codigo} aplicado` : 'Tenés un cupón de ejemplo'}</div>
              <div className="cx-sub">{(coupon ?? coupons[0]).descripcion}</div>
              {coupon && descuento === 0 && <p className="cx-fine" style={{ color: 'var(--warn)', margin: 0 }}>Aplica a comida y bebidas sin alcohol: no hay productos elegibles.</p>}
            </div>
            <button className="cx-btn sm" onClick={() => session.set({ couponId: coupon ? null : coupons[0].id })}>
              {coupon ? 'Quitar' : 'Aplicar'}
            </button>
          </div>
        )}

        <div className="cx-row" style={{ display: 'block' }}>
          {showAlias ? (
            <div className="field">
              <label htmlFor="alias" className="cx-h3" style={{ fontSize: '1rem' }}>
                ¿Cómo te llamamos? <span className="cx-sub">(opcional)</span>
              </label>
              <input id="alias" className="input" maxLength={24} value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Ej.: Lu" autoComplete="nickname" aria-describedby="alias-h" />
              <span id="alias-h" className="cx-fine">
                Solo lo ve el equipo. No aparece en la pantalla del local.
              </span>
            </div>
          ) : (
            <button className="cx-link" onClick={() => setShowAlias(true)}>
              + Agregar un nombre para llamarte (opcional)
            </button>
          )}
        </div>
      </div>

      <div className="cx-totals">
        <span>Subtotal</span>
        <Money cents={subtotal} />
        {descuento > 0 && (
          <>
            <span>Descuento de ejemplo</span>
            <span className="cx-num">−{ars(descuento)}</span>
          </>
        )}
        <span className="grand">Total</span>
        <span className="grand num">
          <Money cents={total} />
        </span>
      </div>
      <p className="cx-fine" style={{ textAlign: 'center', fontStyle: 'italic', margin: 0 }}>
        Pago simulado · No se realiza ningún cobro
      </p>
      <div className="cx-sticky-cta">
        <button className="cx-btn primary lg block" onClick={pay} disabled={pending}>
          {pending ? 'Preparando…' : `Continuar · ${ars(total)}`}
        </button>
      </div>

      <Sheet open={!!cambios} onClose={() => setCambios(null)} title="Algo cambió">
        {cambios && (
          <div className="cx-stack">
            <p style={{ margin: 0 }}>Revisá antes de seguir. No cobramos ni cambiamos nada sin tu confirmación.</p>
            <div className="cx-rows">
              {cambios.list.map((c) => (
                <div key={c.index} className="cx-row" style={{ display: 'block' }}>
                  <div className="cx-name" style={{ fontSize: '1.05rem' }}>
                    {c.nombre}
                  </div>
                  {c.tipo === 'precio' ? (
                    <div className="cx-num">
                      Precio <s>{ars(c.antes)}</s> → <strong>{ars(c.ahora!)}</strong>
                    </div>
                  ) : (
                    <div className="cx-sub">Se quita del pedido: {c.motivo}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="cx-between" style={{ fontWeight: 800, fontSize: '1.15rem' }}>
              <span>Nuevo subtotal</span>
              <Money cents={cambios.total} />
            </div>
            <div className="cx-wrap" style={{ justifyContent: 'flex-end' }}>
              <button className="cx-btn" onClick={() => setCambios(null)}>
                Volver
              </button>
              <button className="cx-btn primary" onClick={acceptChanges}>
                Aceptar cambios
              </button>
            </div>
            <p className="cx-fine" style={{ margin: 0 }}>
              Después de aceptar, revisá el total y tocá Continuar.
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}

export function BackToMenu() {
  return (
    <Link to="/carta" className="cx-link" style={{ marginTop: 4 }}>
      <I.atras /> Volver a la carta
    </Link>
  );
}

export function foodIn(lines: { presKey: string }[]) {
  return lines.some((l) => FOOD_CATEGORIES.includes(presentationByKey(l.presKey)?.product.categoria ?? ''));
}
