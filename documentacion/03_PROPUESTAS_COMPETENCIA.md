# Terraço — Propuestas seleccionadas a partir de la competencia

Fecha de consulta: 22 de noviembre de 2026.
Estado: recomendaciones para evaluar; no son requisitos aprobados ni funcionalidades implementadas.

## Resultado

Seleccioné seis candidatas: tres para incorporar al diseño del mockup y tres condicionadas a comprobar una necesidad operativa. La selección se comparó con la matriz actual de 72 problemas, leída desde su versión disponible. No se presentan como novedades el control de stock, los permisos, las devoluciones, los estados del pedido ni las votaciones ya previstas.

La investigación consultó documentación y páginas oficiales de me&u, sunday, Toast, SevenRooms, Fourvenues, RequestNow, Creventa y Tenzo. Se estudiaron flujos y dependencias; no se probaron productos contratados ni integraciones con Terraço. No se trasladan porcentajes comerciales de los proveedores a nuestro proyecto.

Las propuestas para Terraço son adaptaciones propias. Una referencia acredita el antecedente descrito, no garantiza que Terraço obtenga los mismos resultados o pueda contratar esa solución en Argentina.

## Criterio de selección

Cada candidata se evaluó con cinco preguntas:

1. ¿Resuelve una tarea frecuente o un problema plausible y concreto de Terraço?
2. ¿Mejora una decisión o ahorra pasos verificables?
3. ¿Puede encajar en el recorrido cotidiano sin agregar una obligación a todos?
4. ¿Tiene dependencias que podamos identificar y validar?
5. ¿Podemos medir el beneficio y retirarla si no ayuda?

No se asignaron puntuaciones numéricas inventadas. Las prioridades expresan juicio de diseño, no una medición del impacto.

## Selección resumida

| Nº | Propuesta | Usuario principal | Relación con el piloto | Recomendación |
| --- | --- | --- | --- | --- |
| 1 | Repetir un pedido con revisión | Cliente de cena o baile | Acción nueva sobre el historial del pedido | Incluir en mockup |
| 2 | Vista de producción agrupada por producto y variante | Barra y cocina | Mejora específica de las pantallas por estación | Incluir como vista opcional |
| 3 | Ficha operativa de la noche con plantilla reutilizable | Encargado, personal y DJ | Organización por fecha que reúne configuraciones y novedades | Incluir en mockup |
| 4 | Reserva de cena conectada con la programación de esa noche | Cliente y recepción | Nuevo recorrido previo a la visita | Condicionada a gestión real de mesas |
| 5 | Coordinación de comidas de una mesa sin unificar los pagos | Clientes y cocina | Mejora operativa para grupos con pedidos independientes | Condicionada a pedidos fragmentados frecuentes |
| 6 | Enlaces por canal para medir reservas y asistencias atribuibles | Dueño y DJ | Nueva información de captación | Condicionada a conversiones registrables |

Los productos y cantidades utilizados a continuación son ejemplos de interfaz. No se verificó la carta real de Terraço.

## 1. Repetir un pedido con revisión

**Antecedente observado.** me&u documenta Another Round para volver a pedir bebidas; sunday también ofrece repetir pedidos. [F01] [F02]

**Propuesta propia.** Desde un pedido anterior, permitir “Volver a pedir”. Se abre una copia editable y se muestra el total vigente. El cliente confirma y realiza un nuevo pago.

**Aporte.** Evita volver a buscar los mismos productos. Es útil tanto para una bebida individual como para una ronda; no requiere que todos se registren ni que guarden una tarjeta.

**Condiciones.** Revalidar variantes, disponibilidad, precio y punto de retiro. Detectar si el pedido anterior aún está pendiente y advertirlo para reducir duplicados. Nunca generar compras automáticas.

**Prueba.** Comparar tiempo y errores al repetir con los del recorrido habitual. Conservarla si simplifica sin aumentar pedidos accidentales.

**Decisión.** Incluir en el mockup. Complejidad relativa baja a media una vez que el circuito de compra esté construido.

## 2. Producción agrupada por producto y variante

**Antecedente observado.** Toast All Day View suma artículos similares y puede separarlos por modificadores; Production Item Count agrega necesidades de componentes. [F03] [F04]

**Propuesta propia.** Además de la lista cronológica, ofrecer un resumen de pendientes por preparación. Desde cada total se accede a los pedidos involucrados y a su antigüedad. Variantes distintas permanecen separadas.

**Aporte.** Reduce la necesidad de recorrer y contar tickets. Puede ayudar a preparar pedidos parecidos, siempre que el trabajador elija qué agrupación es práctica.

**Condiciones.** No esperar nuevos pedidos para formar un lote. Conservar prioridad y entregas por pedido; permitir marcar unidades concretas. Empezar por productos, sin exigir un inventario completo de ingredientes.

**Prueba.** Comparar trabajo y errores durante un pico, controlando también si aumenta la espera de los pedidos antiguos.

**Decisión.** Incluir como vista opcional del personal. No sumar una pantalla obligatoria al cliente.

## 3. Ficha operativa de la noche y plantilla reutilizable

**Antecedentes observados.** SevenRooms ofrece información de turno y reportes previos al servicio. Fourvenues permite reutilizar configuraciones de tipos de entrada para fechas futuras. [F05] [F06]

**Propuesta propia.** Crear una ficha por fecha con horarios, carta activa, responsables, sesión del DJ, novedades y puntos pendientes de confirmar. El encargado parte de una plantilla y valida los cambios.

**Aporte.** Reúne lo que el equipo debe conocer antes de abrir y reduce configuraciones repetidas. El DJ consulta horario y recursos; cocina y barra ven sus cambios relevantes.

**Condiciones.** Copiar configuración no copia ventas, pagos, votos ni asistencia. Precios y fechas requieren revisión. Una actuación tentativa no pasa a confirmada automáticamente. El resumen no reemplaza una conversación breve del equipo.

**Prueba.** Preparar una nueva fecha y comprobar tiempo de configuración, errores heredados y dudas durante el turno.

**Decisión.** Incluir en el mockup. La preparación detallada se concentra antes del servicio.

## 4. Reserva de cena conectada con la noche

**Antecedente observado.** SevenRooms conecta reservas, lista de espera y experiencias. [F07]

**Propuesta propia.** Desde la fecha elegida, mostrar opciones de cena, horario y personas, junto con la programación confirmada del baile. La reserva tiene estado verificable y una política clara para llegar, cancelar o avisar demora.

**Aporte.** Puede ordenar consultas dispersas y ayudar a quien quiere organizar cena y baile con sus amigos.

**Condición decisiva.** Comprobar que Terraço administra reservas o desea hacerlo, cuántas mesas dispone y quién las confirma. Si hay pocas consultas sin dificultad, un formulario y confirmación asistida podrían alcanzar.

**Límites.** Explicar duración de mesa y condiciones reales de acceso al baile. No inventar descuentos, acceso garantizado ni permanencia de mesa. Señas y prepedidos quedan para una etapa posterior.

**Prueba.** Medir solicitudes, confirmaciones, ausencias y tiempo administrativo. La lista de espera se activa si existe demanda real por lugares que se liberan.

**Decisión.** Diseñar como módulo condicionado, no como promesa comercial cerrada.

## 5. Coordinación de comidas de una mesa, con pagos separados

**Antecedente observado.** me&u agrupa pedidos de una misma mesa en una ventana configurable y permite tiempos diferentes para comida y bebida. [F08]

**Propuesta propia.** Cuando una mesa hace compras independientes casi simultáneas, cocina puede verlas juntas y coordinar su preparación. Cada pedido conserva pago, titular, comprobante e incidencias.

**Aporte.** Puede evitar que parte del grupo termine de comer antes de que otros reciban su pedido. No exige implementar cobros entre varios.

**Condiciones.** Identificar la mesa y su sesión vigente; no mostrar información privada de otros comensales. El intervalo debe ser breve y acordado con cocina. Las bebidas y el modo baile no quedan retenidos por esta función.

**Prueba.** Medir diferencia entre entregas de la mesa y espera del primer pedido. Retirar la agrupación si introduce más demora de la que evita.

**Decisión.** Activar únicamente si se observa fragmentación frecuente; si todos ya piden juntos, puede aportar poco.

## 6. Enlaces por canal y conversión atribuida

**Antecedente observado.** Fourvenues distingue enlaces oficiales y de RRPP, y atribuye ventas según el enlace empleado. [F09]

**Propuesta propia.** Crear enlaces por fecha para Instagram de Terraço, difusión del DJ y otros canales elegidos. Asociar la referencia a reservas confirmadas y, cuando se verifique, su asistencia.

**Aporte.** Ofrece al dueño información sobre captación y al DJ una medida limitada de la actividad que llega por su difusión.

**Condiciones.** Definir la regla; por ejemplo, último enlace identificado en el recorrido de reserva. Separar clic, solicitud, confirmación, cancelación y asistencia. Mostrar origen desconocido cuando se pierda la referencia. Si se usa un sistema externo, la conversión requiere integración o conciliación autorizada.

**Límites.** Un enlace reenviado conserva una atribución imperfecta. No demuestra causalidad ni permanencia y no justifica entregar al DJ datos personales de clientes.

**Prueba.** Revisar trazabilidad de reservas y utilidad para decidir difusión. Con solo clics, postergar el módulo.

**Decisión.** Condicionada a reservas u otras conversiones verificables.

## Qué conservaría fuera de esta ampliación

| Propuesta observada | Antecedente | Evaluación para Terraço |
| --- | --- | --- |
| Cuentas abiertas con tarjeta y cobro posterior | me&u Group Tabs contempla garantía, límites y distintas modalidades de cobro. [F10] | Puede servir a otros locales, pero agrega dependencias financieras y excepciones. El piloto ya prioriza pago por pedido. |
| Pronóstico de demanda con IA | Tenzo utiliza datos históricos y contexto para pronosticar ventas. [F11] | No se comprobó un historial completo de Terraço. Primero ordenar datos y medir; no prometer previsión automática. |
| Preferencias musicales antes del evento | RequestNow admite solicitudes previas. [F12] | No la selecciono todavía: las encuestas en vivo ya están contempladas y falta demostrar que el DJ utilizaría otra bandeja previa. |
| Prepedidos de grupos grandes | Creventa describe un recorrido asociado a reservas. [F13] | Interesante si hay eventos grupales frecuentes, pero depende de validar reservas, horarios y capacidad. No añadir ahora. |
| CRM muy detallado y personalización automática | SevenRooms ofrece perfiles y segmentación. [F14] | El piloto necesita datos mínimos. Ampliar perfiles solo cuando exista una decisión concreta que mejore el servicio. |
| Servicio por cursos y liberación secuencial | Toast documenta meal pacing, con restricciones según canal. [F15] | No se confirmó que Terraço sirva menús por pasos. Agrupar una mesa, si hace falta, sería una adaptación más acotada. |
| Promociones y recomendaciones comerciales automáticas | sunday muestra menús y opciones adicionales. [F02] | El catálogo y los combos ya forman parte del piloto. No contarlos de nuevo como agregado ni prometer resultados ajenos. |

El criterio es posponer lo que tiene valor condicionado, no declarar que sea inútil para todos los negocios.

## Encaje con el piloto y las 72 soluciones

| Mejora | Reglas existentes que debe conservar |
| --- | --- |
| Repetir pedido | Precio y disponibilidad vigentes; pago nuevo verificado; prevención de duplicación. |
| Producción agrupada | Responsabilidad por estación; prioridad visible; preparación y entrega parciales. |
| Ficha de la noche | Jornada operativa; permisos; transición cena/baile; historial por fecha. |
| Reservas | Capacidad y responsable reales; confirmación; continuidad ante fallas. |
| Mesa coordinada | Compras independientes; privacidad; tiempos claros; ningún cambio financiero implícito. |
| Atribución | Alcance de datos visible; asistencia verificada; ninguna conclusión causal automática. |

Estas propuestas no eliminan problemas de la matriz. Agregan recorridos que deben reutilizar sus controles.

## Orden sugerido

1. Mostrar repetir pedido, vista agrupada y ficha operativa en el mockup.
2. Recorrerlos con dueño, encargado, cocina, barra y DJ.
3. Relevar demanda y procedimiento de reservas.
4. Si se habilitan reservas, considerar atribución de canales.
5. Observar cenas antes de activar agrupación por mesa.
6. Probar beneficios con el mismo equipo y tareas comparables, registrando ayuda, errores y tiempos.

Se trata de tres decisiones de diseño firmes para probar y tres oportunidades condicionadas. No se propone construir seis módulos de producción de inmediato.

## Fuentes

Consultadas el 22/11/2026. Los porcentajes y casos comerciales de las páginas no se adoptan como previsión para Terraço.

- **F01 — me&u, Another Round:** https://help.meandu.com/hc/en-us/articles/9631552713615-How-to-use-the-Another-Round-feature
- **F02 — sunday, Order & Pay:** https://sundayapp.com/order-and-pay/
- **F03 — Toast, All Day View:** https://support.toasttab.com/en/article/KDS-All-Day-1493055871075
- **F04 — Toast, Production Item Count:** https://support.toasttab.com/en/article/Production-Item-Count?lang=en_US
- **F05 — SevenRooms, Table Management / Pre-shift:** https://sevenrooms.com/platform/table-management/
- **F06 — Fourvenues, configuraciones reutilizables:** https://academy.fourvenues.com/es/configuracion-automatizaciones-y-estados/
- **F07 — SevenRooms, Reservations & Waitlist:** https://sevenrooms.com/platform/reservations-waitlist/
- **F08 — me&u, Order Batching:** https://help.meandu.com/hc/en-us/articles/6539900084495-How-to-set-up-Order-Batching-advanced-split-batching
- **F09 — Fourvenues, links oficiales y RRPP:** https://academy.fourvenues.com/es/canales-de-venta-oficial-y-rrpp/
- **F10 — me&u, Group Tabs:** https://help.meandu.com/hc/en-us/articles/6539925773583-How-to-use-group-tabs
- **F11 — Tenzo, Forecasting:** https://support.gotenzo.com/docs/forecasting-your-future-sales/
- **F12 — RequestNow:** https://www.requestnow.io/
- **F13 — Creventa, prepedidos con SevenRooms:** https://creventa.com/sevenrooms/
- **F14 — SevenRooms, CRM:** https://sevenrooms.com/platform/crm/
- **F15 — Toast, Course Firing:** https://support.toasttab.com/en/article/Course-Firing-Options

