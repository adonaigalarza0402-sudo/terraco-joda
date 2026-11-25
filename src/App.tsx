import { useEffect } from 'react';
import { session, useSession } from './state/session';
import { dispatch, useStore } from './state/store';
import { Empty, Link, navigate, Toasts, useRoute } from './ui/kit';
import { Access } from './views/Access';
import { Lab } from './views/Lab';
import { Limits } from './views/Limits';
import { Benefits } from './views/client/Benefits';
import { Cart } from './views/client/Cart';
import { Home } from './views/client/Home';
import { Menu } from './views/client/Menu';
import { OrderDetail, Orders } from './views/client/Orders';
import { ReservationDetail, Reserve } from './views/client/Reserve';
import { NewRound, RoundView } from './views/client/Round';
import { ClientShell } from './views/client/Shell';
import { Tonight } from './views/client/Tonight';
import { Caja } from './views/staff/Caja';
import { DJView } from './views/staff/DJ';
import { Encargado } from './views/staff/Encargado';
import { Entrega } from './views/staff/Entrega';
import { Owner } from './views/staff/Owner';
import { Pantalla } from './views/staff/Pantalla';
import { StationView } from './views/staff/Station';
import { PERMISSIONS } from './domain/roles';
import type { Role } from './domain/types';

function Guard({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const ses = useSession();
  if (!roles.includes(ses.role))
    return (
      <div className="app-root theme-ops" style={{ minHeight: '100dvh', padding: 24 }}>
        <Empty title="Esta vista es para otro rol" action={<Link to="/acceso" className="btn btn-primary">Cambiar acceso de demostración</Link>}>
          Elegí el rol correspondiente. Es un control de la demo, no una autorización de servidor.
        </Empty>
      </div>
    );
  return <>{children}</>;
}

function MesaEntry({ mesaId }: { mesaId: string }) {
  const s = useStore((x) => x);
  const { query } = useRoute();
  const mesa = s.tables.find((t) => t.id === mesaId);
  const current = s.tableSessions.filter((t) => t.mesaId === mesaId && !t.cerradaEn).at(-1);
  const old = query.get('s');
  useEffect(() => {
    if (mesa && current && (!old || old === current.id)) {
      session.set({ mesaId, mesaSesionId: current.id, role: session.get().role.startsWith('cliente') ? session.get().role : 'cliente' });
      navigate('/carta');
    }
  }, [mesa, current, old, mesaId]);
  if (!mesa) return <Empty title="Mesa desconocida" />;
  if (old && old !== current?.id)
    return (
      <div className="stack" style={{ paddingTop: 16 }}>
        <Empty
          title="Esta ocupación de la mesa terminó"
          action={
            <button className="btn btn-primary" onClick={() => navigate(`/mesa/${mesaId}`)}>
              Empezar como nueva ocupación
            </button>
          }
        >
          Por privacidad, el QR de {mesa.nombre} no muestra pedidos de ocupaciones anteriores.
        </Empty>
      </div>
    );
  return <p className="muted">Abriendo {mesa.nombre}…</p>;
}

export function App() {
  const { path, query } = useRoute();
  const ses = useSession();

  // Enlace por canal: se registra una visita y se recuerda el último enlace identificado en esta pestaña.
  useEffect(() => {
    const ref = query.get('ref');
    if (ref && ref !== ses.lastLink) {
      session.set({ lastLink: ref });
      dispatch({ type: 'link.visit', codigo: ref, visitorId: ses.buyerId }).catch(() => undefined);
    }
  }, [query, ses.lastLink, ses.buyerId]);

  const seg = path.split('/').filter(Boolean);
  let view: React.ReactNode;
  const client = (node: React.ReactNode) => <ClientShell>{node}</ClientShell>;
  switch (seg[0]) {
    case undefined:
      view = client(<Home />);
      break;
    case 'carta':
      view = client(<Menu />);
      break;
    case 'carrito':
      view = client(<Cart />);
      break;
    case 'pedido':
      view = client(seg[1] ? <OrderDetail id={seg[1]} /> : <Orders />);
      break;
    case 'noche':
      view = client(<Tonight />);
      break;
    case 'beneficios':
      view = client(<Benefits />);
      break;
    case 'reserva':
      view = client(seg[1] ? <ReservationDetail id={seg[1]} /> : <Reserve />);
      break;
    case 'ronda':
      view = client(seg[1] === 'nueva' ? <NewRound /> : <RoundView id={seg[1]} />);
      break;
    case 'mesa':
      view = client(<MesaEntry mesaId={seg[1]} />);
      break;
    case 'acceso':
      view = <Access />;
      break;
    case 'limites':
      view = <Limits />;
      break;
    case 'demo':
      view = <Lab />;
      break;
    case 'pantalla':
      view = <Pantalla />;
      break;
    case 'caja':
      view = (
        <Guard roles={PERMISSIONS.caja}>
          <Caja />
        </Guard>
      );
      break;
    case 'cocina':
      view = (
        <Guard roles={['cocina', 'encargado']}>
          <StationView estacion="cocina" />
        </Guard>
      );
      break;
    case 'barra':
      view = (
        <Guard roles={['barra', 'encargado']}>
          <StationView estacion="barra" />
        </Guard>
      );
      break;
    case 'entrega':
      view = (
        <Guard roles={['entrega', 'barra', 'encargado']}>
          <Entrega />
        </Guard>
      );
      break;
    case 'encargado':
      view = (
        <Guard roles={['encargado']}>
          <Encargado />
        </Guard>
      );
      break;
    case 'dueno':
      view = (
        <Guard roles={['dueno', 'encargado']}>
          <Owner />
        </Guard>
      );
      break;
    case 'dj':
      view = (
        <Guard roles={['dj', 'dj_asistente']}>
          <DJView />
        </Guard>
      );
      break;
    default:
      view = client(<Empty title="No encontramos esta página" action={<Link to="/" className="btn">Ir a la portada</Link>} />);
  }
  return (
    <>
      {view}
      <Toasts />
    </>
  );
}
