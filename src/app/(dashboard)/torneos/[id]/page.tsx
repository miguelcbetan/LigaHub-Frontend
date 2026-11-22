"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { TorneoDesarrolloView } from "@/components/features/torneos/desarrollo/TorneoDesarrolloView";
import {
  businessTorneosApi,
  type TorneoDesarrolloDTO,
  type TorneoDTO,
} from "@/lib/api/business-torneos";
import type { UserResponseDTO } from "@/lib/api/types";
import { usersApi } from "@/lib/api/users";
import { useAccess } from "@/lib/access";

/** HU-GC-08: consultar la estructura y el desarrollo de un torneo. */
export default function TorneoDesarrolloPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const access = useAccess();
  const canView = access.hasPermission("/torneos/{id}/desarrollo", "GET");
  const canListTorneos = access.hasPermission("/torneos", "GET");
  const [desarrollo, setDesarrollo] = useState<TorneoDesarrolloDTO | null>(null);
  const [torneos, setTorneos] = useState<TorneoDTO[]>([]);
  const [usuarios, setUsuarios] = useState<UserResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDesarrollo = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      setDesarrollo(await businessTorneosApi.findDesarrollo(id));
    } catch (caught) {
      setDesarrollo(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo cargar el desarrollo del torneo.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, canView]);

  useEffect(() => {
    void loadDesarrollo();
  }, [loadDesarrollo]);

  // Catálogos opcionales: si no hay permiso la vista sigue funcionando.
  useEffect(() => {
    if (!canView) return;
    let active = true;
    if (canListTorneos) {
      businessTorneosApi
        .findAll()
        .then((result) => active && setTorneos(result))
        .catch(() => undefined);
    }
    // Los nombres de los jugadores viven en ms-security.
    usersApi
      .findAll()
      .then((result) => active && setUsuarios(result))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [canView, canListTorneos]);

  const usuariosPorId = useMemo(
    () => new Map(usuarios.map((usuario) => [usuario.id, usuario.name])),
    [usuarios],
  );
  const nombreJugador = useCallback(
    (userId: number | null) =>
      userId === null
        ? "Jugador no disponible"
        : (usuariosPorId.get(userId) ?? `Jugador #${userId}`),
    [usuariosPorId],
  );

  const volver = (
    <LinkButton
      href="/torneos"
      variant="secondary"
      leftIcon={<ArrowLeft className="size-4" />}
    >
      Volver a torneos
    </LinkButton>
  );

  if (!canView) {
    return (
      <Card>
        <EmptyState
          title="Sin permiso"
          description="No tienes permiso para consultar el desarrollo de los torneos."
          action={volver}
        />
      </Card>
    );
  }

  const opciones = torneos.length
    ? torneos.map((torneo) => ({ value: torneo.id, label: torneo.nombre }))
    : desarrollo
      ? [{ value: desarrollo.torneo.id, label: desarrollo.torneo.nombre }]
      : [];

  return (
    <>
      <PageHeader
        eyebrow="Desarrollo del torneo"
        title={desarrollo?.torneo.nombre ?? "Torneo"}
        description="Estructura, fases, posiciones, llaves, partidos y anotaciones del torneo seleccionado."
        actions={
          <>
            {volver}
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => void loadDesarrollo()}
            >
              Actualizar
            </Button>
          </>
        }
      />

      {opciones.length > 1 && (
        <div className="mb-6 max-w-sm">
          <Select
            label="Torneo"
            value={id}
            options={opciones}
            onChange={(event) => router.push(`/torneos/${event.target.value}`)}
          />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-co-red/30 bg-co-red/10 px-4 py-3 text-sm text-co-red"
        >
          {error}
        </div>
      )}

      {loading && !desarrollo ? (
        <Card>
          <EmptyState
            title="Cargando desarrollo…"
            description="Consultando fases, partidos y anotaciones."
          />
        </Card>
      ) : (
        desarrollo && (
          <TorneoDesarrolloView desarrollo={desarrollo} nombreJugador={nombreJugador} />
        )
      )}
    </>
  );
}
