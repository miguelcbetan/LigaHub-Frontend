"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import type { DeporteDTO } from "@/lib/api/business-deportes";
import { businessEquiposDeportesApi } from "@/lib/api/business-equipos-deportes";
import { businessEquiposApi, type EquipoDTO } from "@/lib/api/business-equipos";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface DeporteEquiposModalProps {
  open: boolean;
  onClose: () => void;
  deporte?: DeporteDTO;
}

export function DeporteEquiposModal({ open, onClose, deporte }: DeporteEquiposModalProps) {
  const [equipos, setEquipos] = useState<EquipoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !deporte) return;
    let active = true;
    setEquipos([]);
    setError("");
    setLoading(true);

    Promise.all([
      businessEquiposDeportesApi.findByDeporte(deporte.id),
      businessEquiposApi.findAll(),
    ])
      .then(([links, todos]) => {
        if (!active) return;
        const asociados = new Set(links.map(({ equipo_id }) => equipo_id));
        setEquipos(todos.filter(({ id }) => asociados.has(id)));
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "No se pudieron cargar los equipos del deporte.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, deporte]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<Shield />}
      title={`Equipos de ${deporte?.nombre ?? "este deporte"}`}
      description="Equipos que participan en esta disciplina."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando equipos…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-co-red">
          {error}
        </p>
      ) : equipos.length === 0 ? (
        <p className="text-sm text-zinc-500">Ningún equipo está asociado a este deporte.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          {equipos.map((equipo) => (
            <li key={equipo.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {equipo.nombre}
              </span>
              <Badge tone={equipo.activo ? "success" : "neutral"}>
                {equipo.activo ? "Activo" : "Inactivo"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
