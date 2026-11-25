import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ars } from '../../domain/money';
import { setPreferencia, useClientTheme, type Preferencia } from '../../state/appearance';
import { useSession } from '../../state/session';
import { useStore } from '../../state/store';
import { Link, navigate, Sheet, useRoute } from '../../ui/kit';
import { I, LogoAlpha } from './ui';

export function useClientContext() {
  return useClientTheme().tema;
}

const NAV = [
  { to: '/carta', label: 'Carta', icon: I.copa, match: (p: string) => p.startsWith('/carta') },
  { to: '/pedido', label: 'Mis pedidos', icon: I.ticket, match: (p: string) => p.startsWith('/pedido') || p === '/carrito' || p.startsWith('/ronda') },
  { to: '/noche', label: 'Esta noche', icon: I.calendario, match: (p: string) => p.startsWith('/noche') || p.startsWith('/reserva') },
];

function BottomNav() {
  const ses = useSession();
  const { path } = useRoute();
  const activos = useStore((s) => s.orders.filter((o) => o.buyerId === ses.buyerId && ['esperando_pago', 'activo', 'incidencia'].includes(o.estado)).length);
  return (
    <nav className="cx-nav" aria-label="Navegación principal">
      <ul>
        {NAV.map((n) => (
          <li key={n.to}>
            <Link to={n.to} aria-current={n.match(path) ? 'page' : undefined}>
              <n.icon />
              <span>{n.label}</span>
              {n.to === '/pedido' && activos > 0 && (
                <span className="cx-badge" aria-label={`${activos} en curso`}>
                  {activos}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CartBar({ hideWide }: { hideWide: boolean }) {
  const ses = useSession();
  const count = ses.cart.reduce((a, c) => a + c.cantidad, 0);
  const total = ses.cart.reduce((a, c) => a + c.precioVisto * c.cantidad, 0);
  const [changed, setChanged] = useState(false);
  const prev = useRef(count);
  useEffect(() => {
    if (count !== prev.current) {
      prev.current = count;
      setChanged(true);
      const t = setTimeout(() => setChanged(false), 340);
      return () => clearTimeout(t);
    }
  }, [count]);
  return (
    <button className={`cx-cartbar ${hideWide ? 'hide-wide' : ''}`} onClick={() => navigate('/carrito')} aria-label={`Ver carrito: ${count} productos, ${ars(total)}`}>
      <I.carrito />
      <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Ver carrito · <span className={`count ${changed ? 'changed' : ''}`} style={{ display: 'inline-block' }}>{count}</span> {count === 1 ? 'producto' : 'productos'}
      </span>
      <span className="sep" aria-hidden />
      <span className="cx-num">{ars(total)}</span>
    </button>
  );
}

function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pref, momento } = useClientTheme();
  const go = (to: string) => {
    onClose();
    navigate(to);
  };
  const Row = ({ icon: Ic, title, sub, to }: { icon: () => React.ReactElement; title: string; sub: string; to: string }) => (
    <button className="cx-rowbtn cx-row" onClick={() => go(to)}>
      <span className="cx-row-ico">
        <Ic />
      </span>
      <span style={{ flex: 1 }}>
        <span className="cx-h3" style={{ display: 'block', fontSize: '1rem' }}>
          {title}
        </span>
        <span className="cx-sub">{sub}</span>
      </span>
      <span className="cx-chev">
        <I.chev />
      </span>
    </button>
  );
  const opts: { v: Preferencia; l: string }[] = [
    { v: 'auto', l: 'Automático' },
    { v: 'claro', l: 'Claro' },
    { v: 'oscuro', l: 'Oscuro' },
  ];
  return (
    <Sheet open={open} onClose={onClose} title="Menú">
      <div className="cx-rows">
        <Row icon={I.regalo} title="Beneficios" sub="Tu progreso y cupones de ejemplo" to="/beneficios" />
        <Row icon={I.reserva} title="Consultar reserva" sub="Para esta u otra fecha" to="/reserva" />
        <Row icon={I.casa} title="El lugar" sub="Dirección, contacto y próximas fechas" to="/" />
      </div>
      <p className="cx-menu-section">Apariencia</p>
      <div className="cx-wrap" role="radiogroup" aria-label="Apariencia">
        {opts.map((o) => (
          <button key={o.v} role="radio" aria-checked={pref === o.v} className="cx-chip" onClick={() => setPreferencia(o.v)}>
            {o.l}
          </button>
        ))}
      </div>
      <p className="cx-fine" style={{ marginTop: 8 }}>
        Automático sigue el momento de la noche ({momento.etiqueta.toLowerCase()}
        {momento.cambio ? `; la joda empieza ${momento.cambio}, horario de demostración` : ''}). Solo cambia los colores: no afecta pedidos ni horarios del local.
      </p>
      <p className="cx-menu-section">Ayuda</p>
      <div className="cx-rows">
        <Row icon={I.ayuda} title="Cómo funciona esta demo" sub="Qué es real, qué es supuesto y qué está simulado" to="/limites" />
      </div>
      <p className="cx-fine" style={{ marginTop: 6 }}>
        El logotipo del encabezado es una versión de trabajo derivada del archivo original (transparencia calculada, sin redibujar). Falta el archivo oficial transparente o vectorial.
      </p>
      <p className="cx-menu-section">Demostración</p>
      <div className="cx-rows">
        <Row icon={I.llave} title="Acceso de demostración" sub="Cambiar rol o perfil de prueba (no es un inicio de sesión)" to="/acceso" />
        <Row icon={I.info} title="Herramientas de demostración" sub="Reloj, escenarios y fallas simuladas" to="/demo" />
      </div>
    </Sheet>
  );
}

export function ClientShell({ children }: { children: ReactNode }) {
  const ses = useSession();
  const { tema } = useClientTheme();
  const { path } = useRoute();
  const [menu, setMenu] = useState(false);
  // Con un campo de texto enfocado (teclado abierto en el teléfono) se ocultan la navegación y la barra del carrito.
  const [teclado, setTeclado] = useState(false);
  const esCampo = (el: EventTarget | null) => el instanceof HTMLElement && (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit'].includes((el as HTMLInputElement).type)));
  const onFocusIn = (e: React.FocusEvent) => esCampo(e.target) && setTeclado(true);
  const onFocusOut = (e: React.FocusEvent) => esCampo(e.target) && !esCampo(e.relatedTarget) && setTeclado(false);
  const showBar = ses.cart.length > 0 && path !== '/carrito' && !path.startsWith('/ronda');
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'cena' ? '#fdf6e6' : '#1f0f1c');
  }, [tema]);
  return (
    <div
      className="cx"
      data-tema={tema}
      data-teclado={teclado ? 'si' : undefined}
      data-pantalla={path.startsWith('/carta') ? 'carta' : path.split('/')[1] || 'inicio'}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
    >
      <a className="cx-skip" href="#contenido">
        Saltar al contenido
      </a>
      <header className="cx-header">
        <button className="cx-iconbtn" aria-label="Abrir menú" onClick={() => setMenu(true)}>
          <I.menu />
        </button>
        <Link to="/" aria-label="TERRACO Social Club · Portada" style={{ justifySelf: 'center', lineHeight: 0 }}>
          <LogoAlpha width={path.startsWith('/carta') ? 130 : 104} />
        </Link>
        <span className="cx-desktop-nav" style={{ display: 'contents' }}>
          <BottomNav />
        </span>
        <Link to="/limites" className="cx-demo" title="Datos y pagos de prueba">
          Demo
        </Link>
      </header>
      <main id="contenido" className={`cx-page ${showBar ? 'has-bar' : ''}`}>
        <div className="cx-enter" key={path}>
          {children}
        </div>
      </main>
      {showBar && <CartBar hideWide={path.startsWith('/carta')} />}
      <MenuSheet open={menu} onClose={() => setMenu(false)} />
    </div>
  );
}
