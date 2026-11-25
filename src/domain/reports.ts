// Indicadores derivados de los registros de la demo. Nada se guarda aparte: todo se recalcula.
import { allUnits } from './engine';
import { jornadaTime } from './time';
import type { Order, State } from './types';

export type CanalFiltro = 'todos' | 'web' | 'caja';

const PAGADO = new Set(['aprobado', 'aprobado_tardio', 'verificado_manual', 'efectivo_registrado']);

export function isSale(o: Order) {
  return o.pagadoEn !== null && PAGADO.has(o.pago);
}

function avg(xs: number[]) {
  return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
}

export function reportFor(s: State, jornada: string, canal: CanalFiltro) {
  const orders = s.orders.filter((o) => o.jornada === jornada && (canal === 'todos' || o.canal === canal));
  const ventas = orders.filter(isSale);
  const ventasBrutas = ventas.reduce((a, o) => a + o.subtotal, 0);
  const descuentos = ventas.reduce((a, o) => a + o.descuento, 0);
  const orderIds = new Set(orders.map((o) => o.id));
  const refunds = s.refunds.filter((r) => r.jornada === jornada && (r.orderId ? orderIds.has(r.orderId) : canal !== 'caja'));
  const devCompletadas = refunds.filter((r) => r.estado === 'completada').reduce((a, r) => a + r.monto, 0);
  const devPendientes = refunds.filter((r) => r.estado !== 'completada').reduce((a, r) => a + r.monto, 0);
  const cobros = s.cobros.filter((c) => c.jornada === jornada && (c.orderId ? orderIds.has(c.orderId) : canal !== 'caja'));
  const cobrosTotal = cobros.reduce((a, c) => a + c.monto, 0);
  const cobrosPorMetodo = {
    digital_demo: cobros.filter((c) => c.metodo === 'digital_demo').reduce((a, c) => a + c.monto, 0),
    efectivo: cobros.filter((c) => c.metodo === 'efectivo').reduce((a, c) => a + c.monto, 0),
    transferencia_manual: cobros.filter((c) => c.metodo === 'transferencia_manual').reduce((a, c) => a + c.monto, 0),
  };
  const abiertos = orders.filter((o) => ['activo', 'esperando_pago', 'incidencia'].includes(o.estado));
  const incidents = s.incidents.filter((i) => i.jornada === jornada && (!i.orderId || orderIds.has(i.orderId) || canal === 'todos'));

  const prod = new Map<string, { nombre: string; categoria: string; unidades: number; importe: number }>();
  const cats = new Map<string, { unidades: number; importe: number }>();
  let unidades = 0;
  for (const o of ventas)
    for (const l of o.lineas) {
      const vendidas = l.unidades.filter((u) => u.estado !== 'cancelada').length;
      if (!vendidas) continue;
      unidades += vendidas;
      const k = `${l.nombre} · ${l.presentacion}${l.sabor ? ` · ${l.sabor}` : ''}`;
      const p = prod.get(k) ?? { nombre: k, categoria: l.categoria, unidades: 0, importe: 0 };
      p.unidades += vendidas;
      p.importe += vendidas * l.precioUnitario;
      prod.set(k, p);
      const c = cats.get(l.categoria) ?? { unidades: 0, importe: 0 };
      c.unidades += vendidas;
      c.importe += vendidas * l.precioUnitario;
      cats.set(l.categoria, c);
    }

  const recepcion: number[] = [];
  const prep: Record<'cocina' | 'barra', number[]> = { cocina: [], barra: [] };
  const retiro: number[] = [];
  for (const o of ventas) {
    for (const t of o.tickets) if (t.recibidoEn && o.pagadoEn) recepcion.push(t.recibidoEn - o.pagadoEn);
    for (const u of allUnits(o)) {
      const t = o.tickets.find((x) => x.estacion === u.line.estacion);
      if (u.listaEn && t?.recibidoEn) prep[u.line.estacion].push(u.listaEn - t.recibidoEn);
      if (u.entregadaEn && u.listaEn) retiro.push(u.entregadaEn - u.listaEn);
    }
  }

  const night = s.nights.find((n) => n.jornada === jornada)?.publicada;
  const porMomento: { titulo: string; importe: number; pedidos: number }[] = [];
  if (night) {
    for (const m of night.momentos.filter((m) => m.tipo !== 'cierre')) {
      const a = jornadaTime(jornada, m.inicio);
      const b = jornadaTime(jornada, m.fin);
      const os = ventas.filter((o) => o.pagadoEn! >= a && o.pagadoEn! < b);
      porMomento.push({ titulo: `${m.titulo} (${m.inicio}–${m.fin})`, importe: os.reduce((x, o) => x + o.total, 0), pedidos: os.length });
    }
  }

  return {
    jornada,
    canal,
    pedidos: orders.length,
    ventasCount: ventas.length,
    ventasBrutas,
    descuentos,
    devCompletadas,
    devPendientes,
    ventasNetas: ventasBrutas - descuentos - devCompletadas - devPendientes,
    cobrosTotal,
    cobrosPorMetodo,
    cobrosTardios: cobros.filter((c) => c.tardio).length,
    abiertos: abiertos.length,
    esperandoPago: orders.filter((o) => o.estado === 'esperando_pago').length,
    incidenciasAbiertas: incidents.filter((i) => i.estado === 'abierta').length,
    incidenciasTotal: incidents.length,
    unidades,
    topProductos: [...prod.values()].sort((a, b) => b.unidades - a.unidades || b.importe - a.importe).slice(0, 8),
    categorias: [...cats.entries()].map(([nombre, v]) => ({ nombre, ...v })).sort((a, b) => b.importe - a.importe),
    tiempos: {
      recepcion: { ms: avg(recepcion), n: recepcion.length },
      cocina: { ms: avg(prep.cocina), n: prep.cocina.length },
      barra: { ms: avg(prep.barra), n: prep.barra.length },
      retiro: { ms: avg(retiro), n: retiro.length },
    },
    porMomento,
    sembrados: orders.filter((o) => o.sembrado).length,
    web: orders.filter((o) => o.canal === 'web' && isSale(o)).reduce((a, o) => a + o.total, 0),
    caja: orders.filter((o) => o.canal === 'caja' && isSale(o)).reduce((a, o) => a + o.total, 0),
  };
}

export type Report = ReturnType<typeof reportFor>;

export function pollStats(s: State, jornada: string) {
  const sessions = s.sessions.filter((x) => x.jornada === jornada).map((x) => x.id);
  const polls = s.polls.filter((p) => sessions.includes(p.sesionId));
  const universo = (s.nightAccess[jornada] ?? []).length;
  return polls.map((p) => {
    const votos = Object.values(p.votos);
    const counts = p.opciones.map((o) => ({ ...o, votos: votos.filter((v) => v === o.id).length }));
    const max = Math.max(0, ...counts.map((c) => c.votos));
    const lideres = counts.filter((c) => c.votos === max && max > 0);
    return { poll: p, total: votos.length, universo, counts, empate: lideres.length > 1, pocos: votos.length < p.minVotos, lideres };
  });
}

export function attribution(s: State, jornada?: string) {
  return s.links
    .filter((l) => !jornada || l.jornada === jornada)
    .map((l) => {
      const rs = s.reservations.filter((r) => r.linkId === l.id);
      return {
        link: l,
        visitas: s.linkVisits.filter((v) => v.linkId === l.id).length,
        visitantes: new Set(s.linkVisits.filter((v) => v.linkId === l.id).map((v) => v.visitorId)).size,
        solicitudes: rs.length,
        confirmadas: rs.filter((r) => ['confirmada', 'llegada', 'ausente'].includes(r.estado)).length,
        canceladas: rs.filter((r) => r.estado === 'cancelada').length,
        asistencias: rs.filter((r) => r.estado === 'llegada').length,
        personasAsistentes: rs.filter((r) => r.estado === 'llegada').reduce((a, r) => a + r.personas, 0),
      };
    });
}
