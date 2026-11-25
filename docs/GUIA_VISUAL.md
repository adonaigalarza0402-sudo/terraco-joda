# Guía visual · apartado de clientes

Rediseño 2 (22/11/2026). Referencia principal: concepto «TERRACO · Dirección visual 01» (carta cena, carta joda y carrito). Implementación: `src/client.css` (tokens y componentes), `src/views/client/ui.tsx` (componentes), `src/state/appearance.ts` (tema).

Capturas comparables: `docs/capturas/antes/` y `docs/capturas/despues/`, tomadas a 390 × 844 px emulados (salvo `11_carta_escritorio_joda.jpg`, a 1280 px).

## 1. Tipografía

| Uso | Fuente | Pesos | Tamaño |
| --- | --- | --- | --- |
| Títulos de pantalla («¿Qué pedimos?», «Tu pedido») | Playfair Display (OFL, local vía @fontsource) | 700 | `clamp(1.9rem, 7.5vw, 2.4rem)` |
| Secciones («Tragos», «Programación») | Playfair Display | 700 | 1.5rem |
| Nombre de producto | Playfair Display | 700 | 1.2rem |
| Texto, controles, precios | Inter Variable (OFL, local) | 400 / 500 / 600 / 700 / 800 | 1rem base; 0.875rem secundario; 0.78rem fino |
| Variante («4 sabores», «Frutilla») | Inter cursiva | 400 | 0.875rem, color cobre |
| Rótulo de contexto («MODO CENA») | Inter mayúsculas, espaciado 0.2em | 700 | 0.78rem |

Los precios usan cifras tabulares (`font-variant-numeric: tabular-nums`) y se alinean a la derecha. No se usa la tipografía para imitar el wordmark: el logotipo es siempre la imagen original.

## 2. Color

### Tema cena (claro)

| Token | Valor | Uso |
| --- | --- | --- |
| `--bg` | `#FDF6E6` | Fondo crema cálido |
| `--surface` / `--surface-2` | `#FFFBF1` / `#F8EFDB` | Tarjetas, paneles, avisos |
| `--text` | `#3A0F25` | Texto principal (15,3:1) |
| `--text-2` | `#6A4656` | Texto secundario (7,4:1) |
| `--heading` / `--accent` | `#651944` | Títulos, botón principal, «+» |
| `--copper` | `#8E5A33` | Rótulos, variantes, separadores (5,3:1; se oscureció el cobre `#B67D52` para leer bien en texto chico) |
| `--line` | borgoña al 14 % | Separadores |

### Tema joda (oscuro)

| Token | Valor | Uso |
| --- | --- | --- |
| `--bg` | `#1F0F1C` | Ciruela profundo |
| `--surface` / `--surface-2` | `#2B1628` / `#361D32` | Superficies apenas elevadas |
| `--text` | `#FFF4E6` | Marfil (16,9:1) |
| `--text-2` | `#D8BFCB` | Secundario (10,7:1) |
| `--accent` / `--select` | `#C21984` | Acción principal y selección (texto blanco 5,6:1) |
| `--copper` | `#E2A878` | Rótulos y variantes |
| Gradiente | frambuesa al 50 % | Solo en la zona superior y en las tarjetas de presentación |

Estados en ambos temas: `--ok`, `--warn`, `--bad` e `--info`, cada uno con su fondo `*-bg`. Todos los pares texto/fondo verificados quedan en 4,5:1 o más.

## 3. Espacios, radios, sombras y movimiento

- Escala de espacio: 4 · 8 · 12 · 16 · 20 · 24 · 32 px (`--s1` … `--s8`). Margen lateral del teléfono: 16 px.
- Radios: 10 / 14 / 20 px y píldora. Botón principal: 20 px.
- Área táctil: `--tap` 48 px para los controles principales; «+», cantidad y cerrar, 40–44 px.
- Sombras: `--shadow-1` en tarjetas; `--shadow-2` solo en la barra del carrito y en los paneles.
- Movimiento: entrada de pantalla 220 ms (solo opacidad), apertura de panel 220 ms, «pulso» al agregar o cambiar una cantidad 280–360 ms, cambio de tema 160 ms. Todo se reduce a 1 ms con `prefers-reduced-motion`.

## 4. Componentes

| Componente | Dónde | Notas |
| --- | --- | --- |
| Encabezado | `Shell.tsx` | Menú ☰ (acciones reales), logotipo original recortado y pastilla «Demo». En escritorio la navegación pasa al encabezado. |
| Búsqueda | Carta | Tolerante a mayúsculas y acentos. Botón para borrar. |
| Rail de categorías | `CategoryRail` | Sin barra visible, con máscara de borde y flecha «ver más». La opción activa sigue a la lectura de la carta. Funciona con teclado. |
| Fila de producto | `ProductRow` | Nombre serif, descripción en dos líneas, variante en cursiva, precio a la derecha («desde» cuando corresponde). «+» agrega directo solo si no hay decisiones; si las hay, abre el detalle. Si el producto no se puede pedir, muestra «ⓘ» y su estado. |
| Detalle | `ProductSheet` | Panel inferior con cierre ✕ y tecla Esc. Sabor obligatorio, presentaciones como opciones de radio, cantidad y «Agregar · total» fijos abajo. «Información de la carta» plegable con fuente, dudas e imagen original. |
| Cantidad | `Qty` | − / número / +, con aviso al lector de pantalla. |
| Barra de carrito | `CartBar` | Sobre la navegación; no aparece en el carrito ni en escritorio (ahí hay un resumen lateral). |
| Navegación inferior | `BottomNav` | Carta · Mis pedidos · Esta noche. La opción activa se marca con texto en negrita, color y una línea. Muestra la cantidad de pedidos en curso. |
| Estado de pedido | `Orders.tsx` | Pasos Pago, Recibido, Preparado y Entregado, cada uno con su propio estado. Debajo, un bloque por sector (bebidas o comida) con texto, símbolo y lugar de retiro. |
| Credencial | Panel | QR grande sobre blanco, el código en letras y el lugar de retiro. |
| Avisos | `Note`, `Pill` | Texto, símbolo y color; no dependen solo del color. |
| Vacíos | `EmptyState` | Arco decorativo, título, una línea y una acción. |

## 5. Tema automático

`useClientTheme()` decide el tema así:

1. Si la persona eligió **Claro** u **Oscuro** en el menú, se usa esa preferencia (guardada en este navegador).
2. Si no, y el encargado fijó una **apariencia operativa** en Operación, se usa esa.
3. Si no, se mira la noche publicada: desde el inicio del momento DJ en adelante es **joda**; antes, **cena**. Los horarios son supuestos de demostración y se evalúan con el reloj de demo en hora de Argentina.

El tema se recalcula al iniciar, cuando cambia el reloj o la configuración, al volver a la pestaña (`visibilitychange`, `focus`), al recuperar la página desde segundo plano (`pageshow`) y una vez por minuto. Cambiar el tema solo cambia un atributo `data-tema`: no vuelve a montar la pantalla, así que conserva carrito, formularios, ruta y posición de lectura. No modifica disponibilidad, precios ni pedidos.

## 6. Reglas de navegación

- Las tres pestañas principales llevan siempre a la raíz de su sección. El carrito cuenta como parte de «Mis pedidos».
- En el menú: Beneficios, Consultar reserva, El lugar, la preferencia de apariencia, Ayuda y, separado, «Demostración» (acceso de demo y herramientas). Los selectores de personas ficticias no están en las pantallas del cliente.
- Las reservas se abren desde Esta noche (programación y próximas fechas) y desde el menú.
- Abrir o cerrar un detalle no mueve la carta: el enrutador solo vuelve arriba cuando cambia la pantalla.
- En escritorio (≥ 960 px), la carta se muestra en dos columnas con el resumen del pedido fijo a la derecha. El resto de las pantallas usa un ancho de lectura de 680 px.

## 7. Reglas de contenido

- Español de Argentina. Los botones dicen lo que hacen: Agregar, Ver carrito, Continuar, Mostrar credencial, Ver programación.
- Una sola advertencia de demostración por contexto: la pastilla «Demo» siempre visible y notas puntuales donde importan (precios a confirmar, pago simulado, beneficio de ejemplo).
- Sin fotos de productos: no hay fotos auténticas individuales. La identidad se apoya en la tipografía, el arco y los rayos, y el logotipo original.

## 8. Ajuste de fidelidad · carta en modo joda (ronda 4)

Por ahora aplica **solo** a la carta en modo joda (`.fxj`, es decir `[data-tema='joda'][data-pantalla='carta']`). Se extiende al resto cuando se apruebe. Comparación: `docs/capturas/comparacion/carta_joda_referencia_vs_actual.png` (390 × 762 px, mismo ancho que la referencia escalada).

| Aspecto | Referencia (a 390 px) | Implementación |
| --- | --- | --- |
| Logo | Wordmark crema sobre el fondo, ~130 px, sin caja | `LogoAlpha` de 130 px, sin caja (ver «Logo» abajo) |
| Menú y «Demo» | Alineados con la parte alta del logo; pastilla fina | Pastilla visible de ~26 px con borde fino; el área táctil sigue siendo de 40 px |
| Rótulo | «— MODO JODA —» con líneas a ambos lados, cobre | Igual; se quitó el texto «· Barra abierta» (queda como tooltip) |
| Título | Serif de alto contraste, ~36 px, peso medio, marfil | Playfair Display 500, 36 px, interlineado 1.15, `#FBEEDD` |
| Sol | Arco y rayos cobre a la derecha del título | Mismo recurso, 112 × 68 px |
| Búsqueda | ~40 px de alto, radio ~12 px, superficie translúcida | 44 px, radio 12 px, `rgba(255,235,245,.07)` con borde fino |
| Categorías | Píldoras de ~34 px; seleccionada magenta | 36 px visibles con 44 px táctiles; «Sin alcohol» como tercera; rótulos cortos |
| Sección | «Tragos» ~26 px con línea cobre | Playfair 600, 26 px |
| Filas | Nombre serif ~20 px, descripción ~14 px, variante en cursiva cobre; separadores finos; altura ~64–75 px | Playfair 600 a 19,5 px, Inter a 14 px, descripción en 1 línea, separadores al 14 %; altura de 64 a 82 px |
| Precio | Sans en negrita ~17 px, sin espacio tras «$» | Inter 700 a 16,3 px; formato `$8.000` en toda la app |
| «+» | Círculo magenta de ~28 px | Círculo de 30 px dentro de un botón de 44 px |
| Barra del carrito | ~48 px, radio ~12 px, casi todo el ancho | 50 px, radio 12 px, ancho total menos 28 px |
| Navegación | Mismo fondo, línea fina superior, subrayado cobre en la activa | Igual, 64 px de alto |
| Fondo | Ciruela con brillo magenta difuso arriba | `#2E1229` con dos gradientes radiales en la parte superior; la franja de categorías toma fondo propio solo cuando queda fija |

**Tipografía.** La referencia es un concepto con letras de alto contraste: no se puede identificar con certeza su fuente. Se usa **Playfair Display** (OFL), la más cercana entre las fuentes libres que vienen con la app, en peso 500 para el título y 600 para los nombres. Para el texto se usa **Inter** (OFL), una sans muy legible y parecida a la de la referencia.

**Logo.** El paquete solo trae el logotipo y el isotipo como **PNG RGB sin transparencia**, con el gradiente de fondo incorporado. No hay versión transparente ni vectorial oficial.
- Para quitar el rectángulo se generó una **versión de trabajo derivada**: `recursos/marca/derivados/terraco_logo_crema_alfa.png`. Para cada píxel se calculó cuánto aporta el crema del logo y cuánto el gradiente de fondo (estimado por columna), y ese aporte se usó como transparencia.
- La forma no se redibujó ni se deformó: al recomponerla, el error medio frente al original es de 2,45 sobre 255, y el original no se modificó.
- **Pendiente:** pedir al local el archivo transparente o vectorial oficial, también en borgoña para el tema claro. Hasta tenerlo, el tema cena sigue usando el recorte original dentro de una pastilla.

## 9. Sistema extendido a todo el cliente (ronda 5)

La dirección ajustada de la carta nocturna (§8) ya no está limitada a esa pantalla: pasó a los tokens y componentes compartidos (`src/client.css`, bloque «Sistema ajustado»). Se aplica a portada, carta, detalle, carrito, pago simulado, pedidos, credencial, Esta noche, reservas, beneficios y menú, en los dos temas. Capturas a 390 px: `docs/capturas/ronda5/` (prefijos `cena_` y `joda_`).

### Tokens por tema

| Token | Cena | Joda |
| --- | --- | --- |
| `--bg` | `#FCF4E2` | `#2E1229` |
| `--surface` | `#FFFAF0` | `#381834` |
| `--text` / `--heading` | `#3A0F25` / `#5A1740` | `#FBEEDD` / `#FBEEDD` |
| `--text-2` | `#64404F` | `#E7D2DC` |
| `--accent` / `--select` | `#651944` | `#D0218F` |
| `--copper` | `#8E5A33` | `#E2A878` |
| `--sun` (decoración) | `#C08A5E` | `#C98C62` |
| `--logo` (color del logo de trabajo) | `#651944` | `#FBEEDD` |
| `--page-glow` | Brillo cobre arriba a la derecha | Brillo magenta y frambuesa arriba |

### Medidas compartidas

- Encabezado: menú, logo y «Demo» alineados arriba. El logo mide 130 px en la carta y 104 px en el resto. «Demo» tiene una pastilla visible de ~26 px y un área táctil de 40 px.
- Títulos: Playfair Display 500 a 36 px en la carta y a 32 px en el resto. Secciones a 26 px (600).
- Filas de producto: nombre a 19,5 px (600), descripción en hasta **2 líneas** a 14 px, variante en cursiva cobre a 13 px y precio en Inter 700 a 16,3 px.
- Áreas táctiles con íconos chicos: «+» con un círculo de 30 px en un botón de 44; chips de 36 px con área de 44; cantidad con botones de 36 × 32 y área de ~44 × 44.
- Campos: 44 px, radio 12, superficie translúcida (joda) o crema (cena).
- Botones principales: 52 px, radio 12. Barra del carrito: 50 px, radio 12. Navegación: 64 px con subrayado cobre.
- Los rótulos dentro de tarjetas llevan solo la línea inicial, más corta, y no se parten en dos renglones.

### Portada

Composición en HTML/CSS (la marca aparece una sola vez, en el encabezado):
- Rótulo «Cena · Shows · Baile», título «Tu noche / empieza acá.», sol dibujado y dos acciones (Ver la carta / Consultar reserva).
- «Esta noche» con «Ver agenda» y una tarjeta del momento actual, tomada de la fecha activa:
  - «Ahora · Cena / Show / DJ»
  - Encuesta disponible, en pausa o próximo momento.
  - El botón «Participar» aparece solo si hay una encuesta. Las ondas decorativas, solo durante el show o el DJ.
- «Cómo llegar» abre un panel con dirección, reservas y días. «Mis beneficios» lleva a Beneficios.

A 390 × 844 px el contenido termina antes de la barra del carrito. La referencia llegó como imagen en la conversación (no como archivo), así que se comparó a ojo con la captura `joda_00_portada.jpg`.

### Teclado y elementos fijos

Mientras un campo de texto tiene el foco (en el teléfono, con el teclado abierto), se ocultan la navegación inferior y la barra del carrito, y el botón fijo «Continuar» baja al borde. Al salir del campo vuelven. En escritorio la navegación se mantiene.

### Logo de trabajo

El encabezado usa la forma del archivo derivado (`recursos/marca/derivados/terraco_logo_crema_alfa.png`) como máscara, con el color de cada tema: borgoña en cena y crema en joda.
- La forma no cambia; solo el relleno.
- Revisión de contornos sobre claro y oscuro: `docs/capturas/comparacion/logo_derivado_contornos.png`. Bordes limpios, sin halos; solo el antialias del original.
- Se identifica como versión de trabajo en el atributo `data-recurso`, en el texto alternativo, en el menú (Ayuda) y en esta guía.

## 10. Sol de la portada (ronda 6, corrección exacta)

Calcado de la referencia de la portada. Se midió sobre la pantalla útil de 852 px, sin el marco del teléfono. Es un SVG propio, no un ícono genérico, con `viewBox="-280 -280 340 340"`. Las unidades son píxeles de la referencia y el origen es el centro común de los rayos.
- **Rayos:** son 12. Cada extremo (interior y exterior) se midió uno por uno sobre la imagen y quedó en `SUN_RAYS` (`src/views/client/Home.tsx`). Así se conservan las diferencias reales de largo, separación y orientación: alternan largos y cortos, pero no son iguales entre sí. Trazo de 2,6 unidades, puntas redondeadas.
- **Arco:** tiene su propio centro, desplazado (16,5; 56,1) respecto del de los rayos, y radio 171,5. Sigue más allá del borde derecho. Trazo de 3,6 unidades.
- **Color:** `--sol-portada`. En joda es `#F5B886`, muestreado del arco de la referencia; en cena cae en `--copper`.
- **Escala:** uniforme, 3,47 em del tamaño del título, con `preserveAspectRatio="xMidYMid meet"`. Acompaña al título y nunca se estira.
- **Posición:** a la derecha, en `calc(-1 * var(--s4) - 0.663em)`; arriba, a −1,645 em del bloque del título. El corte en el borde derecho es intencional.
- **Separación del texto:** el SVG está fuera del `h1`, dentro de `.cx-home-title-wrap`. Lleva `aria-hidden="true"`, `focusable="false"` y `pointer-events: none`.
- **Recorte:** lo hace `.cx-home-hero`, que llega al borde de la pantalla con `overflow-x: clip`. No genera desplazamiento lateral.

Comparaciones al mismo tamaño visual (390 px):
- `docs/capturas/comparacion/portada_sol_referencia_vs_actual.png`
- `docs/capturas/comparacion/portada_sol_detalle_x2.png`
