// Datos de ESTA pestaña (sessionStorage): rol de demostración, carrito, identidad de invitado y mesa.
// Cada pestaña puede representar a una persona distinta para probar el circuito en una sola computadora.
import { useSyncExternalStore } from 'react';
import type { CartLine } from '../domain/engine';
import type { Actor, Role } from '../domain/types';

export interface CartItem extends CartLine {
  key: string;
}

interface SessionData {
  role: Role;
  staffId: string | null;
  profileId: string | null;
  buyerId: string;
  identity: string;
  alias: string;
  cart: CartItem[];
  couponId: string | null;
  mesaSesionId: string | null;
  mesaId: string | null;
  lastLink: string | null;
  favorites: string[];
  introSeen: boolean;
  repiteDe: string | null;
  contexto: 'auto' | 'cena' | 'show' | 'joda';
  reservas: string[];
  rondas: string[];
}

const KEY = 'terraco-demo:session';
const FAV_KEY = 'terraco-demo:favoritos';

function rid(p: string) {
  return `${p}-${Math.random().toString(36).slice(2, 8)}`;
}

function initial(): SessionData {
  let favorites: string[] = [];
  try {
    favorites = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]');
  } catch {
    /* sin almacenamiento */
  }
  return { role: 'cliente', staffId: null, profileId: null, buyerId: rid('inv'), identity: rid('id'), alias: '', cart: [], couponId: null, mesaSesionId: null, mesaId: null, lastLink: null, favorites, introSeen: false, repiteDe: null, contexto: 'auto', reservas: [], rondas: [] };
}

function read(): SessionData {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...initial(), ...JSON.parse(raw) };
  } catch {
    /* sin almacenamiento */
  }
  return initial();
}

let data = read();
const listeners = new Set<() => void>();

function write(next: SessionData) {
  data = next;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
    localStorage.setItem(FAV_KEY, JSON.stringify(next.favorites));
  } catch {
    /* la demo sigue funcionando en memoria */
  }
  listeners.forEach((l) => l());
}

export const session = {
  get: () => data,
  set(patch: Partial<SessionData>) {
    write({ ...data, ...patch });
  },
  actor(): Actor {
    return { role: data.role, staffId: data.staffId ?? undefined, buyerId: data.buyerId, profileId: data.profileId ?? undefined };
  },
  /** Identidad usada para votar: perfil de prueba o invitado de esta pestaña. */
  voter(): string {
    return data.profileId ?? data.identity;
  },
  addToCart(item: Omit<CartItem, 'key'>) {
    const same = data.cart.find((c) => c.presKey === item.presKey && c.sabor === item.sabor && c.mods.join() === item.mods.join() && (c.nota ?? '') === (item.nota ?? ''));
    if (same) write({ ...data, cart: data.cart.map((c) => (c === same ? { ...c, cantidad: Math.min(30, c.cantidad + item.cantidad), precioVisto: item.precioVisto } : c)) });
    else write({ ...data, cart: [...data.cart, { ...item, key: rid('c') }] });
  },
  setQty(key: string, cantidad: number) {
    write({ ...data, cart: cantidad <= 0 ? data.cart.filter((c) => c.key !== key) : data.cart.map((c) => (c.key === key ? { ...c, cantidad: Math.min(30, cantidad) } : c)) });
  },
  clearCart() {
    write({ ...data, cart: [], couponId: null, repiteDe: null });
  },
  toggleFav(id: string) {
    write({ ...data, favorites: data.favorites.includes(id) ? data.favorites.filter((f) => f !== id) : [...data.favorites, id] });
  },
};

export function useSession(): SessionData {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => data,
  );
}
