// Escenarios del laboratorio: parten de la semilla y aplican comandos deterministas.
import { unitPrice } from './engine';
import { A, createSeedState, DEMO_JORNADA, run, webOrder } from './seed';
import { arDateTime } from './time';
import type { State } from './types';

const L = (s: State, presKey: string, cantidad = 1, sabor: string | null = null) => ({ presKey, sabor, mods: [], nota: null, cantidad, precioVisto: unitPrice(s, presKey, [])! });

export interface Scenario {
  id: string;
  titulo: string;
  descripcion: string;
  build: () => State;
}

const mark = (s: State, nombre: string) => run(s, A.sys, { type: 'scenario.mark', nombre }).s;

export const SCENARIOS: Scenario[] = [
  {
    id: 'base',
    titulo: 'Noche base (22:00)',
    descripcion: 'Cena en curso, show a las 22:30, DJ desde las 00:30. Algunos pedidos sembrados en cola.',
    build: () => mark(createSeedState(), 'Noche base'),
  },
  {
    id: 'pico',
    titulo: 'Pico de barra',
    descripcion: 'Seis pedidos de tragos llegan juntos: probá la vista agrupada por producto y variante.',
    build: () => {
      let s = createSeedState();
      const combos: [string, string | null][] = [['terraco-001:0', 'Frutilla'], ['terraco-007:0', 'Tradicional'], ['terraco-001:0', 'Maracuyá'], ['terraco-002:0', 'Frutos rojos'], ['terraco-001:0', 'Frutilla'], ['terraco-007:0', 'Tradicional']];
      combos.forEach(([k, sabor], i) => {
        s = { ...s, now: s.now + 30_000 };
        s = webOrder(s, `pico-${i}`, [L(s, k, 1 + (i % 2), sabor), L(s, 'terraco-061:0')]).s;
      });
      return mark(s, 'Pico de barra');
    },
  },
  {
    id: 'ultima',
    titulo: 'Última unidad disputada',
    descripcion: 'Otra persona (simulada) ya tiene reservada la única botella de Moet CH BR mientras paga. Intentá comprarla.',
    build: () => {
      let s = createSeedState();
      s = run(s, A.cliente('otra-persona'), { type: 'checkout.start', lines: [L(s, 'terraco-038:0')], modalidad: 'retiro', alias: 'Otra persona (simulada)' }).s;
      return mark(s, 'Última unidad disputada');
    },
  },
  {
    id: 'sin_recepcion',
    titulo: 'Barra sin recepción',
    descripcion: 'La barra pierde conexión. Pedidos nuevos de barra quedan pausados; un cobro aprobado queda como incidencia.',
    build: () => {
      let s = createSeedState();
      const r = run(s, A.cliente('sr-1'), { type: 'checkout.start', lines: [L(s, 'terraco-005:0')], modalidad: 'retiro', alias: 'Cliente simulado' });
      s = run(r.s, A.sys, { type: 'station.setOnline', estacion: 'barra', online: false }).s;
      s = run(s, A.sys, { type: 'payment.simulate', intentId: r.data.intentId, resultado: 'aprobar' }).s;
      return mark(s, 'Barra sin recepción');
    },
  },
  {
    id: 'tardia',
    titulo: 'Aprobación tardía',
    descripcion: 'Un pago llega aprobado después de vencer el pedido. Queda como incidencia para decidir cumplir o devolver.',
    build: () => {
      let s = createSeedState();
      const r = run(s, A.cliente('tard-1'), { type: 'checkout.start', lines: [L(s, 'terraco-019:0')], modalidad: 'retiro', alias: 'Cliente simulado' });
      s = run(r.s, A.sys, { type: 'clock.advance', minutes: 6 }).s;
      s = run(s, A.sys, { type: 'payment.simulate', intentId: r.data.intentId, resultado: 'aprobar' }).s;
      return mark(s, 'Aprobación tardía');
    },
  },
  {
    id: 'ronda',
    titulo: 'Ronda entre amigos por vencer',
    descripcion: 'Ronda avanzada de 4 personas con 2 aportes pagos. Cubrí el saldo o avanzá el reloj para ver las devoluciones.',
    build: () => {
      let s = createSeedState();
      const r = run(s, A.cliente('demo-ronda'), { type: 'round.create', lines: [L(s, 'terraco-060:0'), L(s, 'terraco-061:1')], participantes: 4, organizador: 'Mati (ficticio)' });
      const ron = r.s.rounds[r.s.rounds.length - 1];
      s = run(r.s, A.cliente('x'), { type: 'round.pay', roundId: ron.id, cuotaId: ron.cuotas[0].id, pagador: 'Mati (ficticio)' }).s;
      s = run(s, A.cliente('y'), { type: 'round.pay', roundId: ron.id, cuotaId: ron.cuotas[1].id, pagador: 'Sol (ficticia)' }).s;
      return mark(s, 'Ronda por vencer');
    },
  },
  {
    id: 'pre_joda',
    titulo: 'Cambio a joda (00:20)',
    descripcion: 'Reloj a las 00:20 con comida pendiente. Avanzá 10 minutos: la cocina deja de tomar pedidos nuevos y lo aceptado sigue.',
    build: () => {
      let s = createSeedState();
      s = run(s, A.sys, { type: 'clock.set', at: arDateTime(DEMO_JORNADA, '00:20') + 24 * 3600_000 }).s;
      s = webOrder(s, 'joda-1', [L(s, 'terraco-095:0'), L(s, 'terraco-081:0')]).s;
      return mark(s, 'Cambio a joda');
    },
  },
  {
    id: 'encuesta',
    titulo: 'Encuesta del DJ en curso (01:00)',
    descripcion: 'DJ ZETA tiene una encuesta abierta con algunos votos simulados. Votá desde otra pestaña de cliente.',
    build: () => {
      let s = createSeedState();
      s = run(s, A.sys, { type: 'clock.set', at: arDateTime(DEMO_JORNADA, '01:00') + 24 * 3600_000 }).s;
      const dj = { role: 'dj' as const, staffId: 'st-aurora' };
      const r = run(s, dj, { type: 'poll.create', sesionId: 'ses-aurora', pregunta: '¿Qué sigue en la pista?', opciones: ['Cumbia', 'Cuarteto', 'Reggaetón'], duracionMin: 10, minVotos: 5 });
      s = run(r.s, dj, { type: 'poll.open', pollId: r.data.pollId }).s;
      ['seed-acc-1', 'seed-acc-2', 'seed-acc-3'].forEach((id, i) => {
        s = run(s, A.cliente(id), { type: 'poll.vote', pollId: r.data.pollId, identity: id, opcionId: i === 2 ? 'op2' : 'op1' }).s;
      });
      return mark(s, 'Encuesta en curso');
    },
  },
];
