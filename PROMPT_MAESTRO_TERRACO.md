# PROMPT MAESTRO — TERRACO / proyecto JODA

Versión 1.0 · 22 de noviembre de 2026 · Idioma del producto: español de Argentina.

## 0. Tu encargo: construir y terminar una demo, no entregar solamente un plan

Actuá como un equipo senior de producto, diseño de interacción, diseño visual e ingeniería. Construí una aplicación web de demostración amplia, coherente y utilizable para TERRACO Social Club, dentro del proyecto JODA. Debe servir para recorrer el servicio completo con el dueño, el encargado, los trabajadores y el DJ, y detectar cambios antes de operar con clientes reales.

Implementá la aplicación y comprobá sus recorridos. Un plan, una landing, capturas aisladas o tarjetas con botones sin comportamiento no cumplen el encargo. Hacé un plan breve al comenzar y ejecutalo por etapas hasta entregar una versión que se pueda iniciar y probar. No frenes para pedir aprobación de cada elección técnica o visual reversible. Registrá los supuestos y seguí; preguntá solo cuando una decisión realmente impida avanzar y no admita una configuración de demostración.

No estamos pidiendo un sistema de producción ni integraciones financieras reales. La demo debe representar las principales funciones de todos los perfiles y sus excepciones con datos ficticios identificados. Las verificaciones presenciales, los servicios externos y las garantías de un servidor real se documentan como pendientes. No los presentes como resueltos por una interfaz.

### Resultado que debe poder demostrar el dueño

1. Un cliente consulta una fecha, inicia una consulta de reserva, mira la carta real, compra de forma simulada y sigue su pedido.
2. Caja, cocina y barra ven el mismo pedido; cada estación trabaja sus artículos y el retiro se valida una sola vez por unidad pendiente.
3. El cliente sigue comprando aunque haya un show, cambie el momento de la noche o se publique una votación del DJ.
4. El DJ crea una encuesta breve, el público participa voluntariamente y los resultados se actualizan en las vistas abiertas.
5. El encargado configura una noche, disponibilidad, reservas y personal sin cambiar configuraciones en varios lugares.
6. El dueño entiende qué se vendió y qué incidencias hubo, con alcance y límites de los datos visibles.

## 1. Leé el paquete antes de implementar

Orden de lectura y autoridad:

1. Este archivo define el encargo y las decisiones finales para la demo.
2. `documentacion/04_DECISIONES_CONSOLIDADAS.md` precisa reglas y límites aceptados después de la investigación.
3. `documentacion/01_BASE_REAL_TERRACO.md` contiene identidad, contacto, carta y evidencia del establecimiento.
4. `datos/catalogo_base.json`, `datos/negocio_y_supuestos.json` y `recursos/INDICE_RECURSOS.md` aportan datos estructurados y los archivos auténticos.
5. `documentacion/02_MATRIZ_72_PROBLEMAS.md` reúne problemas, soluciones y pruebas operativas que hay que considerar.
6. `documentacion/03_PROPUESTAS_COMPETENCIA.md` explica seis mejoras seleccionadas y sus antecedentes.
7. `documentacion/00_INVESTIGACION_INICIAL_JODA.md` conserva la comparación inicial y las referencias de los reels, como contexto histórico de la investigación. Sus precios y disponibilidad no se presumen vigentes ni son requisitos de la demo.

Los documentos de investigación se preservan como antecedentes: algunas partes dicen Terraço, plantean propuestas todavía condicionadas o usan ejemplos anteriores a recibir la carta. La marca final es **TERRACO SOCIAL CLUB**. Ante contradicción, prevalecen este prompt, las decisiones consolidadas y la evidencia real más reciente. No sustituyas los productos reales por ejemplos antiguos.

Leé los documentos completos por partes si tu herramienta limita la salida. Revisá las imágenes de las cartas y los dos logos. Usá el video como referencia de ambiente; no hace falta reproducirlo completo dentro de la aplicación. No vuelvas a investigar decenas de competidores antes de empezar: ya tenés una base suficiente para esta construcción. Consultá documentación técnica primaria cuando necesites verificar una implementación o dependencia.

## 2. Contexto real y criterios de éxito

TERRACO es un bar en altura de Gral. José de San Martín, Chaco, Argentina. Se puede ir a cenar y después al baile. Algunas fechas tienen shows en el horario de cena y luego DJs. La mayoría del público, según el usuario, va por la joda; también hay gente que combina gastronomía y baile.

Hoy hay carta física, pedidos asistidos y retiro en barra. El usuario describe un circuito con caja y un QR para retirar. No conocemos qué sistema emite ese QR ni si permite integraciones. Las reservas se gestionan por WhatsApp. No se confirmó el servicio de comida a mesa, la cantidad de puestos, el aforo, la red ni la existencia de una televisión.

La herramienta debe ordenar pedidos y comunicación y ayudar al equipo existente. No diseñes un plan de reducción de personal. Una persona puede cubrir varios roles si el encargado lo configura. Conservá compra asistida para quien no quiera o no pueda usar su teléfono.

El éxito de la demo se evalúa por claridad, continuidad entre módulos y capacidad de completar tareas con pocos pasos. La cantidad de funciones no justifica abrumar la pantalla cotidiana. Las vistas avanzadas deben estar disponibles mediante navegación secundaria, filtros y detalles progresivos.

No prometas aumento de ventas, eliminación de filas, ausencia de fraude, seguridad absoluta o ahorro porcentual sin medición real.

## 3. Alcance: qué construir ahora

| Área | Comportamiento exigido en la demo |
| --- | --- |
| Público y cliente | Programación, consulta de reserva, carta, variantes, carrito, ronda con cálculo, pago simulado, seguimiento, retiro, repetir pedido y beneficios de prueba. |
| Caja | Pedido asistido sobre el mismo circuito, método de cobro simulado, búsqueda e incidencias. |
| Cocina y barra | Colas por estación, toma de tarea, estados parciales, disponibilidad, carga visible y vista agrupada opcional. |
| Entrega | Pendientes por punto de retiro, validación de credencial privada y entrega de unidades concretas. |
| Pantalla pública | Códigos listos, punto de retiro y encuesta opcional sin exponer información privada. |
| DJ | Perfil, enlaces de playlists, sesión de la noche, plantillas y una encuesta activa por sesión. |
| Encargado | Preparar la noche, reservas, carta y disponibilidad, roles de demostración, incidencias y pausas operativas. |
| Dueño | Resumen entendible de ventas y operación, informes con muestra y cobertura, votos y atribución de canales. |
| Laboratorio de demo | Cambiar rol, cargar escenarios, avanzar el reloj de prueba, simular fallas y reiniciar datos con confirmación. |

El núcleo de pedido, pago simulado, preparación y retiro debe quedar conectado primero. Después completá las demás áreas. El pago entre varios, los beneficios, la coordinación de mesa y la atribución tienen que poder probarse como escenarios opcionales; no hace falta integrarlos con proveedores reales. No recortes el núcleo para priorizar gráficos o efectos.

Quedan fuera de esta entrega: cobros reales, facturación fiscal, automatización de WhatsApp, autenticación de producción, venta de entradas, billetera/saldo interno, cobro posterior automático, pronósticos con IA, transmisión musical, contratación automática de DJs y despliegue comercial. Documentá las conexiones futuras sin crear una infraestructura innecesaria para abrir la demo.

## 4. Arquitectura de experiencia y navegación

### Cliente

Mobile first, acceso por enlace o QR, sin instalación obligatoria. Comprar como invitado debe ser posible; la cuenta o identificación para beneficios no bloquea la carta ni el pedido. Pedí solo los datos necesarios para cada función y separá preferencias de publicidad.

Antes de llegar: portada de TERRACO con programación, información útil y Consultar reserva. Dentro del local: acceso directo a la carta y al contexto de mesa o punto de retiro. Navegación móvil corta, por ejemplo **Carta · Mi pedido · Esta noche · Beneficios**. El carrito y los pendientes tienen acceso consistente. Puede haber varios pedidos activos: no desaparece el anterior al realizar otro.

La selección Cena / Show / Joda cambia el contexto visible, no las obligaciones existentes. La programación puede tener momentos superpuestos y la carta depende de disponibilidad y horario por categoría. El encargado controla el estado operativo de la fecha. El cliente puede explorar otra sección sin activar o cerrar servicios.

### Personal

Abrir directamente el puesto asignado. Barra y cocina necesitan primero **pendientes, en preparación y listos**, con producto, variantes, cantidad, antigüedad y siguiente acción. Entrega necesita comprobar y entregar. Caja necesita iniciar pedido, cobrar de manera simulada y resolver pendientes. Mostrar métricas y configuración en áreas secundarias.

En teléfonos, permitir el trabajo con botones cómodos y textos claros. En tablet o escritorio, aprovechar espacio para colas y detalle. No exigir arrastrar tarjetas para completar una tarea: el arrastre puede ser complementario si no complica la operación.

### Encargado y dueño

Separar **Operación de esta noche**, **Preparar la noche** e **Informes**. Usar un resumen inicial con señales que lleven a acciones concretas. Mostrar el detalle financiero y los filtros cuando se solicita. No crear un panel con veinte indicadores del mismo peso.

### DJ

Primera vista: sesión actual, encuesta activa y crear encuesta desde plantilla. El perfil y las playlists quedan a mano, pero no ocupan el centro durante el show. El DJ decide cuándo participar y qué opciones puede cumplir. Debe poder delegar tareas expresamente a un asistente autorizado de demostración.

## 5. Identidad y calidad visual

El resultado debe sentirse diseñado para TERRACO. Usá los logotipos auténticos del paquete. Son imágenes con fondo; no supongas que son PNG transparentes ni SVG editables. No reescribas el wordmark con una fuente aproximada para presentarlo como logo original. Conservá proporciones y área de respiro, y resolvé su incorporación con composición y fondos compatibles. Si falta una versión vectorial, registrala como material pendiente sin frenar.

Dirección de color propuesta a partir del material, no manual oficial: crema `#FFF9E1`, borgoña `#651944`, frambuesa `#9A2855`, cobre `#B67D52`, magenta `#C21984` y ciruela oscuro `#291020`. Ajustá combinaciones para lectura y contraste; no fuerces un color si perjudica la tarea.

- Cena: superficies crema, encabezados borgoña, detalles cálidos y sensación editorial cuidada.
- Show y joda: ciruela, gradientes borgoña y acentos violeta/magenta inspirados en el lugar. Mantener una lectura clara a baja iluminación.
- Operación: superficie tranquila, jerarquía muy clara, marca en acentos. Los estados se distinguen por texto y forma además del color.
- Titulares con serif elegante que acompañe al logo; interfaz con sans serif legible. Números, precios y tiempos fáciles de comparar. No intentar identificar como hecho una fuente no confirmada.
- Usar arco, rayos y recursos solares con moderación. No llenar cada tarjeta de decoración.
- Crear sistema consistente de botones, tarjetas, etiquetas, formularios, estados vacíos, errores, carga y confirmación. Evitar un aspecto de plantilla genérica con métricas ficticias gigantes.
- Las cartas deben convertirse en contenido estructurado. No usar las capturas como única carta navegable.
- No hay fotos individuales verificadas de todos los platos y tragos. Preferir tarjetas tipográficas bien compuestas a inventar fotos presentadas como productos reales. No uses capturas de WhatsApp con la interfaz del teléfono como fondo de la app.

Animaciones: transiciones cortas de contexto, apertura de detalles, respuesta al agregar productos y cambios de estado. Una entrada de marca puede existir brevemente en la portada pública, sin bloquear la carta o repetirse cada vez que se vuelve a pedir. Evitá animar continuamente colas o botones de compra, destellos, fondos pesados y desplazamientos que causen saltos de contenido. Respetá reducción de movimiento y mantené el funcionamiento completo sin animación. El video fuente es referencia, no un hero de reproducción automática obligatorio.

Verificá diseño en 360 y 390 px de ancho, tablet y escritorio. Soportá navegación por teclado, foco visible, etiquetas, errores asociados al campo y áreas táctiles cómodas. Los importes usan formato argentino y moneda ARS. El tono es cercano, claro y profesional; usá “joda” donde corresponda a la experiencia del público y textos más precisos para operación.

## 6. Carta real, variantes y disponibilidad

Hay **99 referencias base en 18 categorías**; no equivalen a 99 SKU finales. Importalas del JSON y conservá fuente, texto original y advertencias. Incluí búsqueda tolerante a mayúsculas y acentos, categorías manejables, favoritos locales opcionales y detalle del producto. Separá variantes de presentación, sabores y extras. El importe del carrito debe ser comprobable antes de confirmar.

Precios de las capturas: sirven para la prueba y no están validados comercialmente. Mostrá un aviso general discreto de demostración; las dudas específicas se ven en detalle y en administración. No repitas un gran aviso en cada tarjeta.

Reglas de fidelidad:

1. No inventar tamaños de vaso, botellas, recetas, rendimientos, fotos o mezcladores incluidos.
2. Los guiones de las cartas significan precio no publicado para esa presentación; no son cero ni prueba de agotado.
3. Los íconos de whisky no prueban el volumen ni que uno sea medida doble. Los formatos ambiguos quedan consultables o habilitados solo mediante una configuración rotulada de demo.
4. Frutos rojos en gin aparece como opción sin recargo indicado. No declararlo gratis ni cobrar un adicional inventado como dato del local.
5. Pizzas: $20.000 aparece como precio del encabezado. La demo puede adoptarlo como supuesto visible para cada variedad; conservar esa salvedad en los datos.
6. Empanadas: la fuente dice “x4: $2.000 c/u; x12: $20.000”. No inventar un pack oficial de cuatro a $8.000 ni una regla de combinación de sabores. Se puede mostrar la referencia y ofrecer una presentación de prueba expresamente configurada, sin convertirla en política real.
7. “Galáctica”, “Jäggerboom”, “Moet CH BR”, “Befeeter” y otras grafías o composiciones se conservan según la fuente y con observación cuando corresponda. No corregir ingredientes por intuición.
8. No usar insignias de alergias, aptitud celíaca o ausencia de contaminación como certificación. La información de ingredientes no garantiza seguridad alimentaria. Ofrecer consulta al personal; una nota libre no obliga a cocina a una sustitución sin aceptar.

Disponibilidad de demo: datos ficticios separados de la carta real. Cada producto y presentación puede estar disponible, pausado o agotado. Los combos usan componentes cuando esa composición se conoce, por ejemplo el Fernet de 750 cc con cinco latas de Coca. No crear recetas de todos los cócteles en gramos o mililitros. La última unidad debe reservarse y consumirse de forma coherente dentro de la simulación; el carrito abierto no bloquea stock indefinidamente.

Cambio de precio, agotado o cierre de categoría durante checkout: revalidar, explicar qué cambió y pedir confirmación del nuevo total. No sustituir ni cobrar silenciosamente. Pausar nuevas ventas no borra pedidos ya aceptados.

## 7. Pedidos, cobro simulado y entrega: el núcleo

Modelá por separado pago, recepción por la estación, preparación y entrega, además de cancelaciones e incidencias. Usá estados internos suficientes, pero mensajes simples para el cliente. “Pago aprobado” no equivale a “recibido en barra”; “listo” no equivale a “entregado”.

Pedido con líneas: producto, presentación, modificadores aceptados, precio congelado al confirmar, cantidad y destino. Asignar comida a cocina y bebidas a barra, con puntos configurables. Conservar quién hizo el pedido, canal digital/caja y registro de cambios. Usar datos ficticios para personas y personal.

Recorrido básico:

1. Elegir productos y revisar carrito, mesa/sesión si aplica, modalidad de entrega y total.
2. Crear intención de pago de demo con identificador único. Doble toque o reintento reutiliza la operación correspondiente.
3. Simular aprobación, pendiente o rechazo desde controles de prueba, sin pedir números de tarjeta ni credenciales.
4. Enviar tareas a estaciones y registrar recepción. Si no hay recepción, mostrar incidencia y bloquear o pausar el canal afectado según el escenario.
5. Un trabajador toma una tarea, prepara y marca unidades listas. Dos vistas no deben crear dos tareas para la misma unidad.
6. Cliente y pantalla pública ven qué está listo y dónde. Si faltan artículos, conservar el resto pendiente.
7. Entrega valida credencial privada y registra solo lo entregado. No permitir un segundo retiro de las mismas unidades.

La credencial de demostración debe poder validarse en la misma app con código pegado/escrito y representación QR si hay una biblioteca apropiada. Una cámara real es mejora opcional; no debe ser necesaria para probar el circuito en una computadora. El código público de pedido y la credencial privada deben ser distintos.

Comida a mesa o retiro son una configuración de prueba hasta confirmación del dueño. La pantalla identifica inequívocamente la modalidad. Si se sirve a mesa, también hay confirmación de entrega por personal. En baile, pedir mesa solo cuando sea necesario.

Incidencias disponibles en escenarios: pago pendiente/rechazado, aprobación tardía tras vencimiento, cobro aprobado sin recepción de estación, producto no entregable, cancelación, devolución parcial, devolución pendiente/fallida y entrega discutida. No borrar movimientos. La aprobación tardía no reactiva automáticamente un pedido vencido: comprobar si se puede cumplir y, si no, gestionar devolución simulada con estado visible.

Pagos asistidos: efectivo, transferencia manual y pago digital son métodos simulados distinguibles. Solo un rol autorizado puede registrar verificación manual y motivo. Una captura de comprobante no acredita pago. Ventas, cobros y devoluciones tienen registros separados; no emitas factura fiscal real ni la representes como válida.

Repetir pedido: copia editable de productos y variantes, con nueva revisión de precio, stock, lugar y contexto. Avisar si el anterior sigue pendiente, dejando que el cliente decida si quiere otro. No cobrar automáticamente ni copiar una credencial de retiro.

## 8. Rondas y pagos entre amigos

La acción principal es **Calcular cuánto pone cada uno** y un único pago simulado. Calcular no significa haber cobrado aportes. No exigir cuentas a todos para dividir el importe orientativamente.

Como función avanzada de demo, incorporar un escenario de varios pagadores:

- Congelar productos, total, reparto y plazo antes de recibir aportes.
- Trabajar en centavos enteros para dinero y repartir el sobrante de forma determinista. La suma de partes debe coincidir exactamente con el total final.
- Cada cuota tiene pagador ficticio, identificador y estado; impedir pagar dos veces la misma cuota en el estado compartido.
- No preparar hasta completar el monto requerido y revalidar disponibilidad. El stock se reserva por un plazo configurado de prueba y no indefinidamente.
- Si alguien falta, permitir a otro cubrir voluntariamente el saldo con confirmación. Si se vence, cancelar el pedido y crear devoluciones simuladas a los pagadores originales.
- Si cambia el pedido cuando ya hay aportes, usar un circuito explícito de cancelación/revisión. No modificar silenciosamente lo acordado.
- El enlace de invitación no expone datos personales del grupo. Expirar o revocar invitaciones cuando corresponda.
- No crear billetera ni saldo obligatorio. El reparto o split de un proveedor no se presume equivalente a cobrar entre amigos.

Esta parte debe quedar rotulada como simulación avanzada y estar disponible para evaluar con el dueño, sin recargar el checkout habitual.

## 9. Cocina, barra, mesa y pantalla pública

La cola combina pedidos digitales y asistidos, con una única fuente de verdad. Mostrar antigüedad, prioridad e incidencias. Estimar tiempos solo con una regla de demostración declarada; si no hay base, informar estado y carga sin inventar minutos exactos. Permitir al encargado pausar un canal o categoría y seguir atendiendo compromisos previos.

**Vista agrupada de producción:** opcional, por producto y modificadores exactos. El trabajador puede desplegar qué pedidos y unidades componen el total. Marcar tres unidades listas afecta esas tres unidades concretas y actualiza la vista por pedido. No esperar pedidos futuros para formar un lote ni perder el más antiguo.

**Coordinación de mesa:** agrupación visual por sesión de mesa y franja de servicio. Cocina decide si puede coordinar. No introducir ventanas automáticas de espera ni retener bebidas o pedidos para esperar amigos. Cada compra conserva importe, pagador, privacidad y comprobante. Un QR permanente identifica la mesa, pero no da acceso al historial de la ocupación anterior. La sesión de mesa cambia al reutilizarse.

**Pantalla pública:** ruta específica para TV opcional. Código público, estado listo y punto de retiro; sin teléfonos, nombres completos, importe ni credencial privada. Las unidades pendientes no aparecen como entregadas. La encuesta puede ocupar un área secundaria cuando exista, sin ocultar los avisos de retiro. La TV acompaña al seguimiento del teléfono y a la atención presencial.

Prever pedidos listos no retirados, calidad y necesidad de intervención; no inventar un plazo real de descarte. La congestión se resuelve también con puntos y procedimiento físico: no afirmar que una pantalla elimina filas.

## 10. Programación, reservas y WhatsApp

Una fecha puede contener cena, show, uno o varios DJs y cierre. Configuración por momento, con horarios y disponibilidad independientes. Un show en vivo no está obligado a usar las encuestas del DJ.

Usar fechas y artistas ficticios claramente rotulados en la programación de demostración. Alan Gómez aparece como antecedente histórico en el material recibido; no publicarlo como actuación próxima, residente ni contratación confirmada. Tampoco convertir otros flyers antiguos en agenda actual.

Contacto transcrito: WhatsApp `+54 9 3725 50-2750`, enlace `https://wa.me/5493725502750`; Instagram `@terracosocialclub`; correo `terracosocialclub@gmail.com`; dirección `Passo 222, H3509, Gral. José de San Martín, Chaco, Argentina`. No enviar mensajes automáticamente ni ejecutar consultas reales durante las pruebas.

Reserva de cena:

1. Elegir fecha, horario propuesto y cantidad de personas; pedir contacto mínimo.
2. Crear referencia y una solicitud. No confirmar ni consumir una mesa definitivamente.
3. El botón explícito Continuar por WhatsApp abre un borrador con esa referencia. Abrir el enlace no prueba envío, lectura ni respuesta. En modo demostración, mostrar primero el borrador y permitir copiarlo sin salir de la app.
4. El encargado ve la solicitud y puede registrar contacto realizado, confirmar, proponer cambio, cancelar, marcar llegada o ausencia. Mantener un único registro para solicitudes web y consultas recibidas directamente por WhatsApp.
5. Si una persona abandona el contacto, el registro queda incompleto; no simular confirmación automática.

Los cupos, mesas, horarios, tolerancias y políticas del ejemplo son supuestos configurables de demo. No calcular disponibilidad con una simple suma de sillas si importa la composición de mesas. No vender señas ni prometer acceso al baile, descuentos o permanencia de la mesa sin condiciones reales confirmadas. La captura 00:00–06:00 no es el horario completo de apertura de TERRACO.

Lista de espera solo como escenario opcional, sin notificaciones externas ni asignaciones irrevocables. Los datos de clientes reales no se cargan en la demo.

## 11. DJ y participación del público

Perfil del DJ: nombre de prueba, descripción, géneros y enlaces de playlists o sesiones. No reproducir música automáticamente, copiar catálogos ni prometer una lista exacta de todas las canciones si el DJ no la publica. Distinguir enlace de playlist y repertorio realmente confirmado.

Programación: mostrar DJs confirmados de la fecha ficticia. Preferencia para una futura fecha: encuesta consultiva separada, con tamaño de muestra visible y texto que explique que TERRACO decide según disponibilidad y criterio propio.

Encuesta en vivo:

- Crear desde plantillas de género, artista o tema, solo entre opciones que el DJ acepta tocar. No necesita escribir opciones nuevas en cada ocasión.
- Una encuesta activa por sesión. Crear, abrir, cerrar, pausar/cancelar y delegar según rol. Si hay cambio o cancelación, explicarlo y mantener historial.
- Invitación voluntaria. Nunca convertirla en la única pantalla, bloquear la carta, interrumpir un pago o tapar el QR de retiro. Sin sonidos obligatorios ni ventanas invasivas.
- Votos y resultados coherentes entre pestañas. Un voto por identidad de demostración y encuesta; controlar la participación con acceso de noche de prueba. Aclarar que esto no demuestra presencia real ni evita todo fraude.
- El reloj compartido de demo decide el cierre. Empates, pocos votos y cancelación tienen criterio anunciado: decisión del DJ, por ejemplo. No presentar al ganador como reproducción automática.
- Mostrar cantidad de votos y universo conocido. No llamar “80% del local” a cuatro votos de cinco participantes.
- Evitar comentarios públicos libres en esta versión; usar opciones moderadas. No vender prioridad musical ni generar presión para pagar por ser escuchado.

El objetivo es acercar al DJ y al público sin transformar al DJ en operador permanente del celular.

## 12. Beneficios e identidad opcional

El usuario propuso un incentivo cada ocho visitas, pero no hay política comercial aprobada. Crear una regla editable de demostración, con recompensa, vigencia y condiciones visibles. No anunciarla como promoción vigente del local.

Visita, compra y reserva son eventos distintos. Una visita requiere validación presencial simulada por personal autorizado, una por persona y noche operativa. Un QR escaneado no crea una visita. Pagar una ronda no acredita visitas de todos los integrantes. Si solo se miden compras, el programa debe decir compras, no asistencia.

Mostrar progreso sencillo y un beneficio de ejemplo cercano, sin gamificación que obligue a consumir alcohol. Dejar aplicarlo también a comida o alternativas sin alcohol según la configuración de prueba. Cuenta o identidad opcional solo cuando se necesite recuperar beneficios; la demostración usa perfiles ficticios seleccionables, sin pedir OTP real.

Cupón de un solo uso coherente entre vistas, aplicación explícita y total revisable. Restaurar si falla la compra cuando corresponda; ajustar efectos ante cancelación o devolución, sin duplicar recompensas. Conservar registro del ajuste. Evitar acumular descuentos incompatibles; límites y costos de ejemplo deben estar identificados.

Documentar recuperación de identidad y prevención de duplicados como integración futura; no darla por resuelta mediante un selector local de personas.

## 13. Preparar la noche, informes y atribución

### Ficha operativa reutilizable

Plantilla con momentos, categorías activas, responsables, puntos de retiro, sesión del DJ, notas y pendientes. Flujo: borrador → revisar cambios → publicar. Copiar configuración no copia ventas, aportes, votos, asistencia ni reservas particulares. No convertir artistas tentativos en confirmados. La portada pública y los resúmenes del equipo leen la misma configuración publicada.

### Informes útiles

Mostrar inicialmente ventas de la noche, pedidos abiertos, incidencias y categorías/productos más pedidos. Permitir ampliar a unidades, importes brutos, descuentos, devoluciones, cobros, ventas netas y tiempos por etapa. Explicar cada indicador con lenguaje simple y su intervalo.

- Datos sembrados siempre identificados como ficticios. Las nuevas acciones de demo actualizan sus informes; no usar gráficos desconectados del estado.
- Distinguir todo lo registrado, canal web y canal caja. No llamar ventas totales de TERRACO a una muestra digital incompleta.
- Jornada operativa con zona `America/Argentina/Buenos_Aires`, que puede cruzar medianoche. No contar la misma noche como dos visitas ni mezclar filtros calendario/noche.
- El producto más vendido no es necesariamente el más rentable. Sin costos, mostrar ingresos, no margen. Si se incluye margen de ejemplo, rotular los costos como ficticios y no mezclarlo con datos reales.
- Aprobaciones, devoluciones y acreditación del proveedor son medidas distintas. No mostrar saldo bancario disponible sin integración.
- Participación por encuesta y tamaño de muestra. No inventar retención o permanencia del público, satisfacción ni causalidad de ingresos por DJ.
- Evitar rankings injustificados de empleados. Ver carga, tipo de tarea e incidencias antes de comparar tiempos.

### Enlaces por canal

Función opcional que puede generar enlaces internos de demo para una fecha y un origen: Instagram TERRACO, difusión del DJ, otro o desconocido. Regla visible: último enlace identificado dentro del recorrido de consulta de reserva. Distinguir visita al enlace, solicitud, confirmación, cancelación y asistencia validada. Un enlace reenviado limita la interpretación y no demuestra causa. El DJ ve agregados, no datos personales de reservas. No crear comisiones ni pagos a promotores.

## 14. Roles, continuidad y alcance técnico honesto

Roles de ejemplo: cliente invitado, cliente identificado de prueba, caja, cocina, barra, entrega, encargado, dueño, DJ y asistente del DJ si se habilita. Un selector de rol facilita la evaluación y debe decir **Acceso de demostración**. No presentarlo como un inicio de sesión seguro.

Implementar reglas de visibilidad y acciones permitidas en la demo, sin confundir restricciones de interfaz con autorización de servidor. No colocar datos secretos, tokens, claves de Mercado Pago ni credenciales de WhatsApp en el frontend. No conectar servicios reales ni crear cuentas pagas. No desplegar públicamente ni enviar comunicaciones como parte de este encargo.

En una página de límites y en la documentación técnica explicar qué falta para producción: autorización de servidor por rol y objeto, autenticación y revocación de sesiones, verificación financiera del proveedor, persistencia transaccional, validación central de entrega, registros, copias recuperables, observabilidad y controles de abuso. No construir una falsa pantalla que diga que esas garantías ya están activas.

Contingencia demostrable:

- Última sincronización y estado de conexión por estación.
- Simular una estación sin recepción: pausar el canal afectado y atender pedidos anteriores o incidencias según corresponda.
- Ver datos guardados sin conexión no significa poder confirmar un cobro online o nuevas entregas globales.
- Un modo asistido numerado y centralizado puede representarse como procedimiento de prueba, con responsable y conciliación al recuperar servicio.
- No permitir que dos puestos desconectados prometan impedir el doble retiro. La simulación debe explicar esa limitación.
- Reanudar sin duplicar compra, tarea o entrega. No reiniciar automáticamente la noche ante un error.
- Eliminar/reiniciar datos de demo exige confirmación y está fuera de las acciones de uso diario.

La app ayuda a operar; la atención, controles presenciales de entrega de bebidas y resolución de situaciones particulares siguen a cargo del establecimiento.

## 15. Implementación y datos compartidos

Primero inspeccioná la carpeta de trabajo. Respetá un proyecto existente si lo hubiera. Si está vacía, elegí una base web moderna y mantenible; React con TypeScript es una opción razonable. Verificá versiones y compatibilidad al instalar. No dediques el proyecto a migraciones, microservicios o integraciones que no necesitamos para esta demo.

Separá datos fuente de TERRACO, configuración ficticia, entidades de operación y componentes visuales. Definí tipos y transiciones explícitas para pedido, pago, estación, entrega, encuesta, reserva, beneficio y jornada. Usá importes enteros en la unidad monetaria mínima y formato de presentación consistente. Derivá totales e indicadores de los registros.

Una fuente de estado compartida debe conectar todas las vistas. La persistencia local permite volver a abrir la demo; sincronizá cambios entre pestañas del mismo navegador/origen, por ejemplo con mecanismos de almacenamiento y comunicación entre pestañas apropiados. Documentá que eso no sincroniza teléfonos de distintas personas. Si elegís un servidor local para la demo, explicá cómo iniciarlo y qué garantiza realmente. No hagas pasar un almacenamiento del navegador por un backend de producción.

La simulación necesita transiciones deterministas e identificadores estables: doble toque, repetición de un evento de pago y doble validación de entrega no duplican efectos dentro de su alcance. Si no podés garantizar concurrencia entre procesos sin un servidor, declará el límite y mantené una autoridad de simulación única. No afirmes atomicidad global basada solo en leer y escribir localStorage.

Los escenarios deben poder ejecutarse con un reloj de demo controlado, sin esperar horas ni depender de que hoy sea un sábado específico. Mostrar cuándo está activo ese reloj. No fijar una fecha futura ficticia como programación real.

Los controles técnicos quedan en **Herramientas de demostración**, separados de la navegación del cliente. Un pequeño indicador permanente “Demo · datos y pagos de prueba” alcanza en la experiencia general. No llenar cada pantalla de información de implementación.

Estados de vacío, sin resultados, agotado, carga, error y recuperación tienen contenido real. No dejar botones de las funciones base que solo muestren “próximamente”. En acciones de producción fuera de alcance, no simular éxito; deshabilitar con explicación o dirigir a la documentación de límites.

## 16. Plan de construcción que debés ejecutar

1. **Fundación:** revisar fuentes, crear sistema visual, datos tipados, catálogo y configuración de demo. Preparar estructura de rutas y roles.
2. **Circuito completo:** cliente → pago simulado → caja/estaciones → listo → retiro parcial/completo → informe. Comprobarlo antes de expandir pantallas.
3. **Antes y durante la noche:** programación, consulta de reserva, ficha operativa, continuidad cena/show/joda, pantalla pública y DJ.
4. **Profundidad opcional:** repetir pedido, producción agrupada, coordinación visual de mesa, rondas avanzadas, beneficios y atribución. Reutilizar las reglas del núcleo.
5. **Pulido:** claridad en cada rol, móvil, accesibilidad, animaciones, fallas y documentación. Corregir hallazgos antes de entregar.

No abandones después de la primera etapa. Si el entorno te limita, dejá un punto de continuación preciso y el estado real de cada requisito. No describas una intención de implementación como una función terminada.

## 17. Verificación y criterios de aceptación

Ejecutá el build y los controles adecuados al stack. Agregá pruebas de dominio y de integración en las reglas donde un error cambia dinero simulado, stock, votos o derecho de entrega. No hace falta escribir una prueba trivial por cada tarjeta. Usá pruebas de recorrido automatizadas si el entorno lo permite, complementadas con revisión visual móvil y escritorio.

Recorridos mínimos de extremo a extremo:

1. **Cena y entrega parcial:** comida y bebida; pago aprobado; tareas separadas; bebida lista y retirada; comida todavía pendiente; entrega final; total correcto en informe.
2. **Ronda y repetición:** Fernet + cinco latas a precio de carta; dividir orientativamente; pago único; volver a pedir con precio o stock cambiado; revisión obligatoria.
3. **Compra asistida:** caja crea el pedido; aparece en la misma cola y se procesa una sola vez. Dos intentos de validar no entregan dos veces dentro del alcance de la demo.
4. **Reserva:** consulta creada; borrador WhatsApp sin envío real; encargado confirma; registra llegada; no aparece confirmada antes de esa acción.
5. **Encuesta:** DJ abre desde plantilla; cliente vota en otra vista; intenta repetir; cierra al avanzar el reloj; carta y pedido siguen accesibles.
6. **Cambio de momento:** pasar de cena a joda con comida pendiente y cocina cerrada para nuevas compras; el pedido aceptado sigue operativo.
7. **Noche y beneficios:** confirmar asistencia ficticia antes y después de medianoche de la misma jornada; no duplicar visita; aplicar y ajustar un cupón sin doble uso.
8. **Excepciones financieras y de conexión:** pendiente, rechazo, doble toque, aprobación tardía, devolución parcial pendiente y pérdida de recepción de una estación; mensajes y reportes coherentes.

También comprobar: última unidad disputada en el simulador, variantes diferentes en producción agrupada, pedido grupal incompleto que vence, reserva incompleta, QR de mesa de ocupación anterior, pantalla pública sin datos privados, informe sin denominador conocido y plantilla de noche sin arrastrar votos o ventas.

Mantener `COBERTURA_DEMO.md` con referencia a los 72 problemas de la matriz: resuelto en la lógica local, representado por un escenario, requiere servicio externo/servidor o requiere validación del local. No afirmar que los 72 están resueltos para producción. Si alguno no corresponde a esta demo, explicá el motivo.

Criterio de terminación: la app se inicia con instrucciones reproducibles; todas las áreas base tienen tareas completas; los recorridos comparten datos; no hay errores de consola graves conocidos; se comprobó el build; el diseño móvil no corta acciones importantes; se distingue lo real, lo supuesto y lo simulado; los pendientes están escritos.

## 18. Entrega que tenés que dejar en la carpeta

- Código ejecutable y archivos de dependencias reproducibles.
- `README.md`: requisitos, instalación, comandos exactos para iniciar y compilar, rutas de cada rol y cómo reiniciar la demo.
- `GUIA_DEMO.md`: recorrido breve para mostrárselo al dueño, al equipo y al DJ, con datos listos para probar y resultados esperados.
- `DECISIONES_Y_PENDIENTES.md`: supuestos usados, dudas del establecimiento, conexiones futuras y límites de seguridad/sincronización.
- `COBERTURA_DEMO.md`: trazabilidad de los 72 casos y de las seis mejoras seleccionadas.
- Registro conciso de validación: qué ejecutaste, qué pasó y qué no pudiste comprobar. No inventar pruebas aprobadas.

En tu respuesta final indicá dónde abrir la demo, qué se puede probar de verdad, qué está simulado y los pocos pendientes que más influyen en el piloto real. El objetivo es que Nacho pueda usarla y revisarla con TERRACO sin tener que reconstruir este brief.
