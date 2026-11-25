# Cobertura de la demo: 72 problemas y 6 mejoras

Referencia: `documentacion/02_MATRIZ_72_PROBLEMAS.md` y `documentacion/03_PROPUESTAS_COMPETENCIA.md`.

Claves de estado (pueden combinarse):

- **L** — resuelto en la lógica local de la demo (autoridad de simulación, con prueba cuando corre dinero, stock, votos o entrega).
- **E** — representado por un escenario o una acción de demostración.
- **S** — requiere servicio externo o servidor real para producción.
- **V** — requiere validación del local (dueño, equipo, DJ).

Nada de esta tabla significa «resuelto para producción». Pruebas: `src/domain/engine.test.ts`.

## A. Cena, carta y disponibilidad

| # | Problema | Estado | Cómo está en la demo |
| --- | --- | --- | --- |
| 1 | Cena y baile se superponen | L, E, V | Momentos por horario; pasar a joda no cambia pedidos (escenario «Cambio a joda», prueba 6). |
| 2 | La cocina cierra mientras alguien paga | L, E, S | `sellCheck` revalida al confirmar; pago aprobado tardío pasa a incidencia. Ventana real a definir con el proveedor. |
| 3 | Mesa equivocada o QR reemplazado | L, E, V | QR permanente por mesa con ocupación cambiante; QR viejo no muestra pedidos (prueba). QR físico reemplazado requiere control del local. |
| 4 | Combos, tamaños y extras ambiguos | L, V | Presentaciones «publicado / supuesto / consultable»; no se inventan volúmenes ni recargos. |
| 5 | Nota de alergia interpretada como garantía | L, V | Nota libre rotulada «no es garantía»; aviso de ingredientes; sin insignias de aptitud. |
| 6 | Dos personas compran la última unidad | L, E | Reserva de stock por intención con vencimiento (escenario «Última unidad», prueba). |
| 7 | Se agota un componente y siguen vendiéndose combos | L | Combo fernet + 5 latas consume componentes; latas sueltas comparten stock (prueba 2). |
| 8 | Cambia precio o promoción con carrito abierto | L, E | Revalidación con diálogo de cambios y nuevo total (prueba 2). |

## B. Preparación y coordinación

| # | Problema | Estado | Cómo |
| --- | --- | --- | --- |
| 9 | Barra recibe más de lo que puede preparar | L, E, V | Carga visible, pausa por categoría/producto, vista agrupada. Capacidad real a medir. |
| 10 | La app promete tiempos que no se cumplen | L | No se muestran minutos estimados; solo estado y carga. |
| 11 | Caja y web con listas distintas o ventas duplicadas | L | Una sola cola y un solo registro (prueba 3). |
| 12 | Comida y bebida a la estación incorrecta | L, V | Ruteo por categoría (comida → cocina). Puntos configurables en la ficha. |
| 13 | Se cobró pero no llegó al personal | L, E, S | Recepción separada del pago; incidencia y pausa del canal (escenario «Barra sin recepción», prueba 8). |
| 14 | Dos trabajadores preparan lo mismo | L | Toma de tarea única por estación (prueba 3). |
| 15 | Una parte lista y otra pendiente | L | Estado por unidad; entrega parcial (prueba 1). |
| 16 | Se pulsa un estado incorrecto | L | «Corregir estado» con motivo y registro. |

## C. Cobros, cancelaciones y conciliación

| # | Problema | Estado | Cómo |
| --- | --- | --- | --- |
| 17 | Doble toque o reintento genera dos cobros | L, S | `cid` estable y aprobación repetida ignorada (prueba 8). Idempotencia real con el proveedor. |
| 18 | Captura de pago falsa | L, V | Transferencia manual requiere verificación del encargado con motivo; la captura no acredita. |
| 19 | Pendiente o rechazado y se prepara igual | L | No se envía a estaciones sin aprobación (prueba 8). |
| 20 | Pago aprobado después de vencer | L, E, S | Incidencia: cumplir con revalidación o devolver (escenario «Aprobación tardía», prueba 8). |
| 21 | Cancelación o producto no entregable | L | Cancelación con motivo y devolución de lo no entregado; «No se puede preparar» por unidad. |
| 22 | Devolución parcial, fallida o lenta | L, E, S | Movimiento propio con estados y reintento (prueba 8). Plazos reales del proveedor. |
| 23 | Efectivo/transferencia marcados sin verificar | L, V | Efectivo lo registra caja; transferencia solo el encargado. |
| 24 | Ventas ≠ dinero recibido o comprobante fiscal | L, S, V | Ventas, cobros y devoluciones separados en informes. Sin factura fiscal ni saldo bancario. |

## D. Rondas y pagos grupales

| # | Problema | Estado | Cómo |
| --- | --- | --- | --- |
| 25 | Confundir dividir con cobrar | L | «Calcular cuánto pone cada uno» + pago único; aclaración visible. |
| 26 | El grupo edita cuando otros pagan | L | Acuerdo congelado; cambiar exige cancelar con devoluciones. |
| 27 | Falta una persona | L, E | Cobertura voluntaria con confirmación; vencimiento con devoluciones (escenario «Ronda», prueba). |
| 28 | Redondeos que no suman | L | Centavos y reparto determinista (prueba). |
| 29 | Dos pagan la misma parte | L | Parte ya pagada rechazada (prueba). Concurrencia real requiere servidor (S). |
| 30 | Invitado sale o se filtra el enlace | L, S | Enlace con token revocable; no muestra nombres a invitados. |
| 31 | El grupo reserva stock demasiado tiempo | L | Reserva de stock con el plazo de la ronda. |
| 32 | Devolución grupal mal asignada | L | Una devolución por aporte, al pagador original (prueba). |

## E. Retiro, comprobantes y avisos

| # | Problema | Estado | Cómo |
| --- | --- | --- | --- |
| 33 | Retiro con número visto en la TV | L | Código público ≠ credencial privada; el público se rechaza al validar (prueba 3). |
| 34 | Dos barras validan a la vez | L, S | Autoridad única entre pestañas; entre equipos reales requiere validación central. |
| 35 | Cliente en barra equivocada | L, V | Punto de retiro en el pedido y en la TV. Señalización física pendiente. |
| 36 | Nadie retira y pierde calidad | L, V | Alerta de demo a los 15 min como incidencia; sin plazo de descarte inventado. |
| 37 | Producto equivocado o cuestionado | L | «Entrega discutida» crea incidencia; historial por unidad. |
| 38 | El aviso no llega | L, S | Estado visible en el pedido y TV; push real no incluido. |
| 39 | TV mezcla votación con datos personales | L | TV sin nombres, importes ni credenciales; encuesta en área secundaria. |
| 40 | El retiro genera aglomeración | V | Puntos de retiro configurables; no se afirma que la pantalla elimine filas. |

## F. DJ, encuestas y contenido

| # | Problema | Estado | Cómo |
| --- | --- | --- | --- |
| 41 | El DJ administra la pantalla toda la noche | L, V | Plantillas, cierre por reloj y delegación expresa. |
| 42 | Temas que el DJ no tiene | L, V | Opciones filtradas por repertorio aceptado. |
| 43 | Votan desde afuera o varias veces | L, S | Acceso de noche + un voto por identidad (prueba 5). No prueba presencia. |
| 44 | Votación interrumpe compra o retiro | L | Encuesta opcional, nunca modal; carta y credencial siempre accesibles. |
| 45 | Empate, pocos votos, relojes distintos | L | Política anunciada; reloj compartido decide el cierre (prueba 5). |
| 46 | Dos DJs/asistentes publican a la vez | L | Una activa por sesión (prueba 5). |
| 47 | Votación promete una contratación | L | Consulta de próximas fechas separada y rotulada como consultiva. |
| 48 | Insultos o perfiles falsos | L, S | Sin comentarios libres; perfiles de prueba. Moderación real pendiente. |

## G. Fidelización y datos del cliente

| # | Problema | Estado | Cómo |
| --- | --- | --- | --- |
| 49 | Escanear QR suma visitas falsas | L, V | Visita solo validada por personal, una por jornada (prueba 7). |
| 50 | Paga uno por todos y el premio se asigna mal | L | Pagar no crea visitas. |
| 51 | Se devuelve la compra y quedan premios | L | Cupón restaurado o ajustado con registro (prueba 7). |
| 52 | Cupón usado dos veces | L | Estado reservado/usado de un solo uso (prueba 7). |
| 53 | Descuentos reducen el resultado | V | Tope y costo de ejemplo identificados; costo real a definir. |
| 54 | Ocho visitas no motivan | V | Regla editable de ejemplo. |
| 55 | Cambiar de teléfono o cuentas duplicadas | S | Documentado como integración futura. |
| 56 | Obligar a aceptar publicidad o dar datos | L | Compra como invitado; preferencia comercial separada; reserva pide lo mínimo. |

## H. Estadísticas y decisiones del dueño

| # | Problema | Estado | Cómo |
| --- | --- | --- | --- |
| 57 | Ventas digitales como ventas totales | L | Filtro de canal y aviso de alcance en informes. |
| 58 | La madrugada parte la noche | L | Jornada operativa 08:00–08:00 (pruebas 6 y 7). |
| 59 | Facturación, cobros, devoluciones y saldo | L | Medidas separadas; sin saldo bancario. |
| 60 | Más vendido = más rentable; stock = robo | L | Solo ingresos, aclaración de margen; sin rankings de empleados. |
| 61 | Inventar permanencia | L | No se mide. |
| 62 | Votos de pocos como opinión de todos | L | «X votos de N con acceso de noche». |
| 63 | Atribuir al DJ o a la app | L | Cobros por momento con aclaración de no causalidad; enlaces sin causalidad. |
| 64 | El proyecto cuesta más de lo que aporta | V | Requiere métricas reales del piloto. |

## I. Equipo, seguridad y continuidad

| # | Problema | Estado | Cómo |
| --- | --- | --- | --- |
| 65 | Personal abrumado | L, V | Vista por puesto con siguiente acción; detalles secundarios. A probar con el equipo. |
| 66 | Acceso a pedidos o funciones ajenos | L, S | Cliente ve solo sus pedidos de la pestaña; permisos de demo. Autorización real en servidor. |
| 67 | Claves compartidas, equipo perdido, baja | S | Documentado; requiere autenticación y revocación reales. |
| 68 | Bots y abuso | S | Documentado; requiere límites de servidor. |
| 69 | Se cae internet y se sigue cobrando | L, E, S | Pausa del canal y contingencia con recepción manual (escenario). Comportamiento real depende de la red. |
| 70 | Falla un dispositivo, TV o electricidad | V, S | La TV es accesoria; procedimiento físico a definir. |
| 71 | Actualización o pérdida de datos en plena noche | L, S | Reinicio solo desde Herramientas con confirmación escrita; sin copias reales. |
| 72 | El mockup parece completo pero no se validó | V | Rótulo permanente de demo, página de Límites y esta tabla. |

## Seis mejoras seleccionadas

| Mejora | Estado | Dónde |
| --- | --- | --- |
| 1. Volver a pedir con revisión | L | Pedido → «Volver a pedir»: carrito nuevo con precios actuales, aviso de cambios y de pedidos en curso; no copia cobro ni credencial. |
| 2. Producción agrupada | L | Cocina/Barra → «Producción agrupada»: por producto y variantes exactas, despliega pedidos, marca N unidades concretas (prueba). |
| 3. Preparar la noche y plantillas | L, V | Encargado → «Preparar la noche»: borrador → revisar cambios → publicar; plantillas sin ventas, votos ni reservas (prueba). |
| 4. Reserva vinculada a la fecha | L, V, S | Consulta con referencia, borrador de WhatsApp, registro único con carga asistida y estados del encargado. |
| 5. Coordinación de mesa | L, V | Cocina → «Coordinación de mesa»: agrupación visual por ocupación, sin esperas automáticas. |
| 6. Enlaces por canal | L, E | Encargado → «Enlaces» e Informes: visitas, consultas, confirmadas, canceladas y llegadas; DJ ve solo agregados. |
