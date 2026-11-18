"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { businessHabilidadesApi, type HabilidadDTO } from "@/lib/api/business-habilidades";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { HabilidadJugadoresSection } from "./HabilidadJugadoresSection";

interface HabilidadDetailModalProps {
  open: boolean;
  onClose: () => void;
  habilidad?: HabilidadDTO;
  canViewJugadores?: boolean;
}

export function HabilidadDetailModal({
  open,
  onClose,
  habilidad,
  canViewJugadores = false,
}: HabilidadDetailModalProps) {
  const [detail, setDetail] = useState<HabilidadDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !habilidad) return;
    let active = true;
    setDetail(null);
    setError("");
    setLoading(true);

    businessHabilidadesApi
      .findOne(habilidad.id)
      .then((found) => {
        if (active) setDetail(found);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : "No se pudo cargar la habilidad.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, habilidad]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<Eye />}
      title="Detalle de la habilidad"
      description="Información registrada en el catálogo de habilidades."
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
      ) : (
        detail && (
          <>
            <dl className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              <div className="flex gap-3 py-2.5">
                <dt className="w-32 shrink-0 text-zinc-500">Nombre</dt>
                <dd className="min-w-0 flex-1 font-medium break-words">{detail.nombre}</dd>
              </div>
              <div className="flex gap-3 py-2.5">
                <dt className="w-32 shrink-0 text-zinc-500">Descripción</dt>
                <dd className="min-w-0 flex-1 font-medium break-words whitespace-pre-line">
                  {detail.descripcion}
                </dd>
              </div>
            </dl>
            {canViewJugadores && <HabilidadJugadoresSection habilidadId={detail.id} />}
          </>
        )
      )}
    </Modal>
  );
}
