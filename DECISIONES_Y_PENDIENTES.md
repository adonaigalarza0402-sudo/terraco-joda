# Decisiones, supuestos y pendientes

Fecha: 22/11/2026. Complementa `PROMPT_MAESTRO_TERRACO.md` y `documentacion/04_DECISIONES_CONSOLIDADAS.md`.

## 1. Decisiones técnicas

| Decisión | Motivo | Límite |
| --- | --- | --- |
| Vite + React 19 + TypeScript, sin backend | Demo que se abre con `npm run dev`, mantenible y tipada. | No hay servidor ni base de datos. |
| Una autoridad de simulación (`src/domain/engine.ts`) con comandos y transiciones explícitas | Un solo lugar decide pagos, stock, tareas, entregas, votos y beneficios; las vistas solo envían comandos. | Determinista y probada, pero corre en el navegador. |
| Estado en `localStorage`, sincronización con `BroadcastChannel` + evento `storage`, y Web Lock exclusivo por comando | Varias pestañas del mismo navegador comparten datos y no se pisan. | **No sincroniza teléfonos distintos.** Sin Web Locks (navegadores viejos) queda una ventana de carrera entre pestañas. No es atomicidad global. |
| Identificadores de comando estables (`cid`) + reglas idempotentes | Doble toque, evento de pago repetido o segunda validación no duplican efectos. | Solo dentro de este navegador. |
| Dinero en centavos enteros; reparto determinista del sobrante | Las partes siempre suman el total. | Sin redondeos fiscales ni comisiones reales. |
| Rol y carrito por pestaña (`sessionStorage`); favoritos por navegador | Probar varias personas en una computadora. | El selector de rol no es seguridad. |
| Reloj de demo controlado y detenido | Probar vencimientos y medianoche sin esperar. Siempre visible en el personal. | El tiempo real no avanza el reloj. |
| Jornada operativa 08:00–08:00, zona America/Argentina/Buenos_Aires (UTC-3) | La noche que cruza medianoche cuenta una vez. | Corte de 08:00 es un supuesto. |
| Hash router propio, QR con la librería `qrcode` | Menos dependencias; QR local sin servicios externos. | Sin lectura por cámara (opcional, no incluida). |
| Tipografías Cormorant Garamond (títulos) e Inter (interfaz) empaquetadas localmente | Funciona sin internet. | No se afirma que sean las fuentes del logo. |
| Logos originales usados como imagen (portada, isotipo recortado por CSS) | No se redibuja el wordmark. | **Pendiente**: versiones vectoriales/transparentes oficiales. |

## 2. Supuestos de demostración (todos editables o rotulados)

- Fecha 21/11/2026 y próximas fechas: ficticias. Banda «Trío Brasa», DJ ZETA y DJ Nébula: ficticios. Alan Gómez no aparece como agenda.
- Horarios: cena 21:00–00:30, show 22:30–23:30, DJ 00:30–05:00, cierre 05:30. Cocina toma pedidos nuevos hasta 00:30, barra hasta 05:30.
- Puntos de retiro «Barra principal» y «Ventana de cocina». Comida para **retiro** por defecto; servicio a mesa como configuración de prueba.
- Seis mesas del JSON, cupo de reservas de 40 personas, horarios de reserva 21:00–22:30: ejemplos que no calculan disponibilidad real.
- Personal ficticio (Sofía, Martín, Ana, Leo, Juli, Nico, Fede) con roles combinables.
- Stock controlado solo en: Fernet 750 cc (6), latas de Coca (40), Moet CH BR (1, última unidad), rabas (4). Chandon Rose Delice agotado y Jägermeister Orange pausado como ejemplo. El resto sin conteo.
- Pizzas a $ 20.000 por variedad (precio del encabezado, supuesto activo). Empanadas: docena de un sabor a $ 20.000 como presentación de prueba; «x4 · $ 2.000 c/u» queda consultable. Whisky por vaso deshabilitado. Gin frutos rojos: consultable; se puede habilitar como modificador ficticio con recargo de demo ($ 1.000).
- Plazos: pago y reserva de stock 5 min; verificación de caja 30 min; ronda avanzada 10 min; alerta de listo sin retirar 15 min; consulta de reserva incompleta a los 60 min sin contacto.
- Beneficio: 8 visitas validadas → cupón 15 % con tope $ 5.000 en comida y sin alcohol, 30 días, no acumulable. **No es una promoción vigente.**
- Código de la noche para votar: SOL2111. Acceso de noche ≠ presencia real.
- Enlaces por canal sembrados: Instagram TERRACO y difusión de DJ ZETA, con visitas ficticias.

## 3. Simulaciones

Pagos (aprobado, pendiente, rechazado, vencido, aprobación tardía), devoluciones (pendiente, completada, fallida, reintento), recepción de estaciones y caídas, contingencia con recepción manual, borrador de WhatsApp (copiar o abrir enlace, sin envío), validación de visitas, acceso de noche, perfiles de clientes, comprobantes (no fiscales).

## 4. Dudas del establecimiento (antes de un piloto)

1. Qué sistema emite el QR actual, qué representa y quién lo valida; si permite integración.
2. Si la comida se retira o va a la mesa, y si cambia por noche.
3. Mesas, combinaciones, tolerancias, duración y reglas de reserva durante el baile.
4. Horarios reales de cocina, barra, shows, baile y cierre por fecha.
5. Carta y precios vigentes: volúmenes de vasos/botellas, íconos de whisky, recargo de frutos rojos, empanadas x4/x12, pizzas, recetas (Galáctica/Americana Capricho, Jäggerboom con Corona, Jamón y morrones), Sin TACC de Michelob.
6. Puestos, personas, permisos y espacio físico de retiro; si hay televisión.
7. Medios de pago, titular, conciliación, devoluciones y sistema fiscal.
8. Conectividad en hora pico, dispositivos y procedimiento de contingencia aceptable.
9. Repertorio y participación que acepta cada DJ; quién lo asiste.
10. Cómo verificar asistencia sin frenar el ingreso y qué incentivo es sostenible (costo).
11. Métricas del piloto, soporte y criterio para continuar.

## 5. Conexiones futuras (no implementadas)

- Servidor con persistencia transaccional, validación central de entrega y registro de auditoría.
- Autenticación del personal, permisos por rol y objeto en servidor, revocación de sesiones/equipos.
- Proveedor de pago (p. ej. Mercado Pago u otro a elegir): intención de pago, notificaciones firmadas, idempotencia, devoluciones, conciliación y acreditación. Las claves nunca en el frontend.
- Facturación fiscal.
- WhatsApp Business: solo si se autoriza y valida; la demo no automatiza.
- Notificaciones push con respaldo (el aviso puede no llegar).
- Cámara para leer QR, impresora de tickets, TV en red.
- Recuperación de identidad y deduplicación de cuentas para beneficios.
- Observabilidad, copias recuperables, límites de abuso (bots, votos, enlaces).

## 6. Límites de seguridad y sincronización

- El selector de rol («Acceso de demostración») y las restricciones de interfaz **no son autorización**. Cualquiera puede elegir cualquier rol.
- `localStorage` puede borrarse; la demo se regenera desde la semilla.
- Dos teléfonos distintos no comparten estado. Dos puestos desconectados no pueden garantizar que no haya doble retiro: durante contingencia, una sola persona valida entregas con lista.
- Datos de clientes: solo perfiles ficticios. No cargar datos reales.
- No hay secretos, tokens ni claves en el código.

## 7. Pendientes de esta demo

- Lectura de QR por cámara (opcional según el prompt): no incluida; se valida escribiendo o pegando la credencial.
- Lista de espera de reservas (escenario opcional): no incluida.
- Pruebas automatizadas de interfaz de extremo a extremo (Playwright): no se agregaron; los recorridos se comprobaron con pruebas de dominio y manualmente en el navegador (ver `VALIDACION.md`).
- El paquete de JavaScript pesa ~590 kB sin dividir; aceptable para la demo, mejorable con división de código.
- Logos vectoriales oficiales.
