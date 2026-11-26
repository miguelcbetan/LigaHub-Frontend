import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatFechaHora } from "@/components/features/partidos/partido-utils";
import { formatearPesos } from "@/components/features/boletos/boleto-utils";
import type { EstadoApuesta } from "@/lib/api/business-aficionados";
import type { ApuestaDTO } from "@/lib/api/business-apuestas";
import {
  ESTADO_APUESTA_LABEL,
  ESTADO_APUESTA_TONE,
  PRONOSTICO_LABEL,
  gananciaPotencial,
} from "./apuesta-utils";

export interface ApuestaFila extends ApuestaDTO {
  aficionado: string;
  partido: string;
}

interface ApuestasTableProps {
  apuestas: ApuestaFila[];
  /** Liquida o anula una apuesta PENDIENTE. */
  onEstado?: (apuesta: ApuestaFila, estado: EstadoApuesta) => void;
  onDelete?: (apuesta: ApuestaFila) => void;
}

const LIQUIDACIONES: { estado: EstadoApuesta; label: string }[] = [
  { estado: "GANADA", label: "Ganada" },
  { estado: "PERDIDA", label: "Perdida" },
  { estado: "ANULADA", label: "Anular" },
];

export function ApuestasTable({ apuestas, onEstado, onDelete }: ApuestasTableProps) {
  const columns: Column<ApuestaFila>[] = [
    { key: "aficionado", header: "Aficionado", cell: (item) => item.aficionado },
    { key: "partido", header: "Partido", cell: (item) => item.partido },
    { key: "pronostico", header: "Pronóstico", cell: (item) => PRONOSTICO_LABEL[item.pronostico] },
    {
      key: "monto",
      header: "Monto × cuota",
      cell: (item) => (
        <div>
          <p>{`${formatearPesos(item.monto)} × ${item.cuota.toFixed(2)}`}</p>
          <p className="text-xs text-zinc-500">
            Paga {formatearPesos(gananciaPotencial(item.monto, item.cuota))}
          </p>
        </div>
      ),
    },
    { key: "fecha", header: "Fecha", cell: (item) => formatFechaHora(item.fecha_apuesta) },
    {
      key: "estado",
      header: "Estado",
      cell: (item) => (
        <Badge tone={ESTADO_APUESTA_TONE[item.estado]}>{ESTADO_APUESTA_LABEL[item.estado]}</Badge>
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
          {onEstado &&
            item.estado === "PENDIENTE" &&
            LIQUIDACIONES.map(({ estado, label }) => (
              <Button key={estado} size="sm" variant="ghost" onClick={() => onEstado(item, estado)}>
                {label}
              </Button>
            ))}
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
      data={apuestas}
      rowKey={(item) => item.id}
      emptyTitle="No hay apuestas"
      emptyDescription="Las apuestas de los aficionados aparecerán aquí."
    />
  );
}
