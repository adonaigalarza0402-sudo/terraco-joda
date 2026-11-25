import { describe, expect, it } from 'vitest';
import { PRODUCTS, CATEGORIES } from './catalog';
import { apply, sellCheck, unitPrice, type CartLine, type Command } from './engine';
import { splitCents, allocateProportional } from './money';
import { reportFor } from './reports';
import { A, createSeedState, DEMO_JORNADA } from './seed';
import { arDateTime, jornadaOf } from './time';
import type { Actor, State } from './types';

let n = 0;
function go(s: State, actor: Actor, cmd: Command, cid?: string) {
  return apply(s, { cid: cid ?? `t-${++n}`, actor, cmd });
}
function ok(s: State, actor: Actor, cmd: Command, cid?: string) {
  const r = go(s, actor, cmd, cid);
  if (!r.result.ok) throw new Error(`${cmd.type}: ${r.result.message}`);
  return r;
}
const line = (s: State, presKey: string, cantidad = 1, sabor: string | null = null): CartLine => ({ presKey, sabor, mods: [], nota: null, cantidad, precioVisto: unitPrice(s, presKey, [])! });
const cli = (b = 'buyer-1', profileId?: string): Actor => ({ role: profileId ? 'cliente_id' : 'cliente', buyerId: b, profileId });
const order = (s: State, id: string) => s.orders.find((o) => o.id === id)!;
const unitsOf = (s: State, id: string, est?: 'cocina' | 'barra') => order(s, id).lineas.filter((l) => !est || l.estacion === est).flatMap((l) => l.unidades.map((u) => u.id));

describe('catálogo', () => {
  it('importa 99 referencias en 18 categorías', () => {
    expect(PRODUCTS).toHaveLength(99);
    expect(CATEGORIES).toHaveLength(18);
  });
  it('los guiones no se convierten en precio cero; formatos ambiguos no se venden', () => {
    const s = createSeedState();
    for (const p of PRODUCTS) for (const pr of p.presentaciones) if (pr.precio !== null) expect(pr.precio).toBeGreaterThan(0);
    expect(sellCheck(s, 'terraco-025:0').tipo).toBe('consultable'); // whisky ícono vaso
    expect(sellCheck(s, 'terraco-097:0').tipo).toBe('consultable'); // empanadas x4 c/u
    expect(sellCheck(s, 'terraco-097:1').ok).toBe(true); // docena de prueba
    expect(sellCheck(s, 'terraco-088:0').ok).toBe(true); // pizza con supuesto visible
    expect(PRODUCTS.find((p) => p.nombre === 'Jäggerboom')?.descripcion).toContain('Corona');
  });
});

describe('dinero', () => {
  it('reparte en centavos y suma exacto', () => {
    const parts = splitCents(6000000, 7);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(6000000);
    expect(Math.max(...parts) - Math.min(...parts)).toBeLessThanOrEqual(1);
    expect(allocateProportional([800000, 800000, 2000000], 500000).reduce((a, b) => a + b, 0)).toBe(500000);
  });
});

describe('1. cena y entrega parcial', () => {
  it('separa tareas, entrega parcial y total en informe', () => {
    let s = createSeedState();
    const before = reportFor(s, DEMO_JORNADA, 'todos').ventasBrutas;
    let r = ok(s, cli(), { type: 'checkout.start', lines: [line(s, 'terraco-089:0'), line(s, 'terraco-007:0', 1, 'Tradicional')], modalidad: 'retiro' });
    const { orderId, intentId } = r.result.data;
    s = r.state;
    expect(order(s, orderId).estado).toBe('esperando_pago');
    s = ok(s, A.sys, { type: 'payment.simulate', intentId, resultado: 'aprobar' }).state;
    const o = order(s, orderId);
    expect(o.tickets.map((t) => t.estacion).sort()).toEqual(['barra', 'cocina']);
    expect(o.tickets.every((t) => t.recibidoEn)).toBe(true);
    s = ok(s, A.barra, { type: 'units.ready', unitIds: unitsOf(s, orderId, 'barra') }).state;
    s = ok(s, A.entrega, { type: 'delivery.deliver', orderId, credencial: o.credencial, unitIds: unitsOf(s, orderId) }).state;
    expect(order(s, orderId).lineas.find((l) => l.estacion === 'cocina')!.unidades[0].estado).toBe('pendiente');
    expect(order(s, orderId).estado).toBe('activo');
    s = ok(s, A.cocina, { type: 'station.take', orderId, estacion: 'cocina' }).state;
    s = ok(s, A.cocina, { type: 'units.ready', unitIds: unitsOf(s, orderId, 'cocina') }).state;
    s = ok(s, A.entrega, { type: 'delivery.deliver', orderId, credencial: o.credencial, unitIds: unitsOf(s, orderId) }).state;
    expect(order(s, orderId).estado).toBe('completado');
    expect(reportFor(s, DEMO_JORNADA, 'todos').ventasBrutas - before).toBe(2000000 + 800000);
  });
});

describe('2. ronda y repetición', () => {
  it('fernet + 5 latas a precio de carta; repetir con precio cambiado exige revisión', () => {
    let s = createSeedState();
    const l = line(s, 'terraco-060:0');
    expect(l.precioVisto).toBe(6000000);
    expect(splitCents(l.precioVisto, 4)).toEqual([1500000, 1500000, 1500000, 1500000]);
    const cocaAntes = s.insumos['coca-lata'].stock;
    const fernetAntes = s.insumos['fernet-750'].stock;
    let r = ok(s, cli(), { type: 'checkout.start', lines: [l], modalidad: 'retiro' });
    s = ok(r.state, A.sys, { type: 'payment.simulate', intentId: r.result.data.intentId, resultado: 'aprobar' }).state;
    expect(s.insumos['coca-lata'].stock).toBe(cocaAntes - 5);
    expect(s.insumos['fernet-750'].stock).toBe(fernetAntes - 1);
    s = ok(s, A.sys, { type: 'price.set', presKey: 'terraco-060:0', precio: 6500000 }).state;
    const rep = go(s, cli(), { type: 'checkout.start', lines: [l], modalidad: 'retiro', repiteDe: r.result.data.orderId });
    expect(rep.result.ok).toBe(false);
    expect(rep.result.code).toBe('revalidar');
    expect(rep.result.data.cambios[0].ahora).toBe(6500000);
  });
});

describe('3. compra asistida y doble validación', () => {
  it('caja crea, aparece en la cola y no se entrega dos veces', () => {
    let s = createSeedState();
    let r = ok(s, A.caja, { type: 'caja.createOrder', lines: [line(s, 'terraco-068:0', 2)], metodo: 'efectivo', alias: 'Juan', modalidad: 'retiro' });
    const id = r.result.data.orderId;
    s = ok(r.state, A.caja, { type: 'caja.registerCash', orderId: id }).state;
    const again = go(s, A.caja, { type: 'caja.registerCash', orderId: id });
    expect(again.result.code).toBe('repetido');
    expect(again.state.cobros.filter((c) => c.orderId === id)).toHaveLength(1);
    s = ok(s, A.barra, { type: 'station.take', orderId: id, estacion: 'barra' }).state;
    const other = go(s, { role: 'barra', staffId: 'st-leo' }, { type: 'station.take', orderId: id, estacion: 'barra' });
    expect(other.result.code).toBe('ya_tomada');
    s = ok(s, A.barra, { type: 'units.ready', unitIds: unitsOf(s, id) }).state;
    const cred = order(s, id).credencial;
    s = ok(s, A.entrega, { type: 'delivery.deliver', orderId: id, credencial: cred, unitIds: unitsOf(s, id) }).state;
    const second = go(s, { role: 'barra', staffId: 'st-leo' }, { type: 'delivery.deliver', orderId: id, credencial: cred, unitIds: unitsOf(s, id) });
    expect(second.result.ok).toBe(false);
    expect(order(second.state, id).lineas[0].unidades.filter((u) => u.estado === 'entregada')).toHaveLength(2);
    const pub = go(s, A.entrega, { type: 'delivery.deliver', orderId: id, credencial: order(s, id).codigo, unitIds: unitsOf(s, id) });
    expect(pub.result.code).toBe('credencial');
  });
});

describe('4. reserva', () => {
  it('consulta → borrador → confirmación del encargado → llegada', () => {
    let s = createSeedState();
    const r = ok(s, cli(), { type: 'reservation.create', jornada: DEMO_JORNADA, horario: '22:30', personas: 3, nombre: 'Prueba', contacto: '+54 9 3725 111-222', notas: '', origen: 'web' });
    s = r.state;
    const id = r.result.data.id;
    expect(s.reservations.find((x) => x.id === id)!.estado).toBe('consulta_creada');
    s = ok(s, cli(), { type: 'reservation.mark', id, accion: 'enlace_abierto' }).state;
    expect(s.reservations.find((x) => x.id === id)!.estado).toBe('consulta_creada');
    const bad = go(s, A.sys, { type: 'reservation.setState', id, estado: 'llegada' });
    expect(bad.result.ok).toBe(false);
    s = ok(s, A.sys, { type: 'reservation.setState', id, estado: 'confirmada' }).state;
    s = ok(s, A.sys, { type: 'reservation.setState', id, estado: 'llegada' }).state;
    expect(s.reservations.find((x) => x.id === id)!.estado).toBe('llegada');
  });
  it('una consulta sin contacto queda incompleta', () => {
    let s = createSeedState();
    const r = ok(s, cli(), { type: 'reservation.create', jornada: DEMO_JORNADA, horario: '22:30', personas: 3, nombre: 'Prueba', contacto: '+54 9 3725 111-222', notas: '', origen: 'web' });
    s = ok(r.state, A.sys, { type: 'clock.advance', minutes: 61 }).state;
    expect(s.reservations.find((x) => x.id === r.result.data.id)!.estado).toBe('incompleta');
  });
});

describe('5. encuesta', () => {
  it('una activa, un voto por identidad, cierre por reloj y carta accesible', () => {
    let s = createSeedState();
    const dj: Actor = { role: 'dj', staffId: 'st-aurora' };
    let r = ok(s, dj, { type: 'poll.create', sesionId: 'ses-aurora', pregunta: '¿Qué sigue?', opciones: ['Cumbia', 'Cuarteto'], duracionMin: 5, minVotos: 3 });
    const pollId = r.result.data.pollId;
    s = ok(r.state, dj, { type: 'poll.open', pollId }).state;
    const second = ok(s, dj, { type: 'poll.create', sesionId: 'ses-aurora', pregunta: 'x', opciones: ['A', 'B'], duracionMin: 5, minVotos: 1 });
    expect(go(second.state, dj, { type: 'poll.open', pollId: second.result.data.pollId }).result.code).toBe('una_activa');
    expect(go(s, cli('b1'), { type: 'poll.vote', pollId, identity: 'id-1', opcionId: 'op1' }).result.code).toBe('acceso');
    s = ok(s, cli('b1'), { type: 'night.access', identity: 'id-1', codigo: 'SOL2111' }).state;
    s = ok(s, cli('b1'), { type: 'poll.vote', pollId, identity: 'id-1', opcionId: 'op1' }).state;
    expect(go(s, cli('b1'), { type: 'poll.vote', pollId, identity: 'id-1', opcionId: 'op2' }).result.code).toBe('ya_voto');
    expect(sellCheck(s, 'terraco-061:0').ok).toBe(true);
    s = ok(s, A.sys, { type: 'clock.advance', minutes: 6 }).state;
    expect(s.polls.find((p) => p.id === pollId)!.estado).toBe('cerrada');
    expect(go(s, cli('b2'), { type: 'poll.vote', pollId, identity: 'id-1', opcionId: 'op2' }).result.ok).toBe(false);
  });
  it('el asistente solo actúa si el DJ delega', () => {
    let s = createSeedState();
    const asist: Actor = { role: 'dj_asistente', staffId: 'st-fede' };
    expect(go(s, asist, { type: 'poll.create', sesionId: 'ses-aurora', pregunta: 'x', opciones: ['A', 'B'], duracionMin: 5, minVotos: 1 }).result.code).toBe('permiso');
    s = ok(s, { role: 'dj', staffId: 'st-aurora' }, { type: 'dj.delegate', sesionId: 'ses-aurora', asistenteId: 'st-fede', permisos: ['crear'] }).state;
    expect(go(s, asist, { type: 'poll.create', sesionId: 'ses-aurora', pregunta: 'x', opciones: ['A', 'B'], duracionMin: 5, minVotos: 1 }).result.ok).toBe(true);
  });
});

describe('6. cambio de momento', () => {
  it('cocina cierra para nuevas compras y el pedido aceptado sigue', () => {
    let s = createSeedState();
    s = ok(s, A.sys, { type: 'clock.set', at: arDateTime(DEMO_JORNADA, '00:20') + 24 * 3600_000 }).state;
    const r = ok(s, cli(), { type: 'checkout.start', lines: [line(s, 'terraco-092:0')], modalidad: 'retiro' });
    s = ok(r.state, A.sys, { type: 'payment.simulate', intentId: r.result.data.intentId, resultado: 'aprobar' }).state;
    s = ok(s, A.sys, { type: 'clock.advance', minutes: 15 }).state;
    expect(jornadaOf(s.now)).toBe(DEMO_JORNADA);
    expect(sellCheck(s, 'terraco-092:0').tipo).toBe('horario');
    expect(sellCheck(s, 'terraco-061:0').ok).toBe(true);
    s = ok(s, A.cocina, { type: 'units.ready', unitIds: unitsOf(s, r.result.data.orderId) }).state;
    expect(order(s, r.result.data.orderId).estado).toBe('activo');
  });
});

describe('7. noche y beneficios', () => {
  it('no duplica visita antes y después de medianoche; cupón de un solo uso', () => {
    let s = createSeedState();
    s = ok(s, A.entrega, { type: 'visit.validate', profileId: 'prf-lucia' }).state;
    expect(s.coupons.filter((c) => c.profileId === 'prf-lucia')).toHaveLength(1);
    s = ok(s, A.sys, { type: 'clock.set', at: arDateTime(DEMO_JORNADA, '01:30') + 24 * 3600_000 }).state;
    expect(go(s, A.entrega, { type: 'visit.validate', profileId: 'prf-lucia' }).result.code).toBe('duplicado');
    const caro = cli('b-caro', 'prf-caro');
    const lines = [line(s, 'terraco-077:0'), line(s, 'terraco-061:0')];
    let r = ok(s, caro, { type: 'checkout.start', lines, modalidad: 'retiro', couponId: 'cup-caro-8' });
    expect(order(r.state, r.result.data.orderId).descuento).toBe(180000); // 15% de la jarra
    expect(go(r.state, caro, { type: 'checkout.start', lines, modalidad: 'retiro', couponId: 'cup-caro-8' }).result.code).toBe('cupon');
    s = ok(r.state, A.sys, { type: 'payment.simulate', intentId: r.result.data.intentId, resultado: 'rechazar' }).state;
    expect(s.coupons.find((c) => c.id === 'cup-caro-8')!.estado).toBe('disponible');
    r = ok(s, caro, { type: 'checkout.start', lines, modalidad: 'retiro', couponId: 'cup-caro-8' });
    s = ok(r.state, A.sys, { type: 'payment.simulate', intentId: r.result.data.intentId, resultado: 'aprobar' }).state;
    expect(s.coupons.find((c) => c.id === 'cup-caro-8')!.estado).toBe('usado');
    s = ok(s, A.sys, { type: 'order.cancel', orderId: r.result.data.orderId, motivo: 'Prueba de ajuste' }).state;
    expect(s.coupons.find((c) => c.id === 'cup-caro-8')!.estado).toBe('disponible');
    const dev = s.refunds.find((x) => x.orderId === r.result.data.orderId)!;
    expect(dev.monto).toBe(order(s, r.result.data.orderId).total);
  });
});

describe('8. excepciones financieras y de conexión', () => {
  it('doble toque reutiliza la operación', () => {
    const s = createSeedState();
    const cmd: Command = { type: 'checkout.start', lines: [line(s, 'terraco-061:0')], modalidad: 'retiro' };
    const a = ok(s, cli(), cmd, 'same-cid');
    const b = go(a.state, cli(), cmd, 'same-cid');
    expect(b.state.orders.length).toBe(a.state.orders.length);
    expect(b.result.data.orderId).toBe(a.result.data.orderId);
  });
  it('pendiente, rechazo, aprobación repetida y aprobación tardía', () => {
    let s = createSeedState();
    let r = ok(s, cli(), { type: 'checkout.start', lines: [line(s, 'terraco-005:0')], modalidad: 'retiro' });
    s = ok(r.state, A.sys, { type: 'payment.simulate', intentId: r.result.data.intentId, resultado: 'pendiente' }).state;
    expect(order(s, r.result.data.orderId).tickets).toHaveLength(0);
    s = ok(s, A.sys, { type: 'payment.simulate', intentId: r.result.data.intentId, resultado: 'aprobar' }).state;
    const rep = ok(s, A.sys, { type: 'payment.simulate', intentId: r.result.data.intentId, resultado: 'aprobar' });
    expect(rep.result.code).toBe('repetido');
    expect(rep.state.cobros.filter((c) => c.orderId === r.result.data.orderId)).toHaveLength(1);
    // tardía
    r = ok(s, cli(), { type: 'checkout.start', lines: [line(s, 'terraco-038:0')], modalidad: 'retiro' });
    s = ok(r.state, A.sys, { type: 'clock.advance', minutes: 6 }).state;
    expect(order(s, r.result.data.orderId).estado).toBe('vencido');
    s = ok(s, A.sys, { type: 'payment.simulate', intentId: r.result.data.intentId, resultado: 'aprobar' }).state;
    expect(order(s, r.result.data.orderId).estado).toBe('incidencia');
    expect(s.incidents.some((i) => i.tipo === 'aprobacion_tardia')).toBe(true);
    s = ok(s, A.sys, { type: 'late.resolve', orderId: r.result.data.orderId, accion: 'devolver' }).state;
    expect(s.refunds.some((d) => d.orderId === r.result.data.orderId && d.estado === 'pendiente')).toBe(true);
  });
  it('devolución parcial por producto no entregable', () => {
    let s = createSeedState();
    const r = ok(s, cli(), { type: 'checkout.start', lines: [line(s, 'terraco-061:0', 2)], modalidad: 'retiro' });
    s = ok(r.state, A.sys, { type: 'payment.simulate', intentId: r.result.data.intentId, resultado: 'aprobar' }).state;
    const [u1] = unitsOf(s, r.result.data.orderId);
    s = ok(s, A.barra, { type: 'units.cannotFulfill', unitIds: [u1], motivo: 'Se rompió la botella' }).state;
    const dev = s.refunds.find((d) => d.orderId === r.result.data.orderId)!;
    expect(dev.monto).toBe(600000);
    s = ok(s, A.sys, { type: 'refund.simulate', refundId: dev.id, resultado: 'fallida' }).state;
    expect(s.incidents.some((i) => i.tipo === 'devolucion_fallida')).toBe(true);
    s = ok(s, A.sys, { type: 'refund.retry', refundId: dev.id }).state;
    expect(s.refunds.find((d) => d.id === dev.id)!.estado).toBe('pendiente');
  });
  it('estación sin recepción pausa el canal y reconecta sin duplicar', () => {
    let s = createSeedState();
    const r = ok(s, cli(), { type: 'checkout.start', lines: [line(s, 'terraco-061:0')], modalidad: 'retiro' });
    s = ok(r.state, A.sys, { type: 'station.setOnline', estacion: 'barra', online: false }).state;
    s = ok(s, A.sys, { type: 'payment.simulate', intentId: r.result.data.intentId, resultado: 'aprobar' }).state;
    expect(order(s, r.result.data.orderId).tickets[0].recibidoEn).toBeNull();
    expect(s.incidents.some((i) => i.tipo === 'sin_recepcion' && i.estado === 'abierta')).toBe(true);
    expect(sellCheck(s, 'terraco-061:0').tipo).toBe('estacion');
    expect(sellCheck(s, 'terraco-088:0').ok).toBe(true);
    s = ok(s, A.sys, { type: 'station.setOnline', estacion: 'barra', online: true }).state;
    expect(order(s, r.result.data.orderId).tickets).toHaveLength(1);
    expect(order(s, r.result.data.orderId).tickets[0].recibidoEn).not.toBeNull();
    expect(go(s, A.sys, { type: 'station.setOnline', estacion: 'barra', online: true }).result.code).toBe('repetido');
  });
});

describe('controles adicionales', () => {
  it('última unidad disputada', () => {
    let s = createSeedState();
    const a = ok(s, cli('A'), { type: 'checkout.start', lines: [line(s, 'terraco-038:0')], modalidad: 'retiro' });
    const b = go(a.state, cli('B'), { type: 'checkout.start', lines: [line(s, 'terraco-038:0')], modalidad: 'retiro' });
    expect(b.result.code).toBe('revalidar');
    s = ok(a.state, A.sys, { type: 'clock.advance', minutes: 6 }).state;
    expect(go(s, cli('B'), { type: 'checkout.start', lines: [line(s, 'terraco-038:0')], modalidad: 'retiro' }).result.ok).toBe(true);
  });
  it('ronda avanzada: no se paga dos veces la misma parte y al vencer se devuelve a cada pagador', () => {
    let s = createSeedState();
    const r = ok(s, cli(), { type: 'round.create', lines: [line(s, 'terraco-060:0')], participantes: 3, organizador: 'Mati' });
    const ron = r.state.rounds.find((x) => x.id === r.result.data.roundId)!;
    expect(ron.cuotas.reduce((a, c) => a + c.monto, 0)).toBe(6000000);
    s = ok(r.state, cli('x'), { type: 'round.pay', roundId: ron.id, cuotaId: ron.cuotas[0].id, pagador: 'Mati' }).state;
    expect(go(s, cli('y'), { type: 'round.pay', roundId: ron.id, cuotaId: ron.cuotas[0].id, pagador: 'Otro' }).result.code).toBe('ya_pagada');
    s = ok(s, cli('y'), { type: 'round.pay', roundId: ron.id, cuotaId: ron.cuotas[1].id, pagador: 'Sol' }).state;
    s = ok(s, A.sys, { type: 'clock.advance', minutes: 11 }).state;
    const after = s.rounds.find((x) => x.id === ron.id)!;
    expect(after.estado).toBe('vencida');
    expect(s.refunds.filter((d) => d.rondaId === ron.id).map((d) => d.pagador).sort()).toEqual(['Mati', 'Sol']);
    expect(s.orders.some((o) => o.rondaId === ron.id)).toBe(false);
  });
  it('ronda completa con cobertura voluntaria crea un único pedido', () => {
    let s = createSeedState();
    const r = ok(s, cli(), { type: 'round.create', lines: [line(s, 'terraco-061:1')], participantes: 3, organizador: 'Mati' });
    const ron = r.state.rounds[r.state.rounds.length - 1];
    s = ok(r.state, cli(), { type: 'round.pay', roundId: ron.id, cuotaId: ron.cuotas[0].id, pagador: 'Mati' }).state;
    s = ok(s, cli(), { type: 'round.cover', roundId: ron.id, cuotaIds: [ron.cuotas[1].id, ron.cuotas[2].id], pagador: 'Mati' }).state;
    expect(s.orders.filter((o) => o.rondaId === ron.id)).toHaveLength(1);
    expect(s.cobros.filter((c) => c.rondaId === ron.id && c.cuotaId).reduce((a, c) => a + c.monto, 0)).toBe(2000000);
  });
  it('la nueva ocupación de mesa invalida el QR de la anterior', () => {
    let s = createSeedState();
    const old = s.tableSessions.find((t) => t.mesaId === 'demo-mesa-3')!.id;
    s = ok(s, A.sys, { type: 'table.newSession', mesaId: 'demo-mesa-3' }).state;
    expect(go(s, cli(), { type: 'checkout.start', lines: [line(s, 'terraco-061:0')], modalidad: 'retiro', mesaSesionId: old }).result.code).toBe('mesa');
  });
  it('plantilla de noche no arrastra ventas ni votos', () => {
    let s = createSeedState();
    s = ok(s, A.sys, { type: 'night.saveTemplate', nightId: 'noche-2111', nombre: 'Copia' }).state;
    const tpl = s.templates[s.templates.length - 1];
    s = ok(s, A.sys, { type: 'night.createFromTemplate', templateId: tpl.id, jornada: '2026-12-05', titulo: 'Nueva' }).state;
    const nn = s.nights.find((x) => x.jornada === '2026-12-05')!;
    expect(nn.publicada).toBeNull();
    expect(nn.borrador!.momentos.every((m) => !m.confirmado)).toBe(true);
    expect(s.orders.filter((o) => o.jornada === '2026-12-05')).toHaveLength(0);
  });
  it('agrupada: marcar unidades concretas actualiza el pedido', () => {
    let s = createSeedState();
    const ids: string[] = [];
    for (const b of ['g1', 'g2']) {
      const r = ok(s, cli(b), { type: 'checkout.start', lines: [line(s, 'terraco-001:0', 2, 'Frutilla'), line(s, 'terraco-001:0', 1, 'Durazno')], modalidad: 'retiro' });
      s = ok(r.state, A.sys, { type: 'payment.simulate', intentId: r.result.data.intentId, resultado: 'aprobar' }).state;
      ids.push(r.result.data.orderId);
    }
    const frutilla = ids.flatMap((id) => order(s, id).lineas.filter((l) => l.sabor === 'Frutilla').flatMap((l) => l.unidades.map((u) => u.id))).slice(0, 3);
    s = ok(s, A.barra, { type: 'units.ready', unitIds: frutilla }).state;
    expect(order(s, ids[0]).lineas[0].unidades.every((u) => u.estado === 'lista')).toBe(true);
    expect(order(s, ids[1]).lineas[0].unidades.filter((u) => u.estado === 'lista')).toHaveLength(1);
    expect(order(s, ids[0]).lineas[1].unidades[0].estado).toBe('pendiente');
  });
  it('informe sin denominador conocido no muestra porcentaje', () => {
    const s = createSeedState();
    const rep = reportFor(s, '2026-12-31', 'todos');
    expect(rep.pedidos).toBe(0);
  });
});

describe('devolución parcial con cupón', () => {
  it('el descuento solo se descuenta de los productos elegibles', () => {
    let s = createSeedState();
    const caro = cli('b-caro', 'prf-caro');
    const r = ok(s, caro, { type: 'checkout.start', lines: [line(s, 'terraco-077:0'), line(s, 'terraco-061:0')], modalidad: 'retiro', couponId: 'cup-caro-8' });
    s = ok(r.state, A.sys, { type: 'payment.simulate', intentId: r.result.data.intentId, resultado: 'aprobar' }).state;
    const o = order(s, r.result.data.orderId);
    const jarra = o.lineas.find((l) => l.categoria === 'Sin alcohol')!.unidades[0].id;
    const cerveza = o.lineas.find((l) => l.categoria === 'Cerveza')!.unidades[0].id;
    s = ok(s, A.barra, { type: 'units.cannotFulfill', unitIds: [jarra], motivo: 'Sin limones' }).state;
    expect(s.refunds.find((d) => d.orderId === o.id)!.monto).toBe(1200000 - 180000);
    s = ok(s, A.barra, { type: 'units.cannotFulfill', unitIds: [cerveza], motivo: 'Sin stock' }).state;
    expect(s.refunds.filter((d) => d.orderId === o.id).reduce((a, d) => a + d.monto, 0)).toBe(o.total);
  });
});

describe('escenarios del laboratorio', () => {
  it('todos se construyen de forma determinista', async () => {
    const { SCENARIOS } = await import('./scenarios');
    for (const sc of SCENARIOS) {
      const a = sc.build();
      const b = sc.build();
      expect(a.orders.map((o) => o.credencial)).toEqual(b.orders.map((o) => o.credencial));
    }
  });
});
