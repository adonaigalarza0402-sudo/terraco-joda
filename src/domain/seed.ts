// Datos de demostración. Todo lo que no proviene de la carta es ficticio y está rotulado.
import { CATEGORIES } from './catalog';
import { apply, type Command } from './engine';
import { arDateTime, HOUR, MIN } from './time';
import type { Actor, NightConfig, State } from './types';

export const SCHEMA = 3;
export const DEMO_JORNADA = '2026-11-21';
export const DEMO_START = arDateTime(DEMO_JORNADA, '22:00');

export function baseNightConfig(): NightConfig {
  return {
    momentos: [
      { id: 'm-cena', tipo: 'cena', titulo: 'Cena', artista: null, inicio: '21:00', fin: '00:30', confirmado: true, djId: null },
      { id: 'm-show', tipo: 'show', titulo: 'Show en vivo', artista: 'Trío Brasa (banda ficticia de demo)', inicio: '22:30', fin: '23:30', confirmado: true, djId: null },
      { id: 'm-dj', tipo: 'dj', titulo: 'Joda con DJ', artista: 'DJ ZETA (perfil ficticio)', inicio: '00:30', fin: '05:00', confirmado: true, djId: 'dj-aurora' },
      { id: 'm-cierre', tipo: 'cierre', titulo: 'Cierre', artista: null, inicio: '05:30', fin: '06:00', confirmado: true, djId: null },
    ],
    categoriasActivas: Object.fromEntries(CATEGORIES.map((c) => [c.nombre, true])),
    cocinaNuevasHasta: '00:30',
    barraNuevasHasta: '05:30',
    responsables: { caja: 'Sofía', cocina: 'Martín', barra: 'Ana', entrega: 'Juli', encargado: 'Nico' },
    puntosRetiro: { barra: 'Barra principal', cocina: 'Ventana de cocina' },
    modalidadComida: 'retiro',
    djSesionId: 'ses-aurora',
    notas: 'Horarios y responsables de ejemplo. Confirmar con el local antes de cualquier piloto.',
    pendientes: ['Confirmar horario real de cocina', 'Confirmar si la comida se retira o va a mesa', 'Definir punto físico de retiro'],
    reservasHorarios: ['21:00', '21:30', '22:00', '22:30'],
    reservasCupoPersonas: 40,
  };
}

function baseState(): State {
  const cfg = baseNightConfig();
  const viernes = baseNightConfig();
  viernes.momentos = [
    { id: 'm-cena', tipo: 'cena', titulo: 'Cena', artista: null, inicio: '21:00', fin: '00:30', confirmado: true, djId: null },
    { id: 'm-dj', tipo: 'dj', titulo: 'Joda con DJ', artista: 'DJ Nébula (perfil ficticio)', inicio: '00:30', fin: '05:00', confirmado: true, djId: 'dj-nebula' },
  ];
  viernes.djSesionId = 'ses-nebula';
  const sabado = baseNightConfig();
  sabado.momentos = sabado.momentos.map((m) => (m.tipo === 'show' ? { ...m, artista: 'Banda a confirmar', confirmado: false } : m.tipo === 'dj' ? { ...m, artista: 'DJ a confirmar', confirmado: false, djId: null } : m));
  sabado.djSesionId = null;

  const profiles = [
    { id: 'prf-lucia', alias: 'Lucía (perfil de prueba)', ficticio: true as const, aceptaPublicidad: false },
    { id: 'prf-caro', alias: 'Caro (perfil de prueba)', ficticio: true as const, aceptaPublicidad: true },
    { id: 'prf-tomas', alias: 'Tomás (perfil de prueba)', ficticio: true as const, aceptaPublicidad: false },
  ];
  const pastJornadas = ['2026-09-05', '2026-09-12', '2026-09-26', '2026-10-03', '2026-10-17', '2026-10-24', '2026-10-31', '2026-11-07'];
  const visits = [
    ...pastJornadas.slice(0, 7).map((j, i) => ({ id: `vis-l${i}`, profileId: 'prf-lucia', jornada: j, validadaEn: arDateTime(j, '23:30'), validadaPor: 'Juli (Entrega / retiro)', sembrado: true })),
    ...pastJornadas.map((j, i) => ({ id: `vis-c${i}`, profileId: 'prf-caro', jornada: j, validadaEn: arDateTime(j, '23:10'), validadaPor: 'Juli (Entrega / retiro)', sembrado: true })),
    ...pastJornadas.slice(5, 7).map((j, i) => ({ id: `vis-t${i}`, profileId: 'prf-tomas', jornada: j, validadaEn: arDateTime(j, '00:40'), validadaPor: 'Juli (Entrega / retiro)', sembrado: true })),
  ];

  return {
    schema: SCHEMA,
    rev: 0,
    seq: 1000,
    rng: 20261121,
    now: arDateTime(DEMO_JORNADA, '20:40'),
    config: {
      supuestos: { pizzas_precio_encabezado: true, empanadas_docena: true, whisky_vasos: false },
      ginFrutosRojos: { habilitado: false, recargo: 100000 },
      plazoPagoSeg: 300,
      plazoRondaSeg: 600,
      alertaListoMin: 15,
      preciosDemo: {},
      disponibilidad: { 'terraco-034:0': 'agotado', 'terraco-030:0': 'pausado' },
      categoriasPausadas: {},
      codigoNoche: 'SOL2111',
      contingencia: false,
    },
    insumos: {
      'fernet-750': { nombre: 'Fernet Branca 750 cc', stock: 6 },
      'coca-lata': { nombre: 'Coca Cola lata', stock: 40 },
      moet: { nombre: 'Moet CH BR', stock: 1 },
      rabas: { nombre: 'Porciones de rabas', stock: 4 },
    },
    holds: [],
    stations: { cocina: { online: true, ultimaSync: 0, caidaDesde: null }, barra: { online: true, ultimaSync: 0, caidaDesde: null } },
    nights: [
      { id: 'noche-2111', jornada: DEMO_JORNADA, titulo: 'Noche de demostración · cena, show y DJ', publicada: cfg, borrador: null, publicadaEn: arDateTime('2026-11-20', '18:00'), publicadaPor: 'Nico (Encargado)', plantillaOrigen: 'tpl-sabado', historial: [] },
      { id: 'noche-2711', jornada: '2026-11-27', titulo: 'Viernes de demostración · cena y DJ', publicada: viernes, borrador: null, publicadaEn: arDateTime('2026-11-20', '18:10'), publicadaPor: 'Nico (Encargado)', plantillaOrigen: null, historial: [] },
      { id: 'noche-2811', jornada: '2026-11-28', titulo: 'Sábado de demostración (borrador)', publicada: null, borrador: sabado, publicadaEn: null, publicadaPor: null, plantillaOrigen: 'tpl-sabado', historial: [] },
    ],
    templates: [{ id: 'tpl-sabado', nombre: 'Sábado: cena + show + DJ', config: { ...baseNightConfig(), djSesionId: null, momentos: baseNightConfig().momentos.map((m) => ({ ...m, confirmado: false })) }, creadaEn: arDateTime('2026-11-01', '12:00') }],
    orders: [],
    intents: [],
    cobros: [],
    refunds: [],
    incidents: [],
    reservations: [],
    djs: [
      {
        id: 'dj-aurora',
        nombre: 'DJ ZETA (perfil ficticio)',
        descripcion: 'Perfil de prueba para la demo. Sets de cumbia, reggaetón y clásicos para cerrar la noche.',
        generos: ['Cumbia', 'Reggaetón', 'Cuarteto', 'Clásicos de boliche'],
        enlaces: [
          { id: 'e1', tipo: 'playlist', etiqueta: 'Playlist de referencia (enlace de ejemplo)', url: 'https://example.com/playlist-aurora' },
          { id: 'e2', tipo: 'sesion', etiqueta: 'Sesión grabada (enlace de ejemplo)', url: 'https://example.com/sesion-aurora' },
        ],
        repertorioConfirmado: ['Cumbia', 'Reggaetón', 'Cuarteto', 'Clásicos 2000', 'Electrónica', 'Rock nacional'],
        ficticio: true,
      },
      {
        id: 'dj-nebula',
        nombre: 'DJ Nébula (perfil ficticio)',
        descripcion: 'Perfil de prueba. Electrónica y pop latino.',
        generos: ['Electrónica', 'Pop latino'],
        enlaces: [{ id: 'e1', tipo: 'playlist', etiqueta: 'Playlist de referencia (enlace de ejemplo)', url: 'https://example.com/playlist-nebula' }],
        repertorioConfirmado: ['Electrónica', 'Pop latino', 'House'],
        ficticio: true,
      },
    ],
    sessions: [
      { id: 'ses-aurora', djId: 'dj-aurora', jornada: DEMO_JORNADA, inicio: '00:30', fin: '05:00', asistenteId: null, permisosAsistente: [] },
      { id: 'ses-nebula', djId: 'dj-nebula', jornada: '2026-11-27', inicio: '00:30', fin: '05:00', asistenteId: null, permisosAsistente: [] },
    ],
    pollTemplates: [
      { id: 'pt-genero', tipo: 'genero', titulo: 'Próximo género', pregunta: '¿Qué sigue en la pista?', opciones: ['Cumbia', 'Reggaetón', 'Cuarteto', 'Electrónica', 'Rock nacional'] },
      { id: 'pt-tema', tipo: 'tema', titulo: 'Bloque temático', pregunta: '¿Qué bloque ponemos?', opciones: ['Clásicos 2000', 'Hits del verano', 'Lentos', 'Cachengue'] },
      { id: 'pt-artista', tipo: 'artista', titulo: 'Artista para el próximo bloque', pregunta: '¿A quién escuchamos ahora?', opciones: ['Artista A (de la lista del DJ)', 'Artista B (de la lista del DJ)', 'Artista C (de la lista del DJ)'] },
    ],
    polls: [],
    preferencePolls: [
      {
        id: 'pref-1',
        pregunta: '¿Qué estilo te gustaría para una próxima fecha?',
        opciones: [
          { id: 'a', label: 'Noche de cuarteto' },
          { id: 'b', label: 'Electrónica' },
          { id: 'c', label: 'Clásicos 2000' },
        ],
        votos: { 'seed-v1': 'a', 'seed-v2': 'a', 'seed-v3': 'b', 'seed-v4': 'c', 'seed-v5': 'a', 'seed-v6': 'c', 'seed-v7': 'b' },
        abierta: true,
        aclaracion: 'Consulta orientativa. TERRACO decide la programación según disponibilidad y criterio propio; no es una contratación.',
      },
    ],
    nightAccess: { [DEMO_JORNADA]: Array.from({ length: 9 }, (_, i) => `seed-acc-${i + 1}`) },
    profiles,
    visits,
    coupons: [
      {
        id: 'cup-caro-8',
        codigo: 'DEMO-CARO8',
        profileId: 'prf-caro',
        descripcion: '15% (tope $ 5.000) en comida y bebidas sin alcohol — beneficio de ejemplo',
        porcentaje: 15,
        tope: 500000,
        categoriasAplicables: 'comida_y_sin_alcohol',
        estado: 'disponible',
        emitidoEn: arDateTime('2026-11-07', '23:10'),
        venceEn: arDateTime('2026-12-07', '23:10'),
        hito: 8,
        orderId: null,
        historial: [{ at: arDateTime('2026-11-07', '23:10'), by: 'Sistema', msg: 'Emitido al validar la visita 8 (dato sembrado)' }],
      },
    ],
    benefitRule: { umbralVisitas: 8, porcentaje: 15, tope: 500000, vigenciaDias: 30, aplicaA: 'comida_y_sin_alcohol', condiciones: 'Regla de ejemplo para evaluar con el dueño. No es una promoción vigente. Una visita por persona y noche, validada por el personal. No acumulable con otros cupones.' },
    rounds: [],
    tables: [
      { id: 'demo-mesa-1', nombre: 'Mesa 1', plazas: 4 },
      { id: 'demo-mesa-2', nombre: 'Mesa 2', plazas: 4 },
      { id: 'demo-mesa-3', nombre: 'Mesa 3', plazas: 4 },
      { id: 'demo-mesa-4', nombre: 'Mesa 4', plazas: 4 },
      { id: 'demo-mesa-5', nombre: 'Mesa 5', plazas: 6 },
      { id: 'demo-mesa-6', nombre: 'Mesa 6', plazas: 6 },
    ],
    tableSessions: Array.from({ length: 6 }, (_, i) => ({ id: `ocup-ini-${i + 1}`, mesaId: `demo-mesa-${i + 1}`, abiertaEn: arDateTime(DEMO_JORNADA, '20:30'), cerradaEn: null })),
    links: [
      { id: 'lnk-ig', codigo: 'ig-2111', origen: 'instagram', etiqueta: 'Instagram TERRACO · historia de la fecha', jornada: DEMO_JORNADA, creadoEn: arDateTime('2026-11-19', '12:00') },
      { id: 'lnk-dj', codigo: 'dj-zeta', origen: 'dj', etiqueta: 'Difusión de DJ ZETA', jornada: DEMO_JORNADA, creadoEn: arDateTime('2026-11-19', '12:00') },
    ],
    linkVisits: [
      ...Array.from({ length: 14 }, (_, i) => ({ linkId: 'lnk-ig', visitorId: `seed-ig-${i}`, en: arDateTime('2026-11-20', '19:00') + i * 7 * MIN })),
      ...Array.from({ length: 6 }, (_, i) => ({ linkId: 'lnk-dj', visitorId: `seed-dj-${i}`, en: arDateTime('2026-11-20', '21:00') + i * 9 * MIN })),
    ],
    staff: [
      { id: 'st-sofia', nombre: 'Sofía', roles: ['caja'] },
      { id: 'st-martin', nombre: 'Martín', roles: ['cocina'] },
      { id: 'st-ana', nombre: 'Ana', roles: ['barra'] },
      { id: 'st-leo', nombre: 'Leo', roles: ['barra', 'entrega'] },
      { id: 'st-juli', nombre: 'Juli', roles: ['entrega', 'caja'] },
      { id: 'st-nico', nombre: 'Nico', roles: ['encargado', 'caja'] },
      { id: 'st-duenio', nombre: 'Dueño/a (demo)', roles: ['dueno'] },
      { id: 'st-aurora', nombre: 'DJ ZETA', roles: ['dj'], djId: 'dj-aurora' },
      { id: 'st-fede', nombre: 'Fede', roles: ['dj_asistente'] },
    ],
    audit: [],
    processed: {},
    processedOrder: [],
    escenario: null,
  };
}

/** Ejecuta comandos sobre el estado y falla si alguno no se aplica (solo para semillas y escenarios). */
export function run(s: State, actor: Actor, cmd: Command): { s: State; data: any } {
  const { state, result } = apply(s, { cid: `seed-${s.seq}-${s.rev}-${cmd.type}-${Math.round(s.now / 1000)}`, actor, cmd });
  if (!result.ok) throw new Error(`Semilla: ${cmd.type} falló: ${result.message}`);
  return { s: state, data: result.data };
}

export const A = {
  sys: { role: 'encargado', staffId: 'st-nico' } as Actor,
  caja: { role: 'caja', staffId: 'st-sofia' } as Actor,
  cocina: { role: 'cocina', staffId: 'st-martin' } as Actor,
  barra: { role: 'barra', staffId: 'st-ana' } as Actor,
  entrega: { role: 'entrega', staffId: 'st-juli' } as Actor,
  cliente: (buyerId: string) => ({ role: 'cliente', buyerId }) as Actor,
};

const L = (presKey: string, precio: number, cantidad = 1, sabor: string | null = null) => ({ presKey, sabor, mods: [], nota: null, cantidad, precioVisto: precio });

function readyAll(s: State, orderId: string): State {
  const o = s.orders.find((x) => x.id === orderId)!;
  const ids = o.lineas.flatMap((l) => l.unidades.map((u) => u.id));
  return run(s, A.sys, { type: 'units.ready', unitIds: ids }).s;
}

function deliverAll(s: State, orderId: string): State {
  const o = s.orders.find((x) => x.id === orderId)!;
  return run(s, A.entrega, { type: 'delivery.deliver', orderId, credencial: o.credencial, unitIds: o.lineas.flatMap((l) => l.unidades.map((u) => u.id)) }).s;
}

const at = (s: State, hhmm: string): State => ({ ...s, now: arDateTime(DEMO_JORNADA, hhmm) });

export function webOrder(s: State, buyer: string, lines: ReturnType<typeof L>[], approve = true): { s: State; orderId: string } {
  let r = run(s, A.cliente(buyer), { type: 'checkout.start', lines, modalidad: 'retiro', alias: 'Cliente sembrado (ficticio)' });
  const { orderId, intentId } = r.data;
  if (approve) r = run(r.s, A.sys, { type: 'payment.simulate', intentId, resultado: 'aprobar' });
  return { s: r.s, orderId };
}

export function createSeedState(): State {
  let s = baseState();
  // Pedidos sembrados entre 20:45 y 21:55 (ficticios, identificados en informes).
  s = at(s, '20:45');
  let r = webOrder(s, 'seed-b1', [L('terraco-088:0', 2000000), L('terraco-001:0', 800000, 2, 'Frutilla')]);
  s = at(r.s, '21:02');
  s = readyAll(s, r.orderId);
  s = deliverAll(s, r.orderId);

  s = at(s, '21:05');
  let c = run(s, A.caja, { type: 'caja.createOrder', lines: [L('terraco-061:1', 2000000)], metodo: 'efectivo', alias: 'Mesa de la ventana', modalidad: 'retiro' });
  s = run(c.s, A.caja, { type: 'caja.registerCash', orderId: c.data.orderId }).s;
  s = at(s, '21:09');
  s = readyAll(s, c.data.orderId);
  s = deliverAll(s, c.data.orderId);

  s = at(s, '21:20');
  r = webOrder(s, 'seed-b2', [L('terraco-060:0', 6000000)]);
  s = at(r.s, '21:26');
  s = readyAll(s, r.orderId);
  s = at(s, '21:31');
  s = deliverAll(s, r.orderId);

  s = at(s, '21:40');
  r = webOrder(s, 'seed-b3', [L('terraco-082:0', 800000), L('terraco-072:0', 400000, 2)]);
  const o4 = r.orderId;
  s = at(r.s, '21:44');
  s = run(s, A.cocina, { type: 'station.take', orderId: o4, estacion: 'cocina' }).s;
  const barraUnits = s.orders.find((x) => x.id === o4)!.lineas.filter((l) => l.estacion === 'barra').flatMap((l) => l.unidades.map((u) => u.id));
  s = run(s, A.barra, { type: 'units.ready', unitIds: barraUnits }).s;

  s = at(s, '21:50');
  s = run(s, A.caja, { type: 'caja.createOrder', lines: [L('terraco-005:0', 1000000)], metodo: 'transferencia_manual', alias: 'Grupo cumpleaños', modalidad: 'retiro' }).s;

  s = at(s, '21:55');
  r = webOrder(s, 'seed-b4', [L('terraco-085:0', 1750000), L('terraco-069:0', 700000, 2)]);
  s = r.s;

  // Reservas sembradas (personas ficticias).
  s = at(s, '19:00');
  let rv = run(s, A.sys, { type: 'reservation.create', jornada: DEMO_JORNADA, horario: '21:30', personas: 4, nombre: 'Familia Ramírez (ficticia)', contacto: '+54 9 3725 000-001', notas: '', origen: 'whatsapp_directo' });
  s = run(rv.s, A.sys, { type: 'reservation.setState', id: rv.data.id, estado: 'confirmada', mesa: 'demo-mesa-5' }).s;
  s = at(s, '21:35');
  s = run(s, A.sys, { type: 'reservation.setState', id: rv.data.id, estado: 'llegada' }).s;
  s = at(s, '21:45');
  rv = run(s, A.cliente('seed-b5'), { type: 'reservation.create', jornada: DEMO_JORNADA, horario: '22:30', personas: 2, nombre: 'Paula (ficticia)', contacto: '+54 9 3725 000-002', notas: 'Si puede ser cerca del escenario', origen: 'web', linkCodigo: 'ig-2111' });
  s = rv.s;
  s = at(s, '21:30');
  rv = run(s, A.cliente('seed-b6'), { type: 'reservation.create', jornada: '2026-11-27', horario: '21:30', personas: 6, nombre: 'Grupo Medina (ficticio)', contacto: '+54 9 3725 000-003', notas: '', origen: 'web', linkCodigo: 'dj-zeta' });
  s = run(rv.s, A.sys, { type: 'reservation.setState', id: rv.data.id, estado: 'contacto_realizado' }).s;
  s = run(s, A.sys, { type: 'reservation.setState', id: rv.data.id, estado: 'confirmada' }).s;

  // Marcar todo lo sembrado como ficticio y llevar el reloj al inicio de la demo.
  s = structuredClone(s);
  for (const o of s.orders) o.sembrado = true;
  for (const cb of s.cobros) cb.sembrado = true;
  for (const rr of s.reservations) rr.sembrado = true;
  s.audit = [{ at: DEMO_START, by: 'Sistema', role: 'sistema', msg: 'Demo iniciada con datos sembrados ficticios', tipo: 'demo' }];
  s.processed = {};
  s.processedOrder = [];
  s.now = DEMO_START;
  for (const st of Object.values(s.stations)) st.ultimaSync = DEMO_START;
  s.rev = 1;
  return s;
}

export const HOURS = HOUR;
