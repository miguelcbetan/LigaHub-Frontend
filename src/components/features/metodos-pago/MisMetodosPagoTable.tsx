import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import type { MiMetodoPagoDTO } from "@/lib/api/business-aficionados";
import { ESTADO_METODO_LABEL, TIPO_METODO_LABEL } from "./metodo-pago-utils";

interface Props {
  registros: MiMetodoPagoDTO[];
  onEdit?: (registro: MiMetodoPagoDTO) => void;
  onDelete?: (registro: MiMetodoPagoDTO) => void;
  deleting: boolean;
}

const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

export function MisMetodosPagoTable({ registros, onEdit, onDelete, deleting }: Props) {
  const columns: Column<MiMetodoPagoDTO>[] = [
    {
      key: "metodo",
      header: "Método de pago",
      cell: (item) => (
        <div>
          <p className="font-medium">{item.metodo_pago_nombre}</p>
          <p className="text-xs text-zinc-500">{TIPO_METODO_LABEL[item.metodo_pago_tipo]}</p>
        </div>
      ),
    },
    { key: "referencia", header: "Referencia", cell: (item) => item.referencia },
    { key: "fecha", header: "Registro", cell: (item) => fecha.format(new Date(item.fecha_registro)) },
    {
      key: "predeterminado",
      header: "Predeterminado",
      cell: (item) => item.predeterminado ? <Badge tone="blue">Sí</Badge> : "No",
    },
    {
      key: "estado",
      header: "Estado",
      cell: (item) => (
        <Badge tone={item.estado === "ACTIVO" ? "success" : "neutral"}>
          {ESTADO_METODO_LABEL[item.estado]}
        </Badge>
      ),
    },
  ];

  if (onEdit || onDelete) {
    columns.push({
      key: "acciones",
      header: "Acciones",
      cell: (item) => (
        <div className="flex gap-1">
          {onEdit && <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>Editar</Button>}
          {onDelete && (
            <Button size="sm" variant="ghost" disabled={deleting} onClick={() => onDelete(item)}>
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
      data={registros}
      rowKey={(item) => item.id}
      emptyTitle="Todavía no tienes métodos de pago"
      emptyDescription="Los métodos que registres aparecerán aquí."
    />
  );
}
