import type { Role } from './types';

export const ROLE_LABEL: Record<Role, string> = {
  cliente: 'Cliente invitado',
  cliente_id: 'Cliente identificado (prueba)',
  caja: 'Caja',
  cocina: 'Cocina',
  barra: 'Barra',
  entrega: 'Entrega / retiro',
  encargado: 'Encargado',
  dueno: 'Dueño',
  dj: 'DJ',
  dj_asistente: 'Asistente del DJ',
};

export const ROLE_HOME: Record<Role, string> = {
  cliente: '/',
  cliente_id: '/',
  caja: '/caja',
  cocina: '/cocina',
  barra: '/barra',
  entrega: '/entrega',
  encargado: '/encargado',
  dueno: '/dueno',
  dj: '/dj',
  dj_asistente: '/dj',
};

export const STAFF_ROLES: Role[] = ['caja', 'cocina', 'barra', 'entrega', 'encargado', 'dueno', 'dj', 'dj_asistente'];

/** Permisos de la demo. Son reglas de interfaz y del simulador, no autorización de servidor. */
export const PERMISSIONS: Record<string, Role[]> = {
  comprar: ['cliente', 'cliente_id'],
  caja: ['caja', 'encargado'],
  verificarManual: ['encargado'],
  estacion: ['cocina', 'barra', 'encargado'],
  entregar: ['entrega', 'barra', 'encargado'],
  cancelar: ['caja', 'encargado'],
  incidencias: ['caja', 'encargado'],
  noche: ['encargado'],
  reservasGestion: ['encargado', 'caja'],
  encuestas: ['dj', 'dj_asistente'],
  votar: ['cliente', 'cliente_id'],
  visitas: ['entrega', 'caja', 'encargado'],
  informes: ['encargado', 'dueno'],
  config: ['encargado'],
};

export function can(role: Role, perm: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[perm].includes(role);
}
