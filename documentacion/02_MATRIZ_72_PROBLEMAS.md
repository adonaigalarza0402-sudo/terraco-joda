# Terraço — Matriz de problemas, soluciones y criterios de validación

Fecha de investigación: 22 de noviembre de 2026.
Versión: propuesta para analizar con Nacho, el dueño, el equipo y el DJ. No constituye una especificación aprobada ni una implementación terminada.

## Alcance y resultado

Se revisaron 30 páginas de documentación y ayuda de nueve proveedores: Square, Toast, Uber Eats, Mercado Pago, Stripe, Eventbrite, Rekwest, Slido y Mentimeter; además, MDN y OWASP como referencias técnicas. Se priorizaron manuales operativos y respuestas oficiales sobre material comercial. Algunas páginas de Odoo no pudieron abrirse de forma satisfactoria y no se usaron como fundamento de las conclusiones.

La documentación acredita funciones o limitaciones descritas por sus proveedores; no demuestra que se hayan probado en Terraço ni que estén disponibles en Argentina o en cualquier plan. En particular, no se propone contratar Stripe, Toast o Square para Argentina por haberlos estudiado.

La matriz identifica 72 problemas principales; es un registro ampliable, no una garantía de haber anticipado todos los incidentes posibles. Cada solución es un diseño propio para Terraço inspirado en patrones observados, y no una afirmación de que el proveedor citado implemente exactamente esa regla. Las referencias relacionadas permiten revisar el antecedente, no acreditan una integración terminada.

## Qué se aprendió de la competencia

| Área | Observación comprobada | Aplicación propuesta para Terraço |
| --- | --- | --- |
| Carga de trabajo | Square documenta pausas de pedidos y configuración de capacidad de retiro. [S01](#s01), [S02](#s02) | Poner límites por estación y mantener visibles los pedidos ya aceptados. |
| Disponibilidad | Square diferencia disponible, agotado y cantidad, con visibilidad del stock comprometido. [S03](#s03) | Unificar canales y diseñar reservas breves al pagar; no prometer exactitud sin conteo físico. |
| Cocina y retiro | Toast separa estaciones, consolidación y cumplimiento de preparación y entrega. [S04](#s04), [S05](#s05) | Tareas por cocina/barra y validación final distinta de marcar listo. |
| Compra de grupo | Uber Eats documenta anfitrión, enlace, plazo y bloqueo del carrito; Toast documenta pago por artículos o saldo. [S08](#s08), [S09](#s09) | Un proceso de grupo con reglas explícitas. Empezar por cálculo y un pagador. |
| Dinero | Mercado Pago documenta idempotencia, estados, notificaciones y reembolsos; Stripe distingue estados de devolución. [S10](#s10)–[S14](#s14) | Separar pago, preparación y entrega; dar seguimiento a excepciones. |
| Falta de conexión | Toast explica que la operación local y los pedidos online se comportan de forma distinta durante interrupciones. [S15](#s15) | Frenar compras afectadas y pasar a una contingencia presencial acordada. |
| Comprobantes | Eventbrite detecta códigos ya usados. [S16](#s16) | Diseñar validación central de entrega única y separar número público de credencial privada. |
| DJ | Rekwest ofrece repertorios limitados y gestión delegada con pausa. [S17](#s17), [S18](#s18) | Participación opcional bajo control de la sesión activa del DJ. |
| Votaciones | Slido reconoce límites de la restricción por navegador; Mentimeter documenta controles de respuestas. [S19](#s19), [S20](#s20) | Distinguir opinión abierta y asistentes verificados; moderar contenido. |
| Fidelización | Square registra acumulaciones y ajustes y contempla devolución de puntos ante reembolsos. [S21](#s21), [S22](#s22) | Historial de beneficios coherente con compras o asistencias realmente comprobadas. |
| Informes y equipo | Square documenta métricas, jornada de informes, cierre y permisos individuales. [S23](#s23)–[S27](#s27) | Informes con alcance explícito y responsables por acción. |
| Notificaciones y acceso | MDN describe permisos y entornos; OWASP identifica riesgos de autenticación, autorización y abuso. [S28](#s28), [S29](#s29) | Avisos con respaldo, accesos comprobados en servidor y límites de uso. |

## Criterio de prioridades

- **Base:** condición para un piloto con pedidos y cobros reales. No significa que deba construirse todo desde cero: puede cubrirla una integración o un procedimiento comprobado.
- **Avanzado:** mostrar su diseño en el mockup si resulta útil, pero habilitarlo en producción después de validar el núcleo y sus dependencias.
- **Piloto musical opcional:** puede probarse junto con el núcleo si el DJ lo acepta y no perjudica la operación.
- **Condicionado:** no mostrar la métrica o promesa hasta disponer de los datos o capacidades que requiere.

El mockup puede abarcar todos los perfiles y representar casos simulados. La producción necesita verificaciones de dinero, permisos, conexión y carga real.

## Matriz de 72 problemas

### A. Cena, carta y disponibilidad

#### 1. Cena y baile se superponen

**Solución propuesta:** Conservar pedidos de cena y habilitar baile sin cambiar su estado. El encargado controla qué categorías aceptan nuevos pedidos.

**Por qué:** Evita perder compras válidas durante la transición.

**Prueba de aceptación:** Activar baile con una cena pendiente: el pedido sigue visible.

**Prioridad:** Base.

**Referencias relacionadas:** [S01](#s01), [S02](#s02).

#### 2. La cocina cierra mientras alguien está pagando

**Solución propuesta:** Revalidar horario y disponibilidad antes del cobro. Conservar una ventana definida para operaciones ya iniciadas; un pago tardío pasa a excepción con resolución y seguimiento.

**Por qué:** El reloj de la pantalla no basta para decidir qué se puede vender.

**Prueba de aceptación:** Cerrar cocina durante el checkout y comprobar ambos resultados de pago.

**Prioridad:** Base.

**Referencias relacionadas:** [S02](#s02), [S12](#s12).

#### 3. Se escanea una mesa equivocada o un QR reemplazado

**Solución propuesta:** Mostrar dominio, local y mesa o retiro antes de comprar; revisar los QR físicos y permitir corregir contexto. El QR del menú no concede permisos del personal.

**Por qué:** Reduce errores de ubicación y desvíos a páginas falsas.

**Prueba de aceptación:** Escanear otro QR: confirmar contexto; probar un enlace de un local distinto.

**Prioridad:** Base.

**Referencias relacionadas:** [S29](#s29).

#### 4. Combos, tamaños y extras generan pedidos ambiguos

**Solución propuesta:** Definir opciones obligatorias, cantidades permitidas y adicionales con precio visible. Validar la combinación en el sistema antes del pago.

**Por qué:** Cocina y barra necesitan una instrucción concreta y cobrable.

**Prueba de aceptación:** Intentar comprar un combo incompleto o un adicional no disponible.

**Prioridad:** Base.

**Referencias relacionadas:** [S03](#s03), [S04](#s04).

#### 5. Una nota sobre alergias o una sustitución se interpreta como garantía

**Solución propuesta:** Publicar información validada por Terraço. Las solicitudes especiales necesitan confirmación humana; no aceptar automáticamente preparaciones que el equipo no pueda asegurar.

**Por qué:** Una preferencia escrita no confirma que la cocina pueda cumplirla.

**Prueba de aceptación:** Solicitar una modificación fuera de catálogo y comprobar la derivación al equipo.

**Prioridad:** Base.

**Referencias relacionadas:** [S07](#s07).

#### 6. Dos personas compran la última unidad

**Solución propuesta:** Reservar disponibilidad por un plazo breve al iniciar el pago y confirmar el descuento de forma única. Si vence y llega un cobro tardío, revalidar y resolver como excepción.

**Por qué:** Evita vender dos veces la misma disponibilidad sin bloquearla indefinidamente.

**Prueba de aceptación:** Dos compras simultáneas con una unidad; después, una aprobación tardía.

**Prioridad:** Base.

**Referencias relacionadas:** [S03](#s03), [S10](#s10), [S12](#s12).

#### 7. Se agota un componente, pero siguen vendiéndose combos

**Solución propuesta:** Relacionar cada combo con sus componentes y canales de venta. Mantener agotado manual, conteo físico y ajustes con motivo; incluir caja o reconocer que el stock digital es parcial.

**Por qué:** El catálogo debe reflejar lo que realmente puede prepararse.

**Prueba de aceptación:** Agotar un componente y comprobar todos los combos y puntos de venta afectados.

**Prioridad:** Base.

**Referencias relacionadas:** [S03](#s03).

#### 8. Cambian el precio o una promoción con un carrito abierto

**Solución propuesta:** Dar vigencia al presupuesto y guardar el detalle aceptado. Si vence, mostrar el nuevo total y pedir aceptación antes de cobrar. Los pedidos pagados conservan sus condiciones.

**Por qué:** Evita cargos inesperados y discusiones sobre precios anteriores.

**Prueba de aceptación:** Cambiar un precio entre carrito, pago y entrega.

**Prioridad:** Base.

**Referencias relacionadas:** [S08](#s08), [S23](#s23).


### B. Preparación y coordinación

#### 9. La barra recibe más trabajo del que puede preparar

**Solución propuesta:** Configurar capacidad por estación y tipo de preparación; empezar con límites y pausa manual. Ajustar con tiempos reales e informar la espera antes de pagar.

**Por qué:** El cuello de botella es capacidad física, no cantidad de celulares.

**Prueba de aceptación:** Simular el pico previsto y comprobar pausas sin perder pedidos aceptados.

**Prioridad:** Base.

**Referencias relacionadas:** [S01](#s01), [S02](#s02).

#### 10. La aplicación promete tiempos que no se cumplen

**Solución propuesta:** Mostrar rangos estimados, actualizar demoras y señalar cuándo la estimación dejó de ser confiable. Medir preparación y retiro por separado.

**Por qué:** La información honesta permite decidir sin vender una certeza falsa.

**Prueba de aceptación:** Retrasar una estación y comprobar avisos y estimación actualizada.

**Prioridad:** Base.

**Referencias relacionadas:** [S02](#s02), [S04](#s04).

#### 11. Caja y web mantienen listas diferentes o duplican ventas

**Solución propuesta:** Usar un identificador único y una cola compartida para compras digitales y presenciales. Investigar el sistema del QR actual antes de integrar; no exigir doble carga permanente.

**Por qué:** Una operación compartida evita pedidos olvidados e informes incompletos.

**Prueba de aceptación:** Crear ventas de ambos canales y reconciliar cada pedido una sola vez.

**Prioridad:** Base.

**Referencias relacionadas:** [S03](#s03), [S04](#s04).

#### 12. Comida y bebida llegan a la estación incorrecta

**Solución propuesta:** Separar tareas por producto y estación con un pedido común. Mostrar a cada estación su parte y una vista consolidada al responsable de entrega.

**Por qué:** Cada equipo puede avanzar sin recibir tareas ajenas.

**Prueba de aceptación:** Pedir comida y bebida: revisar qué recibe cada pantalla.

**Prioridad:** Base.

**Referencias relacionadas:** [S04](#s04).

#### 13. Se cobró, pero el pedido no llegó al personal

**Solución propuesta:** Guardar cobro y tarea de envío de forma recuperable; exigir recepción del dispositivo, reintentar sin duplicar y alertar al encargado. Frenar nuevas compras si falla el destino; resolver los cobros del intervalo.

**Por qué:** Aceptar dinero exige detectar y atender lo que el personal no recibió.

**Prueba de aceptación:** Desconectar la estación justo después del cobro y recuperar el mismo pedido.

**Prioridad:** Base.

**Referencias relacionadas:** [S11](#s11), [S15](#s15).

#### 14. Dos trabajadores preparan lo mismo

**Solución propuesta:** Permitir tomar una tarea con estado compartido y confirmación de quién la atiende; rechazar cambios incompatibles y ofrecer reasignación por encargado.

**Por qué:** La concurrencia requiere coordinación además de pantallas visibles.

**Prueba de aceptación:** Dos operadores toman la misma tarea al mismo tiempo.

**Prioridad:** Base.

**Referencias relacionadas:** [S04](#s04), [S29](#s29).

#### 15. Una parte está lista y otra sigue pendiente

**Solución propuesta:** Gestionar preparación y entrega por artículo o paquete; mostrar retiro parcial explícito. Un pedido con varias estaciones no queda totalmente listo por una sola confirmación.

**Por qué:** Evita avisos prematuros y dobles entregas de lo ya retirado.

**Prueba de aceptación:** Retirar bebidas y después comida con el mismo pedido.

**Prioridad:** Base.

**Referencias relacionadas:** [S04](#s04), [S05](#s05).

#### 16. Se pulsa un estado incorrecto

**Solución propuesta:** Ofrecer corrección de preparación con historial y aviso actualizado al cliente. Una entrega ya validada requiere incidencia y autorización; no restablecer automáticamente el derecho a retirar.

**Por qué:** Corregir una pantalla no debe habilitar otro retiro indebido.

**Prueba de aceptación:** Deshacer 'listo' y luego intentar deshacer una entrega.

**Prioridad:** Base.

**Referencias relacionadas:** [S06](#s06), [S16](#s16), [S27](#s27).


### C. Cobros, cancelaciones y conciliación

#### 17. Doble toque o reintento genera dos cobros

**Solución propuesta:** Usar una identidad estable para cada intento lógico y claves de idempotencia cuando corresponda. Consultar el intento pendiente antes de crear otro; bloquear el botón es solo una ayuda visual.

**Por qué:** La conexión puede repetir una operación aunque el usuario toque una vez.

**Prueba de aceptación:** Reenviar la misma solicitud de pago varias veces.

**Prioridad:** Base.

**Referencias relacionadas:** [S10](#s10).

#### 18. Se muestra una captura de pago falsa o de otra compra

**Solución propuesta:** Confirmar el cobro desde el proveedor, validando autenticidad, cuenta receptora, referencia, importe y moneda. Un mensaje de retorno o imagen no habilita preparación.

**Por qué:** El comprobante visible puede falsificarse o pertenecer a otro pedido.

**Prueba de aceptación:** Presentar captura, retorno manipulado y pago válido con referencia distinta.

**Prioridad:** Base.

**Referencias relacionadas:** [S11](#s11), [S12](#s12).

#### 19. El pago está pendiente o rechazado y se prepara igual

**Solución propuesta:** Separar estado financiero de preparación y entrega. Liberar preparación tras la confirmación válida del medio elegido; efectivo se verifica en caja. No confundir autorización con cobro capturado.

**Por qué:** Pendiente, autorizado y cobrado significan cosas diferentes.

**Prueba de aceptación:** Probar pendientes, rechazos y aprobación sin duplicar la comanda.

**Prioridad:** Base.

**Referencias relacionadas:** [S12](#s12), [S30](#s30).

#### 20. Un pago se aprueba después de vencer el pedido

**Solución propuesta:** Mantener seguimiento de la transacción aunque expire el carrito. Revalidar stock y horario; cumplir solo si sigue siendo posible y corresponde, o iniciar devolución con aviso y seguimiento.

**Por qué:** Vencer una compra localmente no impide que el proveedor confirme después.

**Prueba de aceptación:** Aprobar el pago de un carrito vencido y una cocina cerrada.

**Prioridad:** Base.

**Referencias relacionadas:** [S11](#s11), [S12](#s12), [S13](#s13).

#### 21. El cliente cancela o un producto ya no puede entregarse

**Solución propuesta:** Antes de preparación, permitir la cancelación operativa según la política aplicable. Después, derivar al encargado. Separar faltantes atribuibles al local y devolver lo no cumplido sin imponer sustituciones.

**Por qué:** La fase de trabajo y el motivo cambian la respuesta apropiada.

**Prueba de aceptación:** Cancelar antes y después de preparar; simular un faltante del local.

**Prioridad:** Base.

**Referencias relacionadas:** [S13](#s13), [S27](#s27).

#### 22. La devolución es parcial, falla o tarda

**Solución propuesta:** Registrar importe, pago original, motivo, responsable y estado. Mostrar solicitada, en proceso o confirmada; reintentar con control de duplicación y escalar fallos. Comunicar plazos según el medio real.

**Por qué:** Solicitar una devolución no demuestra que el dinero ya llegó.

**Prueba de aceptación:** Simular reembolso parcial, pendiente, fallido y notificación repetida.

**Prioridad:** Base.

**Referencias relacionadas:** [S13](#s13), [S14](#s14).

#### 23. Efectivo y transferencias manuales se marcan como pagados sin verificar

**Solución propuesta:** Permitir efectivo en caja y transferencias solo con verificación del responsable. Registrar medio, importe y operador; mantener pendiente cualquier pago no confirmado.

**Por qué:** La flexibilidad de cobro necesita una responsabilidad verificable.

**Prueba de aceptación:** Registrar efectivo e intentar aprobar una transferencia solo con una imagen.

**Prioridad:** Base.

**Referencias relacionadas:** [S12](#s12), [S26](#s26), [S27](#s27).

#### 24. Las ventas no coinciden con el dinero recibido o el comprobante fiscal

**Solución propuesta:** Conciliar pedidos, cobros, comisiones, devoluciones y liquidaciones del proveedor. Mantener la emisión fiscal correspondiente del local; el QR de retiro no la reemplaza. Guardar evidencia para reclamos.

**Por qué:** Vender, cobrar, liquidar y emitir un comprobante son hechos distintos.

**Prueba de aceptación:** Cerrar una noche con efectivo, tarjeta, devolución y pago aún no liquidado.

**Prioridad:** Base.

**Referencias relacionadas:** [S23](#s23), [S25](#s25).


### D. Rondas y pagos grupales

#### 25. Se confunde dividir el precio con cobrar a varias personas

**Solución propuesta:** Ofrecer calculadora y pago único desde la primera versión. Mostrar pagos individuales como función avanzada, disponible solo tras validar la integración y sus excepciones.

**Por qué:** Una cuenta matemática no resuelve un circuito de cobros.

**Prueba de aceptación:** Comprobar que dividir por seis no genera seis cobros automáticamente.

**Prioridad:** Base; cobro múltiple avanzado.

**Referencias relacionadas:** [S08](#s08), [S09](#s09).

#### 26. El grupo sigue editando cuando otros ya pagan

**Solución propuesta:** Asignar un organizador y una versión del pedido. Al iniciar pagos, bloquear productos, cantidades y reparto; un cambio requiere cerrar o revisar el proceso anterior.

**Por qué:** Todos deben pagar sobre el mismo acuerdo.

**Prueba de aceptación:** Editar un artículo mientras otro integrante paga.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S08](#s08).

#### 27. Falta una persona y el grupo queda parcialmente pagado

**Solución propuesta:** Fijar un plazo; ofrecer que alguien cubra voluntariamente el saldo. Si no se completa, cancelar sin preparar e iniciar devoluciones a quienes pagaron, con estados visibles.

**Por qué:** El local no debe asumir una deuda ni retener fondos sin salida clara.

**Prueba de aceptación:** Pagar cinco de seis partes y dejar vencer el plazo.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S08](#s08), [S09](#s09), [S13](#s13).

#### 28. Redondeos o cargos hacen que las partes no sumen el total

**Solución propuesta:** Calcular importes en unidades monetarias mínimas, asignar el resto de manera determinista y mostrar el total final antes de pagar, incluidos cargos aplicables.

**Por qué:** La suma de contribuciones debe coincidir exactamente con lo aceptado.

**Prueba de aceptación:** Dividir un total no divisible exactamente entre tres personas.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S09](#s09), [S23](#s23).

#### 29. Dos personas pagan simultáneamente la misma parte

**Solución propuesta:** Identificar y reservar cada cuota durante el intento; confirmar el pago de forma única. Si llegan dos cobros, detectar exceso y resolverlo sin preparar dos pedidos.

**Por qué:** El grupo necesita coordinación del dinero además del carrito.

**Prueba de aceptación:** Dos teléfonos intentan pagar la última cuota.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S09](#s09), [S10](#s10).

#### 30. Un invitado sale del grupo o se filtra el enlace

**Solución propuesta:** Permitir revocar invitaciones y sustituir integrantes antes de bloquear. Las contribuciones ya cobradas mantienen su titular y se resuelven expresamente; conocer el enlace no permite retirarlas.

**Por qué:** Protege aportes y evita transferir obligaciones por sorpresa.

**Prueba de aceptación:** Compartir un enlace y reemplazar a un integrante que ya pagó.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S08](#s08), [S29](#s29).

#### 31. El grupo reserva stock demasiado tiempo

**Solución propuesta:** Usar una ventana de pago común y acotada. Reservar disponibilidad al abrirla y liberarla al vencer; un cobro posterior se trata como excepción, no como reapertura automática.

**Por qué:** Evita inmovilizar productos y sobreventas al final del plazo.

**Prueba de aceptación:** Dejar varias rondas incompletas y comprobar que liberan disponibilidad.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S03](#s03), [S08](#s08), [S12](#s12).

#### 32. Una devolución grupal se envía al organizador o se reparte mal

**Solución propuesta:** Guardar la relación entre aportes, artículos y pagadores. Distribuir devoluciones conforme a esa relación, con redondeo y límites por pago original; conciliar cada devolución.

**Por qué:** El organizador no es necesariamente quien puso todo el dinero.

**Prueba de aceptación:** Cancelar un producto en un pedido con varios pagadores.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S09](#s09), [S13](#s13).


### E. Retiro, comprobantes y avisos

#### 33. Se retira con un nombre o número visto en la televisión

**Solución propuesta:** Separar número público y comprobante privado. La entrega requiere un QR o credencial verificable asociada al pedido y a las unidades pendientes.

**Por qué:** El dato de una pantalla pública no prueba derecho a retirar.

**Prueba de aceptación:** Intentar retirar usando solo el número anunciado.

**Prioridad:** Base.

**Referencias relacionadas:** [S16](#s16), [S29](#s29).

#### 34. Dos barras validan el mismo comprobante al mismo tiempo

**Solución propuesta:** Confirmar cada entrega en una operación central única por artículo o paquete. El segundo intento recibe 'ya entregado'. Sin sincronización, concentrar validación en un punto de contingencia.

**Por qué:** Un QR copiado puede mostrarse en varios lugares.

**Prueba de aceptación:** Escanear simultáneamente el mismo comprobante en dos equipos.

**Prioridad:** Base.

**Referencias relacionadas:** [S16](#s16), [S29](#s29).

#### 35. El cliente busca el pedido en una barra equivocada

**Solución propuesta:** Asignar el punto de retiro y mostrar texto claro, ubicación real y señalización coincidente. Evitar cambiar de barra tras avisar salvo incidencia comunicada.

**Por qué:** El estado listo es útil cuando también se sabe dónde retirar.

**Prueba de aceptación:** Seguir las instrucciones desde la pista hasta el retiro.

**Prioridad:** Base.

**Referencias relacionadas:** [S02](#s02), [S05](#s05).

#### 36. Nadie retira y el pedido pierde calidad

**Solución propuesta:** Registrar la hora de preparado, recordar el retiro y alertar al responsable. Definir tratamiento por producto; no rehacer, desechar ni devolver dinero automáticamente por un contador.

**Por qué:** El software no puede evaluar por sí solo la condición física del producto.

**Prueba de aceptación:** Dejar un pedido listo sin retirar y revisar la escalada.

**Prioridad:** Base.

**Referencias relacionadas:** [S02](#s02), [S05](#s05).

#### 37. Se entrega un producto equivocado, incompleto o cuestionado

**Solución propuesta:** Verificar contenido y cantidades al entregar; abrir una incidencia vinculada al pedido. El encargado decide corrección, reposición o devolución y registra el motivo.

**Por qué:** La entrega validada no elimina la necesidad de atender errores reales.

**Prueba de aceptación:** Reportar una bebida faltante después de una entrega parcial.

**Prioridad:** Base.

**Referencias relacionadas:** [S05](#s05), [S13](#s13), [S27](#s27).

#### 38. El aviso no llega o el teléfono está bloqueado

**Solución propuesta:** Mantener estado consultable en la web y respaldo en televisión si existe; ofrecer notificaciones con permiso y canales opcionales con costos controlados. No depender de un único aviso.

**Por qué:** Permisos, conectividad y dispositivos condicionan las notificaciones.

**Prueba de aceptación:** Denegar notificaciones y cerrar la pestaña durante la preparación.

**Prioridad:** Base.

**Referencias relacionadas:** [S28](#s28), [S05](#s05).

#### 39. La televisión mezcla votaciones con pedidos y datos personales

**Solución propuesta:** Reservar una zona persistente para retiros, usar códigos sin nombres completos y ocultar los entregados. La pantalla pública solo muestra información pública, sin controles internos.

**Por qué:** La animación musical no debe tapar una entrega ni exponer datos.

**Prueba de aceptación:** Abrir una encuesta mientras se anuncian pedidos nuevos.

**Prioridad:** Base.

**Referencias relacionadas:** [S16](#s16), [S29](#s29).

#### 40. El retiro produce una nueva aglomeración

**Solución propuesta:** Acordar un punto y responsable de entrega, señalización y capacidad de espera; escalonar avisos cuando sea necesario, sin marcar como no preparado lo que ya está listo.

**Por qué:** La disposición del lugar sigue siendo parte de la solución.

**Prueba de aceptación:** Observar una tanda real de retiros simultáneos.

**Prioridad:** Base.

**Referencias relacionadas:** [S02](#s02), [S05](#s05).


### F. DJ, encuestas y contenido

#### 41. El DJ termina administrando una pantalla toda la noche

**Solución propuesta:** Preparar plantillas y opciones antes del evento; permitir pausa, ventanas breves de participación y delegado autorizado si existe alguien disponible.

**Por qué:** La participación debe caber en el trabajo real del DJ.

**Prueba de aceptación:** Ejecutar una sesión con cambios musicales mientras llegan interacciones.

**Prioridad:** Mockup; piloto musical opcional.

**Referencias relacionadas:** [S18](#s18).

#### 42. Se piden temas que el DJ no tiene o que no encajan

**Solución propuesta:** Limitar opciones a géneros, artistas o repertorio que el DJ habilite. Un voto no dispara audio ni garantiza una canción; las playlists posteriores pueden publicarse mediante enlaces autorizados.

**Por qué:** La consulta del público debe respetar la disponibilidad y el criterio musical.

**Prueba de aceptación:** Solicitar un tema fuera del repertorio y revisar la respuesta.

**Prioridad:** Mockup; piloto musical opcional.

**Referencias relacionadas:** [S17](#s17).

#### 43. Votan desde afuera o varias veces

**Solución propuesta:** Para encuestas de asistentes, usar una credencial individual habilitada esa noche y controles de frecuencia; evitar un límite por IP compartida. Cookies, teléfono verificado o código público por sí solos no prueban presencia.

**Por qué:** Hay un equilibrio entre participación fácil y confianza en el resultado.

**Prueba de aceptación:** Probar incógnito, otro teléfono y una credencial de otra noche.

**Prioridad:** Mockup; piloto musical opcional.

**Referencias relacionadas:** [S19](#s19), [S29](#s29).

#### 44. La votación interrumpe una compra o el retiro

**Solución propuesta:** Mostrar invitación voluntaria y mantener pedido, pago y comprobante accesibles. Al entrar, dar protagonismo a la encuesta sin imponer un bloqueo de la web.

**Por qué:** Una actividad opcional no debe impedir la función principal.

**Prueba de aceptación:** Recibir una votación durante pago y durante retiro.

**Prioridad:** Mockup; piloto musical opcional.

**Referencias relacionadas:** [S18](#s18), [S20](#s20).

#### 45. Hay empate, pocos votos o diferentes relojes muestran resultados distintos

**Solución propuesta:** Definir antes del evento qué ocurre con empate o participación escasa; el DJ resuelve entre opciones habilitadas. Cerrar según hora del servidor y confirmar resultados tras sincronizar.

**Por qué:** Una regla previa evita cambiar el criterio para favorecer un resultado.

**Prueba de aceptación:** Simular empate, cero votos y un teléfono con hora incorrecta.

**Prioridad:** Mockup; piloto musical opcional.

**Referencias relacionadas:** [S19](#s19), [S20](#s20).

#### 46. Dos DJs o asistentes publican encuestas simultáneas

**Solución propuesta:** Asignar una sesión activa y permisos por franja. Solo una encuesta musical activa; el cambio de DJ transfiere control sin mezclar resultados históricos.

**Por qué:** Cada momento de la noche necesita un responsable claro.

**Prueba de aceptación:** Cambiar de DJ durante una encuesta abierta.

**Prioridad:** Mockup; piloto musical opcional.

**Referencias relacionadas:** [S18](#s18), [S26](#s26).

#### 47. La votación promete una contratación que Terraço no puede hacer

**Solución propuesta:** Consultar preferencias entre candidatos previamente disponibles o preguntar a quién quieren volver a escuchar, dejando claro su carácter consultivo. Publicar fechas solo tras confirmación.

**Por qué:** Contratar también depende de presupuesto, agenda y propuesta del local.

**Prueba de aceptación:** Elegir un candidato indisponible y comprobar que no aparece como contratado.

**Prioridad:** Mockup; decisión comercial.

**Referencias relacionadas:** [S19](#s19).

#### 48. Hay insultos, contenido inapropiado o perfiles y playlists falsos

**Solución propuesta:** Empezar con opciones cerradas y perfiles editables por DJs autorizados; aprobar cambios públicos y enlaces. Si se incorpora texto libre, moderar antes de proyectar y permitir bloquear abuso.

**Por qué:** La interacción pública requiere responsabilidad editorial.

**Prueba de aceptación:** Enviar texto abusivo e intentar editar el perfil de otro DJ.

**Prioridad:** Mockup; piloto musical opcional.

**Referencias relacionadas:** [S17](#s17), [S18](#s18), [S20](#s20).


### G. Fidelización y datos del cliente

#### 49. Escanear el QR suma visitas falsas

**Solución propuesta:** Contar como máximo una asistencia por persona y jornada verificada por acceso o personal. Si solo hay compras verificadas, llamar al beneficio fidelización por compra, no asistencia.

**Por qué:** Visitar una página no demuestra haber estado en el local.

**Prueba de aceptación:** Escanear repetidamente sin asistir y repetir después de medianoche.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S21](#s21), [S16](#s16).

#### 50. Paga uno por todos y el premio queda mal asignado

**Solución propuesta:** Separar premio por compra del premio por asistencia. La compra se atribuye según su regla; cada asistente valida su propia presencia. No multiplicar visitas por declarar que el grupo tiene seis.

**Por qué:** Quien paga y quien asiste pueden ser personas diferentes.

**Prueba de aceptación:** Una ronda con un pagador y varios asistentes verificados.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S21](#s21), [S08](#s08).

#### 51. Se devuelve la compra pero quedan puntos o premios indebidos

**Solución propuesta:** Vincular puntos al pedido y registrar ajustes ante devoluciones, sin duplicarlos por reintentos. En premios ya usados, enviar a revisión una excepción documentada.

**Por qué:** El beneficio debe seguir siendo consistente con la operación real.

**Prueba de aceptación:** Reembolsar una compra premiada y repetir su notificación.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S21](#s21), [S22](#s22).

#### 52. Un mismo cupón se usa dos veces

**Solución propuesta:** Reservar el beneficio durante el pago y confirmarlo una sola vez; liberarlo si falla sin generar una compra. Mantener historial de canje y anulaciones autorizadas.

**Por qué:** El premio también requiere protección frente a uso simultáneo.

**Prueba de aceptación:** Aplicar el mismo cupón a dos compras concurrentes.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S21](#s21), [S22](#s22), [S29](#s29).

#### 53. Los descuentos aumentan ventas pero reducen el resultado

**Solución propuesta:** Definir costo máximo, productos aplicables, acumulación y vigencia visibles. Evaluar margen estimado y repetición antes de ampliar el programa.

**Por qué:** Un incentivo solo sirve si su costo es sostenible para Terraço.

**Prueba de aceptación:** Calcular el costo de premiar al volumen esperado de clientes.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S22](#s22), [S23](#s23).

#### 54. Ocho visitas resultan demasiado lejanas o no motivan

**Solución propuesta:** Tratar la cantidad como hipótesis. Mostrar progreso y ensayar beneficios tempranos de costo controlado; comparar retorno y canje por grupos semejantes.

**Por qué:** La cantidad elegida necesita evidencia de comportamiento real.

**Prueba de aceptación:** Medir inicio, progreso, abandono y canje del programa piloto.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S21](#s21).

#### 55. Cambiar de teléfono o crear cuentas duplica o pierde beneficios

**Solución propuesta:** Ofrecer recuperación mediante contacto verificado y revisión de fusiones. No unir perfiles solo por nombre, ni asumir que un teléfono garantiza identidad única.

**Por qué:** Conservar confianza requiere corregir errores sin regalar historiales ajenos.

**Prueba de aceptación:** Recuperar cuenta y solicitar una fusión con datos insuficientes.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S21](#s21), [S29](#s29).

#### 56. Para comprar se obliga a aceptar publicidad o entregar datos innecesarios

**Solución propuesta:** Permitir pedido como invitado con datos mínimos para el servicio. Separar beneficios y comunicaciones comerciales voluntarias, con salida sencilla y permisos claros.

**Por qué:** La compra no necesita convertirse en un trámite de marketing.

**Prueba de aceptación:** Comprar rechazando publicidad y notificaciones opcionales.

**Prioridad:** Base.

**Referencias relacionadas:** [S28](#s28), [S29](#s29).


### H. Estadísticas y decisiones del dueño

#### 57. El dueño interpreta ventas digitales como ventas de todo el local

**Solución propuesta:** Mostrar qué canales están incluidos y su cobertura conocida. Integrar ventas presenciales si es viable; si no, etiquetar explícitamente el alcance y evitar totales globales engañosos.

**Por qué:** Los datos faltantes no son ventas iguales a cero.

**Prueba de aceptación:** Comparar informe con una venta presencial no integrada.

**Prioridad:** Base.

**Referencias relacionadas:** [S23](#s23).

#### 58. La madrugada parte una misma noche en dos días

**Solución propuesta:** Definir jornada operativa con horario de corte y zona de Argentina. Conservar la fecha real de cada evento y asignarlo además a su noche de servicio.

**Por qué:** La experiencia del viernes continúa aunque el calendario ya diga sábado.

**Prueba de aceptación:** Vender y sumar una visita antes y después de medianoche.

**Prioridad:** Base.

**Referencias relacionadas:** [S24](#s24).

#### 59. Se confunden facturación, cobros, devoluciones y saldo disponible

**Solución propuesta:** Presentar métricas con definiciones: ventas, cobrado, devuelto, comisiones y liquidación. Conservar fechas de cada hecho y conciliación; los reclamos y contracargos quedan separados.

**Por qué:** Una cifra única no explica el dinero ni sus movimientos.

**Prueba de aceptación:** Revisar pago vendido hoy, liquidado después y parcialmente devuelto.

**Prioridad:** Base.

**Referencias relacionadas:** [S23](#s23), [S25](#s25).

#### 60. Lo más vendido se toma como lo más rentable o el stock como prueba de robo

**Solución propuesta:** Mostrar unidades e ingresos; calcular margen solo con costos y recetas confiables y etiquetarlo como estimado. Registrar mermas, cortesías y ajustes antes de interpretar diferencias.

**Por qué:** Ni los ingresos ni el inventario incompleto prueban rentabilidad o conducta.

**Prueba de aceptación:** Cambiar un costo y registrar una cortesía o merma.

**Prioridad:** Base; margen avanzado.

**Referencias relacionadas:** [S03](#s03), [S23](#s23).

#### 61. Se inventa permanencia del público a partir de compras o clics

**Solución propuesta:** Mostrar participación musical y opiniones. Medir permanencia únicamente con entradas y salidas confiables y alcance indicado; nunca convertir la última compra en hora de salida.

**Por qué:** La conducta digital no demuestra presencia física.

**Prueba de aceptación:** Un asistente deja de usar la web y continúa bailando.

**Prioridad:** Base de informes; permanencia condicionada.

**Referencias relacionadas:** [S19](#s19).

#### 62. Los votos de pocos se presentan como opinión de todo el local

**Solución propuesta:** Mostrar votos y cantidad de participantes; calcular tasa solo si existe un total de elegibles confiable. Distinguir consulta abierta y encuesta de asistentes verificados.

**Por qué:** El resultado describe a quienes respondieron.

**Prueba de aceptación:** Publicar un resultado con pocos votos y aforo desconocido.

**Prioridad:** Mockup; piloto musical opcional.

**Referencias relacionadas:** [S19](#s19), [S20](#s20).

#### 63. Se atribuye al DJ o a la app una diferencia causada por otra cosa

**Solución propuesta:** Comparar noches junto con horarios, asistencia verificada, precios, promociones y personal. Mostrar asociaciones y límites; no afirmar causalidad desde una sola fecha.

**Por qué:** Una comparación sin contexto puede llevar a decisiones comerciales equivocadas.

**Prueba de aceptación:** Comparar noches con precios, asistencia o dotación diferentes.

**Prioridad:** Avanzado.

**Referencias relacionadas:** [S23](#s23), [S24](#s24).

#### 64. El proyecto cuesta más de lo que aporta

**Solución propuesta:** Medir tiempo ahorrado, incidencias, adopción, costo de cobros, equipos, soporte e incentivos. Validar disposición del dueño a continuar y ampliar por etapas.

**Por qué:** La utilidad técnica necesita sostener una operación y un negocio.

**Prueba de aceptación:** Evaluar una prueba incluyendo horas de ayuda y todos sus costos.

**Prioridad:** Base de validación.

**Referencias relacionadas:** [S02](#s02), [S23](#s23).


### I. Equipo, seguridad y continuidad

#### 65. El personal se abruma con opciones y cambios

**Solución propuesta:** Pantallas por función, acciones grandes y detalle secundario. Capacitar con situaciones reales y conservar compra asistida; asignar responsabilidades según el equipo disponible.

**Por qué:** La velocidad depende de que cada turno entienda y use el circuito.

**Prueba de aceptación:** Un trabajador realiza tareas habituales tras una capacitación breve.

**Prioridad:** Base.

**Referencias relacionadas:** [S04](#s04), [S26](#s26).

#### 66. Un cliente o trabajador accede a pedidos o funciones ajenos

**Solución propuesta:** Verificar permisos en el servidor para cada pedido y operación. Separar lectura y edición, devoluciones y configuración; las pantallas y enlaces ocultos no son controles suficientes.

**Por qué:** Cambiar un identificador o una URL no debe cambiar los derechos.

**Prueba de aceptación:** Intentar leer o modificar un pedido con una cuenta sin permiso.

**Prioridad:** Base.

**Referencias relacionadas:** [S29](#s29).

#### 67. Se comparten claves, se pierde un equipo o un empleado deja el local

**Solución propuesta:** Usar accesos individuales, autenticación reforzada para administración, bloqueo de equipos y revocación de sesiones. Registrar acciones sensibles con responsable y motivo.

**Por qué:** La trazabilidad y la salida del personal deben estar previstas.

**Prueba de aceptación:** Revocar un usuario y comprobar que su sesión abierta deja de funcionar.

**Prioridad:** Base.

**Referencias relacionadas:** [S26](#s26), [S27](#s27), [S29](#s29).

#### 68. Bots, abuso o recolección excesiva generan costos y exposición

**Solución propuesta:** Limitar solicitudes y envío de avisos por cuenta y función; aplicar controles adicionales ante abuso. Minimizar datos, proteger secretos y limitar visibilidad pública y conservación.

**Por qué:** La plataforma debe resistir abuso sin impedir el uso normal del público.

**Prueba de aceptación:** Simular exceso de solicitudes y revisar datos visibles en pantallas y registros.

**Prioridad:** Base.

**Referencias relacionadas:** [S29](#s29), [S28](#s28).

#### 69. Se cae internet y el local sigue cobrando pedidos que no recibe

**Solución propuesta:** Comprobar la recepción de cada estación, pausar compras afectadas e informar lo ocurrido. Mantener contingencia presencial numerada con un responsable y conciliación posterior; nunca anunciar aprobación online sin verificar.

**Por qué:** Continuar trabajando localmente no equivale a recibir pedidos por internet.

**Prueba de aceptación:** Cortar conexión con pedidos pendientes y cobros en tránsito.

**Prioridad:** Base.

**Referencias relacionadas:** [S15](#s15).

#### 70. Falla un dispositivo, la tele o la electricidad

**Solución propuesta:** Mostrar última sincronización, permitir un equipo alternativo autenticado y usar energía de respaldo cuando se justifique. La tele es complementaria; acordar un procedimiento físico si se pierde la operación digital.

**Por qué:** El servicio necesita una salida práctica cuando falla su soporte material.

**Prueba de aceptación:** Apagar pantalla o dispositivo y continuar con la alternativa acordada.

**Prioridad:** Base.

**Referencias relacionadas:** [S15](#s15), [S28](#s28).

#### 71. Una actualización o pérdida de datos rompe una noche en marcha

**Solución propuesta:** Probar en entorno separado, evitar cambios durante servicio, disponer de reversión y copias recuperables, monitoreo y reanudación segura. Verificar restauración y conciliación de cobros reales tras incidentes.

**Por qué:** Una copia sin prueba y un botón de reinicio no garantizan recuperación.

**Prueba de aceptación:** Restaurar un respaldo y recuperar pendientes sin duplicar cobros ni entregas.

**Prioridad:** Base.

**Referencias relacionadas:** [S15](#s15), [S29](#s29).

#### 72. El mockup parece completo pero la operación real nunca fue validada

**Solución propuesta:** Etiquetar datos y pagos simulados. Antes del piloto, relevar flujo actual, equipos, QR y responsables; probar con el personal, fijar soporte y criterios de aceptación. Incorporar pagos grupales y premios después del núcleo.

**Por qué:** Una demostración visual no acredita integración, seguridad ni capacidad real.

**Prueba de aceptación:** Ejecutar un recorrido de punta a punta con el equipo y documentar excepciones.

**Prioridad:** Base de planificación.

**Referencias relacionadas:** [S04](#s04), [S15](#s15), [S26](#s26).

## Reglas que evitan contradicciones entre módulos

### 1. Tres estados independientes

Cada compra conserva su situación de pago, preparación y entrega. Además, tiene estados para cancelación e incidencias. Un pago confirmado no equivale a un pedido visto por el personal; un producto preparado no equivale a una entrega. Una devolución no debe borrar el historial anterior.

La interfaz traduce estas diferencias a mensajes sencillos. Por ejemplo: “Pago confirmado; enviando pedido”, “Recibido en barra”, “Bebidas listas; comida en preparación” y “Bebidas entregadas”. No se anuncia “recibido en barra” hasta que exista confirmación de recepción.

### 2. Reserva de stock, pago tardío y cierre

El carrito por sí solo no reserva productos indefinidamente. La reserva de pago tiene duración definida y una confirmación única. La disponibilidad se vuelve a evaluar cuando corresponde y el sistema sigue escuchando novedades financieras después del vencimiento.

Si un pago tardío llega cuando ya no se puede cumplir, el pedido queda como incidencia financiera: se informa al cliente, se inicia la devolución por el medio correspondiente y se sigue su resultado. No se prepara automáticamente un pedido vencido ni se ignora el dinero recibido.

Los tiempos de reserva y tolerancia al cierre deben acordarse con el local y ajustarse a los medios de pago elegidos. No se fijaron segundos o minutos sin observar su operación.

### 3. Una compra grupal necesita un acuerdo congelado

Definir productos, total, reparto y plazo antes de comenzar a cobrar las cuotas. Los aportes no se convierten en un monedero reutilizable. Registrar cada contribución contra el pedido y su pagador. Enviar a preparación al completar el importe requerido y confirmar disponibilidad.

Ante un faltante de pago, permitir cobertura voluntaria del saldo. Si vence sin completarse, cerrar el pedido y tramitar las devoluciones de los aportes cobrados. La disponibilidad de autorizaciones, capturas, cancelaciones y reembolsos debe comprobarse en la modalidad específica del proveedor; no se asume que un “split” comercial resuelva aportes entre amigos.

### 4. Reembolsar no es borrar ni liberar un pago que ya se cobró

Una reserva de dinero no capturada, un cobro finalizado y un reembolso pendiente son situaciones distintas. Registrar el original y el movimiento correctivo, junto con importes y responsables. No prometer devolución instantánea ni sustituir una devolución por saldo interno obligatorio.

Si hay varios pagadores, devolver contra las contribuciones originales conforme a la asignación guardada. El plazo, los cargos aplicables, las obligaciones de consumo y el tratamiento fiscal se deben verificar para la operación real; las políticas operativas del prototipo no eliminan derechos del cliente.

### 5. Un QR de retiro no garantiza identidad ni funciona solo

El código público identifica el pedido. La credencial privada acredita acceso al pedido, pero puede copiarse o compartirse. La validación central limita una entrega a las unidades pendientes; las restricciones presenciales y comprobaciones necesarias permanecen a cargo del local.

Dos validadores desconectados no deben prometer protección global contra doble retiro. Durante contingencia, concentrar la entrega en una autoridad con lista o registro controlado. Conciliar al recuperar servicio sin volver a emitir derechos de retiro ya usados.

### 6. Sin señal no se inventan confirmaciones

Probar la conectividad en cada estación y durante el pico, incluyendo la red del público. Una pantalla puede conservar información local sin poder recibir cambios actuales. Mostrar última sincronización y advertir cuando los datos estén desactualizados.

El mecanismo de pausa por pérdida de recepción tiene un intervalo de detección: debe existir una rutina para los pedidos y cobros aceptados justo antes de la pausa. La conexión recuperada no justifica repetir cobros ni tareas de preparación ya realizadas.

El plan de continuidad puede combinar caja asistida, pedidos numerados, comunicación interna y posterior conciliación. No se confirmó que la infraestructura actual de Terraço permita una solución automática offline.

### 7. Participar con el DJ es opcional y limitado

El DJ prepara opciones posibles y controla cuándo consultar al público. Una encuesta sugiere el próximo bloque o decisión anunciada; no reproduce música automáticamente ni compromete contrataciones. La pantalla de compra y el comprobante permanecen accesibles.

La hora de cierre la decide el sistema central. La política para empate, participación insuficiente y cancelación de encuesta se define antes de abrirla. Si se cambia o anula, se informa sin alterar silenciosamente votos históricos.

Un acceso verificado mediante teléfono confirma control del contacto, no presencia en Terraço. La verificación de asistencia requiere un mecanismo del local. Usar un único límite por IP excluiría a personas que comparten Wi-Fi. Los controles reducen abuso; no se promete ausencia absoluta de manipulación.

### 8. Visita, compra y retorno son medidas diferentes

El beneficio por asistencia exige comprobación presencial o un acceso equivalente. Si solo se conocen compras, el programa se presenta como premio por compra. Un pagador de una ronda no puede crear asistencias de personas no verificadas.

Definir qué significa una noche de servicio y evitar doble visita por el cambio de fecha a medianoche. Acordar recuperación de identidad, privacidad, vigencia y costo de incentivos. Empezar con la regla más sencilla que pueda verificarse sin frenar el ingreso.

### 9. Las estadísticas explican lo que se registró

Distinguir datos completos, parciales y estimaciones. Mostrar tamaño de muestra y cobertura, sin porcentajes cuyo denominador se desconoce. Un voto, una compra o una sesión del navegador no prueban cuánto permaneció una persona.

Comparar ingresos por hora de un DJ puede aportar contexto, pero no acredita cuánto ingreso causó ni cuál es su calidad. Tampoco se deben clasificar trabajadores por tiempos sin considerar tipo de tarea y carga. Las herramientas deben apoyar decisiones informadas, no generar conclusiones ficticias.

### 10. La atención y el control físico permanecen en Terraço

El personal puede ayudar a comprar y resolver incidencias. Los controles presenciales para entregar bebidas permanecen a cargo del local; la app no los sustituye. Un rechazo de entrega debe tener responsable y circuito de resolución del cobro, no dejar al cliente sin respuesta.

No se confirmó si la comida llega a mesa o se retira. El diseño conserva ambas modalidades como configuración hasta conocer el recorrido real. Tampoco se confirmó que exista televisión, red adecuada o sistema integrable de caja. No se inventaron equipos, catálogo, precios o personal.

## Qué resolver antes de construir el piloto

| Pregunta pendiente | Por qué cambia el diseño |
| --- | --- |
| ¿Qué genera el QR actual y quién lo valida? | Determina integración, emisión y control de retiro. |
| ¿La comida se retira o llega a mesa? | Cambia despacho, identificación de mesa y entrega. |
| ¿Cuántas estaciones y personas trabajan en cada tramo? | Determina permisos, capacidad y responsabilidades. |
| ¿Qué pagos usan y a nombre de quién se reciben? | Determina confirmaciones, conciliación y devoluciones. |
| ¿Hay carta, combos, recetas y disponibilidad mantenida? | Determina catálogo e inventario realista. |
| ¿Cómo funciona internet y dónde puede instalarse respaldo? | Determina continuidad y límites del canal digital. |
| ¿Hay televisión y un punto separado de retiro? | Determina avisos y circulación. |
| ¿Qué participación acepta el DJ? | Determina repertorio, encuestas, horarios y delegación. |
| ¿Cómo se comprueba hoy la asistencia? | Determina si puede existir un premio por visita. |
| ¿Qué resultado y costo hacen valioso el piloto para el dueño? | Determina prioridades y continuidad comercial. |

## Orden recomendado de implementación

1. **Relevamiento y mockup:** recorrido completo, perfiles y excepciones simuladas identificadas como tales.
2. **Núcleo operativo:** catálogo, compra asistida y digital, cobro verificado, tareas por estación, retiro único, incidencias, permisos y contingencia.
3. **Prueba acotada:** una fecha, menú limitado y volumen acordado; medir ayuda necesaria, tiempos y errores.
4. **Participación musical opcional:** encuestas cerradas bajo control del DJ y con metodología visible.
5. **Funciones avanzadas:** cobro por varias personas, recompensas e informes más complejos, después de validar sus dependencias.

Los 72 casos no equivalen a 72 pantallas. La mayoría se resuelve mediante reglas internas, estados y procedimientos compartidos, mientras las acciones cotidianas siguen siendo pocas.

## Fuentes consultadas

Todas consultadas el 22/11/2026. Se trata de documentación pública y respuestas oficiales, sin prueba de contratación o uso en Terraço. Cada síntesis siguiente describe solo lo observado en esa página.

### S01

[Square: pausa de pedidos](https://js.squareup.com/help/us/en/article/6679-orders-in-square-pos-setup-guide)

Permite frenar pedidos nuevos y continuar procesando los existentes.

### S02

[Square: retiro y capacidad](https://js.squareup.com/help/us/en/article/6866-in-store-and-curbside-pickup-with-square-online-store)

Configura horarios, tiempos de preparación y capacidad de retiros.

### S03

[Square: disponibilidad](https://api.squareup.com/help/us/en/article/8495-beta-item-availability)

Distingue disponibilidad y conteos; contempla canales integrados y stock comprometido.

### S04

[Toast: configuración de cocina](https://support.toasttab.com/en/article/Basic-Kitchen-Configuration)

Separa estaciones de preparación y una vista que consolida el pedido.

### S05

[Toast: preparación y entrega](https://support.toasttab.com/en/article/Using-KDS-Two-Level-Fulfillment?lang=en_US)

Permite registrar preparación y posterior entrega en dos niveles.

### S06

[Toast: corrección de estados](https://support.toasttab.com/en/article/KDS-FAQ)

Documenta cómo devolver un ticket preparado al estado pendiente.

### S07

[Toast: información de alérgenos](https://support.toasttab.com/en/article/Add-Allergen-Information-to-Online-Ordering-Menu-Items?lang=en_US)

Permite publicar alérgenos por producto en canales de pedido.

### S08

[Uber Eats: pedidos grupales](https://help.uber.com/en-GB/ubereats/restaurants/article/com-puc-fer-una-comanda-de-grup-?nodeId=886fdace-3cee-4658-9d3c-7cadfbec5280)

Ofrece enlace grupal, fecha límite, bloqueo de edición y modalidades de pago.

### S09

[Toast: pagos divididos](https://support.toasttab.com/en/article/Split-Payments-with-Toast-Mobile-Order-Pay)

Permite pagar artículos propios o saldo y depende de configuraciones de cuenta y grupo.

### S10

[Mercado Pago: idempotencia](https://www.mercadopago.com.ar/developers/es/news/2023/01/04/Idempotency-key-usage-will-be-mandatory)

Describe claves para evitar duplicaciones en solicitudes de pago y devolución.

### S11

[Mercado Pago: notificaciones](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-orders/notifications)

Documenta notificaciones de cambios y validación de su origen.

### S12

[Mercado Pago: estados de pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-payments/response-handling/query-results?scope=prod)

Distingue aprobación, autorización, estados pendientes y procesamiento.

### S13

[Mercado Pago: cancelaciones y reembolsos](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-settings/refunds-and-cancellations)

Distingue cancelación y reembolso y contempla devoluciones parciales.

### S14

[Stripe: estados del reembolso](https://support.stripe.com/questions/understanding-refund-statuses?locale=en-GB)

Distingue devolución iniciada, reversión y situaciones pendientes; no equivale a dinero ya recibido.

### S15

[Toast: interrupciones de conectividad](https://support.toasttab.com/en/article/Outages-and-Disruptions-Toast-Online-Ordering)

Diferencia operación local sin conexión de recepción de pedidos online.

### S16

[Eventbrite: comprobantes usados](https://support.eventbrite.com/hc/en-us/articles/34865071066642-Prevent-attendees-from-sharing-tickets)

El escaneo detecta comprobantes ya utilizados.

### S17

[Rekwest: repertorio](https://rekwest.app/documentation/docs/guide/limit-song-requests-to-own-repertoire/)

Permite restringir solicitudes a repertorios definidos por el DJ.

### S18

[Rekwest: personal del evento](https://rekwest.app/documentation/docs/advanced/event-staff/)

Permite delegar gestión, pausar solicitudes y separar determinadas facultades del creador.

### S19

[Slido: límites de votos](https://community.slido.com/community-q-a-7/how-can-i-make-sure-people-only-vote-once-4185)

Una respuesta oficial reconoce límites de controles por navegador y propone verificación adicional.

### S20

[Mentimeter: respuestas abiertas](https://help.mentimeter.com/en/articles/410470-how-to-use-open-ended-slides-in-menti-live)

Ofrece controles sobre respuestas, filtros y eliminación de aportes.

### S21

[Square: puntos de fidelización](https://developer.squareup.com/docs/loyalty-api/loyalty-points)

Registra acumulación y ajustes como eventos vinculados a reglas de compra.

### S22

[Square: premios y reembolsos](https://squareup.com/help/us/en/article/6130-manage-your-square-loyalty-program)

Contempla anulaciones de premios y ajustes de puntos por devoluciones.

### S23

[Square: informes de ventas](https://js.squareup.com/help/us/en/article/5381-in-app-summaries-and-reports)

Distingue métricas financieras y filtros del informe.

### S24

[Square: horario de informes](https://api.squareup.com/help/us/en/article/5072-summaries-and-reports-from-the-online-dashboard)

Permite configurar franjas y zona horaria para atribuir ventas.

### S25

[Square: cierre de jornada](https://js.squareup.com/help/us/en/article/6594-end-of-day-reporting-with-square-for-restaurants)

Incluye cuentas, cajas y procedimientos de cierre.

### S26

[Square: equipo y permisos](https://js.squareup.com/help/us/en/article/8356-add-and-manage-team-members)

Documenta accesos individuales, permisos y desactivación del personal.

### S27

[Square: trazabilidad de acciones](https://squareup.com/us/en/point-of-sale/features/dashboard?msockid=15664502931d6c55364d536992ed6da1)

Describe permisos y registro de actividad atribuible al personal.

### S28

[MDN: notificaciones web](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API)

Explica permisos y diferencias de implementación de notificaciones según entorno.

### S29

[OWASP: seguridad de APIs](https://owasp.org/projects/api-security-project)

Identifica riesgos de autorización, autenticación, consumo de recursos y abuso de procesos.

### S30

[Mercado Pago: diferencias entre APIs](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-orders/resources/migrate-payments-to-orders)

Documenta que estados y operaciones difieren entre Payments API y Orders API.

