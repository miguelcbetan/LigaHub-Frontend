import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import type { MetodoPagoAficionadoDTO } from "@/lib/api/business-metodos-pago-aficionado";
import { ESTADO_METODO_LABEL, TIPO_METODO_LABEL } from "./metodo-pago-utils";

export interface RegistroConNombres extends MetodoPagoAficionadoDTO {
  aficionado?: { nombre: string; documento: string };
  metodo?: { nombre: string; tipo: keyof typeof TIPO_METODO_LABEL };
}

interface Props {
  registros: RegistroConNombres[];
  onEdit?: (registro: MetodoPagoAficionadoDTO) => void;
  onDelete?: (registro: MetodoPagoAficionadoDTO) => void;
  deleting: boolean;
}

export function MetodosPagoAficionadoTable({ registros, onEdit, onDelete, deleting }: Props) {
  const columns: Column<RegistroConNombres>[] = [
    {
      key: "aficionado",
      header: "Aficionado",
      cell: ({ aficionado, aficionado_id }) => (
        <div>
          <p className="font-medium">{aficionado?.nombre ?? aficionado_id}</p>
          {aficionado && <p className="text-xs text-zinc-500">{aficionado.documento}</p>}
        </div>
      ),
    },
    {
      key: "metodo",
      header: "Método de pago",
      cell: ({ metodo, metodo_pago_id }) => (
        <div>
          <p className="font-medium">{metodo?.nombre ?? metodo_pago_id}</p>
          {metodo && <p className="text-xs text-zinc-500">{TIPO_METODO_LABEL[metodo.tipo]}</p>}
        </div>
      ),
    },
    { key: "referencia", header: "Referencia", cell: (item) => item.referencia },
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

  return <DataTable columns={columns} data={registros} rowKey={(item) => item.id} />;
}
