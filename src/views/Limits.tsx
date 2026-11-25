import { CATALOG_META } from '../domain/catalog';
import { Link } from '../ui/kit';

export function Limits() {
  return (
    <div className="app-root theme-ops" style={{ minHeight: '100dvh' }}>
      <main className="staff-main stack" style={{ maxWidth: 880 }}>
        <Link to="/" className="small">
          ← Volver a la demo
        </Link>
        <h1 className="display">Qué es real, qué es supuesto y qué está simulado</h1>
        <section className="card stack-sm">
          <h2>Real (del material recibido)</h2>
          <ul className="stack-xs">
            <li>Marca, logotipo e isotipo originales de TERRACO SOCIAL CLUB.</li>
            <li>
              Carta: {CATALOG_META.referencias} referencias base en {CATALOG_META.categorias} categorías transcriptas de cinco imágenes, con texto y fuente originales. Los precios no tienen vigencia comercial validada.
            </li>
            <li>Contacto transcripto: WhatsApp, Instagram, correo y dirección. Viernes y sábados según Instagram.</li>
          </ul>
        </section>
        <section className="card stack-sm">
          <h2>Supuestos de demostración (configurables)</h2>
          <ul className="stack-xs">
            <li>Fecha, horarios, banda «Trío Brasa», DJ ZETA y DJ Nébula, mesas, cupo de reservas, personal, perfiles de clientes y stock: ficticios.</li>
            <li>Pizzas a $20.000 por variedad (precio del encabezado). Docena de empanadas de un sabor como presentación de prueba. Whisky por vaso y recargo de frutos rojos deshabilitados por defecto.</li>
            <li>Comida para retiro por defecto; servicio a mesa disponible como configuración de prueba.</li>
            <li>Regla de beneficios (8 visitas, 15% con tope) como ejemplo: no es una promoción vigente.</li>
            <li>Plazos: 5 min para pagar, 10 min para rondas, alerta de listo sin retirar a los 15 min. Son valores de prueba, no políticas del local ni del proveedor.</li>
          </ul>
        </section>
        <section className="card stack-sm">
          <h2>Simulado</h2>
          <ul className="stack-xs">
            <li>Pagos, rechazos, aprobaciones tardías y devoluciones: proveedor simulado. No se piden tarjetas ni se mueve dinero.</li>
            <li>Recepción de estaciones y caídas de conexión.</li>
            <li>WhatsApp: se muestra y copia un borrador. Abrir el enlace no envía nada ni prueba lectura o respuesta.</li>
            <li>Visitas validadas por personal, acceso de noche para votar y selector de perfiles: mecanismos de prueba.</li>
            <li>Comprobantes: no son facturas fiscales.</li>
          </ul>
        </section>
        <section className="card stack-sm">
          <h2>Qué garantiza esta demo y qué no</h2>
          <p>
            El estado vive en este navegador (almacenamiento local) y se sincroniza entre pestañas del mismo navegador. Cada acción pasa por una única autoridad de simulación protegida con un bloqueo entre pestañas, con identificadores estables: un doble toque, un evento de pago repetido o una segunda validación de entrega no duplican efectos <strong>dentro de este navegador</strong>.
          </p>
          <p>
            <strong>No</strong> sincroniza teléfonos de distintas personas, no garantiza atomicidad global y no es un backend. El selector de rol no es seguridad: cualquiera puede elegir cualquier rol.
          </p>
        </section>
        <section className="card stack-sm">
          <h2>Qué falta para operar de verdad</h2>
          <ul className="stack-xs">
            <li>Servidor con persistencia transaccional y validación central de entrega (evitar doble retiro entre puestos).</li>
            <li>Autenticación real del personal, permisos por rol y por objeto verificados en servidor, revocación de sesiones y equipos.</li>
            <li>Integración con un proveedor de pago: confirmación del proveedor, notificaciones, idempotencia, devoluciones, conciliación y tratamiento fiscal.</li>
            <li>Registros de auditoría, copias recuperables, observabilidad y controles de abuso (bots, votos, enlaces).</li>
            <li>Validación con el local: carta y precios vigentes, sistema de QR/caja actual, entrega de comida, puestos, red, TV, horarios, mesas y políticas.</li>
            <li>Recuperación de identidad y prevención de cuentas duplicadas para beneficios; verificación de asistencia sin frenar el ingreso.</li>
          </ul>
          <p className="small muted">La atención, los controles presenciales al entregar bebidas y la resolución de casos particulares siguen a cargo del establecimiento.</p>
        </section>
      </main>
    </div>
  );
}
