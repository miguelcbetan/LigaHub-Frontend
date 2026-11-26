import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatFechaHora } from "@/components/features/partidos/partido-utils";
import type { EstadoBoleta } from "@/lib/api/business-aficionados";
import type { BoletaDTO } from "@/lib/api/business-boletas";
import {
  ESTADO_BOLETA_LABEL,
  ESTADO_BOLETA_TONE,
  formatearPesos,
} from "./boleto-utils";

export interface BoletaFila extends BoletaDTO {
  aficionado: string;
  partido: string;
  localidad: string;
}

interface BoletosTableProps {
  boletas: BoletaFila[];
  /** Cambia el estado de una boleta ACTIVA (USADA o ANULADA). */
  onEstado?: (boleta: BoletaFila, estado: EstadoBoleta) => void;
  onDelete?: (boleta: BoletaFila) => void;
}

export function BoletosTable({ boletas, onEstado, onDelete }: BoletosTableProps) {
  const columns: Column<BoletaFila>[] = [
    { key: "aficionado", header: "Aficionado", cell: (item) => item.aficionado },
    { key: "partido", header: "Partido", cell: (item) => item.partido },
    { key: "localidad", header: "Localidad", cell: (item) => item.localidad },
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

  if (onEstado || onDelete) {
    columns.push({
      key: "acciones",
      header: <span className="sr-only">Acciones</span>,
      className: "text-right",
      cell: (item) => (
        <div className="flex justify-end gap-1">
          {onEstado && item.estado === "ACTIVA" && (
            <>
              <Button size="sm" variant="ghost" onClick={() => onEstado(item, "USADA")}>
                Marcar usada
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onEstado(item, "ANULADA")}>
                Anular
              </Button>
            </>
          )}
          {onDelete && (
            <Button size="sm" variant="ghost" onClick={() => onDelete(item)}>
              Eliminar
            </Button>
          )}
        </div>
      ),
    });
  }

  return (
    <DataTable
      columns={columns}
      data={boletas}
      rowKey={(item) => item.id}
      emptyTitle="No hay boletas"
      emptyDescription="Las boletas compradas por los aficionados aparecerán aquí."
    />
  );
}
