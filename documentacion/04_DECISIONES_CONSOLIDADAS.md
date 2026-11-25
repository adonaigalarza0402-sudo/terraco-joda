# TERRACO — Decisiones consolidadas para la demo

Versión 1.0 · 22/11/2026. Este documento convierte la conversación y los antecedentes en reglas de construcción. No acredita validación presencial del establecimiento.

## 1. Qué estamos construyendo

Una aplicación web que acompaña la visita completa: conocer la fecha, consultar una reserva, cenar, ver un show y participar del baile. Cada persona ve pocas acciones frecuentes; el detalle existe cuando hace falta. La demo permite probar todos los perfiles con datos compartidos, pero no hace cobros ni envíos reales.

La prioridad es pedido → pago de prueba → recepción de estación → preparación → entrega → registro. Los módulos de DJ, beneficios, reservas e informes deben acoplarse sin debilitar ese circuito.

## 2. Cómo se incorporan las seis mejoras seleccionadas

| Mejora | Encaje final en la demo | Límite que evita complicaciones |
| --- | --- | --- |
| Volver a pedir | Acción desde un pedido anterior; abre una copia editable y revisada. | Nunca repite el cobro, la credencial ni el precio anterior por defecto. |
| Producción agrupada | Vista opcional de cocina/barra, con detalle de las unidades de cada pedido. | No forma lotes esperando clientes nuevos ni pierde la antigüedad de los tickets. |
| Preparar la noche | Ficha por fecha y plantilla, con revisión antes de publicar. | Copiar configuración no copia ventas, personas, reservas particulares ni votos. |
| Reserva vinculada a la fecha | Consulta web y borrador WhatsApp; confirmación del encargado en un único registro. | Solicitud y confirmación son estados diferentes; no se presume integración automática. |
| Coordinación de mesa | Agrupar visualmente pedidos de la ocupación actual para ayudar a cocina. | Decisión humana; se descarta la retención automática por una ventana de espera. |
| Enlaces por canal | Escenario opcional con solicitudes, confirmaciones y asistencias verificadas de prueba. | Los clics solos no acreditan resultados; no se infiere causalidad ni se comparten datos privados con el DJ. |

Las propuestas 4, 5 y 6 se pueden demostrar, pero su activación en un piloto real depende del procedimiento del local. El usuario aceptó explorar su incorporación; eso no valida aforo, políticas, volumen ni una integración técnica.

## 3. Reglas que atraviesan toda la aplicación

| Situación | Resolución para la demo | Por qué |
| --- | --- | --- |
| Cena, show y baile se solapan | Programación por momentos y disponibilidad independiente por categoría. | Cambiar de contexto no elimina compromisos anteriores. |
| Una función distrae al público | Participación opcional; compra y seguimiento siempre accesibles. | El teléfono debe resolver una tarea y permitir volver a disfrutar del lugar. |
| Sobrecarga del personal | Una cola por puesto, siguiente acción clara y detalles progresivos. | Menos decisiones repetidas facilitan aprender y atender durante el pico. |
| Una persona cubre varios puestos | Roles combinables en la configuración de prueba. | El software se adapta al equipo; no inventa una dotación real. |
| Carta física y carta digital divergen | Un catálogo estructurado para todas las vistas; conservar fuente y dudas. | Evita mantener precios o variantes en listas independientes. |
| Producto ambiguo | Mantener dato original y confirmar presentación; usar supuesto explícito solo en la demo. | No convertir una deducción en una condición comercial. |
| Stock o categoría cambian al pagar | Revalidar y mostrar cambios antes de confirmar; pedidos aceptados continúan. | Un cierre afecta compras nuevas, no borra lo ya vendido. |
| Doble toque o evento repetido | Identificador de intención y transiciones que no repiten efectos en la autoridad de demo. | La misma intención no debe generar dos compras o entregas. |
| Pago aprobado sin recepción | Estados separados y aviso de incidencia, con pausa del canal afectado. | Cobrar no prueba que el equipo haya recibido una tarea. |
| Pedido dividido entre estaciones | Estado y entrega por línea/unidad, con resumen comprensible. | Bebidas listas no significan que la comida también lo esté. |
| Dos trabajadores toman la tarea | Registro compartido de asignación y unidades pendientes. | Evita duplicar la preparación dentro del alcance simulado. |
| TV o teléfono muestran pedido listo | Código público y lugar de retiro; credencial privada distinta. | La información pública identifica; no autoriza la entrega. |
| Retiro parcial o repetido | Validar contra unidades pendientes; registrar lo entregado sin borrar historial. | Permite completar el pedido sin entregar dos veces. |
| Error del trabajador | Acciones sensibles con confirmación contextual, responsable y corrección trazable. | Corregir no debe borrar lo ocurrido. |
| Pago tardío o producto no entregable | Incidencia financiera; comprobar cumplimiento o devolución simulada. | No ignorar un cobro ni reactivar automáticamente una compra vencida. |
| Devolución parcial o fallida | Movimiento separado, monto, pagador y estado propio. | Devolver no equivale a borrar la compra ni a tener dinero ya acreditado. |
| Cálculo de ronda confuso | Calcular reparto es la opción simple; un pagador completa el pedido. | Ayuda al grupo sin exigir identidades ni varios cobros. |
| Pago entre varios incompleto | Acuerdo congelado, aportes identificados, plazo, cobertura voluntaria o devoluciones. | Ningún participante queda sin saber qué pasó con su aporte. |
| Redondeos de dinero | Importes enteros en centavos y reparto determinista del remanente. | Todas las partes deben sumar exactamente el importe final. |
| Mesa cambia de ocupantes | Nueva sesión de mesa; no mostrar pedidos privados de la anterior. | El QR permanente de la mesa no debe entregar acceso al historial. |
| Comidas llegan separadas | Agrupación visual y coordinación manual por cocina. | Evita sumar esperas automáticas para todo el grupo. |
| WhatsApp se abre sin enviar | Mostrar borrador y solicitud incompleta o pendiente según evidencia. | Abrir un enlace no acredita un mensaje ni una reserva. |
| Consultas por dos canales | Un único registro con referencias y origen, carga asistida y revisión de duplicados. | Evita dos agendas que confirmen el mismo espacio por separado. |
| Mesas, horarios y condiciones desconocidos | Datos ficticios editables y solicitudes sin autoconfirmación. | No vender disponibilidad que no se relevó. |
| DJ ocupado durante la noche | Plantillas, opciones de repertorio, una encuesta activa y delegación explícita. | Interactuar no debe convertirse en una tarea permanente. |
| Votos desde fuera o repetidos | Acceso de noche y límite por identidad de prueba; explicar límites. | Un selector o un teléfono no prueba presencia física ni elimina fraude. |
| Encuesta empatada o con pocos votos | Regla anunciada y decisión final del DJ; conservar historial. | No prometer que la app puede decidir todo el repertorio. |
| Votación para próximo DJ | Preferencia consultiva separada de la programación confirmada. | Un resultado no constituye una contratación. |
| Beneficios por visitas falsas | Asistencia validada de prueba, una vez por persona y noche. | Escanear o pagar por amigos no equivale a que todos hayan asistido. |
| Cupón duplicado o compra devuelta | Uso único y ajustes trazables de puntos/beneficios. | Una incidencia no debe generar una segunda recompensa. |
| Ocho visitas se interpretan como política real | Regla de ejemplo configurable, con condiciones visibles. | No hay una promoción aprobada por el dueño. |
| Datos invasivos | Invitado para comprar, identificación opcional para beneficios y autorización comercial separada. | La función no justifica pedir información innecesaria. |
| Informes con cifras engañosas | Mostrar cobertura, canal, período, estados y origen ficticio de los datos. | Una muestra de la app no representa necesariamente todo TERRACO. |
| Retención o rentabilidad supuestas | No medirlas sin asistencia/permanencia o costos verificables. | Clics, votos e ingresos no prueban esos resultados. |
| La madrugada cambia de fecha | Jornada operativa explícita en horario de Argentina. | Una misma visita y servicio no deben partirse a medianoche. |
| Falta conexión o falla un puesto | Advertencia, pausa según canal y procedimiento asistido centralizado de prueba. | Guardar datos locales no garantiza recibir cobros o pedidos nuevos. |
| Reaparece conexión | Reconciliar sin duplicar cobros, preparación ni derechos de retiro. | Reintentar no debe multiplicar efectos. |
| Cambios técnicos durante la noche | Configuración revisable; reinicio/reset fuera de operación y con confirmación. | Evita destruir el turno accidentalmente. |
| Selector de rol confundido con seguridad | Acceso de demostración visible y límites documentados. | Un frontend no ofrece la autorización ni trazabilidad de un servidor real. |

## 4. Lo que sabemos del lugar

- Marca: TERRACO SOCIAL CLUB; utilizar el arte original del logo y el isotipo.
- Dirección transcrita: Passo 222, H3509, Gral. José de San Martín, Chaco, Argentina.
- WhatsApp transcrito: +54 9 3725 50-2750. Las reservas se gestionan por este canal según el usuario.
- Instagram: @terracosocialclub. Correo: terracosocialclub@gmail.com.
- Cena seguida de baile, con shows en algunas noches. Los momentos pueden solaparse.
- Cinco cartas permiten transcribir 99 referencias base en 18 categorías; falta validar vigencia y varias presentaciones.
- Alan Gómez aparece como antecedente de una fiesta anterior. No es agenda futura confirmada.
- El perfil indica viernes y sábados. Una captura de WhatsApp muestra 00:00–06:00; no constituye el horario semanal completo ni confirma la hora de cena.

## 5. Lo que todavía debe responder el dueño y el equipo

Estas dudas no bloquean la demo. Deben resolverse antes de recibir ventas reales:

1. Qué sistema produce el QR actual, qué representa y quién lo valida.
2. Si la comida se retira o llega a mesa y si cambia por noche.
3. Cantidad de mesas, combinaciones, reservas, tolerancias y reglas durante el baile.
4. Horarios reales de cocina, barra, shows, baile y cierre por fecha.
5. Catálogo y precios vigentes; tamaños, componentes, extras y pedidos especiales aceptados.
6. Puestos, personas, responsables, permisos y espacio físico de retiro.
7. Medios de pago, titular receptor, conciliación, devoluciones y sistema fiscal.
8. Conectividad en hora pico, dispositivos, TV y contingencia física posible.
9. Repertorio y participación que acepta el DJ; quién puede asistirlo.
10. Cómo verificar asistencia sin frenar el ingreso y qué incentivo es sostenible.
11. Cómo se medirán mejoras, costos, soporte y criterio para continuar el piloto.

## 6. Qué no agregar por iniciativa propia

No incorporar billetera, cuenta abierta con cobro automático posterior, venta de entradas, CRM invasivo, prepedidos gastronómicos de grupos, predicción de demanda con IA, comentarios musicales públicos sin moderación ni comisiones por promoción. Esas funciones no forman parte de esta demo y requieren una necesidad concreta y dependencias distintas.

Los estados y procedimientos tienen más valor que multiplicar pantallas. La versión final debe ser bonita y fluida, pero su calidad se comprueba terminando tareas completas con claridad.
