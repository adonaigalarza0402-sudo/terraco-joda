# Registro de validación

Última actualización: 22/11/2026. Entorno: Windows 11, Node 24.22.1, npm 11.19.1, navegador integrado de la app de escritorio (Chromium), servidor de desarrollo `npm run dev` en el puerto 5180.

## Cómo se probó en el navegador

Se usaron tres pestañas del mismo navegador sobre la interfaz real (cliente, personal y un segundo puesto u observador). Las acciones se hicieron sobre los botones y campos de la interfaz: algunos clics con el puntero y la mayoría mediante clics y entradas de formulario disparados por script sobre los mismos elementos que usa una persona. Los resultados se leyeron en la pantalla de cada pestaña y se contrastaron con el estado guardado.

Para los **intentos simultáneos**, dos pestañas programaron el clic para el mismo instante del reloj del sistema (diferencia de pocos milisegundos), con el botón ya visible en ambas.

## 1. Comprobado en el navegador

| Recorrido | Qué se hizo | Cliente | Personal | Informes | Sincronización |
| --- | --- | --- | --- | --- | --- |
| 1. Cena y entrega parcial | Pizza + trago → pago aprobado → barra lista → entrega rechaza el código público y acepta la credencial privada → entrega solo la bebida | Estado «Bebidas: recibido en barra · Comida: recibido en cocina»; la pizza sigue pendiente | Barra y entrega ven el pedido | Ventas +$ 28.000 (ronda anterior) | La pantalla pública muestra el código al marcarlo listo |
| 2. Ronda y repetir | Combo fernet + 5 latas → reparto 4 × $ 15.000 y 7 partes (6 × $ 8.571,43 + 1 × $ 8.571,42 = $ 60.000) → doble toque en Pagar → aprobar. El encargado cambia el precio a $ 65.000 → «Volver a pedir» muestra el cambio y el aviso de pedido en curso. Con el carrito abierto, el encargado pasa el precio a $ 62.000 y marca agotada la Corona x1 → al pagar aparece «Algo cambió»: precio $ 65.000 → $ 62.000 y la Corona se quita con su motivo → aceptar → pagar | Mensajes de revisión claros; nada se cobra sin confirmar | Stock: Fernet 5 → 4, latas 33 → 28. Barra recibe T-107 y T-108 | Ventas brutas $ 285.500 = semilla $ 163.500 + $ 60.000 + $ 62.000 | El carrito marca «Precio actualizado» y «Agotado» en cuanto el encargado los cambia |
| 2b. Ronda avanzada | Ronda de 3 partes ($ 6.666,67 + $ 6.666,67 + $ 6.666,66). El invitado abre el enlace en otra pestaña (no ve nombres ni controles del organizador) y paga la parte 2. Las dos pestañas pagan la parte 3 a la vez | Gana una; la otra recibe «La ronda está completa». Pedido único T-109 | Barra recibe un solo pedido | 3 cobros de la ronda, 1 pedido | La ronda se actualiza en ambas pestañas |
| 3. Compra asistida | Caja: 2 Pintas Stella en efectivo → registrar efectivo → ticket con credencial y QR. Barra (Ana) toma. Transferencia manual: la caja no puede verificarla; el encargado la verifica desde Operación con motivo | — | Etiqueta «Caja» en la misma cola | Canal caja: brutas $ 47.000; efectivo $ 39.000; transferencia verificada $ 8.000 | Las señales del encargado y la cola de barra se actualizan solas |
| 6. Cena → joda | Escenario «Cambio a joda (00:20)». El cliente agrega una pizza y una cerveza. Reloj +15 min (00:35) | La carta muestra «Cocina cerrada»; al pagar, la pizza se quita con motivo «Cocina no toma pedidos nuevos desde las 00:30» y la cerveza se compra. El tema visual pasa a noche | Cocina toma y termina el pedido aceptado antes del cierre | Cobros por momento: cena 5 pedidos, joda 1 pedido $ 6.000 | El cambio de horario llega al carrito abierto sin recargar |
| 7. Beneficios | Lucía: visita 8 validada → cupón emitido; segunda validación rechazada. Reloj a 01:00 → nueva validación rechazada (misma jornada). Caro aplica su cupón en dos pestañas a la vez. Rechazo del pago → cupón disponible. «Volver a pedir» → pago aprobado → cupón usado. Barra no puede preparar la jarra → devolución parcial $ 10.200. Caja cancela el resto → devolución $ 6.000 y cupón restaurado con registro | Beneficios muestra 8/8 y el cupón; la pestaña que pierde la carrera recibe «El cupón no está disponible (reservado)» y su total se recalcula; el pedido muestra «Un producto no se pudo preparar» y ambas devoluciones | Visitas, cancelación y devoluciones registradas por persona | Descuentos −$ 1.800; devoluciones pendientes −$ 16.200; netas = semilla | El estado del cupón cambia en las dos pestañas |
| 8. Excepciones | Pago pendiente; pago rechazado; barra sin conexión con un pago aprobado; reconexión; devolución parcial con falla y reintento; aprobación tardía (escenario) resuelta como «cumplir» | Mensajes: «Esperando confirmación del pago», «Pago rechazado… “Volver a pedir”», «Pago confirmado; enviando pedido… sin recepción en barra», luego «Bebidas: recibido en barra»; «Pago recibido tarde: lo está revisando el equipo»; devolución completada en el detalle | Barra no ve pedidos pendientes ni rechazados; aviso de sin conexión y «Sin recepción registrada»; el encargado ve la señal e incidencia; la reconexión registra la recepción una sola vez | Cobro tardío marcado; incidencias resueltas con motivo | La carta pausa los tragos al cortar barra y los reanuda al reconectar |

Los recorridos 4 (reserva) y 5 (encuesta) se comprobaron en el navegador en la ronda anterior y no cambiaron en esta.

### Intentos simultáneos (dos pestañas, mismo instante)

| Caso | Resultado observado |
| --- | --- |
| Última unidad (Moet CH BR) | Una pestaña crea el pedido y reserva la botella; la otra recibe «Algo cambió… Sin stock disponible», sin cobro. Al vencer el plazo de pago (+6 min), la primera ve «Venció el plazo de pago… stock liberado» y la segunda compra con «Volver» → Pagar. |
| Misma credencial de retiro (T-110) | Las dos pestañas de entrega validaron y pulsaron «Entregar 2 unidades» a la vez. Se registró una sola entrega; la otra pestaña recibió «Pedido T-110 ya entregado por completo». |
| Toma de la misma tarea (dos barras) | Una toma; la otra recibe «Ya la tomó Leo a las 22:00. No se duplica la tarea». Un solo registro. |
| Misma parte de una ronda | Un solo cobro; la otra pestaña recibe un rechazo. |
| Mismo cupón | Solo un pedido lo reserva. |
| Doble toque en Pagar | Un solo pedido creado. |

**Alcance real de esta protección:** vale entre pestañas del **mismo navegador y del mismo origen**. Cada comando se aplica dentro de un bloqueo exclusivo del navegador (Web Locks), leyendo el último estado guardado. **No protege** entre teléfonos o computadoras distintas, ni entre navegadores distintos de la misma computadora, porque cada uno tiene su propio almacenamiento; tampoco si el navegador no soporta Web Locks. Para operar de verdad hace falta una validación central en un servidor (ver `DECISIONES_Y_PENDIENTES.md`).

## 2. Errores encontrados y corregidos en esta ronda

| Hallazgo | Corrección | Nueva comprobación |
| --- | --- | --- |
| El descuento del cupón se repartía también entre productos no elegibles (cerveza), así que la devolución parcial de la jarra salía mal calculada. | El descuento se reparte solo entre las unidades elegibles. | Prueba de dominio nueva y repetición en el navegador: devolución de la jarra $ 10.200 (12.000 − 1.800); la suma de devoluciones es igual al total pagado. |
| Si ningún producto se podía preparar, el cupón no se restauraba. | Se restaura con registro del ajuste. | Pruebas de dominio. |
| La caja veía un formulario de verificación de transferencia que no podía usar (fallaba con un error de permiso). | La caja ve un aviso: la verificación la hace el encargado. | En el navegador. |
| Beneficios mostraba «0/8» justo al completar 8 visitas. | Muestra 8/8 y «se emitió un cupón». | En el navegador. |
| «Pago rechazado» sugería volver «desde el carrito», pero el carrito ya estaba vacío. | Remite a «Volver a pedir». | En el navegador (recorrido 8). |
| Una devolución parcial no se mencionaba en el estado principal del pedido. | El estado agrega «Un producto no se pudo preparar» y el estado de la devolución. | En el navegador (recorridos 7 y 8). |
| Los rótulos de pack aparecían como «X1» o «X4». | Se muestran como en la carta: «x1», «x4». | En el navegador. |
| Una pestaña abierta durante varias recargas en caliente del servidor de desarrollo dejó de mostrar avisos. | No es un error de la aplicación; se resuelve recargando la pestaña. No pasa en `npm run build` / `preview`. | Recargada, los avisos funcionan. |

## 3. Cubierto solo por pruebas de dominio

`npm test` → **25/25 aprobadas** (`src/domain/engine.test.ts`). Se ejecutan sobre la misma autoridad que usa la interfaz.

- Vencimiento de una ronda avanzada con devolución a cada pagador original, y cobertura voluntaria del saldo.
- Aprobación tardía resuelta como «devolver» y aprobación tardía de un pedido que ya no se puede cumplir (devolución automática).
- Aprobación repetida del proveedor ignorada sin duplicar el cobro.
- QR de mesa de una ocupación anterior.
- Plantilla de noche que no arrastra ventas ni votos.
- Delegación del DJ al asistente.
- Determinismo de los escenarios del laboratorio.

## 4. Controles generales

| Control | Resultado |
| --- | --- |
| `npx tsc --noEmit` | Sin errores. |
| `npx vite build` | Correcto. Aviso de tamaño del paquete JS (~590 kB, 157 kB gzip). |
| 22 rutas con cada rol | Renderizan sin errores de consola (ronda anterior). |
| 24 rutas a 360 px | Sin desborde horizontal (ronda anterior, después de las correcciones). |

## 5. Pendiente o no comprobado

- Tablet (768 px) con captura; Safari y Firefox; teléfonos reales.
- Lector de pantalla y navegación completa solo con teclado.
- Concurrencia entre dispositivos distintos: no es posible sin servidor (límite de diseño, no un error).
- Pruebas automatizadas de interfaz de extremo a extremo (por ejemplo con Playwright): no se agregaron.
- La incidencia «Devolución fallida» queda abierta después de un reintento exitoso hasta que el encargado la resuelve a mano. Es intencional en la demo, pero conviene revisarlo con el local.
- En la carta, un producto con su última unidad reservada por otra persona aparece como «Agotado» hasta que vence la reserva. Habría que decidir con el local si conviene un rótulo distinto.

---

# Rediseño del apartado de clientes (ronda 3)

Fecha: 22/11/2026. Todas las comprobaciones se hicieron en el **navegador integrado (Chromium) con tamaños emulados**. **No se probó en teléfonos físicos.**

## Qué cambió

- Nuevo sistema visual del cliente (`src/client.css`) con dos temas (cena y joda) sobre los mismos componentes (`src/views/client/ui.tsx`).
- Tema automático centralizado (`src/state/appearance.ts`): sigue el horario publicado y el reloj de demo; el encargado puede fijarlo en Operación; cada persona puede elegir Automático, Claro u Oscuro en el menú.
- Navegación principal de 3 secciones (Carta, Mis pedidos, Esta noche). Beneficios, reservas, apariencia, ayuda y demostración quedan en el menú; reservas también en Esta noche.
- Carta, detalle, carrito, seguimiento, credencial, Esta noche, Beneficios y El lugar recompuestos. El motor de simulación y las reglas de negocio no se tocaron.
- Tipografía de títulos: Playfair Display (antes Cormorant Garamond), aplicada también al personal para mantener una sola pareja tipográfica.

## Comprobado en el navegador (emulación)

| Comprobación | Resultado |
| --- | --- |
| Buscar y agregar | «+» en Aperol (presentación única) agrega directo y la barra se actualiza. En Daikiri abre el detalle: el botón dice «Elegí un sabor» hasta elegirlo; con 2 unidades muestra «Agregar · $ 16.000». |
| Editar y pagar | En el carrito se editan cantidades, se quitan productos y «Dividir la ronda» muestra un cálculo orientativo (2 × $ 13.000) separado del pago. «Continuar» crea el pedido y el pago simulado aprobado lo envía a barra y cocina. |
| Seguir el pedido y entrega parcial | Barra marca las bebidas listas → el cliente ve «Bebidas: Listo para retirar · Barra principal» y «Comida: Recibido en cocina». Entrega retira la bebida → «Entregado» en bebidas, comida pendiente, sin mostrar lugar de retiro en lo ya entregado. |
| Credencial | Se abre en un panel con QR, código, lugar de retiro y advertencia sobre el código público; el foco va al botón Cerrar. |
| Cambio de tema durante un recorrido | Con el pedido abierto, el reloj de demo pasa a las 00:30 → la vista cambia sola a joda, con la misma ruta, el mismo pedido y casi la misma posición de lectura (206 → 189 px; la diferencia vino de un cambio de contenido). Con la preferencia «Oscuro», la carta mantiene la posición (300 → 300 px). |
| Volver a la carta | Abrir y cerrar un detalle conserva la posición (900 → 900 px) después de corregir el error descripto abajo. |
| Encuesta y reserva | Código de la noche → voto → resultados «4 votos de 10 con acceso de noche», sin botones para repetir. La consulta de reserva crea su referencia y el borrador de WhatsApp. |
| Desbordes | 12 rutas a 360 px y la carta, el detalle, el carrito y el pedido a 390 px: sin desplazamiento horizontal. Con el texto base a 24 px (150 %): sin desbordes. |
| Áreas táctiles | Controles principales de 44–56 px; la pastilla «Demo» se amplió de 32 a 40 px. |
| Contraste | Pares calculados: cena entre 5,3:1 y 15,3:1; joda entre 5,6:1 y 16,9:1 (ver `docs/GUIA_VISUAL.md`). |
| Escritorio (1280 px) | Navegación en el encabezado, carta en dos columnas con resumen del pedido fijo a la derecha y sin barra flotante. |
| Consola | Sin errores al recorrer las rutas del cliente. |
| Pruebas y compilación | `npm test` 25/25; `npm run build` correcto (paquete JS de ~607 kB, 162 kB gzip). |

## Errores encontrados y corregidos

| Hallazgo | Corrección |
| --- | --- |
| Al abrir un detalle, la página saltaba hasta el final: la animación de entrada usaba una transformación y convertía al contenedor en referencia de los paneles fijos. | La animación de entrada usa solo opacidad. |
| Al cerrar un detalle, el enrutador volvía arriba de la carta. | Solo vuelve arriba cuando cambia la pantalla, no la consulta `?p=`. |
| Los pasos del pedido no marcaban «Recibido» cuando correspondía. | Cada paso (Pago, Recibido, Preparado, Entregado) se calcula con su propio estado. |
| El ícono del QR desbordaba el botón «Mostrar credencial». | Tamaño fijo para íconos dentro de botones; las filas flexibles ya no desbordan. |
| La barra del carrito pasaba a dos líneas a 390 px. | Una sola línea con recorte. |
| Durante la transición de tema el texto cambiaba antes que el fondo. | Transición de 160 ms. |
| El encabezado de «Esta noche» repetía «Cena · Cena». | Muestra el horario cuando no hay artista. |

## Limitaciones de las capturas

Con el panel del navegador oculto, la herramienta de captura devolvía imágenes recortadas aunque el diseño medido no desbordaba. Por eso las capturas «después» se tomaron en una pestaña con el panel visible. La captura `05_esta_noche.jpg` (cena) es anterior a la corrección de «Cena · Cena»; la versión corregida se ve en `10_esta_noche_joda.jpg`.

## Pendiente o no comprobado

- **Teléfonos físicos** (iOS Safari y Android Chrome): áreas seguras reales, barras del navegador, teclado en pantalla y vuelta desde segundo plano. Los eventos están conectados (`visibilitychange`, `pageshow`, `focus`), pero solo se probó el cambio por reloj.
- 430 px y alturas chicas (< 640 px) con capturas: solo se comprobaron por medición (sin desbordes a 360 × 640).
- Lector de pantalla (VoiceOver / TalkBack).
- En escritorio, la carta en dos columnas de flujo vertical altera un poco el orden de lectura dentro de cada sección.
- No hay fotografías auténticas de productos: la carta es tipográfica a propósito.
- El paquete JS creció a ~607 kB. Conviene dividirlo antes de un piloto.

---

# Ajuste de fidelidad · carta nocturna (ronda 4)

Comprobado en el navegador integrado con emulación a **390 × 762 px**, el mismo ancho y alto que la referencia escalada. No se probó en dispositivos físicos.

- Comparación lado a lado: `docs/capturas/comparacion/carta_joda_lado_a_lado.png` (referencia, antes de este ajuste y ahora) y `carta_joda_referencia_vs_actual.png`.
- Logo sin rectángulo: se usa una versión derivada con transparencia calculada a partir del original (ver `docs/GUIA_VISUAL.md` §8). No existe un archivo transparente oficial en el paquete.
- Áreas táctiles medidas: «+» 44 × 44 px (círculo visible de 30 px), «Demo» 65 × 40 px, categorías 36 px visibles con 44 px táctiles. Sin desplazamiento horizontal (ancho de la página = 390 px).
- Título: Playfair Display 500, 36 px. Precios en formato `$8.000` (también en caja, informes y el resto de la app).
- La franja de categorías ya no muestra una banda más oscura sobre el gradiente: toma fondo solo cuando queda fija (comprobado desplazando a 600 px y volviendo arriba).
- `npm test` 25/25 y `npm run build` correctos.

Diferencias que quedan respecto de la referencia, a propósito:
- El orden y el contenido de los productos salen del catálogo (Daikiri, Caipirinha…), no de la imagen.
- La descripción se muestra en una línea con recorte y la variante debajo, por eso algunas filas son un poco más altas.
- Áreas táctiles de 44 px en lugar de los ~28–34 px de la imagen.
- El sol y el brillo del fondo son aproximaciones del concepto.

Este ajuste se aplica solo a la carta en modo joda. El resto de las pantallas no se modificó.

---

# Extensión del sistema a todo el cliente y nueva portada (ronda 5)

Todo se comprobó en el navegador integrado con **emulación** (390 × 844, 390 × 480 y 360 × 640). No se probó en dispositivos físicos.

## Comprobado

| Comprobación | Resultado |
| --- | --- |
| Capturas a 390 px | 21 en `docs/capturas/ronda5/`, en ambos temas: portada, carta, detalle (variantes de empanadas y Daikiri), carrito, seguimiento (parcial), credencial, Esta noche (con encuesta y sin encuesta), reserva, beneficios (con y sin perfil) y menú con apariencia. |
| Contenido largo | Carrito de 6 líneas con importes altos («Continuar · $1.016.000», Jack Daniel 3 L × 2 = $700.000): sin desbordes; nombres, variantes y precios completos (`joda_03…`). |
| Teclado abierto (simulado) | Alto de 480 px con foco en «¿Cómo te llamamos?»: navegación y barra ocultas, campo y «Continuar» visibles (`joda_04…`). En el navegador automatizado la ventana no tenía el foco, así que el evento de foco se disparó por script. En un teléfono depende del navegador real. |
| Cambio de tema sin perder datos | Con el texto «Lu y amigos» escrito en el carrito, la preferencia cambiada desde otra pestaña (joda → claro), el ajuste del encargado (Cena) y la vuelta a «Según horario» mantuvieron el campo, las 6 líneas del carrito, la ruta y la posición de lectura (773,6 px). |
| Formato de precios | Sin espacio tras «$» en cliente, caja, informes y pantalla pública (0 casos con espacio en la pantalla pública). |
| Pedido parcial | Se corrigió un texto que exageraba lo listo: ahora dice «Bebidas: 1 de 7 listas en Barra principal» y «1 de 7 listas para retirar». |
| Portada | Datos de la fecha activa: «Ahora · Cena» con el próximo momento a las 22:00; «Ahora · DJ / DJ Aurora / Encuesta disponible / Participar» en el escenario de encuesta. El contenido termina en 707 px y la barra del carrito empieza en 718 px. |
| Desbordes y áreas táctiles a 360 px | 9 rutas del cliente sin desplazamiento horizontal (el sol de la portada desbordaba 15 px; se recorta en el borde con `overflow-x: clip`). La franja de categorías sigue fija al desplazar. Solo los botones de cantidad miden 32 px visibles, con área táctil ampliada. |
| Logo derivado | Contornos revisados sobre crema y ciruela (`logo_derivado_contornos.png`). |
| Pruebas y compilación | `npm test` 25/25; `npm run build` correcto. |

## Ajustes hechos al revisar

- Los rótulos dentro de tarjetas se partían en dos renglones («ENCUESTA DEL DJ · / OPCIONAL»): ahora van en una línea y la píldora de horario no se comprime.
- El código del cupón se cortaba («DEMO-/CARO8»).
- En la portada en cena, la tarjeta repetía «Ver agenda»: «Participar» se muestra solo con una encuesta activa.

## Pendiente

- Dispositivos físicos: teclado real, áreas seguras, barras del navegador y vuelta desde segundo plano.
- Comparación de la portada en archivo: la referencia no llegó como archivo, así que no hay composición lado a lado.
- Los puestos de trabajo no se tocaron en esta ronda, salvo que heredan la tipografía de títulos y el formato de precios.

---

# Sol de la portada y DJ ZETA (ronda 6)

Comprobado con emulación en el navegador integrado.

| Comprobación | Resultado |
| --- | --- |
| Comparación con la referencia a 390 px | `docs/capturas/comparacion/portada_sol_referencia_vs_actual.png`: el tamaño (~30 % del ancho), el corte en el borde derecho, la cantidad y distribución de rayos, el arco y la posición respecto del título coinciden. |
| Sin desplazamiento horizontal | Ancho de la página = ancho de la pantalla a 360, 390 y 430 px. |
| Texto libre de interferencias | Distancia mínima entre los trazos y los glifos finales del título: «á» a 12 / 15 / 29 px y «.» a 30 / 34 / 39 px (360 / 390 / 430). Con «Tu noche», 63 px o más. Medido contra la tinta aproximada de cada glifo; contra la caja completa del renglón la distancia es de 3 / 5 / 13 px, porque esa caja incluye el espacio vacío sobre el punto. |
| DJ ZETA | Datos de la fecha de demostración, sesión, perfil, enlace de difusión (`dj-zeta`), personal y textos del laboratorio. Visible en portada, Esta noche, DJ (incluido su alcance), Acceso, Herramientas y Preparar la noche. Los datos ya guardados en el navegador se migran al cargar, sin reiniciar la demo. Los identificadores internos (`dj-aurora`, `st-aurora`, `ses-aurora`) se conservaron para no romper enlaces de prueba. |
| Pruebas y compilación | `npm test` 25/25; `npm run build` correcto. |

## Corrección exacta del sol (ronda 6, segunda parte)

La referencia es la imagen adjunta. El recorte enviado no estaba disponible como archivo. Se midió sobre `2.webp`, que tiene la misma composición.

| Comprobación | Resultado |
| --- | --- |
| Trazado | Se superpuso la geometría medida (12 rayos con extremos propios y el arco con centro propio) sobre la referencia. Coincide trazo por trazo. |
| Comparación al mismo tamaño visual | Las dos capturas están a 390 px, alineadas por el título: `portada_sol_referencia_vs_actual.png` y `portada_sol_detalle_x2.png`. Coinciden la curvatura, el grosor, el largo desigual de los rayos, el ángulo, el color y el corte. |
| Diferencias corregidas | Ángulos uniformes reemplazados por extremos medidos (desvío previo de 3–5 px). Escala recalibrada a la pantalla útil de 852 px. Sol bajado unos 5 px. Cobre más intenso en joda (`#F5B886`). |
| Sin desplazamiento horizontal | `scrollWidth` igual al ancho a 360, 390 y 430 px. Sol de 144 / 156 / 167 px. |
| Separación del texto | El SVG no está dentro del `h1`. Tiene `aria-hidden="true"` y `pointer-events: none` (verificado en el estilo computado). Distancia mínima a la caja de cada carácter del título: 3 / 5 / 19 px (360 / 390 / 430), siempre contra el «.» final. Ningún trazo toca la tinta de las letras; en la referencia, los rayos cortos inferiores también quedan así de cerca del punto. |
| DJ ZETA | Sigue visible en la portada. |
| Pruebas y compilación | `npm test` 25/25; `npm run build` correcto. |
