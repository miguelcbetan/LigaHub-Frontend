"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { businessDeportesApi, type DeporteDTO } from "@/lib/api/business-deportes";
import {
  businessEquiposDeportesApi,
  type EquipoDeporteDTO,
} from "@/lib/api/business-equipos-deportes";
import { businessEquiposApi, type EquipoDTO } from "@/lib/api/business-equipos";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Field";

interface EquipoDetailModalProps {
  open: boolean;
  onClose: () => void;
  equipo?: EquipoDTO;
  canAddDeporte: boolean;
  canRemoveDeporte: boolean;
}

const errorMessage = (caught: unknown, fallback: string) =>
  caught instanceof Error ? caught.message : fallback;

export function EquipoDetailModal({
  open,
  onClose,
  equipo,
  canAddDeporte,
  canRemoveDeporte,
}: EquipoDetailModalProps) {
  const { notify } = useToast();
  const [detail, setDetail] = useState<EquipoDTO | null>(null);
  const [asociaciones, setAsociaciones] = useState<EquipoDeporteDTO[]>([]);
  const [deportes, setDeportes] = useState<DeporteDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDeportes, setLoadingDeportes] = useState(false);
  const [error, setError] = useState("");
  const [deportesError, setDeportesError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deporteId, setDeporteId] = useState("");
  const [saving, setSaving] = useState(false);
  const [porRetirar, setPorRetirar] = useState<EquipoDeporteDTO | null>(null);

  useEffect(() => {
    if (!open || !equipo) return;
    let active = true;
    setDetail(null);
    setAsociaciones([]);
    setDeportes([]);
    setError("");
    setDeportesError("");
    setActionError("");
    setDeporteId("");
    setPorRetirar(null);
    setLoading(true);
    setLoadingDeportes(true);

    Promise.all([
      businessEquiposApi.findOne(equipo.id),
      businessEquiposDeportesApi.findByEquipo(equipo.id),
    ])
      .then(([found, links]) => {
        if (!active) return;
        setDetail(found);
        setAsociaciones(links);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(errorMessage(caught, "No se pudo cargar el detalle del equipo."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    businessDeportesApi
      .findAll()
      .then((result) => {
        if (active) setDeportes(result);
      })
      .catch((caught: unknown) => {
        if (active) {
          setDeportesError(errorMessage(caught, "No se pudieron cargar los deportes."));
        }
      })
      .finally(() => {
        if (active) setLoadingDeportes(false);
      });

    return () => {
      active = false;
    };
  }, [open, equipo]);

  const nombres = useMemo(
    () => new Map(deportes.map(({ id, nombre }) => [id, nombre])),
    [deportes],
  );
  const asociados = useMemo(
    () => new Set(asociaciones.map(({ deporte_id }) => deporte_id)),
    [asociaciones],
  );
  const hayDisponibles = deportes.some(({ id }) => !asociados.has(id));
  const nombreDeporte = (id: string) => nombres.get(id) ?? id;

  const agregarDeporte = async () => {
    if (!detail || !deporteId || saving) return;
    if (asociados.has(deporteId)) {
      setActionError("Ese deporte ya está asociado al equipo.");
      return;
    }
    setSaving(true);
    setActionError("");
    try {
      const created = await businessEquiposDeportesApi.create(detail.id, deporteId);
      setAsociaciones((current) => [...current, created]);
      setDeporteId("");
      notify(`“${nombreDeporte(created.deporte_id)}” asociado a “${detail.nombre}”.`);
    } catch (caught) {
      setActionError(errorMessage(caught, "No se pudo asociar el deporte."));
    } finally {
      setSaving(false);
    }
  };

  const retirarDeporte = async () => {
    const link = porRetirar;
    if (!link || !detail) return;
    setSaving(true);
    setActionError("");
    try {
      await businessEquiposDeportesApi.remove(link.id);
      setAsociaciones((current) => current.filter(({ id }) => id !== link.id));
      notify(`“${nombreDeporte(link.deporte_id)}” retirado de “${detail.nombre}”.`);
    } catch (caught) {
      const message = errorMessage(caught, "No se pudo retirar el deporte.");
      setActionError(message);
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const selectorPlaceholder = loadingDeportes
    ? "Cargando deportes…"
    : deportesError
      ? "No se pudieron cargar los deportes"
      : hayDisponibles
        ? "Selecciona un deporte"
        : "Todos los deportes ya están asociados";

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        icon={<Eye />}
        title="Detalle del equipo"
        description="Información del equipo y deportes en los que participa."
        footer={
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        {loading ? (
          <p className="text-sm text-zinc-500">Cargando detalle…</p>
        ) : error ? (
          <p role="alert" className="text-sm text-co-red">
            {error}
          </p>
        ) : detail ? (
          <div className="space-y-4">
            <dl className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              <div className="flex items-center gap-3 py-2.5">
                <dt className="w-36 shrink-0 text-zinc-500">Nombre</dt>
                <dd className="min-w-0 flex-1 font-medium">{detail.nombre}</dd>
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <dt className="w-36 shrink-0 text-zinc-500">Estado</dt>
                <dd className="flex-1">
                  <Badge tone={detail.activo ? "success" : "neutral"}>
                    {detail.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <dt className="w-36 shrink-0 text-zinc-500">Fase de grupos</dt>
                <dd className="flex-1 font-medium">
                  {detail.fase_grupos_id ? "Asignado" : "Sin asignar"}
                </dd>
              </div>
              <div className="flex items-start gap-3 py-2.5">
                <dt className="w-36 shrink-0 text-zinc-500">Deportes</dt>
                <dd className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  {asociaciones.length === 0 ? (
                    <span className="text-zinc-500">Sin deportes asociados.</span>
                  ) : (
                    asociaciones.map((link) => {
                      const nombre = nombreDeporte(link.deporte_id);
                      return (
                        <span
                          key={link.id}
                          className="inline-flex items-center gap-1 rounded-full bg-co-blue/10 py-0.5 pl-2.5 pr-1 text-xs font-medium text-co-blue"
                        >
                          {nombre}
                          {canRemoveDeporte && (
                            <button
                              type="button"
                              aria-label={`Retirar ${nombre}`}
                              disabled={saving}
                              onClick={() => setPorRetirar(link)}
                              className="rounded-full p-0.5 hover:bg-co-blue/20 disabled:opacity-50"
                            >
                              <X className="size-3" />
                            </button>
                          )}
                        </span>
                      );
                    })
                  )}
                </dd>
              </div>
            </dl>

            {canAddDeporte && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Select
                    label="Asociar deporte"
                    placeholder={selectorPlaceholder}
                    value={deporteId}
                    onChange={(event) => setDeporteId(event.target.value)}
                    options={deportes.map(({ id, nombre }) => ({
                      value: id,
                      label: asociados.has(id) ? `${nombre} (ya asociado)` : nombre,
                      disabled: asociados.has(id),
                    }))}
                    disabled={loadingDeportes || !!deportesError || !hayDisponibles}
                  />
                </div>
                <Button
                  leftIcon={<Plus className="size-4" />}
                  onClick={() => void agregarDeporte()}
                  disabled={!deporteId}
                  loading={saving}
                >
                  Asociar
                </Button>
              </div>
            )}

            {(actionError || deportesError) && (
              <p role="alert" className="text-sm text-co-red">
                {actionError || deportesError}
              </p>
            )}
          </div>
        ) : null}
      </Modal>

      {canRemoveDeporte && (
        <ConfirmDialog
          open={porRetirar !== null}
          onClose={() => setPorRetirar(null)}
          title="Retirar deporte"
          confirmLabel="Retirar asociación"
          message={
            <>
              ¿Retirar <strong>{porRetirar ? nombreDeporte(porRetirar.deporte_id) : ""}</strong>{" "}
              del equipo <strong>{detail?.nombre}</strong>? Solo se retira la
              asociación: el equipo y el deporte se conservan.
            </>
          }
          onConfirm={() => void retirarDeporte()}
        />
      )}
    </>
  );
}
