"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  miAficionadoApi,
  type EquipoAsociadoDTO,
  type EquipoDisponibleDTO,
  type MiAficionadoDTO,
} from "@/lib/api/business-aficionados";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Field";

interface MisEquiposPanelProps {
  aficionado: MiAficionadoDTO;
  disponibles: EquipoDisponibleDTO[];
  canAsociar: boolean;
  canRetirar: boolean;
  onChange: (equipos: EquipoAsociadoDTO[]) => void;
}

const porNombre = (a: EquipoAsociadoDTO, b: EquipoAsociadoDTO) =>
  a.nombre.localeCompare(b.nombre, "es");

const errorMessage = (caught: unknown, fallback: string) =>
  caught instanceof Error ? caught.message : fallback;

export function MisEquiposPanel({
  aficionado,
  disponibles,
  canAsociar,
  canRetirar,
  onChange,
}: MisEquiposPanelProps) {
  const { notify } = useToast();
  const [equipoId, setEquipoId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [porRetirar, setPorRetirar] = useState<EquipoAsociadoDTO | null>(null);

  const seguidos = useMemo(
    () => new Set(aficionado.equipos.map(({ equipo_id }) => equipo_id)),
    [aficionado.equipos],
  );
  const hayDisponibles = disponibles.some(({ id }) => !seguidos.has(id));

  const asociar = async () => {
    if (!equipoId || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await miAficionadoApi.asociarEquipo(equipoId);
      onChange([...aficionado.equipos, created].sort(porNombre));
      setEquipoId("");
      notify(`Ahora sigues a “${created.nombre}”.`);
    } catch (caught) {
      setError(errorMessage(caught, "No se pudo seguir al equipo."));
    } finally {
      setSaving(false);
    }
  };

  const retirar = async () => {
    const equipo = porRetirar;
    if (!equipo) return;
    setSaving(true);
    setError("");
    try {
      await miAficionadoApi.retirarEquipo(equipo.equipo_id);
      onChange(aficionado.equipos.filter(({ equipo_id }) => equipo_id !== equipo.equipo_id));
      notify(`Dejaste de seguir a “${equipo.nombre}”.`);
    } catch (caught) {
      const message = errorMessage(caught, "No se pudo retirar la asociación.");
      setError(message);
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-5">
      {aficionado.equipos.length === 0 ? (
        <p className="text-sm text-zinc-500">Todavía no sigues a ningún equipo.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          {aficionado.equipos.map((equipo) => (
            <li key={equipo.equipo_id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{equipo.nombre}</span>
              <div className="flex items-center gap-2">
                {!equipo.activo && <Badge tone="neutral">Inactivo</Badge>}
                {canRetirar && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<X className="size-4" />}
                    disabled={saving}
                    onClick={() => setPorRetirar(equipo)}
                  >
                    Dejar de seguir
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canAsociar && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              label="Seguir otro equipo"
              placeholder={hayDisponibles ? "Selecciona un equipo" : "Ya sigues a todos los equipos"}
              value={equipoId}
              onChange={(event) => setEquipoId(event.target.value)}
              options={disponibles.map(({ id, nombre }) => ({
                value: id,
                label: seguidos.has(id) ? `${nombre} (ya lo sigues)` : nombre,
                disabled: seguidos.has(id),
              }))}
              disabled={!hayDisponibles}
            />
          </div>
          <Button
            leftIcon={<Plus className="size-4" />}
            onClick={() => void asociar()}
            disabled={!equipoId}
            loading={saving}
          >
            Seguir
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-co-red">
          {error}
        </p>
      )}

      {canRetirar && (
        <ConfirmDialog
          open={porRetirar !== null}
          onClose={() => setPorRetirar(null)}
          title="Dejar de seguir equipo"
          confirmLabel="Dejar de seguir"
          message={
            <>
              ¿Dejar de seguir a <strong>{porRetirar?.nombre}</strong>? Solo se retira la
              asociación: tu registro como aficionado y el equipo se conservan.
            </>
          }
          onConfirm={() => void retirar()}
        />
      )}
    </div>
  );
}
