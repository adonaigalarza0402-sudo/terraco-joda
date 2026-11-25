// Autoridad de simulación: todas las transiciones de la demo pasan por aquí.
// Es determinista: el mismo estado y el mismo comando producen el mismo resultado.
// Las garantías valen dentro de esta autoridad única; no reemplazan un servidor transaccional.
import { COMPONENTS, FOOD_CATEGORIES, presentationByKey, type Station } from './catalog';
import { allocateProportional, ars, splitCents } from './money';
import { ROLE_LABEL } from './roles';
import { hhmm, jornadaOf, jornadaTime, MIN } from './time';
import type {
  Actor,
  Coupon,
  DemoConfig,
  GroupRound,
  Incident,
  IncidentType,
  Metodo,
  Modalidad,
  NightConfig,
  Order,
  OrderLine,
  Poll,
  Refund,
  Reservation,
  ReservationState,
  Result,
  Role,
  State,
  Unit,
} from './types';

export interface CartLine {
  presKey: string;
  sabor: string | null;
  mods: string[]; // 'frutos_rojos'
  nota: string | null;
  cantidad: number;
  precioVisto: number; // precio unitario que vio la persona
}

export type Command =
  | { type: 'clock.advance'; minutes: number }
  | { type: 'clock.set'; at: number }
  | { type: 'checkout.start'; lines: CartLine[]; modalidad: Modalidad; mesaSesionId?: string | null; couponId?: string | null; alias?: string; repiteDe?: string | null }
  | { type: 'payment.simulate'; intentId: string; resultado: 'aprobar' | 'rechazar' | 'pendiente' }
  | { type: 'caja.createOrder'; lines: CartLine[]; metodo: Metodo; alias: string; modalidad: Modalidad; mesaId?: string | null }
  | { type: 'caja.registerCash'; orderId: string }
  | { type: 'payment.verifyManual'; orderId: string; motivo: string }
  | { type: 'station.take'; orderId: string; estacion: Station }
  | { type: 'units.ready'; unitIds: string[] }
  | { type: 'units.revert'; unitIds: string[]; motivo: string }
  | { type: 'units.cannotFulfill'; unitIds: string[]; motivo: string }
  | { type: 'delivery.deliver'; orderId: string; credencial: string | null; unitIds: string[]; mesa?: boolean }
  | { type: 'delivery.dispute'; orderId: string; motivo: string }
  | { type: 'order.cancel'; orderId: string; motivo: string }
  | { type: 'refund.simulate'; refundId: string; resultado: 'completada' | 'fallida' }
  | { type: 'refund.retry'; refundId: string }
  | { type: 'incident.resolve'; incidentId: string; resolucion: string }
  | { type: 'late.resolve'; orderId: string; accion: 'cumplir' | 'devolver' }
  | { type: 'station.setOnline'; estacion: Station; online: boolean }
  | { type: 'station.manualReceipt'; orderId: string; estacion: Station }
  | { type: 'config.set'; patch: Partial<DemoConfig> }
  | { type: 'avail.set'; presKey: string; estado: 'disponible' | 'pausado' | 'agotado' }
  | { type: 'category.pause'; categoria: string; pausada: boolean }
  | { type: 'price.set'; presKey: string; precio: number | null }
  | { type: 'insumo.set'; insumo: string; stock: number }
  | { type: 'night.saveDraft'; nightId: string; config: NightConfig; titulo?: string }
  | { type: 'night.publish'; nightId: string }
  | { type: 'night.discardDraft'; nightId: string }
  | { type: 'night.saveTemplate'; nightId: string; nombre: string }
  | { type: 'night.createFromTemplate'; templateId: string; jornada: string; titulo: string }
  | { type: 'reservation.create'; jornada: string; horario: string; personas: number; nombre: string; contacto: string; notas: string; origen: Reservation['origen']; linkCodigo?: string | null }
  | { type: 'reservation.mark'; id: string; accion: 'borrador_visto' | 'enlace_abierto' }
  | { type: 'reservation.setState'; id: string; estado: ReservationState; nota?: string; propuesta?: string; mesa?: string | null }
  | { type: 'poll.create'; sesionId: string; pregunta: string; opciones: string[]; duracionMin: number; minVotos: number }
  | { type: 'poll.open'; pollId: string }
  | { type: 'poll.pause'; pollId: string }
  | { type: 'poll.resume'; pollId: string }
  | { type: 'poll.close'; pollId: string }
  | { type: 'poll.cancel'; pollId: string; motivo: string }
  | { type: 'poll.decide'; pollId: string; opcionId: string | null; nota: string }
  | { type: 'poll.vote'; pollId: string; identity: string; opcionId: string }
  | { type: 'night.access'; identity: string; codigo: string }
  | { type: 'prefpoll.vote'; pollId: string; identity: string; opcionId: string }
  | { type: 'dj.updateProfile'; djId: string; patch: { descripcion?: string; generos?: string[]; enlaces?: State['djs'][number]['enlaces']; repertorioConfirmado?: string[] } }
  | { type: 'dj.delegate'; sesionId: string; asistenteId: string | null; permisos: ('crear' | 'abrir' | 'cerrar')[] }
  | { type: 'visit.validate'; profileId: string }
  | { type: 'benefit.setRule'; rule: State['benefitRule'] }
  | { type: 'round.create'; lines: CartLine[]; participantes: number; organizador: string }
  | { type: 'round.pay'; roundId: string; cuotaId: string; pagador: string }
  | { type: 'round.cover'; roundId: string; cuotaIds: string[]; pagador: string }
  | { type: 'round.cancel'; roundId: string; motivo: string }
  | { type: 'round.revokeInvite'; roundId: string }
  | { type: 'table.newSession'; mesaId: string }
  | { type: 'link.create'; origen: State['links'][number]['origen']; etiqueta: string; jornada: string }
  | { type: 'link.visit'; codigo: string; visitorId: string }
  | { type: 'staff.setRoles'; staffId: string; roles: Role[] }
  | { type: 'scenario.mark'; nombre: string | null };

export interface Envelope {
  cid: string;
  actor: Actor;
  cmd: Command;
}

class Fail extends Error {
  constructor(public msg: string, public code = 'error', public data?: unknown) {
    super(msg);
  }
}
const fail = (msg: string, code?: string, data?: unknown): never => {
  throw new Fail(msg, code, data);
};

const CRED_ALPHABET = 'ACDEFHJKMNPQRTUVWXY34679';
export const normCred = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

export function stationOfCategory(cat: string): Station {
  return FOOD_CATEGORIES.includes(cat) ? 'cocina' : 'barra';
}

// ---------------------------------------------------------------------------
// Consultas puras reutilizadas por la interfaz
// ---------------------------------------------------------------------------

export function currentNight(s: State) {
  const j = jornadaOf(s.now);
  return s.nights.find((n) => n.jornada === j && n.publicada) ?? null;
}

export function unitPrice(s: State, presKey: string, mods: string[]): number | null {
  const pp = presentationByKey(presKey);
  if (!pp) return null;
  const base = s.config.preciosDemo[presKey] ?? pp.pres.precio;
  if (base === null) return null;
  let extra = 0;
  if (mods.includes('frutos_rojos') && s.config.ginFrutosRojos.habilitado) extra += s.config.ginFrutosRojos.recargo;
  return base + extra;
}

export function stockAvailable(s: State, insumo: string, excludeRef?: string): number {
  const base = s.insumos[insumo]?.stock ?? Infinity;
  const held = s.holds.filter((h) => h.insumo === insumo && h.estado === 'activa' && h.ref !== excludeRef).reduce((a, h) => a + h.qty, 0);
  return base - held;
}

export interface SellCheck {
  ok: boolean;
  motivo: string | null;
  tipo: 'ok' | 'consultable' | 'agotado' | 'pausado' | 'categoria' | 'horario' | 'estacion' | 'stock';
}

/** ¿Se puede vender ahora esta presentación por este canal? (sin contar cantidades). */
export function sellCheck(s: State, presKey: string, canal: 'web' | 'caja' = 'web'): SellCheck {
  const pp = presentationByKey(presKey);
  if (!pp) return { ok: false, motivo: 'Producto inexistente', tipo: 'consultable' };
  const { product, pres } = pp;
  if (pres.tipo === 'consultable') return { ok: false, motivo: 'Consultar al personal: la carta no publica este precio o formato', tipo: 'consultable' };
  if (pres.tipo === 'supuesto' && pres.supuesto && !s.config.supuestos[pres.supuesto])
    return { ok: false, motivo: 'Formato a confirmar con el local (no habilitado en la demo)', tipo: 'consultable' };
  const disp = s.config.disponibilidad[presKey] ?? 'disponible';
  if (disp === 'agotado') return { ok: false, motivo: 'Agotado por esta noche', tipo: 'agotado' };
  if (disp === 'pausado') return { ok: false, motivo: 'Pausado momentáneamente', tipo: 'pausado' };
  const night = currentNight(s);
  if (night?.publicada && night.publicada.categoriasActivas[product.categoria] === false)
    return { ok: false, motivo: `${product.categoria}: no disponible en esta fecha`, tipo: 'categoria' };
  if (s.config.categoriasPausadas[product.categoria]) return { ok: false, motivo: `${product.categoria}: pausado por el encargado`, tipo: 'categoria' };
  const st = product.estacion;
  if (night?.publicada) {
    const hasta = st === 'cocina' ? night.publicada.cocinaNuevasHasta : night.publicada.barraNuevasHasta;
    if (s.now >= jornadaTime(night.jornada, hasta))
      return { ok: false, motivo: st === 'cocina' ? `Cocina no toma pedidos nuevos desde las ${hasta}` : `Barra cerrada para pedidos nuevos desde las ${hasta}`, tipo: 'horario' };
  }
  if (!s.stations[st].online && !(canal === 'caja' && s.config.contingencia))
    return { ok: false, motivo: `${st === 'cocina' ? 'Cocina' : 'Barra'} sin conexión: pedidos nuevos pausados`, tipo: 'estacion' };
  const comps = COMPONENTS[presKey];
  if (comps && comps.some((c) => stockAvailable(s, c.insumo) < c.qty)) return { ok: false, motivo: 'Sin stock disponible', tipo: 'stock' };
  return { ok: true, motivo: null, tipo: 'ok' };
}

export function couponApplies(coupon: Pick<Coupon, 'categoriasAplicables'>, categoria: string): boolean {
  return coupon.categoriasAplicables === 'comida_y_sin_alcohol' ? FOOD_CATEGORIES.includes(categoria) || categoria === 'Sin alcohol' : true;
}

export function couponDiscount(s: State, coupon: Coupon, lines: { categoria: string; precioUnitario: number; cantidad: number }[]): number {
  const elegibles = lines.filter((l) => couponApplies(coupon, l.categoria));
  const base = elegibles.reduce((a, l) => a + l.precioUnitario * l.cantidad, 0);
  void s;
  return Math.min(coupon.tope, Math.floor((base * coupon.porcentaje) / 100));
}

/** Importe neto por unidad: el descuento se reparte de forma determinista solo entre las unidades a las que aplica el cupón. */
export function unitNetMap(o: Order, coupon?: Pick<Coupon, 'categoriasAplicables'> | null): Map<string, number> {
  const units: { id: string; price: number; eligible: boolean }[] = [];
  for (const l of o.lineas) for (const u of l.unidades) units.push({ id: u.id, price: l.precioUnitario, eligible: !coupon || couponApplies(coupon, l.categoria) });
  const elig = units.filter((u) => u.eligible);
  const alloc = allocateProportional(elig.map((u) => u.price), o.descuento);
  const disc = new Map(elig.map((u, i) => [u.id, alloc[i]]));
  return new Map(units.map((u) => [u.id, u.price - (disc.get(u.id) ?? 0)]));
}

export function allUnits(o: Order): (Unit & { line: OrderLine })[] {
  return o.lineas.flatMap((l) => l.unidades.map((u) => ({ ...u, line: l })));
}

// ---------------------------------------------------------------------------
// Aplicación de comandos
// ---------------------------------------------------------------------------

export function apply(prev: State, env: Envelope): { state: State; result: Result } {
  const done = prev.processed[env.cid];
  if (done) return { state: prev, result: { ...done, message: done.message, code: done.code ?? 'repetido', data: { ...(done.data ?? {}), repetido: true } } };
  const s: State = structuredClone(prev);
  const ctx = new Ctx(s, env.actor);
  try {
    const res = ctx.run(env.cmd);
    s.rev += 1;
    s.processed[env.cid] = res;
    s.processedOrder.push(env.cid);
    while (s.processedOrder.length > 600) delete s.processed[s.processedOrder.shift()!];
    if (s.audit.length > 500) s.audit.splice(0, s.audit.length - 500);
    return { state: s, result: res };
  } catch (e) {
    if (e instanceof Fail) return { state: prev, result: { ok: false, message: e.msg, code: e.code, data: e.data } };
    throw e;
  }
}

class Ctx {
  constructor(public s: State, public actor: Actor) {}

  get now() {
    return this.s.now;
  }
  get by(): string {
    const st = this.s.staff.find((x) => x.id === this.actor.staffId);
    if (st) return `${st.nombre} (${ROLE_LABEL[this.actor.role]})`;
    const pr = this.s.profiles.find((p) => p.id === this.actor.profileId);
    if (pr) return pr.alias;
    return ROLE_LABEL[this.actor.role] ?? 'Sistema';
  }
  id(prefix: string) {
    this.s.seq += 1;
    return `${prefix}-${this.s.seq}`;
  }
  rand() {
    // mulberry32 determinista
    let t = (this.s.rng = (this.s.rng + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  code(n: number, alphabet = CRED_ALPHABET) {
    let out = '';
    for (let i = 0; i < n; i++) out += alphabet[Math.floor(this.rand() * alphabet.length)];
    return out;
  }
  audit(msg: string, tipo = 'evento') {
    this.s.audit.push({ at: this.now, by: this.by, role: this.actor.role, msg, tipo });
  }
  require(roles: Role[], what: string) {
    if (!roles.includes(this.actor.role)) fail(`Acceso de demostración: el rol ${ROLE_LABEL[this.actor.role]} no puede ${what}.`, 'permiso');
  }
  order(id: string) {
    return this.s.orders.find((o) => o.id === id) ?? fail('Pedido inexistente', 'no_existe');
  }
  olog(o: Order, msg: string) {
    o.log.push({ at: this.now, by: this.by, msg });
  }
  incident(tipo: IncidentType, titulo: string, detalle: string, orderId: string | null, estacion: Station | null): Incident {
    const inc: Incident = { id: this.id('inc'), tipo, titulo, detalle, orderId, estacion, estado: 'abierta', creadaEn: this.now, jornada: jornadaOf(this.now), resolucion: null, resueltaPor: null };
    this.s.incidents.push(inc);
    this.audit(`Incidencia: ${titulo}`, 'incidencia');
    return inc;
  }
  refund(p: Omit<Refund, 'id' | 'estado' | 'creadoEn' | 'jornada' | 'historial'>): Refund {
    const r: Refund = { ...p, id: this.id('dev'), estado: 'pendiente', creadoEn: this.now, jornada: jornadaOf(this.now), historial: [{ at: this.now, by: this.by, msg: `Devolución simulada creada por ${ars(p.monto)}` }] };
    this.s.refunds.push(r);
    this.audit(`Devolución pendiente ${ars(p.monto)} — ${p.motivo}`, 'dinero');
    return r;
  }

  run(cmd: Command): Result {
    switch (cmd.type) {
      case 'clock.advance': {
        if (cmd.minutes <= 0 || cmd.minutes > 24 * 60) fail('Avance de reloj inválido');
        this.s.now += cmd.minutes * MIN;
        this.audit(`Reloj de demo avanzado ${cmd.minutes} min → ${hhmm(this.now)}`, 'reloj');
        this.processTime();
        return { ok: true, message: `Reloj de demo: ${hhmm(this.now)}` };
      }
      case 'clock.set': {
        if (cmd.at < this.now) fail('El reloj de demo no retrocede: reiniciá la demo para volver atrás.');
        this.s.now = cmd.at;
        this.audit(`Reloj de demo fijado en ${hhmm(this.now)}`, 'reloj');
        this.processTime();
        return { ok: true, message: `Reloj de demo: ${hhmm(this.now)}` };
      }
      case 'checkout.start':
        return this.checkout(cmd);
      case 'payment.simulate':
        return this.simulatePayment(cmd.intentId, cmd.resultado);
      case 'caja.createOrder':
        return this.cajaOrder(cmd);
      case 'caja.registerCash': {
        this.require(['caja', 'encargado'], 'registrar efectivo');
        const o = this.order(cmd.orderId);
        if (o.metodo !== 'efectivo') fail('Este pedido no es en efectivo');
        if (o.pago === 'efectivo_registrado') return { ok: true, message: 'El efectivo ya estaba registrado (sin duplicar)', code: 'repetido' };
        if (o.estado !== 'esperando_pago') fail(`No se puede registrar: pedido ${o.estado}`);
        o.pago = 'efectivo_registrado';
        this.cobro(o, 'efectivo', o.total, null, false);
        this.activate(o, 'Efectivo registrado en caja');
        return { ok: true, message: `Efectivo registrado: ${ars(o.total)}` };
      }
      case 'payment.verifyManual': {
        this.require(['encargado'], 'verificar transferencias manuales');
        const o = this.order(cmd.orderId);
        if (o.metodo !== 'transferencia_manual') fail('Solo aplica a transferencias manuales');
        if (o.pago === 'verificado_manual') return { ok: true, message: 'Ya estaba verificado', code: 'repetido' };
        if (o.estado !== 'esperando_pago') fail(`No se puede verificar: pedido ${o.estado}`);
        if (cmd.motivo.trim().length < 5) fail('Indicá cómo se verificó (mínimo 5 caracteres). Una captura no acredita el pago.', 'validacion');
        o.pago = 'verificado_manual';
        this.cobro(o, 'transferencia_manual', o.total, cmd.motivo.trim(), false);
        this.activate(o, `Transferencia verificada manualmente: ${cmd.motivo.trim()}`);
        return { ok: true, message: 'Transferencia verificada y pedido enviado a estaciones' };
      }
      case 'station.take': {
        this.require(['cocina', 'barra', 'encargado'], 'tomar tareas');
        if (this.actor.role !== 'encargado' && this.actor.role !== cmd.estacion) fail('Esta tarea pertenece a otra estación');
        const o = this.order(cmd.orderId);
        const t = o.tickets.find((x) => x.estacion === cmd.estacion) ?? fail('El pedido no tiene tareas para esta estación');
        if (o.estado !== 'activo') fail('El pedido no está activo');
        if (!t.recibidoEn && !t.recepcionManual) fail('La estación todavía no registró la recepción de este pedido');
        const me = this.actor.staffId ?? this.by;
        if (t.tomadoPor && t.tomadoPor !== me) {
          const who = this.s.staff.find((x) => x.id === t.tomadoPor)?.nombre ?? t.tomadoPor;
          fail(`Ya la tomó ${who} a las ${hhmm(t.tomadoEn!)}. No se duplica la tarea.`, 'ya_tomada');
        }
        if (t.tomadoPor === me) return { ok: true, message: 'Ya tenías esta tarea', code: 'repetido' };
        t.tomadoPor = me;
        t.tomadoEn = this.now;
        for (const l of o.lineas) if (l.estacion === cmd.estacion) for (const u of l.unidades) if (u.estado === 'pendiente') { u.estado = 'en_preparacion'; u.inicioEn = this.now; }
        this.olog(o, `${cmd.estacion === 'cocina' ? 'Cocina' : 'Barra'}: tarea tomada`);
        return { ok: true, message: `Pedido ${o.codigo} en preparación` };
      }
      case 'units.ready': {
        this.require(['cocina', 'barra', 'encargado'], 'marcar unidades listas');
        let n = 0;
        const touched = new Set<Order>();
        for (const uid of cmd.unitIds) {
          const f = this.findUnit(uid);
          if (this.actor.role !== 'encargado' && f.line.estacion !== this.actor.role) fail('Unidad de otra estación');
          if (f.order.estado !== 'activo') continue;
          if (f.unit.estado === 'pendiente' || f.unit.estado === 'en_preparacion') {
            const t = f.order.tickets.find((x) => x.estacion === f.line.estacion)!;
            if (!t.recibidoEn && !t.recepcionManual) fail(`El pedido ${f.order.codigo} no tiene recepción registrada`);
            if (!t.tomadoPor) { t.tomadoPor = this.actor.staffId ?? this.by; t.tomadoEn = this.now; }
            f.unit.inicioEn ??= this.now;
            f.unit.estado = 'lista';
            f.unit.listaEn = this.now;
            n++;
            touched.add(f.order);
          }
        }
        if (!n) return { ok: true, message: 'Esas unidades ya estaban listas o entregadas (sin cambios)', code: 'repetido' };
        for (const o of touched) this.olog(o, `${n} unidad(es) lista(s)`);
        return { ok: true, message: `${n} unidad(es) marcada(s) como lista(s)` };
      }
      case 'units.revert': {
        this.require(['cocina', 'barra', 'encargado'], 'corregir estados');
        if (cmd.motivo.trim().length < 3) fail('Indicá el motivo de la corrección', 'validacion');
        let n = 0;
        for (const uid of cmd.unitIds) {
          const f = this.findUnit(uid);
          if (f.unit.estado === 'lista') {
            f.unit.estado = 'en_preparacion';
            delete f.unit.listaEn;
            n++;
            this.olog(f.order, `Corrección: ${f.line.nombre} vuelve a preparación — ${cmd.motivo}`);
          }
        }
        if (!n) fail('Solo se puede corregir una unidad lista y no entregada');
        return { ok: true, message: `Corrección registrada (${n})` };
      }
      case 'units.cannotFulfill': {
        this.require(['cocina', 'barra', 'encargado'], 'informar productos no entregables');
        if (cmd.motivo.trim().length < 3) fail('Indicá el motivo', 'validacion');
        const byOrder = new Map<Order, string[]>();
        for (const uid of cmd.unitIds) {
          const f = this.findUnit(uid);
          if (f.unit.estado === 'entregada' || f.unit.estado === 'cancelada') continue;
          f.unit.estado = 'cancelada';
          byOrder.set(f.order, [...(byOrder.get(f.order) ?? []), uid]);
        }
        if (!byOrder.size) fail('No hay unidades pendientes para cancelar');
        for (const [o, ids] of byOrder) {
          const r = this.refundUnits(o, ids, `No entregable: ${cmd.motivo}`);
          this.incident('no_entregable', `Producto no entregable en ${o.codigo}`, `${cmd.motivo}. Devolución parcial ${r ? ars(r.monto) : 'no corresponde (sin cobro)'}.`, o.id, null);
          this.olog(o, `No entregable (${ids.length} u.): ${cmd.motivo}`);
          this.checkComplete(o);
          if (o.estado === 'cancelado') this.restoreCoupon(o, 'Ningún producto se pudo entregar: cupón restaurado');
        }
        return { ok: true, message: 'Unidades canceladas y devolución parcial creada' };
      }
      case 'delivery.deliver':
        return this.deliver(cmd);
      case 'delivery.dispute': {
        this.require(['entrega', 'barra', 'encargado', 'caja'], 'registrar entregas discutidas');
        const o = this.order(cmd.orderId);
        this.incident('entrega_discutida', `Entrega discutida ${o.codigo}`, cmd.motivo, o.id, null);
        this.olog(o, `Entrega discutida: ${cmd.motivo}`);
        return { ok: true, message: 'Incidencia registrada para el encargado' };
      }
      case 'order.cancel':
        return this.cancelOrder(cmd.orderId, cmd.motivo);
      case 'refund.simulate': {
        const r = this.s.refunds.find((x) => x.id === cmd.refundId) ?? fail('Devolución inexistente');
        if (r.estado !== 'pendiente') return { ok: true, message: `La devolución ya estaba ${r.estado}`, code: 'repetido' };
        r.estado = cmd.resultado;
        r.historial.push({ at: this.now, by: this.by, msg: cmd.resultado === 'completada' ? 'Proveedor simulado: devolución completada' : 'Proveedor simulado: devolución fallida' });
        if (r.rondaId && r.cuotaId) {
          const rd = this.s.rounds.find((x) => x.id === r.rondaId);
          const c = rd?.cuotas.find((x) => x.id === r.cuotaId);
          if (c && cmd.resultado === 'completada') c.estado = 'devuelta';
        }
        if (cmd.resultado === 'fallida') this.incident('devolucion_fallida', `Devolución fallida ${ars(r.monto)}`, `${r.motivo}. Reintentar o resolver con el pagador (${r.pagador}).`, r.orderId, null);
        this.audit(`Devolución ${r.id} → ${cmd.resultado}`, 'dinero');
        return { ok: true, message: `Devolución ${cmd.resultado}` };
      }
      case 'refund.retry': {
        this.require(['caja', 'encargado'], 'reintentar devoluciones');
        const r = this.s.refunds.find((x) => x.id === cmd.refundId) ?? fail('Devolución inexistente');
        if (r.estado !== 'fallida') fail('Solo se reintenta una devolución fallida');
        r.estado = 'pendiente';
        r.historial.push({ at: this.now, by: this.by, msg: 'Reintento de devolución' });
        return { ok: true, message: 'Devolución reintentada: queda pendiente' };
      }
      case 'incident.resolve': {
        this.require(['caja', 'encargado'], 'resolver incidencias');
        const inc = this.s.incidents.find((x) => x.id === cmd.incidentId) ?? fail('Incidencia inexistente');
        if (inc.estado === 'resuelta') return { ok: true, message: 'Ya estaba resuelta', code: 'repetido' };
        if (cmd.resolucion.trim().length < 3) fail('Describí la resolución', 'validacion');
        inc.estado = 'resuelta';
        inc.resolucion = cmd.resolucion.trim();
        inc.resueltaPor = this.by;
        this.audit(`Incidencia resuelta: ${inc.titulo}`, 'incidencia');
        return { ok: true, message: 'Incidencia resuelta' };
      }
      case 'late.resolve':
        return this.resolveLate(cmd.orderId, cmd.accion);
      case 'station.setOnline':
        return this.setStation(cmd.estacion, cmd.online);
      case 'station.manualReceipt': {
        this.require(['caja', 'encargado', 'cocina', 'barra'], 'registrar recepción manual');
        const o = this.order(cmd.orderId);
        const t = o.tickets.find((x) => x.estacion === cmd.estacion) ?? fail('Sin tarea para esa estación');
        if (t.recibidoEn || t.recepcionManual) return { ok: true, message: 'La recepción ya estaba registrada', code: 'repetido' };
        t.recepcionManual = { por: this.by, en: this.now };
        this.olog(o, `Recepción manual (contingencia) en ${cmd.estacion}`);
        return { ok: true, message: 'Recepción manual registrada; conciliar al recuperar conexión' };
      }
      case 'config.set': {
        this.require(['encargado'], 'cambiar la configuración');
        Object.assign(this.s.config, cmd.patch);
        this.audit(`Configuración de demo actualizada (${Object.keys(cmd.patch).join(', ')})`, 'config');
        return { ok: true, message: 'Configuración guardada' };
      }
      case 'avail.set': {
        this.require(['encargado', 'cocina', 'barra'], 'cambiar disponibilidad');
        const pp = presentationByKey(cmd.presKey) ?? fail('Presentación inexistente');
        if (this.actor.role !== 'encargado' && pp.product.estacion !== this.actor.role) fail('Solo podés cambiar productos de tu estación');
        if (cmd.estado === 'disponible') delete this.s.config.disponibilidad[cmd.presKey];
        else this.s.config.disponibilidad[cmd.presKey] = cmd.estado;
        this.audit(`${pp.product.nombre} (${pp.pres.etiqueta}) → ${cmd.estado}`, 'carta');
        return { ok: true, message: `${pp.product.nombre}: ${cmd.estado}. Los pedidos ya aceptados siguen su curso.` };
      }
      case 'category.pause': {
        this.require(['encargado'], 'pausar categorías');
        if (cmd.pausada) this.s.config.categoriasPausadas[cmd.categoria] = true;
        else delete this.s.config.categoriasPausadas[cmd.categoria];
        this.audit(`Categoría ${cmd.categoria} ${cmd.pausada ? 'pausada' : 'reanudada'} para pedidos nuevos`, 'carta');
        return { ok: true, message: `${cmd.categoria} ${cmd.pausada ? 'pausada para pedidos nuevos' : 'reanudada'}` };
      }
      case 'price.set': {
        this.require(['encargado'], 'cambiar precios');
        const pp = presentationByKey(cmd.presKey) ?? fail('Presentación inexistente');
        if (cmd.precio === null) delete this.s.config.preciosDemo[cmd.presKey];
        else {
          if (!Number.isInteger(cmd.precio) || cmd.precio <= 0) fail('Precio inválido', 'validacion');
          this.s.config.preciosDemo[cmd.presKey] = cmd.precio;
        }
        this.audit(`Precio de demo ${pp.product.nombre}: ${cmd.precio === null ? 'vuelve al de carta' : ars(cmd.precio)}`, 'carta');
        return { ok: true, message: 'Precio de demo actualizado (no modifica la carta fuente)' };
      }
      case 'insumo.set': {
        this.require(['encargado'], 'ajustar stock de demo');
        const ins = this.s.insumos[cmd.insumo] ?? fail('Insumo inexistente');
        if (!Number.isInteger(cmd.stock) || cmd.stock < 0) fail('Stock inválido', 'validacion');
        ins.stock = cmd.stock;
        this.audit(`Stock ficticio ${ins.nombre}: ${cmd.stock}`, 'carta');
        return { ok: true, message: 'Stock de demo actualizado' };
      }
      case 'night.saveDraft': {
        this.require(['encargado'], 'preparar la noche');
        const n = this.s.nights.find((x) => x.id === cmd.nightId) ?? fail('Fecha inexistente');
        n.borrador = structuredClone(cmd.config);
        if (cmd.titulo) n.titulo = cmd.titulo;
        n.historial.push({ at: this.now, by: this.by, msg: 'Borrador guardado' });
        return { ok: true, message: 'Borrador guardado: todavía no se publicó' };
      }
      case 'night.publish': {
        this.require(['encargado'], 'publicar la noche');
        const n = this.s.nights.find((x) => x.id === cmd.nightId) ?? fail('Fecha inexistente');
        if (!n.borrador) fail('No hay borrador para publicar');
        n.publicada = n.borrador;
        n.borrador = null;
        n.publicadaEn = this.now;
        n.publicadaPor = this.by;
        n.historial.push({ at: this.now, by: this.by, msg: 'Configuración publicada' });
        this.audit(`Noche ${n.jornada} publicada`, 'noche');
        return { ok: true, message: 'Publicado: portada, carta y equipo leen esta configuración' };
      }
      case 'night.discardDraft': {
        this.require(['encargado'], 'descartar borradores');
        const n = this.s.nights.find((x) => x.id === cmd.nightId) ?? fail('Fecha inexistente');
        n.borrador = null;
        n.historial.push({ at: this.now, by: this.by, msg: 'Borrador descartado' });
        return { ok: true, message: 'Borrador descartado' };
      }
      case 'night.saveTemplate': {
        this.require(['encargado'], 'guardar plantillas');
        const n = this.s.nights.find((x) => x.id === cmd.nightId) ?? fail('Fecha inexistente');
        const cfg = n.borrador ?? n.publicada ?? fail('La fecha no tiene configuración');
        const tpl = structuredClone(cfg);
        // Una plantilla no arrastra artistas confirmados: quedan a confirmar.
        tpl.momentos = tpl.momentos.map((m) => ({ ...m, confirmado: false }));
        this.s.templates.push({ id: this.id('tpl'), nombre: cmd.nombre || `Plantilla ${n.jornada}`, config: tpl, creadaEn: this.now });
        return { ok: true, message: 'Plantilla guardada (solo configuración)' };
      }
      case 'night.createFromTemplate': {
        this.require(['encargado'], 'crear fechas');
        const tpl = this.s.templates.find((t) => t.id === cmd.templateId) ?? fail('Plantilla inexistente');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(cmd.jornada)) fail('Fecha inválida', 'validacion');
        if (this.s.nights.some((n) => n.jornada === cmd.jornada)) fail('Ya existe una ficha para esa fecha', 'duplicado');
        const cfg = structuredClone(tpl.config);
        cfg.momentos = cfg.momentos.map((m) => ({ ...m, confirmado: false }));
        cfg.djSesionId = null;
        this.s.nights.push({ id: this.id('noche'), jornada: cmd.jornada, titulo: cmd.titulo || tpl.nombre, publicada: null, borrador: cfg, publicadaEn: null, publicadaPor: null, plantillaOrigen: tpl.id, historial: [{ at: this.now, by: this.by, msg: `Creada desde plantilla «${tpl.nombre}». No copia ventas, reservas, votos ni asistencias.` }] });
        return { ok: true, message: 'Fecha creada como borrador desde la plantilla' };
      }
      case 'reservation.create':
        return this.createReservation(cmd);
      case 'reservation.mark': {
        const r = this.s.reservations.find((x) => x.id === cmd.id) ?? fail('Consulta inexistente');
        if (cmd.accion === 'borrador_visto') r.borradorVisto = true;
        else {
          r.enlaceWhatsAppAbierto = true;
          r.historial.push({ at: this.now, by: this.by, msg: 'Se abrió el enlace de WhatsApp (no prueba envío ni respuesta)' });
        }
        return { ok: true, message: 'Registrado' };
      }
      case 'reservation.setState':
        return this.setReservation(cmd);
      case 'poll.create':
        return this.createPoll(cmd);
      case 'poll.open':
      case 'poll.pause':
      case 'poll.resume':
      case 'poll.close':
      case 'poll.cancel':
      case 'poll.decide':
        return this.pollAction(cmd);
      case 'poll.vote':
        return this.vote(cmd);
      case 'night.access': {
        if (cmd.codigo.trim().toUpperCase() !== this.s.config.codigoNoche) fail('Código de la noche incorrecto. Lo encontrás en la pantalla del local o en tu mesa.', 'validacion');
        const j = jornadaOf(this.now);
        const list = (this.s.nightAccess[j] ??= []);
        if (!list.includes(cmd.identity)) list.push(cmd.identity);
        return { ok: true, message: 'Acceso de noche de prueba activado' };
      }
      case 'prefpoll.vote': {
        const p = this.s.preferencePolls.find((x) => x.id === cmd.pollId) ?? fail('Consulta inexistente');
        if (!p.abierta) fail('La consulta está cerrada');
        if (p.votos[cmd.identity]) fail('Ya participaste en esta consulta', 'ya_voto');
        if (!p.opciones.some((o) => o.id === cmd.opcionId)) fail('Opción inválida');
        p.votos[cmd.identity] = cmd.opcionId;
        return { ok: true, message: 'Gracias. Es una preferencia consultiva: TERRACO decide la programación.' };
      }
      case 'dj.updateProfile': {
        this.require(['dj'], 'editar el perfil del DJ');
        const dj = this.s.djs.find((d) => d.id === cmd.djId) ?? fail('DJ inexistente');
        Object.assign(dj, cmd.patch);
        return { ok: true, message: 'Perfil actualizado' };
      }
      case 'dj.delegate': {
        this.require(['dj'], 'delegar');
        const ses = this.s.sessions.find((x) => x.id === cmd.sesionId) ?? fail('Sesión inexistente');
        ses.asistenteId = cmd.asistenteId;
        ses.permisosAsistente = cmd.asistenteId ? cmd.permisos : [];
        this.audit(cmd.asistenteId ? `DJ delegó ${cmd.permisos.join(', ')} a asistente` : 'DJ retiró la delegación', 'dj');
        return { ok: true, message: cmd.asistenteId ? 'Delegación registrada' : 'Delegación retirada' };
      }
      case 'visit.validate':
        return this.validateVisit(cmd.profileId);
      case 'benefit.setRule': {
        this.require(['encargado'], 'editar la regla de beneficios');
        if (cmd.rule.umbralVisitas < 2 || cmd.rule.porcentaje <= 0 || cmd.rule.porcentaje > 50) fail('Regla inválida para la demo', 'validacion');
        this.s.benefitRule = cmd.rule;
        return { ok: true, message: 'Regla de ejemplo actualizada (no es una promoción vigente)' };
      }
      case 'round.create':
        return this.createRound(cmd);
      case 'round.pay':
        return this.payShare(cmd.roundId, [cmd.cuotaId], cmd.pagador, false);
      case 'round.cover':
        return this.payShare(cmd.roundId, cmd.cuotaIds, cmd.pagador, true);
      case 'round.cancel': {
        const r = this.round(cmd.roundId);
        if (r.estado !== 'abierta') fail('La ronda ya no está abierta');
        this.closeRound(r, 'cancelada', cmd.motivo || 'Cancelada por el organizador');
        return { ok: true, message: 'Ronda cancelada; aportes en devolución simulada' };
      }
      case 'round.revokeInvite': {
        const r = this.round(cmd.roundId);
        r.invitacionRevocada = true;
        r.historial.push({ at: this.now, by: this.by, msg: 'Invitación revocada' });
        return { ok: true, message: 'Invitación revocada' };
      }
      case 'table.newSession': {
        this.require(['encargado', 'caja', 'entrega'], 'abrir ocupaciones de mesa');
        const mesa = this.s.tables.find((t) => t.id === cmd.mesaId) ?? fail('Mesa inexistente');
        for (const ts of this.s.tableSessions) if (ts.mesaId === mesa.id && !ts.cerradaEn) ts.cerradaEn = this.now;
        const ts = { id: this.id('ocup'), mesaId: mesa.id, abiertaEn: this.now, cerradaEn: null };
        this.s.tableSessions.push(ts);
        this.audit(`${mesa.nombre}: nueva ocupación`, 'mesa');
        return { ok: true, message: `${mesa.nombre}: nueva ocupación. El QR ya no muestra la anterior.`, data: { sesionId: ts.id } };
      }
      case 'link.create': {
        this.require(['encargado'], 'crear enlaces por canal');
        const codigo = `${cmd.origen.slice(0, 2)}-${this.code(4, 'abcdefhkmnpqrtuvwxy34679')}`;
        this.s.links.push({ id: this.id('lnk'), codigo, origen: cmd.origen, etiqueta: cmd.etiqueta || cmd.origen, jornada: cmd.jornada, creadoEn: this.now });
        return { ok: true, message: 'Enlace de demo creado', data: { codigo } };
      }
      case 'link.visit': {
        const l = this.s.links.find((x) => x.codigo === cmd.codigo);
        if (!l) return { ok: true, message: 'Enlace desconocido: se registra como origen desconocido', code: 'desconocido' };
        this.s.linkVisits.push({ linkId: l.id, visitorId: cmd.visitorId, en: this.now });
        return { ok: true, message: 'Visita al enlace registrada' };
      }
      case 'staff.setRoles': {
        this.require(['encargado'], 'asignar roles');
        const st = this.s.staff.find((x) => x.id === cmd.staffId) ?? fail('Persona inexistente');
        if (!cmd.roles.length) fail('Asigná al menos un rol', 'validacion');
        st.roles = cmd.roles;
        this.audit(`Roles de ${st.nombre}: ${cmd.roles.map((r) => ROLE_LABEL[r]).join(', ')}`, 'equipo');
        return { ok: true, message: 'Roles de demostración actualizados' };
      }
      case 'scenario.mark':
        this.s.escenario = cmd.nombre;
        return { ok: true, message: 'Escenario marcado' };
    }
  }

  // ------------------------------------------------------------------ pedidos
  findUnit(uid: string) {
    for (const o of this.s.orders) for (const l of o.lineas) for (const u of l.unidades) if (u.id === uid) return { order: o, line: l, unit: u };
    return fail('Unidad inexistente');
  }

  buildLines(lines: CartLine[], canal: 'web' | 'caja', acceptChanges: boolean) {
    if (!lines.length) fail('El carrito está vacío', 'vacio');
    const cambios: { index: number; nombre: string; tipo: 'precio' | 'no_disponible'; antes: number; ahora: number | null; motivo: string | null }[] = [];
    const need: Record<string, number> = {};
    const out: OrderLine[] = [];
    lines.forEach((cl, index) => {
      const pp = presentationByKey(cl.presKey);
      if (!pp) fail('Producto inexistente');
      const { product, pres } = pp!;
      if (!Number.isInteger(cl.cantidad) || cl.cantidad < 1 || cl.cantidad > 30) fail('Cantidad inválida', 'validacion');
      if (product.sabores.length && (!cl.sabor || !product.sabores.includes(cl.sabor))) fail(`Elegí un sabor para ${product.nombre}`, 'validacion');
      if (cl.mods.includes('frutos_rojos') && !(product.frutosRojosConsultable && this.s.config.ginFrutosRojos.habilitado)) fail('Frutos rojos: opción a consultar, no habilitada en la demo', 'validacion');
      const chk = sellCheck(this.s, cl.presKey, canal);
      const price = unitPrice(this.s, cl.presKey, cl.mods);
      if (!chk.ok || price === null) {
        cambios.push({ index, nombre: product.nombre, tipo: 'no_disponible', antes: cl.precioVisto, ahora: null, motivo: chk.motivo });
        return;
      }
      if (price !== cl.precioVisto) cambios.push({ index, nombre: product.nombre, tipo: 'precio', antes: cl.precioVisto, ahora: price, motivo: 'Cambió el precio' });
      for (const c of COMPONENTS[cl.presKey] ?? []) need[c.insumo] = (need[c.insumo] ?? 0) + c.qty * cl.cantidad;
      const lineId = this.id('lin');
      const mods = cl.mods.includes('frutos_rojos') ? [{ id: 'frutos_rojos', etiqueta: 'Frutos rojos (modificador ficticio de demo)', recargo: this.s.config.ginFrutosRojos.recargo, ficticio: true }] : [];
      out.push({
        id: lineId,
        refId: product.id,
        presKey: cl.presKey,
        nombre: product.nombre,
        presentacion: pres.etiqueta,
        categoria: product.categoria,
        sabor: cl.sabor,
        modificadores: mods,
        nota: cl.nota?.trim() ? cl.nota.trim().slice(0, 140) : null,
        precioUnitario: price,
        cantidad: cl.cantidad,
        estacion: product.estacion,
        unidades: Array.from({ length: cl.cantidad }, () => ({ id: this.id('u'), estado: 'pendiente' as const })),
      });
    });
    for (const [ins, q] of Object.entries(need)) {
      if (stockAvailable(this.s, ins) < q) {
        const idx = lines.findIndex((l) => (COMPONENTS[l.presKey] ?? []).some((c) => c.insumo === ins));
        cambios.push({ index: idx, nombre: presentationByKey(lines[idx].presKey)!.product.nombre, tipo: 'no_disponible', antes: lines[idx].precioVisto, ahora: null, motivo: `Stock insuficiente (quedan ${Math.max(0, stockAvailable(this.s, ins))} de ${this.s.insumos[ins].nombre})` });
      }
    }
    const blocking = cambios.filter((c) => c.tipo === 'no_disponible' || !acceptChanges);
    if (cambios.length && blocking.length) {
      const nuevoTotal = lines.reduce((a, l, i) => {
        const c = cambios.find((x) => x.index === i);
        if (c?.tipo === 'no_disponible') return a;
        return a + (c?.ahora ?? l.precioVisto) * l.cantidad;
      }, 0);
      fail('Algunos productos cambiaron antes de confirmar. Revisá y confirmá el nuevo total.', 'revalidar', { cambios, nuevoTotal });
    }
    return { lines: out, need };
  }

  hold(ref: string, need: Record<string, number>, venceEn: number) {
    for (const [insumo, qty] of Object.entries(need)) this.s.holds.push({ id: this.id('res'), ref, insumo, qty, venceEn, estado: 'activa' });
  }
  releaseHolds(ref: string) {
    for (const h of this.s.holds) if (h.ref === ref && h.estado === 'activa') h.estado = 'liberada';
  }
  consumeHolds(ref: string) {
    for (const h of this.s.holds)
      if (h.ref === ref && h.estado === 'activa') {
        h.estado = 'consumida';
        this.s.insumos[h.insumo].stock -= h.qty;
      }
  }

  newOrder(p: { lines: OrderLine[]; canal: 'web' | 'caja'; metodo: Metodo; alias: string; modalidad: Modalidad; mesaSesionId: string | null; mesaId: string | null; descuento: number; cuponId: string | null; rondaId: string | null; repiteDe: string | null; clientRequestId: string }): Order {
    const subtotal = p.lines.reduce((a, l) => a + l.precioUnitario * l.cantidad, 0);
    const count = this.s.orders.length;
    const o: Order = {
      id: this.id('ped'),
      codigo: `T-${String(101 + count).padStart(3, '0')}`,
      credencial: this.code(6),
      canal: p.canal,
      metodo: p.metodo,
      buyerId: this.actor.buyerId ?? null,
      profileId: this.actor.profileId ?? null,
      alias: p.alias || 'Invitado',
      modalidad: p.modalidad,
      mesaSesionId: p.mesaSesionId,
      mesaId: p.mesaId,
      lineas: p.lines,
      subtotal,
      descuento: p.descuento,
      total: subtotal - p.descuento,
      cuponId: p.cuponId,
      intentId: null,
      pago: 'pendiente',
      estado: 'esperando_pago',
      tickets: [],
      creadoEn: this.now,
      // Digital: plazo de la intención de pago. Caja (efectivo/transferencia): plazo de verificación de demo de 30 min.
      venceEn: this.now + (p.metodo === 'digital_demo' ? this.s.config.plazoPagoSeg * 1000 : 30 * MIN),
      pagadoEn: null,
      jornada: jornadaOf(this.now),
      alertas: [],
      rondaId: p.rondaId,
      repiteDe: p.repiteDe,
      contingencia: p.canal === 'caja' && this.s.config.contingencia && p.lines.some((l) => !this.s.stations[l.estacion].online),
      sembrado: false,
      clientRequestId: p.clientRequestId,
      log: [],
    };
    this.s.orders.push(o);
    this.olog(o, `Pedido creado por ${p.canal === 'web' ? 'canal digital' : 'caja'} · ${ars(o.total)}`);
    return o;
  }

  checkout(cmd: Extract<Command, { type: 'checkout.start' }>): Result {
    this.require(['cliente', 'cliente_id'], 'comprar como cliente (usá Caja para pedidos asistidos)');
    const { lines, need } = this.buildLines(cmd.lines, 'web', false);
    let descuento = 0;
    let coupon: Coupon | undefined;
    if (cmd.couponId) {
      coupon = this.s.coupons.find((c) => c.id === cmd.couponId) ?? fail('Cupón inexistente');
      if (coupon.profileId !== this.actor.profileId) fail('El cupón pertenece a otro perfil', 'cupon');
      if (coupon.estado !== 'disponible') fail(`El cupón no está disponible (${coupon.estado})`, 'cupon');
      if (coupon.venceEn < this.now) fail('El cupón venció', 'cupon');
      descuento = couponDiscount(this.s, coupon, lines);
      if (descuento <= 0) fail('El cupón no aplica a los productos del carrito', 'cupon');
    }
    let mesaId: string | null = null;
    if (cmd.mesaSesionId) {
      const ts = this.s.tableSessions.find((t) => t.id === cmd.mesaSesionId);
      if (!ts || ts.cerradaEn) fail('La ocupación de mesa terminó. Escaneá de nuevo el QR de la mesa.', 'mesa');
      mesaId = ts!.mesaId;
    }
    if (cmd.modalidad === 'mesa' && !mesaId) fail('Para servicio a mesa necesitamos la mesa (escaneá su QR)', 'mesa');
    const o = this.newOrder({ lines, canal: 'web', metodo: 'digital_demo', alias: cmd.alias ?? '', modalidad: cmd.modalidad, mesaSesionId: cmd.mesaSesionId ?? null, mesaId, descuento, cuponId: coupon?.id ?? null, rondaId: null, repiteDe: cmd.repiteDe ?? null, clientRequestId: '' });
    const intent = { id: this.id('pi'), orderId: o.id, monto: o.total, estado: 'pendiente' as const, creadoEn: this.now, venceEn: o.venceEn, eventos: [{ at: this.now, tipo: 'creada' }] };
    this.s.intents.push(intent);
    o.intentId = intent.id;
    this.hold(o.id, need, o.venceEn);
    if (coupon) {
      coupon.estado = 'reservado';
      coupon.orderId = o.id;
      coupon.historial.push({ at: this.now, by: this.by, msg: `Reservado para ${o.codigo}` });
    }
    this.olog(o, `Intención de pago de demo ${intent.id} creada (vence ${hhmm(intent.venceEn)})`);
    this.audit(`Checkout ${o.codigo} ${ars(o.total)}`, 'pedido');
    return { ok: true, message: 'Pedido creado: falta confirmar el pago simulado', data: { orderId: o.id, intentId: intent.id } };
  }

  cajaOrder(cmd: Extract<Command, { type: 'caja.createOrder' }>): Result {
    this.require(['caja', 'encargado'], 'crear pedidos asistidos');
    const { lines, need } = this.buildLines(cmd.lines, 'caja', false);
    const o = this.newOrder({ lines, canal: 'caja', metodo: cmd.metodo, alias: cmd.alias || 'Cliente en caja', modalidad: cmd.modalidad, mesaSesionId: null, mesaId: cmd.mesaId ?? null, descuento: 0, cuponId: null, rondaId: null, repiteDe: null, clientRequestId: '' });
    this.hold(o.id, need, o.venceEn);
    if (cmd.metodo === 'digital_demo') {
      const intent = { id: this.id('pi'), orderId: o.id, monto: o.total, estado: 'pendiente' as const, creadoEn: this.now, venceEn: o.venceEn, eventos: [{ at: this.now, tipo: 'creada' }] };
      this.s.intents.push(intent);
      o.intentId = intent.id;
    }
    if (cmd.metodo === 'transferencia_manual') o.pago = 'esperando_verificacion';
    if (o.contingencia) this.incident('contingencia', `Pedido de contingencia ${o.codigo}`, 'Creado con una estación sin conexión. Comunicar en papel, registrar recepción manual y conciliar al reconectar.', o.id, null);
    this.audit(`Caja creó ${o.codigo} (${cmd.metodo}) ${ars(o.total)}`, 'pedido');
    return { ok: true, message: `Pedido ${o.codigo} creado en caja`, data: { orderId: o.id, intentId: o.intentId } };
  }

  cobro(o: Order, metodo: Metodo, monto: number, motivo: string | null, tardio: boolean) {
    this.s.cobros.push({ id: this.id('cob'), orderId: o.id, rondaId: o.rondaId, cuotaId: null, metodo, monto, en: this.now, jornada: jornadaOf(this.now), verificadoPor: metodo === 'digital_demo' ? null : this.by, motivo, tardio, sembrado: false });
  }

  activate(o: Order, msg: string) {
    o.estado = 'activo';
    o.pagadoEn = this.now;
    this.consumeHolds(o.id);
    if (o.cuponId) {
      const c = this.s.coupons.find((x) => x.id === o.cuponId);
      if (c && c.estado === 'reservado') {
        c.estado = 'usado';
        c.historial.push({ at: this.now, by: this.by, msg: `Usado en ${o.codigo}` });
      }
    }
    this.olog(o, msg);
    const estaciones = [...new Set(o.lineas.map((l) => l.estacion))];
    o.tickets = estaciones.map((e) => {
      const online = this.s.stations[e].online;
      return { estacion: e, enviadoEn: this.now, recibidoEn: online ? this.now : null, tomadoPor: null, tomadoEn: null };
    });
    for (const t of o.tickets) {
      if (t.recibidoEn) this.olog(o, `Recibido en ${t.estacion}`);
      else if (!o.contingencia)
        this.incident('sin_recepcion', `Cobro aprobado sin recepción en ${t.estacion}`, `El pedido ${o.codigo} fue cobrado pero ${t.estacion} no confirmó recepción. Pedidos nuevos de esa estación quedan pausados hasta reconectar.`, o.id, t.estacion);
    }
  }

  simulatePayment(intentId: string, resultado: 'aprobar' | 'rechazar' | 'pendiente'): Result {
    const pi = this.s.intents.find((x) => x.id === intentId) ?? fail('Intención de pago inexistente');
    const o = this.order(pi.orderId);
    if (resultado === 'pendiente') {
      pi.eventos.push({ at: this.now, tipo: 'pendiente' });
      this.olog(o, 'Proveedor simulado: pago pendiente');
      return { ok: true, message: 'El pago sigue pendiente. No se prepara hasta aprobarse.' };
    }
    if (resultado === 'rechazar') {
      if (pi.estado !== 'pendiente') {
        pi.eventos.push({ at: this.now, tipo: 'rechazo', repetido: true });
        return { ok: true, message: `Evento ignorado: el pago ya estaba ${pi.estado}`, code: 'repetido' };
      }
      pi.estado = 'rechazado';
      pi.eventos.push({ at: this.now, tipo: 'rechazado' });
      o.pago = 'rechazado';
      o.estado = 'pago_rechazado';
      this.releaseHolds(o.id);
      this.restoreCoupon(o, 'Pago rechazado: cupón restaurado');
      this.olog(o, 'Proveedor simulado: pago rechazado. No se envía a preparación.');
      return { ok: true, message: 'Pago rechazado (simulado). El pedido no se prepara.' };
    }
    // aprobar
    if (pi.estado === 'aprobado' || pi.estado === 'aprobado_tardio') {
      pi.eventos.push({ at: this.now, tipo: 'aprobacion', repetido: true });
      this.olog(o, 'Evento de aprobación repetido: ignorado sin duplicar cobro ni tareas');
      return { ok: true, message: 'Aprobación repetida ignorada: no se duplicó nada', code: 'repetido' };
    }
    if (pi.estado === 'pendiente' && this.now <= pi.venceEn && o.estado === 'esperando_pago') {
      pi.estado = 'aprobado';
      pi.eventos.push({ at: this.now, tipo: 'aprobado' });
      o.pago = 'aprobado';
      this.cobro(o, o.metodo, o.total, null, false);
      this.activate(o, 'Pago aprobado (simulado)');
      this.audit(`Pago aprobado ${o.codigo} ${ars(o.total)}`, 'dinero');
      return { ok: true, message: 'Pago aprobado (simulado). Enviando a estaciones.' };
    }
    // Aprobación tardía: después de vencer, rechazar o cancelar.
    pi.estado = 'aprobado_tardio';
    pi.eventos.push({ at: this.now, tipo: 'aprobado_tardio' });
    o.pago = 'aprobado_tardio';
    this.cobro(o, o.metodo, o.total, null, true);
    const cumplible = o.lineas.every((l) => sellCheck(this.s, l.presKey, 'web').ok) && this.stockOkFor(o);
    o.estado = 'incidencia';
    this.olog(o, `Aprobación tardía recibida (${hhmm(this.now)}). El pedido vencido no se reactiva solo.`);
    if (cumplible) {
      this.incident('aprobacion_tardia', `Aprobación tardía ${o.codigo}`, `Se cobró ${ars(o.total)} después del vencimiento. Se puede cumplir: decidir si se prepara (con nueva revisión) o se devuelve.`, o.id, null);
    } else {
      this.refund({ orderId: o.id, rondaId: null, cuotaId: null, pagador: o.alias, monto: o.total, motivo: 'Aprobación tardía de un pedido que ya no se puede cumplir' });
      o.estado = 'cancelado';
      this.incident('aprobacion_tardia', `Aprobación tardía ${o.codigo}: devolución`, `Se cobró ${ars(o.total)} tarde y ya no hay disponibilidad. Devolución simulada pendiente.`, o.id, null);
    }
    return { ok: true, message: cumplible ? 'Aprobación tardía: el pedido queda en incidencia para decidir' : 'Aprobación tardía: no se puede cumplir, devolución pendiente', code: 'tardio' };
  }

  stockOkFor(o: Order) {
    const need: Record<string, number> = {};
    for (const l of o.lineas) for (const c of COMPONENTS[l.presKey] ?? []) need[c.insumo] = (need[c.insumo] ?? 0) + c.qty * l.cantidad;
    return Object.entries(need).every(([i, q]) => stockAvailable(this.s, i) >= q);
  }

  resolveLate(orderId: string, accion: 'cumplir' | 'devolver'): Result {
    this.require(['caja', 'encargado'], 'resolver aprobaciones tardías');
    const o = this.order(orderId);
    if (o.estado !== 'incidencia' || o.pago !== 'aprobado_tardio') fail('El pedido no tiene una aprobación tardía pendiente');
    const inc = this.s.incidents.find((i) => i.orderId === o.id && i.tipo === 'aprobacion_tardia' && i.estado === 'abierta');
    if (accion === 'cumplir') {
      if (!(o.lineas.every((l) => sellCheck(this.s, l.presKey, 'web').ok) && this.stockOkFor(o))) fail('Ya no se puede cumplir: corresponde devolver', 'no_cumplible');
      const need: Record<string, number> = {};
      for (const l of o.lineas) for (const c of COMPONENTS[l.presKey] ?? []) need[c.insumo] = (need[c.insumo] ?? 0) + c.qty * l.cantidad;
      this.hold(o.id, need, this.now + 60_000);
      if (o.cuponId) {
        const c = this.s.coupons.find((x) => x.id === o.cuponId);
        if (c?.estado === 'disponible') {
          c.estado = 'reservado';
          c.orderId = o.id;
        } else if (c) {
          // El cupón ya se usó en otro pedido: se respeta el importe cobrado y queda el ajuste registrado.
          c.historial.push({ at: this.now, by: this.by, msg: `Pedido ${o.codigo} cumplido con importe ya cobrado; el cupón no se vuelve a usar` });
        }
      }
      this.activate(o, 'Aprobación tardía revisada: se decidió cumplir el pedido');
      if (inc) { inc.estado = 'resuelta'; inc.resolucion = 'Se cumplió el pedido tras revisar disponibilidad'; inc.resueltaPor = this.by; }
      return { ok: true, message: 'Pedido enviado a estaciones tras revisión' };
    }
    this.refund({ orderId: o.id, rondaId: null, cuotaId: null, pagador: o.alias, monto: o.total, motivo: 'Aprobación tardía: se decidió devolver' });
    o.estado = 'cancelado';
    this.olog(o, 'Aprobación tardía: devolución simulada iniciada');
    if (inc) { inc.estado = 'resuelta'; inc.resolucion = 'Devolución simulada iniciada'; inc.resueltaPor = this.by; }
    return { ok: true, message: 'Devolución simulada creada' };
  }

  restoreCoupon(o: Order, msg: string) {
    if (!o.cuponId) return;
    const c = this.s.coupons.find((x) => x.id === o.cuponId);
    if (c && (c.estado === 'reservado' || c.estado === 'usado') && c.orderId === o.id) {
      c.estado = c.venceEn >= this.now ? 'disponible' : 'anulado';
      c.orderId = null;
      c.historial.push({ at: this.now, by: this.by, msg });
    }
  }

  refundUnits(o: Order, unitIds: string[], motivo: string): Refund | null {
    const paid = ['aprobado', 'aprobado_tardio', 'verificado_manual', 'efectivo_registrado'].includes(o.pago);
    if (!paid) return null;
    const nets = unitNetMap(o, o.cuponId ? this.s.coupons.find((c) => c.id === o.cuponId) : null);
    let monto = 0;
    const ids: string[] = [];
    for (const uid of unitIds) {
      const u = allUnits(o).find((x) => x.id === uid);
      if (!u || u.reembolsoId) continue;
      monto += nets.get(uid) ?? 0;
      ids.push(uid);
    }
    if (!monto) return null;
    const r = this.refund({ orderId: o.id, rondaId: o.rondaId, cuotaId: null, pagador: o.alias, monto, motivo });
    for (const l of o.lineas) for (const u of l.unidades) if (ids.includes(u.id)) u.reembolsoId = r.id;
    return r;
  }

  cancelOrder(orderId: string, motivo: string): Result {
    const o = this.order(orderId);
    const isOwner = !!this.actor.buyerId && o.buyerId === this.actor.buyerId;
    if (!(isOwner && o.estado === 'esperando_pago')) this.require(['caja', 'encargado'], 'cancelar pedidos');
    if (motivo.trim().length < 3) fail('Indicá el motivo', 'validacion');
    if (o.estado === 'cancelado') return { ok: true, message: 'Ya estaba cancelado', code: 'repetido' };
    if (o.estado === 'esperando_pago') {
      o.estado = 'cancelado';
      const pi = this.s.intents.find((x) => x.id === o.intentId);
      if (pi && pi.estado === 'pendiente') { pi.estado = 'rechazado'; pi.eventos.push({ at: this.now, tipo: 'cancelada_por_comercio' }); }
      this.releaseHolds(o.id);
      this.restoreCoupon(o, 'Pedido cancelado antes del pago: cupón restaurado');
      this.olog(o, `Cancelado antes del pago: ${motivo}`);
      return { ok: true, message: 'Pedido cancelado (no había cobro)' };
    }
    if (o.estado !== 'activo') fail(`No se puede cancelar un pedido ${o.estado}`);
    const pendientes = allUnits(o).filter((u) => u.estado !== 'entregada' && u.estado !== 'cancelada');
    if (!pendientes.length) fail('Todo ya fue entregado: registrá una entrega discutida o devolución desde incidencias');
    for (const l of o.lineas) for (const u of l.unidades) if (u.estado !== 'entregada' && u.estado !== 'cancelada') u.estado = 'cancelada';
    const nadaEntregado = allUnits(o).every((u) => u.estado === 'cancelada');
    const r = this.refundUnits(o, pendientes.map((u) => u.id), `Cancelación: ${motivo}`);
    if (nadaEntregado) this.restoreCoupon(o, 'Pedido cancelado completo: cupón restaurado');
    this.incident('cancelacion', `Cancelación ${o.codigo}`, `${motivo}. ${r ? `Devolución pendiente ${ars(r.monto)}.` : ''}`, o.id, null);
    this.olog(o, `Cancelado (${pendientes.length} u. no entregadas): ${motivo}`);
    this.checkComplete(o);
    if (nadaEntregado) o.estado = 'cancelado';
    return { ok: true, message: r ? `Cancelado. Devolución simulada pendiente: ${ars(r.monto)}` : 'Cancelado' };
  }

  checkComplete(o: Order) {
    const us = allUnits(o);
    if (o.estado === 'activo' && us.every((u) => u.estado === 'entregada' || u.estado === 'cancelada')) {
      o.estado = us.some((u) => u.estado === 'entregada') ? 'completado' : 'cancelado';
      this.olog(o, o.estado === 'completado' ? 'Pedido completo' : 'Pedido sin unidades por entregar');
    }
  }

  deliver(cmd: Extract<Command, { type: 'delivery.deliver' }>): Result {
    this.require(['entrega', 'barra', 'encargado', 'cocina'], 'entregar pedidos');
    const o = this.order(cmd.orderId);
    if (cmd.mesa) {
      if (o.modalidad !== 'mesa') fail('Este pedido es para retiro: validá la credencial');
    } else {
      if (!cmd.credencial || normCred(cmd.credencial) !== o.credencial) fail('Credencial privada incorrecta. El código público de la TV no autoriza el retiro.', 'credencial');
    }
    if (o.estado !== 'activo') fail(o.estado === 'completado' ? `Pedido ${o.codigo} ya entregado por completo` : `Pedido ${o.estado}: no se entrega`, 'estado');
    const entregadas: string[] = [];
    const yaEntregadas: string[] = [];
    for (const uid of cmd.unitIds) {
      const l = o.lineas.find((x) => x.unidades.some((u) => u.id === uid));
      const u = l?.unidades.find((x) => x.id === uid);
      if (!u || !l) continue;
      if (cmd.mesa && l.estacion !== 'cocina') continue;
      if (u.estado === 'lista') {
        u.estado = 'entregada';
        u.entregadaEn = this.now;
        u.entregadaPor = this.by;
        entregadas.push(`${l.nombre}${l.sabor ? ` (${l.sabor})` : ''}`);
      } else if (u.estado === 'entregada') yaEntregadas.push(l.nombre);
    }
    if (!entregadas.length) {
      fail(yaEntregadas.length ? `Esas unidades ya se entregaron. No se entrega dos veces.` : 'No hay unidades listas para entregar en la selección', 'ya_entregado');
    }
    this.olog(o, `Entregado: ${entregadas.join(', ')}${cmd.mesa ? ' (servicio a mesa)' : ''}`);
    this.audit(`Entrega ${o.codigo}: ${entregadas.length} u.`, 'entrega');
    this.checkComplete(o);
    return { ok: true, message: `Entregado: ${entregadas.length} unidad(es)`, data: { entregadas } };
  }

  setStation(e: Station, online: boolean): Result {
    const st = this.s.stations[e];
    if (st.online === online) return { ok: true, message: 'Sin cambios', code: 'repetido' };
    st.online = online;
    if (!online) {
      st.caidaDesde = this.now;
      this.audit(`${e} sin conexión (simulado). Pedidos nuevos de ${e} pausados.`, 'falla');
      return { ok: true, message: `${e}: sin conexión simulada. Se pausan pedidos nuevos de esa estación.` };
    }
    st.caidaDesde = null;
    st.ultimaSync = this.now;
    let n = 0;
    for (const o of this.s.orders)
      for (const t of o.tickets)
        if (t.estacion === e && !t.recibidoEn) {
          t.recibidoEn = this.now;
          n++;
          this.olog(o, `Recepción registrada al reconectar ${e}${t.recepcionManual ? ' (conciliada con la recepción manual)' : ''}`);
        }
    for (const inc of this.s.incidents)
      if (inc.estacion === e && inc.tipo === 'sin_recepcion' && inc.estado === 'abierta') {
        inc.estado = 'resuelta';
        inc.resolucion = 'Recepción registrada al reconectar, sin duplicar tareas';
        inc.resueltaPor = 'Sistema';
      }
    this.audit(`${e} reconectada: ${n} recepción(es) pendiente(s) registradas una sola vez`, 'falla');
    return { ok: true, message: `${e} reconectada. ${n} pedido(s) recibidos sin duplicar.` };
  }

  // -------------------------------------------------------------- reservas
  createReservation(cmd: Extract<Command, { type: 'reservation.create' }>): Result {
    if (cmd.origen !== 'web') this.require(['encargado', 'caja'], 'cargar consultas asistidas');
    const errors: Record<string, string> = {};
    if (!cmd.nombre.trim()) errors.nombre = 'Indicá un nombre';
    if (!/^[+\d][\d\s-]{6,}$/.test(cmd.contacto.trim())) errors.contacto = 'Indicá un teléfono de contacto válido';
    if (!Number.isInteger(cmd.personas) || cmd.personas < 1 || cmd.personas > 30) errors.personas = 'Entre 1 y 30 personas';
    if (!cmd.horario) errors.horario = 'Elegí un horario';
    if (Object.keys(errors).length) fail('Revisá los datos marcados', 'validacion', { errors });
    const night = this.s.nights.find((n) => n.jornada === cmd.jornada && n.publicada);
    if (!night) fail('Esa fecha no tiene programación publicada', 'validacion', { errors: { jornada: 'Fecha no disponible' } });
    const link = cmd.linkCodigo ? this.s.links.find((l) => l.codigo === cmd.linkCodigo) : undefined;
    const dup = this.s.reservations.find((r) => r.jornada === cmd.jornada && r.contacto.replace(/\D/g, '') === cmd.contacto.replace(/\D/g, '') && !['cancelada', 'incompleta'].includes(r.estado));
    const r: Reservation = {
      id: this.id('rsv'),
      ref: `R-${this.code(4)}`,
      jornada: cmd.jornada,
      horario: cmd.horario,
      personas: cmd.personas,
      nombre: cmd.nombre.trim(),
      contacto: cmd.contacto.trim(),
      notas: cmd.notas.trim().slice(0, 200),
      origen: cmd.origen,
      linkId: link?.id ?? null,
      estado: cmd.origen === 'web' ? 'consulta_creada' : 'contacto_realizado',
      borradorVisto: false,
      enlaceWhatsAppAbierto: false,
      creadaEn: this.now,
      mesaAsignada: null,
      propuesta: null,
      posibleDuplicado: dup?.ref ?? null,
      historial: [{ at: this.now, by: this.by, msg: cmd.origen === 'web' ? 'Consulta creada desde la web. No es una reserva confirmada.' : `Consulta cargada por el equipo (origen: ${cmd.origen === 'whatsapp_directo' ? 'WhatsApp directo' : 'presencial'})` }],
      sembrado: false,
    };
    this.s.reservations.push(r);
    this.audit(`Consulta de reserva ${r.ref} (${r.personas} p., ${r.horario})`, 'reserva');
    return { ok: true, message: `Consulta ${r.ref} creada. Pendiente de confirmación del local.`, data: { id: r.id, ref: r.ref } };
  }

  setReservation(cmd: Extract<Command, { type: 'reservation.setState' }>): Result {
    this.require(['encargado', 'caja'], 'gestionar reservas');
    const r = this.s.reservations.find((x) => x.id === cmd.id) ?? fail('Consulta inexistente');
    const allowed: Record<ReservationState, ReservationState[]> = {
      consulta_creada: ['contacto_realizado', 'confirmada', 'cambio_propuesto', 'cancelada', 'incompleta'],
      contacto_realizado: ['confirmada', 'cambio_propuesto', 'cancelada', 'incompleta'],
      cambio_propuesto: ['confirmada', 'cancelada', 'incompleta', 'contacto_realizado'],
      confirmada: ['llegada', 'ausente', 'cancelada', 'cambio_propuesto'],
      incompleta: ['contacto_realizado', 'confirmada', 'cancelada'],
      llegada: [],
      ausente: ['llegada'],
      cancelada: [],
    };
    if (r.estado === cmd.estado) return { ok: true, message: 'Sin cambios', code: 'repetido' };
    if (!allowed[r.estado].includes(cmd.estado)) fail(`No se puede pasar de «${r.estado}» a «${cmd.estado}»`, 'transicion');
    if (cmd.estado === 'llegada' && this.now < jornadaTime(r.jornada, '12:00')) fail('La llegada se registra el día de la reserva');
    if (cmd.estado === 'cambio_propuesto') r.propuesta = cmd.propuesta?.trim() || 'Cambio propuesto por el local';
    if (cmd.mesa !== undefined) r.mesaAsignada = cmd.mesa;
    const prevState = r.estado;
    r.estado = cmd.estado;
    r.historial.push({ at: this.now, by: this.by, msg: `${prevState} → ${cmd.estado}${cmd.nota ? `: ${cmd.nota}` : ''}${cmd.estado === 'cambio_propuesto' ? `: ${r.propuesta}` : ''}` });
    this.audit(`Reserva ${r.ref}: ${cmd.estado}`, 'reserva');
    return { ok: true, message: `Reserva ${r.ref}: ${cmd.estado.replace('_', ' ')}` };
  }

  // -------------------------------------------------------------- encuestas
  canPoll(sesionId: string, accion: 'crear' | 'abrir' | 'cerrar') {
    const ses = this.s.sessions.find((x) => x.id === sesionId) ?? fail('Sesión inexistente');
    if (this.actor.role === 'dj') {
      const st = this.s.staff.find((x) => x.id === this.actor.staffId);
      if (st?.djId && st.djId !== ses.djId) fail('Esta sesión pertenece a otro DJ', 'permiso');
      return ses;
    }
    if (this.actor.role === 'dj_asistente') {
      if (ses.asistenteId !== this.actor.staffId || !ses.permisosAsistente.includes(accion)) fail('El DJ no delegó esta acción en vos', 'permiso');
      return ses;
    }
    return fail('Solo el DJ de la sesión o su asistente autorizado gestionan encuestas', 'permiso');
  }

  createPoll(cmd: Extract<Command, { type: 'poll.create' }>): Result {
    this.canPoll(cmd.sesionId, 'crear');
    const opciones = [...new Set(cmd.opciones.map((o) => o.trim()).filter(Boolean))];
    if (opciones.length < 2 || opciones.length > 4) fail('Elegí entre 2 y 4 opciones que puedas cumplir', 'validacion');
    if (cmd.duracionMin < 2 || cmd.duracionMin > 30) fail('Duración entre 2 y 30 minutos', 'validacion');
    const p: Poll = {
      id: this.id('enc'),
      sesionId: cmd.sesionId,
      pregunta: cmd.pregunta.trim() || '¿Qué sigue?',
      opciones: opciones.map((label, i) => ({ id: `op${i + 1}`, label })),
      estado: 'borrador',
      creadaEn: this.now,
      creadaPor: this.by,
      abiertaEn: null,
      cierraEn: null,
      duracionMin: cmd.duracionMin,
      cerradaEn: null,
      pausadaEn: null,
      votos: {},
      minVotos: Math.max(1, cmd.minVotos),
      politica: `Empate o menos de ${Math.max(1, cmd.minVotos)} votos: decide el DJ. El resultado orienta, no reproduce música automáticamente.`,
      motivoCancelacion: null,
      decisionDJ: null,
      historial: [{ at: this.now, by: this.by, msg: 'Encuesta creada como borrador' }],
    };
    this.s.polls.push(p);
    return { ok: true, message: 'Encuesta lista para abrir', data: { pollId: p.id } };
  }

  pollAction(cmd: Extract<Command, { type: 'poll.open' | 'poll.pause' | 'poll.resume' | 'poll.close' | 'poll.cancel' | 'poll.decide' }>): Result {
    const p = this.s.polls.find((x) => x.id === cmd.pollId) ?? fail('Encuesta inexistente');
    const log = (msg: string) => p.historial.push({ at: this.now, by: this.by, msg });
    switch (cmd.type) {
      case 'poll.open': {
        this.canPoll(p.sesionId, 'abrir');
        if (p.estado !== 'borrador') fail('Solo se abre una encuesta en borrador');
        const activa = this.s.polls.find((x) => x.sesionId === p.sesionId && (x.estado === 'abierta' || x.estado === 'pausada'));
        if (activa) fail('Ya hay una encuesta activa en esta sesión. Cerrala o cancelala primero.', 'una_activa');
        p.estado = 'abierta';
        p.abiertaEn = this.now;
        p.cierraEn = this.now + p.duracionMin * MIN;
        log(`Abierta hasta ${hhmm(p.cierraEn)} (reloj compartido de demo)`);
        this.audit(`Encuesta abierta: ${p.pregunta}`, 'dj');
        return { ok: true, message: `Encuesta abierta hasta las ${hhmm(p.cierraEn)}` };
      }
      case 'poll.pause': {
        this.canPoll(p.sesionId, 'cerrar');
        if (p.estado !== 'abierta') fail('Solo se pausa una encuesta abierta');
        p.estado = 'pausada';
        p.pausadaEn = this.now;
        log('Pausada: no recibe votos');
        return { ok: true, message: 'Encuesta pausada' };
      }
      case 'poll.resume': {
        this.canPoll(p.sesionId, 'abrir');
        if (p.estado !== 'pausada') fail('La encuesta no está pausada');
        const pausa = this.now - (p.pausadaEn ?? this.now);
        p.cierraEn = (p.cierraEn ?? this.now) + pausa;
        p.estado = 'abierta';
        p.pausadaEn = null;
        log(`Reanudada; nuevo cierre ${hhmm(p.cierraEn)}`);
        return { ok: true, message: 'Encuesta reanudada' };
      }
      case 'poll.close': {
        this.canPoll(p.sesionId, 'cerrar');
        if (p.estado !== 'abierta' && p.estado !== 'pausada') fail('La encuesta no está activa');
        p.estado = 'cerrada';
        p.cerradaEn = this.now;
        log('Cerrada manualmente');
        return { ok: true, message: 'Encuesta cerrada' };
      }
      case 'poll.cancel': {
        if (this.actor.role !== 'encargado') this.canPoll(p.sesionId, 'cerrar');
        if (p.estado === 'cerrada' || p.estado === 'cancelada') fail('La encuesta ya terminó');
        if (cmd.motivo.trim().length < 3) fail('Explicá el motivo de la cancelación (se muestra al público)', 'validacion');
        p.estado = 'cancelada';
        p.cerradaEn = this.now;
        p.motivoCancelacion = cmd.motivo.trim();
        log(`Cancelada: ${cmd.motivo}. Los votos se conservan en el historial.`);
        return { ok: true, message: 'Encuesta cancelada; se informa el motivo' };
      }
      case 'poll.decide': {
        this.canPoll(p.sesionId, 'cerrar');
        if (p.estado !== 'cerrada') fail('Primero cerrá la encuesta');
        p.decisionDJ = { opcionId: cmd.opcionId, nota: cmd.nota.trim(), en: this.now };
        log(`Decisión del DJ: ${p.opciones.find((o) => o.id === cmd.opcionId)?.label ?? 'otra opción'} ${cmd.nota}`);
        return { ok: true, message: 'Decisión del DJ registrada' };
      }
    }
  }

  vote(cmd: Extract<Command, { type: 'poll.vote' }>): Result {
    this.require(['cliente', 'cliente_id'], 'votar');
    const p = this.s.polls.find((x) => x.id === cmd.pollId) ?? fail('Encuesta inexistente');
    if (p.estado !== 'abierta' || (p.cierraEn && this.now >= p.cierraEn)) fail(p.estado === 'pausada' ? 'La encuesta está pausada' : 'La encuesta no está abierta', 'cerrada');
    const j = jornadaOf(this.now);
    if (!(this.s.nightAccess[j] ?? []).includes(cmd.identity)) fail('Necesitás el acceso de la noche para votar', 'acceso');
    if (p.votos[cmd.identity]) fail('Ya votaste en esta encuesta. Un voto por identidad de demostración.', 'ya_voto');
    if (!p.opciones.some((o) => o.id === cmd.opcionId)) fail('Opción inválida');
    p.votos[cmd.identity] = cmd.opcionId;
    return { ok: true, message: 'Voto registrado. El DJ toma la decisión final.' };
  }

  // -------------------------------------------------------------- beneficios
  validateVisit(profileId: string): Result {
    this.require(['entrega', 'caja', 'encargado'], 'validar visitas');
    const pr = this.s.profiles.find((p) => p.id === profileId) ?? fail('Perfil inexistente');
    const j = jornadaOf(this.now);
    const ya = this.s.visits.find((v) => v.profileId === profileId && v.jornada === j);
    if (ya) fail(`${pr.alias} ya tiene la visita de esta noche (validada ${hhmm(ya.validadaEn)}). Una por persona y jornada.`, 'duplicado');
    this.s.visits.push({ id: this.id('vis'), profileId, jornada: j, validadaEn: this.now, validadaPor: this.by, sembrado: false });
    const total = this.s.visits.filter((v) => v.profileId === profileId).length;
    const rule = this.s.benefitRule;
    let msg = `Visita validada para ${pr.alias} (${total}).`;
    if (total % rule.umbralVisitas === 0 && !this.s.coupons.some((c) => c.profileId === profileId && c.hito === total)) {
      const c: Coupon = {
        id: this.id('cup'),
        codigo: `DEMO-${this.code(5)}`,
        profileId,
        descripcion: `${rule.porcentaje}% (tope ${ars(rule.tope)}) en ${rule.aplicaA === 'comida_y_sin_alcohol' ? 'comida y bebidas sin alcohol' : 'toda la carta'} — beneficio de ejemplo`,
        porcentaje: rule.porcentaje,
        tope: rule.tope,
        categoriasAplicables: rule.aplicaA === 'comida_y_sin_alcohol' ? 'comida_y_sin_alcohol' : [],
        estado: 'disponible',
        emitidoEn: this.now,
        venceEn: this.now + rule.vigenciaDias * 24 * 3600_000,
        hito: total,
        orderId: null,
        historial: [{ at: this.now, by: this.by, msg: `Emitido al validar la visita ${total}` }],
      };
      if (rule.aplicaA === 'toda_la_carta') c.categoriasAplicables = [];
      this.s.coupons.push(c);
      msg += ' Se emitió un cupón de demostración.';
    }
    this.audit(msg, 'beneficio');
    return { ok: true, message: msg };
  }

  // -------------------------------------------------------------- rondas
  round(id: string): GroupRound {
    return this.s.rounds.find((r) => r.id === id) ?? fail('Ronda inexistente');
  }

  createRound(cmd: Extract<Command, { type: 'round.create' }>): Result {
    this.require(['cliente', 'cliente_id'], 'crear rondas');
    if (!Number.isInteger(cmd.participantes) || cmd.participantes < 2 || cmd.participantes > 12) fail('Entre 2 y 12 participantes', 'validacion');
    const { lines, need } = this.buildLines(cmd.lines, 'web', false);
    const total = lines.reduce((a, l) => a + l.precioUnitario * l.cantidad, 0);
    const partes = splitCents(total, cmd.participantes);
    const r: GroupRound = {
      id: this.id('ron'),
      organizador: cmd.organizador || 'Organizador',
      buyerId: this.actor.buyerId ?? '',
      lineas: lines.map((l) => ({ presKey: l.presKey, sabor: l.sabor, cantidad: l.cantidad, precioUnitario: l.precioUnitario, nombre: l.nombre, presentacion: l.presentacion })),
      total,
      cuotas: partes.map((monto, i) => ({ id: `${this.s.seq + 1}-c${i + 1}`, indice: i + 1, monto, estado: 'pendiente', pagador: null, pagadaEn: null })),
      creadoEn: this.now,
      venceEn: this.now + this.s.config.plazoRondaSeg * 1000,
      estado: 'abierta',
      invitacion: this.code(8),
      invitacionRevocada: false,
      orderId: null,
      historial: [{ at: this.now, by: this.by, msg: `Acuerdo congelado: ${ars(total)} en ${cmd.participantes} partes` }],
    };
    this.s.seq += 1;
    this.s.rounds.push(r);
    this.hold(r.id, need, r.venceEn);
    this.audit(`Ronda avanzada creada ${ars(total)} / ${cmd.participantes}`, 'ronda');
    return { ok: true, message: 'Ronda creada: el pedido se prepara cuando se complete el total', data: { roundId: r.id } };
  }

  payShare(roundId: string, cuotaIds: string[], pagador: string, cubrir: boolean): Result {
    const r = this.round(roundId);
    if (r.estado !== 'abierta') fail(`La ronda está ${r.estado}`, 'estado');
    if (this.now > r.venceEn) fail('La ronda venció', 'vencida');
    if (!pagador.trim()) fail('Indicá un nombre de pagador ficticio', 'validacion');
    const cs = cuotaIds.map((id) => r.cuotas.find((c) => c.id === id) ?? fail('Cuota inexistente'));
    const yaPagadas = cs.filter((c) => c.estado !== 'pendiente');
    if (yaPagadas.length) fail(`La parte ${yaPagadas.map((c) => c.indice).join(', ')} ya fue pagada. No se cobra dos veces.`, 'ya_pagada');
    for (const c of cs) {
      c.estado = cubrir ? 'cubierta' : 'pagada';
      c.pagador = pagador.trim();
      c.pagadaEn = this.now;
      this.s.cobros.push({ id: this.id('cob'), orderId: null, rondaId: r.id, cuotaId: c.id, metodo: 'digital_demo', monto: c.monto, en: this.now, jornada: jornadaOf(this.now), verificadoPor: null, motivo: cubrir ? 'Cobertura voluntaria de saldo' : null, tardio: false, sembrado: false });
      r.historial.push({ at: this.now, by: pagador, msg: `${cubrir ? 'Cubrió' : 'Pagó'} la parte ${c.indice}: ${ars(c.monto)}` });
    }
    if (r.cuotas.every((c) => c.estado === 'pagada' || c.estado === 'cubierta')) {
      // Revalidar antes de preparar (el stock reservado por la propia ronda cuenta como disponible).
      const disponibles = r.lineas.every((l) => {
        const chk = sellCheck(this.s, l.presKey, 'web');
        return chk.ok || chk.tipo === 'stock';
      });
      const need: Record<string, number> = {};
      for (const l of r.lineas) for (const c of COMPONENTS[l.presKey] ?? []) need[c.insumo] = (need[c.insumo] ?? 0) + c.qty * l.cantidad;
      const stockOk = Object.entries(need).every(([i, q]) => stockAvailable(this.s, i, r.id) >= q);
      if (!disponibles || !stockOk) {
        this.closeRound(r, 'cancelada', 'Al completar el pago, un producto ya no estaba disponible');
        return { ok: true, message: 'Se completó el pago pero un producto ya no está disponible: devoluciones simuladas creadas', code: 'no_cumplible' };
      }
      r.estado = 'completa';
      const lines: OrderLine[] = r.lineas.map((l) => {
        const pp = presentationByKey(l.presKey)!;
        return { id: this.id('lin'), refId: pp.product.id, presKey: l.presKey, nombre: l.nombre, presentacion: l.presentacion, categoria: pp.product.categoria, sabor: l.sabor, modificadores: [], nota: null, precioUnitario: l.precioUnitario, cantidad: l.cantidad, estacion: pp.product.estacion, unidades: Array.from({ length: l.cantidad }, () => ({ id: this.id('u'), estado: 'pendiente' as const })) };
      });
      const o = this.newOrder({ lines, canal: 'web', metodo: 'digital_demo', alias: `Ronda de ${r.organizador}`, modalidad: 'retiro', mesaSesionId: null, mesaId: null, descuento: 0, cuponId: null, rondaId: r.id, repiteDe: null, clientRequestId: '' });
      o.buyerId = r.buyerId;
      o.pago = 'aprobado';
      // Las reservas de stock de la ronda pasan al pedido.
      for (const h of this.s.holds) if (h.ref === r.id && h.estado === 'activa') h.ref = o.id;
      this.activate(o, 'Ronda completa: aportes cubren el total');
      r.orderId = o.id;
      r.historial.push({ at: this.now, by: 'Sistema', msg: `Total completo. Pedido ${o.codigo} enviado a preparación.` });
      return { ok: true, message: `Total completo: pedido ${o.codigo} en preparación`, data: { orderId: o.id } };
    }
    return { ok: true, message: cubrir ? 'Saldo cubierto voluntariamente' : 'Aporte simulado registrado' };
  }

  closeRound(r: GroupRound, estado: 'vencida' | 'cancelada', motivo: string) {
    r.estado = estado;
    this.releaseHolds(r.id);
    for (const c of r.cuotas)
      if (c.estado === 'pagada' || c.estado === 'cubierta') {
        this.refund({ orderId: null, rondaId: r.id, cuotaId: c.id, pagador: c.pagador ?? 'Pagador', monto: c.monto, motivo: `Ronda ${estado}: ${motivo}` });
        c.estado = 'devolucion_pendiente';
      }
    r.historial.push({ at: this.now, by: this.by, msg: `Ronda ${estado}: ${motivo}. Cada aporte vuelve a su pagador original.` });
  }

  // -------------------------------------------------------------- reloj
  processTime() {
    const now = this.now;
    for (const st of Object.values(this.s.stations)) if (st.online) st.ultimaSync = now;
    for (const pi of this.s.intents) {
      if (pi.estado === 'pendiente' && now > pi.venceEn) {
        pi.estado = 'vencido';
        pi.eventos.push({ at: now, tipo: 'vencido' });
        const o = this.s.orders.find((x) => x.id === pi.orderId);
        if (o && o.estado === 'esperando_pago') {
          o.estado = 'vencido';
          o.pago = 'vencido';
          this.releaseHolds(o.id);
          this.restoreCoupon(o, 'Pago vencido: cupón restaurado');
          this.olog(o, 'Venció el plazo de pago: stock liberado');
        }
      }
    }
    for (const o of this.s.orders) {
      if (o.estado === 'esperando_pago' && !o.intentId && now > o.venceEn) {
        o.estado = 'vencido';
        o.pago = 'vencido';
        this.releaseHolds(o.id);
        this.olog(o, 'Venció sin registrar el cobro en caja: stock liberado');
      }
      if (o.estado === 'activo' && !o.alertas.includes('listo')) {
        const viejas = allUnits(o).filter((u) => u.estado === 'lista' && u.listaEn && now - u.listaEn >= this.s.config.alertaListoMin * MIN);
        if (viejas.length) {
          o.alertas.push('listo');
          this.incident('listo_sin_retirar', `Listo sin retirar ${o.codigo}`, `${viejas.length} unidad(es) listas hace más de ${this.s.config.alertaListoMin} min (regla de demo). Revisar calidad y avisar en persona.`, o.id, null);
        }
      }
    }
    for (const h of this.s.holds) if (h.estado === 'activa' && now > h.venceEn) h.estado = 'liberada';
    for (const r of this.s.rounds) if (r.estado === 'abierta' && now > r.venceEn) this.closeRound(r, 'vencida', 'no se completó el total a tiempo');
    for (const p of this.s.polls)
      if (p.estado === 'abierta' && p.cierraEn && now >= p.cierraEn) {
        p.estado = 'cerrada';
        p.cerradaEn = p.cierraEn;
        p.historial.push({ at: now, by: 'Reloj de demo', msg: `Cerrada automáticamente a las ${hhmm(p.cierraEn)}` });
      }
    for (const r of this.s.reservations)
      if (r.estado === 'consulta_creada' && now - r.creadaEn > 60 * MIN) {
        r.estado = 'incompleta';
        r.historial.push({ at: now, by: 'Reloj de demo', msg: 'Sin contacto registrado en 60 min: consulta incompleta (no consume mesa)' });
      }
  }
}
