# TERRACO Social Club · Demo (proyecto JODA)

Aplicación web de demostración para recorrer el servicio completo de TERRACO con el dueño, el encargado, el equipo y el DJ. **Datos, horarios y pagos de prueba.** No cobra, no envía mensajes y no tiene backend ni integraciones con servicios externos.

## Alcance de la demo

Todas las vistas comparten el mismo estado (entre pestañas de un mismo navegador):

- **Cliente:** carta, carrito, pago simulado, seguimiento y credencial de retiro, reservas (consulta con borrador de WhatsApp), «Esta noche» con encuesta del DJ, beneficios y ronda entre amigos.
- **Equipo:** caja, cocina, barra, entrega (completa o parcial), encargado, dueño e informes.
- **DJ y sala:** panel del DJ y de su asistente, y pantalla pública (TV).
- **Demostración:** escenarios, reloj controlado, reinicio y página de límites (qué es real, supuesto o simulado).

No es un producto listo para operar. Ver [Limitaciones conocidas](#limitaciones-conocidas).

## Requisitos

- **Node.js 22.12 o superior** (admitidos: `^22.12.0`, `^24.0.0` o `>=26`, por Vitest). Probado con Node 24.22.1.
- npm (incluido con Node; probado con npm 11.19.1).
- Git.
- Un navegador moderno (Chrome, Edge, Firefox o Safari recientes). Solo se verificó en Chromium.

## Instalación

El repositorio es privado: hay que tener acceso como colaborador y estar autenticado en GitHub (por ejemplo, con `gh auth login`).

```bash
git clone https://github.com/adonaigalarza0402-sudo/terraco-joda.git
```

```bash
cd terraco-joda
```

```bash
npm ci
```

`npm ci` instala exactamente las versiones de `package-lock.json`. Usá `npm install` solo para agregar o actualizar dependencias, y subí el lockfile junto con el cambio.

## Iniciar, compilar y probar

Todos los comandos se ejecutan desde la raíz del repositorio.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en <http://127.0.0.1:5180/> |
| `npm run build` | Revisa los tipos y compila en `dist/` |
| `npm run preview` | Sirve la versión compilada en <http://127.0.0.1:4173/> (requiere `npm run build` antes) |
| `npm test` | Pruebas de dominio con Vitest (25 pruebas) |
| `npm run typecheck` | Solo revisión de tipos |

## Configuración de ejemplo

La demo **no necesita variables de entorno, claves ni archivo `.env`**; por eso no hay `.env.example`. No agregues credenciales al repositorio: todo lo que está en el frontend es visible para quien use la app.

| Qué | Dónde |
| --- | --- |
| Puertos y host (`5180` y `4173`, solo `127.0.0.1`; si el puerto está ocupado, no se elige otro) | `vite.config.ts` |
| Datos ficticios de la noche, personal, mesas, stock y DJ | `src/domain/seed.ts` |
| Escenarios de demostración | `src/domain/scenarios.ts` |
| Carta base | `datos/catalogo_base.json` (se importa sin modificar) |
| Contacto público del local que muestra la portada | `src/views/client/Home.tsx` |
| Referencia de hechos y supuestos (la app no lo lee) | `datos/negocio_y_supuestos.json` |

## Rutas por rol

Cada pestaña del navegador guarda su propio rol y carrito. Abrí varias pestañas para ver cómo se actualizan juntas. El selector de rol es un **acceso de demostración**, no un inicio de sesión.

| Rol | Ruta | Atajo que fija el rol en una pestaña nueva |
| --- | --- | --- |
| Cliente (carta, mis pedidos, esta noche; beneficios y reservas desde el menú) | `#/carta`, `#/pedido`, `#/noche`, `#/beneficios`, `#/` (el lugar) | `#/acceso?rol=cliente` |
| Cliente identificado de prueba | `#/beneficios` | `#/acceso?rol=cliente_id&perfil=prf-caro` |
| Consulta de reserva | `#/reserva` | — |
| Ronda entre amigos (simulación avanzada) | `#/ronda/nueva` (desde el carrito) | — |
| Mesa (QR permanente) | `#/mesa/demo-mesa-3` | — |
| Caja | `#/caja` | `#/acceso?rol=caja&staff=st-sofia` |
| Cocina | `#/cocina` | `#/acceso?rol=cocina&staff=st-martin` |
| Barra | `#/barra` | `#/acceso?rol=barra&staff=st-ana` (segunda barra: `st-leo`) |
| Entrega | `#/entrega` | `#/acceso?rol=entrega&staff=st-juli` |
| Encargado | `#/encargado` | `#/acceso?rol=encargado&staff=st-nico` |
| Dueño | `#/dueno` | `#/acceso?rol=dueno&staff=st-duenio` |
| DJ | `#/dj` | `#/acceso?rol=dj&staff=st-aurora` |
| Asistente del DJ | `#/dj` | `#/acceso?rol=dj_asistente&staff=st-fede` |
| Pantalla pública (TV) | `#/pantalla` | — |
| Herramientas de demostración | `#/demo` | — |
| Límites (real / supuesto / simulado) | `#/limites` | — |

## Reiniciar la demo

`#/demo` → **Reiniciar demo…** (pide escribir `REINICIAR`). También se puede cargar un escenario desde ahí. Ambos reemplazan los datos de este navegador para todas sus pestañas. Como alternativa, borrar el almacenamiento del sitio en el navegador vuelve a la semilla.

## Limitaciones conocidas

- **Sin servidor ni base de datos.** El estado vive en `localStorage`. Teléfonos, computadoras o navegadores distintos **no comparten datos**.
- **Sin seguridad real.** El selector de rol y las restricciones de interfaz no son autorización.
- La protección contra acciones simultáneas (Web Locks) solo vale entre pestañas del mismo navegador y origen.
- **Todo cobro es simulado:** pagos, devoluciones y comprobantes (no fiscales). No hay envío de WhatsApp ni notificaciones.
- Horarios, stock, mesas, personal, artistas y beneficios son ficticios. La carta y los precios salen de material recibido y falta que el local los valide. No cargar datos de clientes reales.
- La lectura de QR por cámara y la lista de espera de reservas no están incluidas.
- No hay pruebas automatizadas de interfaz de extremo a extremo.
- No se probó en teléfonos físicos, Safari, Firefox ni con lector de pantalla.
- El paquete de JavaScript supera los 500 kB (Vite lo advierte al compilar); falta dividirlo.
- Faltan logos oficiales vectoriales o transparentes.
- La grabación de Instagram de referencia (`recursos/referencias/instagram_referencia.mp4`) no está en el repositorio porque muestra usuarios y caras de terceros. La app no la usa.
- Parte de la documentación es histórica (encargo, validaciones fechadas) y puede describir estados anteriores.

Más detalle: [DECISIONES_Y_PENDIENTES.md](DECISIONES_Y_PENDIENTES.md) y [VALIDACION.md](VALIDACION.md).

## Cómo está hecha

- Vite + React 19 + TypeScript. Sin backend.
- `src/domain/catalog.ts` deriva la carta navegable desde `datos/catalogo_base.json` conservando fuente, texto original y advertencias.
- `src/domain/engine.ts` es la **autoridad de simulación**: todas las transiciones (pedido, pago, estación, entrega, devolución, reserva, encuesta, beneficio, ronda, noche) pasan por ahí, con identificadores estables y efectos idempotentes. Importes en centavos enteros.
- `src/state/store.ts` persiste el estado en `localStorage`, lo sincroniza entre pestañas con `BroadcastChannel` y aplica cada comando dentro de un Web Lock exclusivo.
- `src/domain/seed.ts` y `src/domain/scenarios.ts` generan datos ficticios y escenarios deterministas con un reloj de demo controlado (inicia el sábado 21/11/2026 a las 22:00, fecha ficticia).
- Pruebas: `src/domain/engine.test.ts` (recorridos y reglas de dinero, stock, votos y entrega).

## Trabajo en equipo

Antes de empezar, actualizá `main` (`git pull`). Trabajá en una rama propia, ejecutá `npm run build` y `npm test`, y abrí un pull request.

## Documentación

[GUIA_DEMO.md](GUIA_DEMO.md) · [DECISIONES_Y_PENDIENTES.md](DECISIONES_Y_PENDIENTES.md) · [COBERTURA_DEMO.md](COBERTURA_DEMO.md) · [VALIDACION.md](VALIDACION.md) · [Guía visual](docs/GUIA_VISUAL.md) (capturas en `docs/capturas/`) · encargo original en [PROMPT_MAESTRO_TERRACO.md](PROMPT_MAESTRO_TERRACO.md).
