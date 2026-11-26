import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatFechaHora } from "@/components/features/partidos/partido-utils";
import { formatearPesos, nombrePartido } from "@/components/features/boletos/boleto-utils";
import type { MiApuestaDTO } from "@/lib/api/business-aficionados";
import { ESTADO_APUESTA_LABEL, ESTADO_APUESTA_TONE, PRONOSTICO_LABEL } from "./apuesta-utils";

export function MisApuestasTable({ apuestas }: { apuestas: MiApuestaDTO[] }) {
  const columns: Column<MiApuestaDTO>[] = [
    {
      key: "partido",
      header: "Partido",
      cell: (item) => (
        <div>
          <p className="font-medium">{nombrePartido(item.partido)}</p>
          <p className="text-xs text-zinc-500">{formatFechaHora(item.partido.fecha_hora)}</p>
        </div>
      ),
    },
    { key: "pronostico", header: "Pronóstico", cell: (item) => PRONOSTICO_LABEL[item.pronostico] },
    {
      key: "monto",
      header: "Monto y cuota",
      cell: (item) => `${formatearPesos(item.monto)} × ${item.cuota.toFixed(2)}`,
    },
    { key: "ganancia", header: "Ganancia potencial", cell: (item) => formatearPesos(item.ganancia_potencial) },
    {
      key: "metodo",
      header: "Método de pago",
      cell: (item) => `${item.metodo_pago_nombre ?? "Método"} · ${item.metodo_pago_referencia}`,
    },
    {
      key: "estado",
      header: "Estado",
      cell: (item) => (
        <Badge tone={ESTADO_APUESTA_TONE[item.estado]}>{ESTADO_APUESTA_LABEL[item.estado]}</Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={apuestas}
      rowKey={(item) => item.id}
      emptyTitle="Aún no tienes apuestas"
      emptyDescription="Apuesta al resultado de un partido programado."
    />
  );
}
