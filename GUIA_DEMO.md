# Guía para mostrar la demo

Navegación del cliente: **Carta · Mis pedidos · Esta noche**. Beneficios, reservas, apariencia (Automático/Claro/Oscuro) y ayuda están en el menú ☰. Ver `docs/GUIA_VISUAL.md`.

Duración sugerida: 30–40 minutos. Usá una computadora con varias pestañas (o ventanas lado a lado): cada pestaña es una persona distinta. El reloj de demo empieza el **sábado 21/11 a las 22:00** (fecha ficticia) y solo avanza desde `#/demo`.

Antes de empezar: `#/demo` → **Reiniciar demo…** → escribir `REINICIAR`.

Pestañas recomendadas (desde `#/demo` → «Abrir vistas en pestañas»):

1. Cliente (teléfono): `#/acceso?rol=cliente` — conviene achicar la ventana a ancho de celular.
2. Barra (Ana) y Cocina (Martín).
3. Entrega (Juli).
4. Encargado (Nico).
5. Pantalla pública: `#/pantalla`.

Datos útiles: código de la noche para votar **SOL2111**; perfil con cupón: **Caro (perfil de prueba)**; perfil a una visita del cupón: **Lucía**.

## 1. Cena y entrega parcial (núcleo)

1. Cliente → **Ver la carta** → Fugazzetta → Agregar. Mojito → elegir sabor → Agregar.
2. **Ver carrito** → revisar total ($ 28.000) → **Continuar**.
3. En el pedido aparece el **proveedor de pago simulado** → **Aprobar pago**.
   - Esperado: «Bebidas: recibido en barra · Comida: recibido en cocina», credencial privada con QR y un código público T-1xx distinto.
4. Barra → el pedido está en **Pendientes** → **Marcar listo**. La pantalla pública muestra el código con «Bebidas listas · resto en preparación».
5. Entrega → escribir primero el **código público**: lo rechaza («no autoriza el retiro»). Escribir la **credencial privada** → entregar 1 unidad. La pizza sigue «Pendiente».
6. Cocina → **Tomar pedido** → **Todo listo**. Entrega → validar de nuevo → entregar la pizza. Pedido «Entregado».
7. Dueño o Encargado → **Informes**: las ventas aumentaron exactamente $ 28.000.

## 2. Ronda y volver a pedir

1. Cliente → carta → «Botella 750 cc + 5 latas de Coca» ($ 60.000) → carrito → **Calcular cuánto pone cada uno** → 4 personas = 4 × $ 15.000. Se paga una sola vez.
2. Encargado → **Carta y disponibilidad** → buscar «Botella 750» → **cambiar** precio a 65000.
3. Cliente → pedido anterior → **Volver a pedir**: aparece la revisión con el precio nuevo; nada se cobra hasta confirmar.
4. Opcional (simulación avanzada): en el carrito → «Pagar entre varios» → crear ronda → pagar partes desde otra pestaña con el enlace de invitación; probar pagar dos veces la misma parte (lo impide) y avanzar el reloj 15 min para ver las devoluciones a cada pagador.

## 3. Compra asistida en caja

1. Caja → buscar «pinta» → Pinta Stella → método **Efectivo** → **Crear pedido** → **Registrar efectivo recibido**. Se muestra el ticket con credencial y QR.
2. Barra: el pedido aparece en la misma cola con la etiqueta «Caja».
3. Abrí una segunda pestaña de barra con Leo (`st-leo`): si Ana ya tomó el pedido, Leo recibe «Ya la tomó Ana».
4. Entrega valida y entrega. Un segundo intento con la misma credencial no entrega nada más.
5. Transferencia manual: crear otro pedido con ese método → queda «esperando verificación». Solo el encargado lo verifica, con motivo.

## 4. Reserva

1. Cliente → **Consultar reserva** → horario, 2 personas, nombre y teléfono → **Crear consulta**.
   - Esperado: referencia R-XXXX, estado «Consulta creada · pendiente de confirmación», borrador de WhatsApp con **Copiar** (no envía nada).
2. Encargado → **Reservas** → la consulta aparece con origen web → **Registrar contacto** → **Confirmar** (opcional: mesa de ejemplo). El cliente ve «Confirmada por el local» recién ahora.
3. **Llegó** registra la asistencia. También se puede **Cargar consulta recibida por WhatsApp** para tener un registro único.
4. Si nadie la gestiona, al avanzar el reloj 60 min queda «incompleta» (no consume mesa).

## 5. Encuesta del DJ

1. DJ (DJ ZETA) → elegir plantilla «Próximo género» → marcar 2–4 opciones → **Crear** → **Abrir encuesta**.
2. Cliente → **Esta noche** → código **SOL2111** → votar. Ya no puede votar de nuevo. La TV y el DJ ven los votos y «X votos de N con acceso de noche».
3. El cliente sigue pudiendo usar carta y pedido; la encuesta nunca tapa la credencial.
4. `#/demo` → +5 / +15 min: la encuesta se cierra sola con el reloj compartido. El DJ registra su decisión (empate o pocos votos: decide el DJ).
5. Delegar: DJ → **Delegar** a Fede; abrir `#/acceso?rol=dj_asistente&staff=st-fede`.

## 6. Cambio de momento (cena → joda)

1. `#/demo` → escenario **Cambio a joda (00:20)** (o «Ir a 00:20»).
2. Hay comida pendiente en cocina. Avanzar +15 min: la carta muestra «Cocina cerrada» para comida nueva y las bebidas siguen disponibles.
3. Cocina sigue viendo y terminando el pedido aceptado. El contexto visual del cliente cambia a noche.

## 7. Noche y beneficios

1. Entrega → **Validar visita** → Lucía (llega a 8 → se emite un cupón de ejemplo). Validar otra vez: «ya tiene la visita de esta noche».
2. `#/demo` → «Ir a 01:00» → validar de nuevo: sigue rechazado (misma jornada operativa aunque pasó la medianoche).
3. Abrir `#/acceso?rol=cliente_id&perfil=prf-caro` (perfil de prueba) → menú ☰ → **Beneficios** → carrito con una jarra de limonada → **Aplicar** cupón → total con descuento → pagar y **Rechazar** el pago: el cupón vuelve a disponible. Pagar de nuevo y aprobar: queda «usado»; una cancelación completa desde caja lo restaura con registro del ajuste.

## 8. Excepciones financieras y de conexión

- **Pendiente / rechazo**: desde el pedido, «Dejar pendiente» (no se prepara) o «Rechazar».
- **Doble toque**: el botón Pagar reutiliza la misma operación; una aprobación repetida se ignora sin duplicar cobro.
- **Aprobación tardía**: escenario «Aprobación tardía» → Encargado → Operación → **Resolver** → cumplir (revalida) o devolver.
- **Devolución parcial**: Barra → «No se puede preparar» sobre una unidad → devolución parcial pendiente → Incidencias → «Simular falla» → «Reintentar».
- **Estación sin recepción**: `#/demo` → **Cortar recepción** de barra → los tragos aparecen pausados en la carta; un pago aprobado queda como incidencia «sin recepción». **Reconectar** registra la recepción una sola vez.
- **Última unidad**: escenario «Última unidad disputada» → intentar comprar Moet CH BR → «Sin stock disponible» mientras otra persona la tiene reservada; al vencer su plazo (+6 min) vuelve a estar disponible.
- **QR de mesa viejo**: `#/demo` → Mesas → «Nueva ocupación» y abrir `#/mesa/demo-mesa-3?s=ocup-ini-3`: avisa que esa ocupación terminó.

## Qué mirar con cada persona

- **Dueño**: Resumen (tres señales y categorías) e Informes (bruto, descuentos, devoluciones, netas, cobros, canal, tiempos, alcance de los datos).
- **Encargado**: Operación de esta noche, Preparar la noche (borrador → revisar cambios → publicar; plantillas), Reservas, Carta y disponibilidad, Equipo (roles combinables).
- **Barra y cocina**: columnas Pendientes / En preparación / Listos, vista agrupada por producto y variante exacta, disponibilidad propia.
- **DJ**: sesión, encuesta activa y plantillas; perfil y playlists quedan en segundo plano.
