// Entidades de operación de la demo. Todos los importes en centavos enteros (ARS).
import type { Station, SupuestoId } from './catalog';

export type Role =
  | 'cliente'
  | 'cliente_id'
  | 'caja'
  | 'cocina'
  | 'barra'
  | 'entrega'
  | 'encargado'
  | 'dueno'
  | 'dj'
  | 'dj_asistente';

export interface Actor {
  role: Role;
  /** Persona del equipo (ficticia) o comprador/a. */
  staffId?: string;
  buyerId?: string;
  profileId?: string;
}

export type Canal = 'web' | 'caja';
export type Metodo = 'digital_demo' | 'efectivo' | 'transferencia_manual';
export type Modalidad = 'retiro' | 'mesa';

export type UnitState = 'pendiente' | 'en_preparacion' | 'lista' | 'entregada' | 'cancelada';

export interface Unit {
  id: string;
  estado: UnitState;
  listaEn?: number;
  entregadaEn?: number;
  entregadaPor?: string;
  inicioEn?: number;
  reembolsoId?: string;
}

export interface OrderLine {
  id: string;
  refId: string;
  presKey: string;
  nombre: string;
  presentacion: string;
  categoria: string;
  sabor: string | null;
  modificadores: { id: string; etiqueta: string; recargo: number; ficticio: boolean }[];
  nota: string | null;
  precioUnitario: number; // congelado al confirmar
  cantidad: number;
  estacion: Station;
  unidades: Unit[];
}

export interface Ticket {
  estacion: Station;
  enviadoEn: number;
  recibidoEn: number | null;
  /** Recepción en papel/manual durante contingencia. */
  recepcionManual?: { por: string; en: number };
  tomadoPor: string | null;
  tomadoEn: number | null;
}

export type PagoEstado =
  | 'pendiente' // intención creada, sin resultado
  | 'aprobado'
  | 'rechazado'
  | 'vencido'
  | 'aprobado_tardio'
  | 'esperando_verificacion' // transferencia manual
  | 'verificado_manual'
  | 'efectivo_registrado';

export type OrderState =
  | 'esperando_pago'
  | 'activo'
  | 'completado'
  | 'pago_rechazado'
  | 'vencido'
  | 'cancelado'
  | 'incidencia'; // pago tardío por resolver

export interface LogEntry {
  at: number;
  by: string;
  msg: string;
}

export interface Order {
  id: string;
  codigo: string; // público, se ve en TV
  credencial: string; // privada, autoriza retiro
  canal: Canal;
  metodo: Metodo;
  buyerId: string | null;
  profileId: string | null;
  alias: string;
  modalidad: Modalidad;
  mesaSesionId: string | null;
  mesaId: string | null;
  lineas: OrderLine[];
  subtotal: number;
  descuento: number;
  total: number;
  cuponId: string | null;
  intentId: string | null;
  pago: PagoEstado;
  estado: OrderState;
  tickets: Ticket[];
  creadoEn: number;
  venceEn: number;
  pagadoEn: number | null;
  jornada: string;
  alertas: string[];
  rondaId: string | null;
  repiteDe: string | null;
  contingencia: boolean;
  sembrado: boolean;
  clientRequestId: string;
  log: LogEntry[];
}

export interface PaymentIntent {
  id: string;
  orderId: string;
  monto: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'vencido' | 'aprobado_tardio';
  creadoEn: number;
  venceEn: number;
  eventos: { at: number; tipo: string; repetido?: boolean }[];
}

/** Cobro registrado (separado de la venta y de la devolución). */
export interface Cobro {
  id: string;
  orderId: string | null;
  rondaId: string | null;
  cuotaId: string | null;
  metodo: Metodo;
  monto: number;
  en: number;
  jornada: string;
  verificadoPor: string | null;
  motivo: string | null;
  tardio: boolean;
  sembrado: boolean;
}

export interface Refund {
  id: string;
  orderId: string | null;
  rondaId: string | null;
  cuotaId: string | null;
  pagador: string;
  monto: number;
  motivo: string;
  estado: 'pendiente' | 'completada' | 'fallida';
  creadoEn: number;
  jornada: string;
  historial: LogEntry[];
}

export type IncidentType =
  | 'pago_pendiente'
  | 'pago_rechazado'
  | 'aprobacion_tardia'
  | 'sin_recepcion'
  | 'no_entregable'
  | 'cancelacion'
  | 'devolucion_fallida'
  | 'entrega_discutida'
  | 'listo_sin_retirar'
  | 'ultima_unidad'
  | 'contingencia';

export interface Incident {
  id: string;
  tipo: IncidentType;
  titulo: string;
  detalle: string;
  orderId: string | null;
  estacion: Station | null;
  estado: 'abierta' | 'resuelta';
  creadaEn: number;
  jornada: string;
  resolucion: string | null;
  resueltaPor: string | null;
}

export interface Hold {
  id: string;
  ref: string; // intentId o rondaId
  insumo: string;
  qty: number;
  venceEn: number;
  estado: 'activa' | 'consumida' | 'liberada';
}

export interface Moment {
  id: string;
  tipo: 'cena' | 'show' | 'dj' | 'cierre';
  titulo: string;
  artista: string | null;
  inicio: string; // HH:MM, relativo a la jornada
  fin: string;
  confirmado: boolean;
  djId: string | null;
}

export interface NightConfig {
  momentos: Moment[];
  categoriasActivas: Record<string, boolean>;
  cocinaNuevasHasta: string; // HH:MM
  barraNuevasHasta: string;
  responsables: Record<'caja' | 'cocina' | 'barra' | 'entrega' | 'encargado', string>;
  puntosRetiro: Record<Station, string>;
  modalidadComida: Modalidad;
  djSesionId: string | null;
  notas: string;
  pendientes: string[];
  reservasHorarios: string[];
  reservasCupoPersonas: number;
}

export interface Night {
  id: string;
  jornada: string;
  titulo: string;
  publicada: NightConfig | null;
  borrador: NightConfig | null;
  publicadaEn: number | null;
  publicadaPor: string | null;
  plantillaOrigen: string | null;
  historial: LogEntry[];
}

export interface NightTemplate {
  id: string;
  nombre: string;
  config: NightConfig;
  creadaEn: number;
}

export type ReservationState =
  | 'consulta_creada'
  | 'contacto_realizado'
  | 'confirmada'
  | 'cambio_propuesto'
  | 'cancelada'
  | 'llegada'
  | 'ausente'
  | 'incompleta';

export interface Reservation {
  id: string;
  ref: string;
  jornada: string;
  horario: string;
  personas: number;
  nombre: string;
  contacto: string;
  notas: string;
  origen: 'web' | 'whatsapp_directo' | 'presencial';
  linkId: string | null;
  estado: ReservationState;
  borradorVisto: boolean;
  enlaceWhatsAppAbierto: boolean;
  creadaEn: number;
  mesaAsignada: string | null;
  propuesta: string | null;
  posibleDuplicado: string | null;
  historial: LogEntry[];
  sembrado: boolean;
}

export interface DJProfile {
  id: string;
  nombre: string;
  descripcion: string;
  generos: string[];
  enlaces: { id: string; tipo: 'playlist' | 'sesion' | 'red'; etiqueta: string; url: string }[];
  repertorioConfirmado: string[];
  ficticio: true;
}

export interface DJSession {
  id: string;
  djId: string;
  jornada: string;
  inicio: string;
  fin: string;
  asistenteId: string | null;
  permisosAsistente: ('crear' | 'abrir' | 'cerrar')[];
}

export interface PollTemplate {
  id: string;
  tipo: 'genero' | 'artista' | 'tema';
  titulo: string;
  pregunta: string;
  opciones: string[];
}

export type PollState = 'borrador' | 'abierta' | 'pausada' | 'cerrada' | 'cancelada';

export interface Poll {
  id: string;
  sesionId: string;
  pregunta: string;
  opciones: { id: string; label: string }[];
  estado: PollState;
  creadaEn: number;
  creadaPor: string;
  abiertaEn: number | null;
  cierraEn: number | null;
  duracionMin: number;
  cerradaEn: number | null;
  pausadaEn: number | null;
  votos: Record<string, string>; // identidad -> opción
  minVotos: number;
  politica: string;
  motivoCancelacion: string | null;
  decisionDJ: { opcionId: string | null; nota: string; en: number } | null;
  historial: LogEntry[];
}

export interface PreferencePoll {
  id: string;
  pregunta: string;
  opciones: { id: string; label: string }[];
  votos: Record<string, string>;
  abierta: boolean;
  aclaracion: string;
}

export interface Profile {
  id: string;
  alias: string;
  ficticio: true;
  aceptaPublicidad: boolean;
}

export interface Visit {
  id: string;
  profileId: string;
  jornada: string;
  validadaEn: number;
  validadaPor: string;
  sembrado: boolean;
}

export interface Coupon {
  id: string;
  codigo: string;
  profileId: string;
  descripcion: string;
  porcentaje: number;
  tope: number;
  categoriasAplicables: string[] | 'comida_y_sin_alcohol';
  estado: 'disponible' | 'reservado' | 'usado' | 'anulado';
  emitidoEn: number;
  venceEn: number;
  hito: number;
  orderId: string | null;
  historial: LogEntry[];
}

export interface BenefitRule {
  umbralVisitas: number;
  porcentaje: number;
  tope: number;
  vigenciaDias: number;
  aplicaA: 'comida_y_sin_alcohol' | 'toda_la_carta';
  condiciones: string;
}

export interface RoundShare {
  id: string;
  indice: number;
  monto: number;
  estado: 'pendiente' | 'pagada' | 'cubierta' | 'devuelta' | 'devolucion_pendiente';
  pagador: string | null;
  pagadaEn: number | null;
}

export interface GroupRound {
  id: string;
  organizador: string;
  buyerId: string;
  lineas: { presKey: string; sabor: string | null; cantidad: number; precioUnitario: number; nombre: string; presentacion: string }[];
  total: number;
  cuotas: RoundShare[];
  creadoEn: number;
  venceEn: number;
  estado: 'abierta' | 'completa' | 'vencida' | 'cancelada';
  invitacion: string;
  invitacionRevocada: boolean;
  orderId: string | null;
  historial: LogEntry[];
}

export interface TableDef {
  id: string;
  nombre: string;
  plazas: number;
}

export interface TableSession {
  id: string;
  mesaId: string;
  abiertaEn: number;
  cerradaEn: number | null;
}

export interface ChannelLink {
  id: string;
  codigo: string;
  origen: 'instagram' | 'dj' | 'otro' | 'desconocido';
  etiqueta: string;
  jornada: string;
  creadoEn: number;
}

export interface LinkVisit {
  linkId: string;
  visitorId: string;
  en: number;
}

export interface StaffMember {
  id: string;
  nombre: string;
  roles: Role[];
  djId?: string;
}

export interface StationStatus {
  online: boolean;
  ultimaSync: number;
  caidaDesde: number | null;
}

export interface DemoConfig {
  supuestos: Record<SupuestoId, boolean>;
  ginFrutosRojos: { habilitado: boolean; recargo: number };
  /** Plazo de la intención de pago y de la reserva de stock asociada. */
  plazoPagoSeg: number;
  plazoRondaSeg: number;
  /** Alerta de pedido listo sin retirar (regla de demo, no plazo de descarte). */
  alertaListoMin: number;
  preciosDemo: Record<string, number>; // presKey -> centavos (modificado en demo)
  disponibilidad: Record<string, 'disponible' | 'pausado' | 'agotado'>;
  categoriasPausadas: Record<string, boolean>;
  codigoNoche: string;
  contingencia: boolean;
  /** Ajuste operativo del encargado para la apariencia del cliente (solo colores). */
  aparienciaOperativa?: 'auto' | 'cena' | 'joda';
}

export interface AuditEntry {
  at: number;
  by: string;
  role: Role | 'sistema';
  msg: string;
  tipo: string;
}

export interface State {
  schema: number;
  rev: number;
  seq: number;
  rng: number;
  now: number;
  config: DemoConfig;
  insumos: Record<string, { nombre: string; stock: number }>;
  holds: Hold[];
  stations: Record<Station, StationStatus>;
  nights: Night[];
  templates: NightTemplate[];
  orders: Order[];
  intents: PaymentIntent[];
  cobros: Cobro[];
  refunds: Refund[];
  incidents: Incident[];
  reservations: Reservation[];
  djs: DJProfile[];
  sessions: DJSession[];
  pollTemplates: PollTemplate[];
  polls: Poll[];
  preferencePolls: PreferencePoll[];
  nightAccess: Record<string, string[]>; // jornada -> identidades con acceso de noche
  profiles: Profile[];
  visits: Visit[];
  coupons: Coupon[];
  benefitRule: BenefitRule;
  rounds: GroupRound[];
  tables: TableDef[];
  tableSessions: TableSession[];
  links: ChannelLink[];
  linkVisits: LinkVisit[];
  staff: StaffMember[];
  audit: AuditEntry[];
  processed: Record<string, Result>;
  processedOrder: string[];
  escenario: string | null;
}

export interface Result {
  ok: boolean;
  message: string;
  code?: string;
  data?: any;
}
