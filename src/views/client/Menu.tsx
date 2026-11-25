import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_GROUPS, PRODUCTS, productById, searchProducts, SOURCE_FILES, type Product } from '../../domain/catalog';
import { currentNight, sellCheck, unitPrice } from '../../domain/engine';
import { ars } from '../../domain/money';
import type { State } from '../../domain/types';
import { useClientTheme } from '../../state/appearance';
import { session, useSession } from '../../state/session';
import { useStore } from '../../state/store';
import { CARTA_IMG } from '../../ui/derive';
import { Link, navigate, Sheet, toast, useRoute } from '../../ui/kit';
import { EmptyState, I, Money, Note, Pill, Qty, Sun, CategoryRail } from './ui';

// Orden de presentación de los grupos (la carta es la misma; solo cambia el recorrido).
const GROUP_ORDER = ['tragos', 'comida', 'sin', 'cervezas', 'botellas'];
// Rótulos cortos para las categorías (el título de cada sección conserva el nombre completo).
const CHIP_LABEL: Record<string, string> = { tragos: 'Tragos', comida: 'Para compartir', sin: 'Sin alcohol', cervezas: 'Cervezas', botellas: 'Botellas' };
const GROUPS = GROUP_ORDER.map((id) => CATEGORY_GROUPS.find((g) => g.id === id)!);

export function priceFrom(s: State, p: Product): { text: string; sellable: boolean; desde: boolean } {
  const prices = p.presentaciones.filter((pr) => sellCheck(s, pr.key).tipo !== 'consultable').map((pr) => unitPrice(s, pr.key, [])).filter((x): x is number => x !== null);
  if (!prices.length) return { text: 'Consultar', sellable: false, desde: false };
  const min = Math.min(...prices);
  const desde = prices.some((x) => x !== min);
  return { text: ars(min), sellable: true, desde };
}

function status(s: State, p: Product): { tone: 'bad' | 'warn' | undefined; glyph: string; text: string } | null {
  const checks = p.presentaciones.map((pr) => sellCheck(s, pr.key));
  if (checks.some((c) => c.ok)) return null;
  const c = checks.find((x) => x.tipo !== 'consultable') ?? checks[0];
  if (c.tipo === 'consultable') return { tone: undefined, glyph: '?', text: 'Consultar en barra' };
  if (c.tipo === 'agotado' || c.tipo === 'stock') return { tone: 'bad', glyph: '✕', text: 'Agotado' };
  if (c.tipo === 'horario') return { tone: 'warn', glyph: '◷', text: p.estacion === 'cocina' ? 'Cocina cerrada' : 'Fuera de horario' };
  return { tone: 'warn', glyph: '‖', text: 'Pausado' };
}

/** ¿Se puede agregar directo, sin decisiones obligatorias? */
function quickPres(s: State, p: Product) {
  if (p.sabores.length) return null;
  if (p.frutosRojosConsultable && s.config.ginFrutosRojos.habilitado) return null;
  const ok = p.presentaciones.filter((pr) => sellCheck(s, pr.key).ok);
  const visibles = p.presentaciones.filter((pr) => sellCheck(s, pr.key).tipo !== 'consultable');
  return ok.length === 1 && visibles.length === 1 ? ok[0] : null;
}

function metaText(s: State, p: Product): string | null {
  if (p.sabores.length) return `${p.sabores.length} sabores`;
  const vis = p.presentaciones.filter((pr) => sellCheck(s, pr.key).tipo !== 'consultable');
  if (vis.length > 1) return `${vis.length} presentaciones`;
  if (p.presentaciones.some((pr) => pr.tipo === 'consultable') && vis.length) return 'Otras presentaciones a consultar';
  return null;
}

function ProductRow({ p, s }: { p: Product; s: State }) {
  const ses = useSession();
  const pf = priceFrom(s, p);
  const st = status(s, p);
  const quick = quickPres(s, p);
  const meta = metaText(s, p);
  const [added, setAdded] = useState(false);
  const open = () => navigate(`/carta?p=${p.id}`);
  function add() {
    if (st || !quick) return open();
    const price = unitPrice(s, quick.key, [])!;
    session.addToCart({ presKey: quick.key, sabor: null, mods: [], nota: null, cantidad: 1, precioVisto: price });
    setAdded(true);
    setTimeout(() => setAdded(false), 380);
    toast(`Agregado: ${p.nombre}`, 'ok');
  }
  return (
    <li className={`cx-item ${st ? 'off' : ''}`}>
      <button className="cx-item-main" onClick={open} aria-label={`${p.nombre}. ${pf.desde ? 'Desde ' : ''}${pf.text}${st ? `. ${st.text}` : ''}. Ver detalle`}>
        <span className="cx-name">
          {p.nombre} {ses.favorites.includes(p.id) && <span aria-label="favorito" style={{ fontSize: '0.8em' }}>♥</span>}
        </span>
        {p.descripcion && <span className="cx-desc">{p.descripcion}</span>}
        {(meta || st) && (
          <span className="cx-wrap" style={{ gap: 8 }}>
            {meta && <span className="cx-meta">{meta}</span>}
            {st && (
              <Pill tone={st.tone} glyph={st.glyph} className={st.tone ? '' : 'dashed'}>
                {st.text}
              </Pill>
            )}
          </span>
        )}
      </button>
      <span className="cx-price">
        {pf.desde && <small>desde</small>}
        {pf.text}
      </span>
      {st ? (
        <button className="cx-add ghost" onClick={open} aria-label={`Ver detalle de ${p.nombre}`}>
          <I.info />
        </button>
      ) : (
        <button className={`cx-add ${added ? 'added' : ''}`} onClick={add} aria-label={quick ? `Agregar ${p.nombre}` : `Elegir opciones de ${p.nombre}`}>
          <I.mas />
        </button>
      )}
    </li>
  );
}

export function CartSummary() {
  const ses = useSession();
  const total = ses.cart.reduce((a, c) => a + c.precioVisto * c.cantidad, 0);
  return (
    <div className="cx-card cx-stack-sm">
      <h2 className="cx-h2" style={{ fontSize: '1.3rem' }}>
        Tu pedido
      </h2>
      {!ses.cart.length ? (
        <p className="cx-sub">Todavía no agregaste productos.</p>
      ) : (
        <>
          {ses.cart.map((c) => {
            const p = productById(c.presKey.split(':')[0]);
            return (
              <div key={c.key} className="cx-between" style={{ fontSize: '0.95rem' }}>
                <span>
                  {c.cantidad}× {p?.nombre}
                  {c.sabor && <span className="cx-meta"> · {c.sabor}</span>}
                </span>
                <Money cents={c.precioVisto * c.cantidad} />
              </div>
            );
          })}
          <div className="cx-between" style={{ borderTop: '1px solid var(--line)', paddingTop: 8, fontWeight: 800 }}>
            <span>Subtotal</span>
            <Money cents={total} />
          </div>
          <Link to="/carrito" className="cx-btn primary block">
            Ver carrito
          </Link>
        </>
      )}
    </div>
  );
}

export function Menu() {
  const s = useStore((x) => x);
  const ses = useSession();
  const { momento } = useClientTheme();
  const { query } = useRoute();
  const [q, setQ] = useState('');
  const [favs, setFavs] = useState(false);
  const [active, setActive] = useState<string>(GROUPS[0].id);
  const lock = useRef(0);
  const railRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  // La franja de categorías toma fondo propio solo cuando queda fija arriba.
  useEffect(() => {
    const on = () => {
      const el = railRef.current;
      if (el) setStuck(el.getBoundingClientRect().top <= 0.5 && window.scrollY > 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const openId = query.get('p');
  const night = currentNight(s)?.publicada;

  const list = useMemo(() => {
    let l = searchProducts(q, PRODUCTS);
    if (favs) l = l.filter((p) => ses.favorites.includes(p.id));
    return l;
  }, [q, favs, ses.favorites]);

  const groups = useMemo(
    () =>
      GROUPS.map((g) => ({ ...g, cats: g.categorias.map((c) => ({ cat: c, items: list.filter((p) => p.categoria === c) })).filter((c) => c.items.length) })).filter((g) => g.cats.length),
    [list],
  );

  // Categoría activa según la posición de lectura.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lock.current) return;
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id.replace('g-', ''));
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );
    document.querySelectorAll('.cx-section').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [groups]);

  function jump(id: string) {
    if (id === 'fav') {
      setFavs(!favs);
      return;
    }
    setActive(id);
    lock.current = Date.now() + 800;
    const el = document.getElementById(`g-${id}`);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: reduce ? 'auto' : 'smooth' });
  }

  const open = openId ? productById(openId) : undefined;
  const contexto = momento.tema === 'cena' ? `Cocina hasta ${night?.cocinaNuevasHasta ?? '—'}` : 'Barra abierta';

  return (
    <div className="cx-menu-layout">
      <div>
        <div className="cx-hero-title">
          <p className="cx-eyebrow">
            {momento.etiqueta} <span className="meta">· {contexto}</span>
          </p>
          <h1 className="cx-title" style={{ marginTop: 6 }}>
            ¿Qué pedimos?
          </h1>
          <Sun />
        </div>
        {ses.mesaId && <Note tone="info">Pedís desde {ses.mesaId.replace('demo-mesa-', 'Mesa ')}.</Note>}
        <div className="cx-search" style={{ marginTop: 8 }}>
          <I.buscar />
          <label htmlFor="buscar" className="sr-only">
            Buscar en la carta
          </label>
          <input id="buscar" type="search" placeholder="Buscá tu favorito" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" enterKeyHint="search" />
          {q && (
            <button className="cx-iconbtn clear" aria-label="Borrar búsqueda" onClick={() => setQ('')} style={{ width: 40, height: 40 }}>
              <I.x />
            </button>
          )}
        </div>
        <div ref={railRef} className={`cx-rail-wrap ${stuck ? 'stuck' : ''}`}>
          <CategoryRail
            label="Secciones de la carta"
            active={favs ? 'fav' : active}
            onSelect={jump}
            items={[...groups.map((g) => ({ id: g.id, label: CHIP_LABEL[g.id] ?? g.nombre })), { id: 'fav', label: favs ? '♥ Favoritos ✕' : '♥ Favoritos' }]}
          />
        </div>
        {!list.length && (
          <EmptyState title="Sin resultados" action={<button className="cx-btn" onClick={() => { setQ(''); setFavs(false); }}>Ver toda la carta</button>}>
            {favs ? 'Todavía no marcaste favoritos en este teléfono.' : `No encontramos «${q}». Probá con otra palabra.`}
          </EmptyState>
        )}
        {groups.map((g) => (
          <section key={g.id} id={`g-${g.id}`} className="cx-section" aria-labelledby={`h-${g.id}`}>
            <div className="cx-section-head">
              <h2 id={`h-${g.id}`} className="cx-h2">
                {g.nombre}
              </h2>
            </div>
            {g.cats.map((c) => (
              <div key={c.cat}>
                {c.cat !== g.nombre ? (
                  <p className="cx-menu-section" style={{ margin: '12px 0 0' }}>
                    {c.cat}
                  </p>
                ) : null}
                <ul className="cx-list">
                  {c.items.map((p) => (
                    <ProductRow key={p.id} p={p} s={s} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
        <p className="cx-fine" style={{ marginTop: 24 }}>
          Precios de referencia de la carta recibida, sin validar vigencia. <Link to="/limites">Sobre esta demo</Link>
        </p>
      </div>
      <aside className="cx-aside" aria-label="Resumen del pedido">
        <CartSummary />
      </aside>
      <ProductSheet product={open} onClose={() => navigate('/carta')} />
    </div>
  );
}

function ProductSheet({ product, onClose }: { product?: Product; onClose: () => void }) {
  const s = useStore((x) => x);
  const ses = useSession();
  const [presIdx, setPresIdx] = useState<number | null>(null);
  const [sabor, setSabor] = useState<string | null>(null);
  const [frutos, setFrutos] = useState(false);
  const [nota, setNota] = useState('');
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);
  if (product && lastId !== product.id) {
    setLastId(product.id);
    const firstOk = product.presentaciones.find((pr) => sellCheck(s, pr.key).ok);
    setPresIdx(firstOk?.idx ?? null);
    setSabor(null);
    setFrutos(false);
    setNota('');
    setQty(1);
    setErr(null);
  }
  if (!product) return null;
  const pres = presIdx !== null ? product.presentaciones[presIdx] : null;
  const mods = frutos ? ['frutos_rojos'] : [];
  const price = pres ? unitPrice(s, pres.key, mods) : null;
  const chk = pres ? sellCheck(s, pres.key) : null;
  const fav = ses.favorites.includes(product.id);
  const needsSabor = product.sabores.length > 0 && !sabor;
  const canAdd = !!chk?.ok && price !== null && !needsSabor;

  function add() {
    if (!pres || !chk?.ok || price === null) return setErr('Elegí una presentación disponible.');
    if (needsSabor) return setErr('Elegí un sabor para continuar.');
    session.addToCart({ presKey: pres.key, sabor, mods, nota: nota.trim() || null, cantidad: qty, precioVisto: price });
    toast(`Agregado: ${qty} × ${product!.nombre}`, 'ok');
    onClose();
  }

  return (
    <Sheet open onClose={onClose} title={product.nombre}>
      <div className="cx-stack">
        <div className="cx-between">
          <span className="cx-eyebrow">{product.categoria}</span>
          <button className="cx-link" onClick={() => session.toggleFav(product.id)} aria-pressed={fav}>
            {fav ? '♥ Favorito' : '♡ Guardar'}
          </button>
        </div>
        {product.descripcion ? <p style={{ margin: 0, fontSize: '1.05rem' }}>{product.descripcion}</p> : <p className="cx-sub" style={{ margin: 0 }}>La carta no detalla ingredientes.</p>}

        {product.sabores.length > 0 && (
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="cx-h3" style={{ marginBottom: 8 }}>
              Sabor <span className="cx-sub">· obligatorio</span>
            </legend>
            <div className="cx-wrap" role="radiogroup" aria-label="Sabor">
              {product.sabores.map((sb) => (
                <button key={sb} type="button" role="radio" className="cx-chip" aria-checked={sabor === sb} onClick={() => { setSabor(sb); setErr(null); }}>
                  {sb}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div role="radiogroup" aria-label="Presentación" className="cx-stack-sm">
          <span className="cx-h3">Presentación</span>
          {product.presentaciones.map((pr) => {
            const c = sellCheck(s, pr.key);
            const p = unitPrice(s, pr.key, []);
            const disabled = !c.ok;
            const demoPrice = s.config.preciosDemo[pr.key] !== undefined;
            return (
              <button key={pr.key} type="button" role="radio" className="cx-opt" aria-checked={presIdx === pr.idx} aria-disabled={disabled} onClick={() => !disabled && (setPresIdx(pr.idx), setErr(null))}>
                <span className="dot" aria-hidden />
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 600 }}>{pr.etiqueta}</span>
                  {pr.nota && <span className="cx-fine">{pr.nota}</span>}
                  {pr.tipo === 'supuesto' && c.ok && <span className="cx-fine" style={{ color: 'var(--warn)' }}>Precio a confirmar con el local (supuesto de demo)</span>}
                  {disabled && <span className="cx-fine" style={{ color: 'var(--bad)' }}>{c.motivo}</span>}
                  {demoPrice && <span className="cx-fine" style={{ color: 'var(--warn)' }}>Precio actualizado</span>}
                </span>
                <span className="cx-num" style={{ fontWeight: 700 }}>
                  {pr.precio === null ? (pr.precioUnitarioFuente ? `${ars(pr.precioUnitarioFuente)} c/u` : '—') : p !== null ? ars(p) : '—'}
                </span>
              </button>
            );
          })}
        </div>

        {product.frutosRojosConsultable && (
          <label className="check" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minHeight: 44 }}>
            <input type="checkbox" style={{ width: 22, height: 22, accentColor: 'var(--accent)' }} checked={frutos} disabled={!s.config.ginFrutosRojos.habilitado} onChange={(e) => setFrutos(e.target.checked)} />
            <span>
              Con frutos rojos{' '}
              <span className="cx-fine">
                {s.config.ginFrutosRojos.habilitado ? `· recargo ficticio de demo +${ars(s.config.ginFrutosRojos.recargo)}` : '· consultá en barra: la carta no publica recargo'}
              </span>
            </span>
          </label>
        )}

        <div className="field">
          <label htmlFor="nota" className="cx-h3" style={{ fontSize: '1rem' }}>
            Nota para el equipo <span className="cx-sub">(opcional)</span>
          </label>
          <input id="nota" className="input" maxLength={140} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: sin hielo" aria-describedby="nota-h" />
          <span id="nota-h" className="cx-fine">
            No es una garantía: la barra o la cocina decide si puede hacerlo. Por alergias, consultá en persona.
          </span>
        </div>

        <details className="cx-details">
          <summary>Información de la carta</summary>
          <div className="cx-stack-sm" style={{ paddingBottom: 8 }}>
            {product.observaciones && <Note tone="warn">A confirmar con el local: {product.observaciones}</Note>}
            <p className="cx-fine" style={{ margin: 0 }}>
              Ingredientes según la carta impresa; no garantizan aptitud alimentaria. Texto original: «{product.precioTexto}»{product.variantesTexto && ` · ${product.variantesTexto}`}. Fuente: {product.fuenteCodigo} · {SOURCE_FILES[product.fuenteCodigo]}.
            </p>
            <img src={CARTA_IMG[product.fuenteCodigo]} alt={`Carta original ${product.fuenteCodigo}`} loading="lazy" style={{ maxHeight: 360, width: 'auto', objectFit: 'contain', borderRadius: 12, border: '1px solid var(--line)' }} />
          </div>
        </details>

        {err && (
          <p role="alert" style={{ color: 'var(--bad)', fontWeight: 700, margin: 0 }}>
            {err}
          </p>
        )}
        <div className="cx-detail-foot">
          <Qty value={qty} min={1} onChange={setQty} label={product.nombre} />
          <button className="cx-btn primary lg" style={{ flex: 1 }} aria-disabled={!canAdd} onClick={add} disabled={!chk?.ok || price === null}>
            {!chk?.ok || price === null ? chk?.motivo ?? 'Elegí una presentación' : needsSabor ? 'Elegí un sabor' : `Agregar · ${ars(price * qty)}`}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
