// Traducciones de estados internos a mensajes simples y otros derivados para la interfaz.
import { allUnits, currentNight } from '../domain/engine';
import { ars } from '../domain/money';
import { jornadaOf, jornadaTime } from '../domain/time';
import type { Moment, Order, State, UnitState } from '../domain/types';
import logoUrl from '../../recursos/marca/terraco_logo_original.png';
import isoUrl from '../../recursos/marca/terraco_isotipo_original.png';
import m1 from '../../recursos/cartas/01_tragos.png';
import m2 from '../../recursos/cartas/02_especiales_y_terra_tikis.png';
import m3 from '../../recursos/cartas/03_destilados_y_energizantes.png';
import m4 from '../../recursos/cartas/04_vinos_cervezas_y_sin_alcohol.png';
import m5 from '../../recursos/cartas/05_comidas_para_compartir.png';

export const LOGO = logoUrl;
export const ISO = isoUrl;
export const CARTA_IMG: Record<string, string> = { M1: m1, M2: m2, M3: m3, M4: m4, M5: m5 };

export const UNIT_LABEL: Record<UnitState, { label: string; glyph: string; tone: 'ok' | 'warn' | 'bad' | 'info' | undefined }> = {
  pendiente: { label: 'Pendiente', glyph: '○', tone: undefined },
  en_preparacion: { label: 'En preparación', glyph: '◐', tone: 'warn' },
  lista: { label: 'Lista para retirar', glyph: '●', tone: 'ok' },
  entregada: { label: 'Entregada', glyph: '✓', tone: 'info' },
  cancelada: { label: 'Cancelada', glyph: '✕', tone: 'bad' },
};

export function stationName(e: 'cocina' | 'barra') {
  return e === 'cocina' ? 'cocina' : 'barra';
}

export function pickupPoint(s: State, o: Order, e: 'cocina' | 'barra') {
  const night = s.nights.find((n) => n.jornada === o.jornada)?.publicada;
  if (e === 'cocina' && o.modalidad === 'mesa') {
    const mesa = s.tables.find((t) => t.id === o.mesaId);
    return `Servicio a ${mesa?.nombre ?? 'mesa'}`;
  }
  return night?.puntosRetiro[e] ?? (e === 'cocina' ? 'Ventana de cocina' : 'Barra principal');
}

/** Mensaje simple para el cliente, sin mezclar pago, recepción, preparación y entrega. */
export function clientStatus(s: State, o: Order): { title: string; detail: string; tone: 'ok' | 'warn' | 'bad' | 'info' | 'accent'; step: number } {
  if (o.estado === 'esperando_pago') {
    if (o.pago === 'esperando_verificacion') return { title: 'Esperando verificación de la transferencia', detail: 'El encargado debe verificarla. Una captura no acredita el pago.', tone: 'warn', step: 0 };
    if (o.metodo === 'efectivo') return { title: 'Esperando cobro en caja', detail: 'Pagá en caja para que el pedido se envíe.', tone: 'warn', step: 0 };
    return { title: 'Esperando confirmación del pago', detail: 'Todavía no se envió a preparación.', tone: 'warn', step: 0 };
  }
  if (o.estado === 'pago_rechazado') return { title: 'Pago rechazado', detail: 'No se cobró ni se preparó. Podés intentarlo de nuevo con «Volver a pedir».', tone: 'bad', step: 0 };
  if (o.estado === 'vencido') return { title: 'Venció el plazo de pago', detail: 'No se preparó y el stock reservado se liberó.', tone: 'bad', step: 0 };
  if (o.estado === 'incidencia') return { title: 'Pago recibido tarde: lo está revisando el equipo', detail: 'Vamos a preparar el pedido o devolver el dinero; no se reactiva solo.', tone: 'warn', step: 1 };
  if (o.estado === 'cancelado') return { title: 'Pedido cancelado', detail: refundSummary(s, o) || 'Sin cobro registrado.', tone: 'bad', step: 0 };
  const units = allUnits(o);
  const vivas = units.filter((u) => u.estado !== 'cancelada');
  if (o.estado === 'completado') return { title: 'Pedido entregado', detail: units.some((u) => u.estado === 'cancelada') ? `Hubo productos no entregables. ${refundSummary(s, o)}` : '¡Que lo disfrutes!', tone: 'info', step: 4 };
  const sinRecepcion = o.tickets.filter((t) => !t.recibidoEn && !t.recepcionManual);
  if (sinRecepcion.length) return { title: 'Pago confirmado; enviando pedido', detail: `Todavía no hay recepción en ${sinRecepcion.map((t) => stationName(t.estacion)).join(' y ')}. El equipo ya fue avisado.`, tone: 'warn', step: 1 };
  const listas = vivas.filter((u) => u.estado === 'lista');
  const porEst = (e: 'cocina' | 'barra') => vivas.filter((u) => u.line.estacion === e);
  const parts: string[] = [];
  for (const e of ['barra', 'cocina'] as const) {
    const us = porEst(e);
    if (!us.length) continue;
    const name = e === 'barra' ? 'Bebidas' : 'Comida';
    if (us.every((u) => u.estado === 'entregada')) parts.push(`${name} entregada${e === 'barra' ? 's' : ''}`);
    else if (us.some((u) => u.estado === 'lista')) {
      const listas = us.filter((u) => u.estado === 'lista').length;
      const faltan = us.filter((u) => u.estado === 'pendiente' || u.estado === 'en_preparacion').length;
      parts.push(faltan ? `${name}: ${listas} de ${listas + faltan} listas en ${pickupPoint(s, o, e)}` : `${name} lista${e === 'barra' ? 's' : ''} en ${pickupPoint(s, o, e)}`);
    }
    else if (us.some((u) => u.estado === 'en_preparacion')) parts.push(`${name} en preparación`);
    else parts.push(`${name}: recibido en ${stationName(e)}`);
  }
  const aviso = units.some((u) => u.estado === 'cancelada') ? ` Un producto no se pudo preparar. ${refundSummary(s, o)}` : '';
  if (listas.length) return { title: parts.join(' · '), detail: (o.modalidad === 'mesa' ? 'La comida va a tu mesa. Bebidas: retirá con tu credencial.' : 'Mostrá tu credencial privada al retirar.') + aviso, tone: 'ok', step: 3 };
  return { title: parts.join(' · '), detail: 'Te avisamos acá cuando esté listo. También podés mirar la pantalla del local.' + aviso, tone: 'accent', step: vivas.some((u) => u.estado === 'en_preparacion') ? 2 : 1 };
}

export function refundSummary(s: State, o: Order) {
  const rs = s.refunds.filter((r) => r.orderId === o.id);
  if (!rs.length) return '';
  return rs.map((r) => `Devolución simulada ${r.estado}: ${ars(r.monto)}`).join(' · ');
}

export interface MomentView extends Moment {
  start: number;
  end: number;
  now: boolean;
  past: boolean;
}

export function nightMoments(s: State, jornada = jornadaOf(s.now)): MomentView[] {
  const n = s.nights.find((x) => x.jornada === jornada)?.publicada;
  if (!n) return [];
  return n.momentos
    .map((m) => {
      const start = jornadaTime(jornada, m.inicio);
      const end = jornadaTime(jornada, m.fin);
      return { ...m, start, end, now: s.now >= start && s.now < end, past: s.now >= end };
    })
    .sort((a, b) => a.start - b.start);
}

/** Contexto visible: cena (crema) hasta que empieza el show/joda; noche después. */
export function autoContext(s: State): 'cena' | 'show' | 'joda' {
  const ms = nightMoments(s);
  const active = ms.filter((m) => m.now);
  if (active.some((m) => m.tipo === 'dj') || ms.some((m) => m.tipo === 'dj' && m.past)) return 'joda';
  if (active.some((m) => m.tipo === 'show')) return 'show';
  return 'cena';
}

export function activeSession(s: State) {
  const night = currentNight(s);
  const id = night?.publicada?.djSesionId;
  return s.sessions.find((x) => x.id === id) ?? null;
}

export function activePoll(s: State) {
  const ses = activeSession(s);
  if (!ses) return null;
  return s.polls.filter((p) => p.sesionId === ses.id && (p.estado === 'abierta' || p.estado === 'pausada')).at(-1) ?? null;
}
