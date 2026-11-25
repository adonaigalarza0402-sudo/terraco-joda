import { useState } from 'react';
import { ars } from '../../domain/money';
import { attribution, pollStats, reportFor, type CanalFiltro } from '../../domain/reports';
import { jornadaLabel, jornadaOf } from '../../domain/time';
import { useStore } from '../../state/store';
import { Empty, Notice, Seg, Tag } from '../../ui/kit';

const mins = (ms: number | null) => (ms === null ? '—' : ms < 60_000 ? `${Math.round(ms / 1000)} s` : `${Math.round(ms / 60_000)} min`);

function Kpi({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div className="card tight kpi">
      <span className="k-val">{value}</span>
      <span className="k-lab">{label}</span>
      <span className="xsmall muted">{help}</span>
    </div>
  );
}

/** Resumen inicial: pocas señales, cada una explicada. */
export function Summary() {
  const s = useStore((x) => x);
  const j = jornadaOf(s.now);
  const r = reportFor(s, j, 'todos');
  const maxCat = Math.max(1, ...r.categorias.map((c) => c.importe));
  return (
    <div className="stack">
      <div>
        <p className="eyebrow">Jornada operativa · {jornadaLabel(j)}</p>
        <p className="xsmall muted">Desde las 08:00 hasta las 08:00 del día siguiente (Argentina). Incluye {r.sembrados} pedido(s) sembrados ficticios y lo que hagas en la demo.</p>
      </div>
      <div className="grid-3">
        <Kpi label="Ventas registradas" value={ars(r.ventasBrutas)} help={`${r.ventasCount} pedidos con cobro aprobado o verificado. Antes de descuentos y devoluciones.`} />
        <Kpi label="Pedidos abiertos" value={String(r.abiertos)} help={`${r.esperandoPago} esperando pago; el resto en preparación o retiro.`} />
        <Kpi label="Incidencias abiertas" value={String(r.incidenciasAbiertas)} help={`${r.incidenciasTotal} registradas en la jornada.`} />
      </div>
      <section className="card stack-sm">
        <h3>Categorías más pedidas</h3>
        {!r.categorias.length && <p className="small muted">Todavía no hay ventas registradas.</p>}
        {r.categorias.slice(0, 6).map((c) => (
          <div key={c.nombre} className="stack-xs">
            <div className="row between small">
              <span>{c.nombre}</span>
              <span className="num">
                {c.unidades} u. · {ars(c.importe)}
              </span>
            </div>
            <div className="bar" aria-hidden>
              <span style={{ width: `${(c.importe / maxCat) * 100}%` }} />
            </div>
          </div>
        ))}
        <p className="xsmall muted">Lo más vendido no es necesariamente lo más rentable: la demo no tiene costos, así que muestra ingresos, no margen.</p>
      </section>
    </div>
  );
}

export function DetailedReports() {
  const s = useStore((x) => x);
  const jornadas = [...new Set(s.orders.map((o) => o.jornada).concat(jornadaOf(s.now)))].sort().reverse();
  const [j, setJ] = useState(jornadaOf(s.now));
  const [canal, setCanal] = useState<CanalFiltro>('todos');
  const r = reportFor(s, j, canal);
  const polls = pollStats(s, j);
  const attr = attribution(s);
  return (
    <div className="stack">
      <div className="row-wrap">
        <label className="small">
          Jornada{' '}
          <select className="select input" style={{ width: 'auto', minHeight: 38 }} value={j} onChange={(e) => setJ(e.target.value)}>
            {jornadas.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <Seg label="Canal" value={canal} onChange={setCanal} options={[{ value: 'todos', label: 'Todo lo registrado' }, { value: 'web', label: 'Canal web' }, { value: 'caja', label: 'Canal caja' }]} />
      </div>
      <Notice tone="warn">
        Muestra de la demo: {canal === 'todos' ? 'todo lo registrado en esta app' : `solo canal ${canal}`}. No son las ventas totales de TERRACO: lo que se vende fuera de la app no está acá. {r.sembrados > 0 && `Incluye ${r.sembrados} pedido(s) sembrados ficticios.`}
      </Notice>
      {r.pedidos === 0 ? (
        <Empty title="Sin registros para esta jornada">No hay denominador conocido: no se calculan porcentajes ni promedios.</Empty>
      ) : (
        <>
          <section className="card stack-sm">
            <h3>Dinero (simulado)</h3>
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  <tr>
                    <td>Ventas brutas</td>
                    <td className="num">{ars(r.ventasBrutas)}</td>
                    <td className="small muted">Suma de productos de pedidos con cobro aprobado/verificado, a precio congelado.</td>
                  </tr>
                  <tr>
                    <td>Descuentos</td>
                    <td className="num">−{ars(r.descuentos)}</td>
                    <td className="small muted">Cupones de ejemplo aplicados.</td>
                  </tr>
                  <tr>
                    <td>Devoluciones completadas</td>
                    <td className="num">−{ars(r.devCompletadas)}</td>
                    <td className="small muted">Confirmadas por el proveedor simulado.</td>
                  </tr>
                  <tr>
                    <td>Devoluciones pendientes o fallidas</td>
                    <td className="num">−{ars(r.devPendientes)}</td>
                    <td className="small muted">Comprometidas pero sin completar.</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Ventas netas</strong>
                    </td>
                    <td className="num">
                      <strong>{ars(r.ventasNetas)}</strong>
                    </td>
                    <td className="small muted">Brutas − descuentos − devoluciones registradas.</td>
                  </tr>
                  <tr>
                    <td>Cobros registrados</td>
                    <td className="num">{ars(r.cobrosTotal)}</td>
                    <td className="small muted">
                      Digital {ars(r.cobrosPorMetodo.digital_demo)} · efectivo {ars(r.cobrosPorMetodo.efectivo)} · transferencia verificada {ars(r.cobrosPorMetodo.transferencia_manual)}. Incluye aportes de rondas y {r.cobrosTardios} cobro(s) tardío(s). No es saldo bancario ni acreditación del proveedor.
                    </td>
                  </tr>
                  {canal === 'todos' && (
                    <tr>
                      <td>Por canal</td>
                      <td className="num small">
                        web {ars(r.web)}
                        <br />
                        caja {ars(r.caja)}
                      </td>
                      <td className="small muted">Totales netos de descuento de pedidos cobrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <div className="grid-2">
            <section className="card stack-sm">
              <h3>Productos más pedidos (unidades)</h3>
              <table className="table">
                <tbody>
                  {r.topProductos.map((p) => (
                    <tr key={p.nombre}>
                      <td className="small">{p.nombre}</td>
                      <td className="num">{p.unidades}</td>
                      <td className="num small">{ars(p.importe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="xsmall muted">{r.unidades} unidades vendidas (sin canceladas). Sin costos cargados: no se informa margen.</p>
            </section>
            <section className="card stack-sm">
              <h3>Tiempos por etapa (promedio)</h3>
              <table className="table">
                <tbody>
                  <tr>
                    <td>Cobro → recepción en estación</td>
                    <td className="num">{mins(r.tiempos.recepcion.ms)}</td>
                    <td className="small muted">n={r.tiempos.recepcion.n}</td>
                  </tr>
                  <tr>
                    <td>Recepción → listo (cocina)</td>
                    <td className="num">{mins(r.tiempos.cocina.ms)}</td>
                    <td className="small muted">n={r.tiempos.cocina.n}</td>
                  </tr>
                  <tr>
                    <td>Recepción → listo (barra)</td>
                    <td className="num">{mins(r.tiempos.barra.ms)}</td>
                    <td className="small muted">n={r.tiempos.barra.n}</td>
                  </tr>
                  <tr>
                    <td>Listo → entregado</td>
                    <td className="num">{mins(r.tiempos.retiro.ms)}</td>
                    <td className="small muted">n={r.tiempos.retiro.n}</td>
                  </tr>
                </tbody>
              </table>
              <p className="xsmall muted">Medidos con el reloj de demo. No comparan personas: dependen de carga y tipo de tarea.</p>
            </section>
          </div>
          {r.porMomento.length > 0 && (
            <section className="card stack-sm">
              <h3>Cobros por momento de la noche</h3>
              <table className="table">
                <tbody>
                  {r.porMomento.map((m) => (
                    <tr key={m.titulo}>
                      <td>{m.titulo}</td>
                      <td className="num">{m.pedidos} pedidos</td>
                      <td className="num">{ars(m.importe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="xsmall muted">Los momentos pueden superponerse (un pedido puede contar en cena y show). Describe cuándo se cobró; no atribuye ingresos al show o al DJ.</p>
            </section>
          )}
        </>
      )}
      <section className="card stack-sm">
        <h3>Participación en encuestas</h3>
        {!polls.length && <p className="small muted">No hubo encuestas en esta jornada.</p>}
        {polls.map((p) => (
          <div key={p.poll.id} className="row between small">
            <span>
              {p.poll.pregunta} <Tag className="xsmall">{p.poll.estado}</Tag>
            </span>
            <span className="num">
              {p.total} votos de {p.universo} con acceso de noche
            </span>
          </div>
        ))}
        <p className="xsmall muted">Universo conocido = identidades que activaron el acceso de noche de prueba, no el público del local. No mide permanencia ni satisfacción.</p>
      </section>
      <section className="card stack-sm">
        <h3>Enlaces por canal (escenario opcional)</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Enlace</th>
                <th className="num">Visitas</th>
                <th className="num">Consultas</th>
                <th className="num">Confirmadas</th>
                <th className="num">Canceladas</th>
                <th className="num">Llegada</th>
              </tr>
            </thead>
            <tbody>
              {attr.map((a) => (
                <tr key={a.link.id}>
                  <td className="small">
                    {a.link.etiqueta}
                    <br />
                    <span className="muted xsmall">
                      {a.link.codigo} · {a.link.jornada}
                    </span>
                  </td>
                  <td className="num">{a.visitas}</td>
                  <td className="num">{a.solicitudes}</td>
                  <td className="num">{a.confirmadas}</td>
                  <td className="num">{a.canceladas}</td>
                  <td className="num">{a.asistencias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="xsmall muted">Regla: último enlace identificado dentro del recorrido de consulta de reserva. Visitas incluye datos sembrados. Un enlace reenviado limita la interpretación; no demuestra causa ni genera comisiones.</p>
      </section>
    </div>
  );
}
