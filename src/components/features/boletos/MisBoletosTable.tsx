import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatFechaHora } from "@/components/features/partidos/partido-utils";
import type { MiBoletaDTO } from "@/lib/api/business-aficionados";
import {
  ESTADO_BOLETA_LABEL,
  ESTADO_BOLETA_TONE,
  formatearPesos,
  nombrePartido,
} from "./boleto-utils";

export function MisBoletosTable({ boletas }: { boletas: MiBoletaDTO[] }) {
  const columns: Column<MiBoletaDTO>[] = [
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
    {
      key: "lugar",
      header: "Escenario y localidad",
      cell: (item) => `${item.escenario_nombre ?? "—"} · ${item.localidad_nombre}`,
    },
    { key: "precio", header: "Precio", cell: (item) => formatearPesos(item.precio) },
    { key: "compra", header: "Compra", cell: (item) => formatFechaHora(item.fecha_compra) },
    {
      key: "estado",
      header: "Estado",
      cell: (item) => (
        <Badge tone={ESTADO_BOLETA_TONE[item.estado]}>{ESTADO_BOLETA_LABEL[item.estado]}</Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={boletas}
      rowKey={(item) => item.id}
      emptyTitle="Aún no tienes boletos"
      emptyDescription="Compra un boleto para un partido programado."
    />
  );
}
