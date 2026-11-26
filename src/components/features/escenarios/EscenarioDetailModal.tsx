"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Eye } from "lucide-react";
import { businessEscenariosApi, type EscenarioDTO } from "@/lib/api/business-escenarios";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EscenarioLocalidadesSection } from "./EscenarioLocalidadesSection";
import { boletasVendidas, mensajeDeError, nombreDelPadre, porNombre } from "./escenario-utils";

export interface PermisosLocalidades {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface EscenarioDetailModalProps {
  open: boolean;
  onClose: () => void;
  escenario?: EscenarioDTO;
  /** Catálogo de escenarios, para mostrar el nombre del padre. */
  escenarios: EscenarioDTO[];
  localidades: PermisosLocalidades;
  /** Recibe el escenario actualizado tras un cambio en sus localidades. */
  onEscenarioChange: (escenario: EscenarioDTO) => void;
  /** El escenario ya no existe (se eliminó en otra sesión). */
  onNotFound: () => void;
}

export function EscenarioDetailModal({
  open,
  onClose,
  escenario,
  escenarios,
  localidades,
  onEscenarioChange,
  onNotFound,
}: EscenarioDetailModalProps) {
  const [detail, setDetail] = useState<EscenarioDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !escenario) return;
    let active = true;
    setDetail(null);
    setError("");
    setLoading(true);

    businessEscenariosApi
      .findOne(escenario.id)
      .then((found) => {
        if (active) setDetail(found);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        if (caught instanceof BusinessApiError && caught.status === 404) {
          onNotFound();
          return;
        }
        setError(mensajeDeError(caught, "No se pudo cargar el escenario."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, escenario, onNotFound]);

  const refrescar = useCallback(async () => {
    if (!detail) return;
    try {
      const updated = await businessEscenariosApi.findOne(detail.id);
      setDetail(updated);
      onEscenarioChange(updated);
    } catch (caught) {
      setError(mensajeDeError(caught, "No se pudo actualizar el escenario."));
    }
  }, [detail, onEscenarioChange]);

  const filas: [string, ReactNode][] = detail
    ? [
        ["Nombre", detail.nombre],
        ["Dirección", detail.direccion],
        ["Capacidad", detail.capacidad.toLocaleString("es-CO")],
        ["Escenario padre", nombreDelPadre(escenarios, detail.escenario_padre_id) ?? "Ninguno"],
        [
          "Subescenarios",
          detail.sub_escenarios?.length
            ? [...detail.sub_escenarios].sort(porNombre).map((sub) => sub.nombre).join(", ")
            : "Ninguno",
        ],
        ["Partidos", detail.partidos?.length ?? 0],
        ["Asignaciones a torneos", detail.escenarios_torneo?.length ?? 0],
        ["Boletas vendidas", boletasVendidas(detail)],
      ]
    : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<Eye />}
      size="lg"
      title="Detalle del escenario"
      description="Datos del escenario y sus localidades."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando detalle…</p>
      ) : error && !detail ? (
        <p role="alert" className="text-sm text-co-red">
          {error}
        </p>
      ) : (
        detail && (
          <>
            {error && (
              <p role="alert" className="mb-3 text-sm text-co-red">
                {error}
              </p>
            )}
            <dl className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              {filas.map(([label, value]) => (
                <div key={label} className="flex gap-3 py-2.5">
                  <dt className="w-44 shrink-0 text-zinc-500">{label}</dt>
                  <dd className="min-w-0 flex-1 font-medium break-words">{value}</dd>
                </div>
              ))}
            </dl>
            <EscenarioLocalidadesSection
              escenarioId={detail.id}
              localidades={detail.localidades ?? []}
              {...localidades}
              onChange={refrescar}
            />
          </>
        )
      )}
    </Modal>
  );
}
