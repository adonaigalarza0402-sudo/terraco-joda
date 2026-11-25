// Carta real de TERRACO: se importa del JSON del paquete sin modificarlo.
// Este módulo solo deriva una estructura navegable y conserva fuente, texto original y advertencias.
import raw from '../../datos/catalogo_base.json';

export type Station = 'cocina' | 'barra';

/** Supuestos de demo que pueden habilitar presentaciones que la carta no deja claras. */
export type SupuestoId = 'pizzas_precio_encabezado' | 'empanadas_docena' | 'whisky_vasos';

export interface Presentation {
  idx: number;
  key: string; // `${refId}:${idx}`
  etiqueta: string; // texto para mostrar
  nota: string | null; // aclaración de la fuente (p. ej. "volumen no publicado")
  etiquetaFuente: string;
  precio: number | null; // centavos; null = no publicado como total
  precioUnitarioFuente: number | null; // p. ej. empanadas "x4: $2.000 c/u"
  cantidadPack: number | null;
  /** publicado: se vende tal cual; supuesto: solo si el supuesto de demo está activo; consultable: no se vende en la app. */
  tipo: 'publicado' | 'supuesto' | 'consultable';
  supuesto: SupuestoId | null;
  motivo: string | null;
  extraPendiente: string | null;
}

export interface Product {
  id: string;
  categoria: string;
  nombre: string;
  descripcion: string;
  variantesTexto: string;
  sabores: string[];
  precioTexto: string;
  presentaciones: Presentation[];
  observaciones: string;
  fuenteCodigo: string;
  fuenteArchivo: string;
  estacion: Station;
  /** Gin: frutos rojos aparece sin recargo publicado. */
  frutosRojosConsultable: boolean;
  search: string;
}

interface RawOption {
  etiqueta_fuente: string;
  precio_total_centavos?: number | null;
  precio_unitario_centavos?: number;
  cantidad?: number;
  rotulo_cantidad?: number;
  requiere_confirmacion?: boolean;
  motivo_confirmacion?: string | null;
  extra_pendiente?: string;
  pendiente?: string;
}
interface RawRef {
  id: string;
  categoria: string;
  nombre: string;
  descripcion_publicada: string;
  variantes_texto_publicado: string;
  sabores_publicados: string[];
  precio_texto_publicado: string;
  opciones_precio_transcritas: RawOption[];
  observaciones: string;
  fuente_codigo: string;
  fuente_archivo: string;
}

export const FOOD_CATEGORIES = ['Entradas para compartir', 'Sándwiches', 'Pizzas', 'Empanadas'];

export const CATEGORY_GROUPS: { id: string; nombre: string; categorias: string[] }[] = [
  { id: 'comida', nombre: 'Para compartir', categorias: FOOD_CATEGORIES },
  { id: 'tragos', nombre: 'Tragos', categorias: ['Tragos', 'Tragos especiales', 'TerraTikis'] },
  { id: 'cervezas', nombre: 'Cervezas y fernet', categorias: ['Cerveza', 'Chopp cerveza', 'Fernet Branca'] },
  { id: 'botellas', nombre: 'Botellas y destilados', categorias: ['Whisky', 'Vodka', 'Gin', 'Licor', 'Champagne', 'Vinos'] },
  { id: 'sin', nombre: 'Sin alcohol y energizantes', categorias: ['Sin alcohol', 'Energizantes'] },
];

// No capitaliza rótulos de cantidad como «x1» o «x4».
const cap = (s: string) => (s && !/^x\d/.test(s) ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPresentation(ref: RawRef, o: RawOption, idx: number): Presentation {
  const key = `${ref.id}:${idx}`;
  let [label, note] = o.etiqueta_fuente.split(':').map((s) => s.trim());
  if (/^presentacion de carta$/i.test(normalize(label))) label = 'Presentación de carta';
  if (ref.sabores_publicados.length && label.includes(';')) label = 'Presentación de carta';
  let etiqueta = cap(label);
  let tipo: Presentation['tipo'] = 'publicado';
  let supuesto: SupuestoId | null = null;
  const precio = typeof o.precio_total_centavos === 'number' ? o.precio_total_centavos : null;

  if (/^icono vaso 1/i.test(o.etiqueta_fuente)) {
    etiqueta = 'Vaso (ícono simple)';
    note = 'Volumen pendiente de confirmar';
  }
  if (/^icono vaso con 2/i.test(o.etiqueta_fuente)) {
    etiqueta = 'Vaso (ícono con «2»)';
    note = 'Significado pendiente: no se presume medida doble';
  }
  if (o.requiere_confirmacion) {
    if (ref.categoria === 'Pizzas') supuesto = 'pizzas_precio_encabezado';
    else if (ref.categoria === 'Empanadas' && o.cantidad === 12) supuesto = 'empanadas_docena';
    else if (ref.categoria === 'Whisky') supuesto = 'whisky_vasos';
    tipo = supuesto ? 'supuesto' : 'consultable';
  }
  if (precio === null) tipo = 'consultable';
  if (ref.categoria === 'Empanadas') {
    if (o.cantidad === 12) {
      etiqueta = 'x12 (docena de un mismo sabor)';
      note = 'Presentación de prueba configurada para la demo';
    } else {
      etiqueta = 'x4 · $2.000 c/u según carta';
      note = 'Consultar: no se publica precio de pack ni mínimo';
    }
  }
  return {
    idx,
    key,
    etiqueta,
    nota: note ?? null,
    etiquetaFuente: o.etiqueta_fuente,
    precio,
    precioUnitarioFuente: o.precio_unitario_centavos ?? null,
    cantidadPack: o.cantidad ?? null,
    tipo,
    supuesto,
    motivo: o.motivo_confirmacion ?? o.pendiente ?? null,
    extraPendiente: o.extra_pendiente ?? null,
  };
}

const refs = (raw as unknown as { referencias: RawRef[] }).referencias;

export const PRODUCTS: Product[] = refs.map((r) => ({
  id: r.id,
  categoria: r.categoria,
  nombre: r.nombre,
  descripcion: r.descripcion_publicada,
  variantesTexto: r.variantes_texto_publicado,
  sabores: r.sabores_publicados.map(cap),
  precioTexto: r.precio_texto_publicado,
  presentaciones: r.opciones_precio_transcritas.map((o, i) => buildPresentation(r, o, i)),
  observaciones: r.observaciones,
  fuenteCodigo: r.fuente_codigo,
  fuenteArchivo: r.fuente_archivo,
  estacion: FOOD_CATEGORIES.includes(r.categoria) ? 'cocina' : 'barra',
  frutosRojosConsultable: r.opciones_precio_transcritas.some((o) => !!o.extra_pendiente),
  search: normalize(`${r.nombre} ${r.categoria} ${r.descripcion_publicada} ${r.variantes_texto_publicado}`),
}));

export const CATEGORIES: { nombre: string; referencias: number }[] = (raw as unknown as { categorias: { nombre: string; referencias: number }[] }).categorias;

export const CATALOG_META = {
  advertencia: (raw as unknown as { advertencia: string }).advertencia,
  referencias: PRODUCTS.length,
  categorias: CATEGORIES.length,
  fecha: (raw as unknown as { fecha_transcripcion: string }).fecha_transcripcion,
};

const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
export const productById = (id: string) => byId.get(id);

export function presentationByKey(key: string): { product: Product; pres: Presentation } | undefined {
  const [id, idx] = key.split(':');
  const product = byId.get(id);
  const pres = product?.presentaciones[Number(idx)];
  return product && pres ? { product, pres } : undefined;
}

export function searchProducts(q: string, list: Product[] = PRODUCTS): Product[] {
  const n = normalize(q);
  if (!n) return list;
  const terms = n.split(' ');
  return list.filter((p) => terms.every((t) => p.search.includes(t)));
}

/** Componentes conocidos (solo donde la carta publica la composición o para escenarios rotulados). */
export const COMPONENTS: Record<string, { insumo: string; qty: number }[]> = {
  'terraco-060:0': [
    { insumo: 'fernet-750', qty: 1 },
    { insumo: 'coca-lata', qty: 5 },
  ],
  'terraco-072:0': [{ insumo: 'coca-lata', qty: 1 }],
  'terraco-038:0': [{ insumo: 'moet', qty: 1 }],
  'terraco-085:0': [{ insumo: 'rabas', qty: 1 }],
};

export const SOURCE_FILES: Record<string, string> = {
  M1: 'Carta de tragos',
  M2: 'Tragos especiales y TerraTikis',
  M3: 'Whisky, licor, champagne, vodka, gin y energizantes',
  M4: 'Vinos, fernet, cerveza, chopp y sin alcohol',
  M5: 'Comidas para compartir',
};
