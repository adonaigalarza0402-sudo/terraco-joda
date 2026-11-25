// Estado compartido de la demo en ESTE navegador.
// - Persistencia: localStorage (permite cerrar y volver a abrir la demo).
// - Sincronización entre pestañas del mismo origen: BroadcastChannel + evento "storage".
// - Autoridad única: cada comando se aplica dentro de un Web Lock exclusivo, leyendo el último estado guardado.
// Límite honesto: NO sincroniza teléfonos de distintas personas ni reemplaza un servidor transaccional.
import { useSyncExternalStore } from 'react';
import { apply, type Command } from '../domain/engine';
import { SCENARIOS } from '../domain/scenarios';
import { createSeedState, SCHEMA } from '../domain/seed';
import type { Actor, Result, State } from '../domain/types';
import { session } from './session';

const KEY = 'terraco-demo:state';
const LOCK = 'terraco-demo:authority';
const channel: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('terraco-demo') : null;

function load(): State | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    // Migración de datos de demo guardados: el DJ ficticio «DJ Aurora» pasó a llamarse «DJ ZETA».
    // Solo cambian textos visibles y el código del enlace; los identificadores internos se conservan.
    const s = JSON.parse(raw.replace(/DJ Aurora/g, 'DJ ZETA').replace(/"codigo":"dj-aurora"/g, '"codigo":"dj-zeta"')) as State;
    return s.schema === SCHEMA ? s : null;
  } catch {
    return null;
  }
}

let storageOk = true;
function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    storageOk = true;
  } catch {
    storageOk = false;
  }
}

let state: State = load() ?? (() => {
  const s = createSeedState();
  save(s);
  return s;
})();
const listeners = new Set<() => void>();
let lastSyncAt = Date.now();

function setState(next: State) {
  if (next === state) return;
  state = next;
  lastSyncAt = Date.now();
  listeners.forEach((l) => l());
}

function refreshFromStorage() {
  const s = load();
  if (s && s.rev !== state.rev) setState(s);
  else if (!s) setState(createSeedState());
  lastSyncAt = Date.now();
}

channel?.addEventListener('message', () => refreshFromStorage());
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => e.key === KEY && refreshFromStorage());

async function withLock<T>(fn: () => T): Promise<T> {
  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  if (locks?.request) return locks.request(LOCK, { mode: 'exclusive' }, () => fn()) as Promise<T>;
  return fn();
}

export function newId(prefix = 'cmd') {
  const r = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${prefix}-${r}`;
}

/** Envía un comando a la autoridad de simulación. `cid` permite reintentos idempotentes. */
export async function dispatch(cmd: Command, cid: string = newId(), actor: Actor = session.actor()): Promise<Result> {
  return withLock(() => {
    const latest = load() ?? state;
    const { state: next, result } = apply(latest, { cid, actor, cmd });
    if (next !== latest) {
      save(next);
      channel?.postMessage({ rev: next.rev });
    }
    setState(next);
    return result;
  });
}

export async function resetDemo(scenarioId = 'base'): Promise<void> {
  await withLock(() => {
    const sc = SCENARIOS.find((x) => x.id === scenarioId) ?? SCENARIOS[0];
    const fresh = sc.build();
    fresh.rev = (load()?.rev ?? state.rev) + 1;
    save(fresh);
    channel?.postMessage({ rev: fresh.rev, reset: true });
    setState(fresh);
  });
}

export function getState() {
  return state;
}

export function useStore<T>(selector: (s: State) => T): T {
  const snap = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
  return selector(snap);
}

export function syncInfo() {
  return { lastSyncAt, storageOk, locks: !!(navigator as Navigator & { locks?: LockManager }).locks, broadcast: !!channel };
}
