import { useState } from 'react';
import { useStore } from '../../state/store';
import { Tabs } from '../../ui/kit';
import { DetailedReports, Summary } from './Reports';
import { StaffShell } from './Shell';

export function Owner() {
  const [tab, setTab] = useState<'resumen' | 'informes'>('resumen');
  const incs = useStore((s) => s.incidents.filter((i) => i.estado === 'abierta').slice(-5));
  return (
    <StaffShell title="Dueño" nav={<Tabs label="Dueño" value={tab} onChange={setTab} options={[{ value: 'resumen', label: 'Resumen de la noche' }, { value: 'informes', label: 'Informes' }]} />} wide={false}>
      {tab === 'resumen' ? (
        <div className="stack">
          <Summary />
          <section className="card stack-sm">
            <h3>Incidencias abiertas recientes</h3>
            {!incs.length && <p className="small muted">Sin incidencias abiertas.</p>}
            {incs.map((i) => (
              <p key={i.id} className="small">
                <strong>{i.titulo}</strong> — {i.detalle}
              </p>
            ))}
            <p className="xsmall muted">El encargado las gestiona desde su panel. Las métricas son de la demo y no prometen aumentos de ventas ni reducción de filas.</p>
          </section>
        </div>
      ) : (
        <DetailedReports />
      )}
    </StaffShell>
  );
}
