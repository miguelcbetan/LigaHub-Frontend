"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Swords } from "lucide-react";
import { PartidoDetalleModal } from "@/components/features/partidos/PartidoDetalleModal";
import { PartidoFormModal } from "@/components/features/partidos/PartidoFormModal";
import { PartidosTable } from "@/components/features/partidos/PartidosTable";
import {
  CATALOGOS_VACIOS,
  type PartidoCatalogos,
} from "@/components/features/partidos/partido-utils";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { businessEquiposApi } from "@/lib/api/business-equipos";
import { businessEscenariosApi } from "@/lib/api/business-escenarios";
import { businessEscenariosTorneoApi } from "@/lib/api/business-escenarios-torneo";
import { businessFasesApi } from "@/lib/api/business-fases";
import { businessInscripcionesApi } from "@/lib/api/business-inscripciones";
import {
  businessPartidosApi,
  type PartidoDTO,
} from "@/lib/api/business-partidos";
import { businessTorneosApi } from "@/lib/api/business-torneos";
import { useAccess } from "@/lib/access";

/** Un catálogo que falla (p. ej. sin permiso) se deja vacío en vez de romper la página. */
async function orEmpty<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch {
    return [];
  }
}

export default function PartidosPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/partidos", "POST");
  const canEdit = access.hasPermission("/partidos/{id}", "PATCH");
  const canDelete = access.hasPermission("/partidos/{id}", "DELETE");
  // HU-GC-07: goles (anotaciones) del partido.
  const permisosGoles = {
    canCreate: access.hasPermission("/anotaciones", "POST"),
    canEdit: access.hasPermission("/anotaciones/{id}", "PATCH"),
    canDelete: access.hasPermission("/anotaciones/{id}", "DELETE"),
  };
  const [partidos, setPartidos] = useState<PartidoDTO[]>([]);
  const [catalogos, setCatalogos] = useState<PartidoCatalogos>(CATALOGOS_VACIOS);
  const [torneoFiltro, setTorneoFiltro] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useDisclosure<PartidoDTO>();
  const detalle = useDisclosure<PartidoDTO>();
  const confirmDelete = useDisclosure<PartidoDTO>();
  const { notify } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lista, torneos, fases, equipos, inscripciones, escenarios, escenariosTorneo] =
        await Promise.all([
          businessPartidosApi.findAll(),
          orEmpty(businessTorneosApi.findAll()),
          orEmpty(businessFasesApi.findAll()),
          orEmpty(businessEquiposApi.findAll()),
          orEmpty(businessInscripcionesApi.findAll()),
          orEmpty(businessEscenariosApi.findAll()),
          orEmpty(businessEscenariosTorneoApi.findAll()),
        ]);
      setPartidos(lista);
      setCatalogos({ torneos, fases, equipos, inscripciones, escenarios, escenariosTorneo });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudieron cargar los partidos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return partidos.filter(
      (partido) =>
        (!torneoFiltro || partido.torneo_id === torneoFiltro) &&
        (!normalized ||
          [
            partido.equipo_local_nombre,
            partido.equipo_visitante_nombre,
            partido.escenario_nombre,
            partido.estado,
          ].some((value) => value?.toLowerCase().includes(normalized))),
    );
  }, [partidos, query, torneoFiltro]);

  const replace = (updated: PartidoDTO) =>
    setPartidos((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  const titulo = (partido: PartidoDTO) =>
    `${partido.equipo_local_nombre ?? "Local"} vs ${partido.equipo_visitante_nombre ?? "Visitante"}`;

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Gestión de partidos"
        description="Registra, consulta, actualiza y elimina los partidos de las fases de cada torneo."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => void load()}
            >
              Actualizar
            </Button>
            {canCreate && (
              <Button leftIcon={<Plus className="size-4" />} onClick={() => form.open()}>
                Registrar partido
              </Button>
            )}
          </>
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-co-red/30 bg-co-red/10 px-4 py-3 text-sm text-co-red"
        >
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader
          icon={<Swords />}
          title="Partidos registrados"
          description={
            loading
              ? "Cargando partidos…"
              : `${filtered.length} de ${partidos.length} partidos`
          }
          action={
            <div className="flex flex-wrap items-end gap-2">
              <Select
                aria-label="Filtrar por torneo"
                value={torneoFiltro}
                onChange={(event) => setTorneoFiltro(event.target.value)}
                options={[
                  { value: "", label: "Todos los torneos" },
                  ...catalogos.torneos.map((torneo) => ({
                    value: torneo.id,
                    label: torneo.nombre,
                  })),
                ]}
              />
              <SearchInput value={query} onChange={setQuery} placeholder="Buscar partido" />
            </div>
          }
        />
        <PartidosTable
          partidos={filtered}
          catalogos={catalogos}
          canEdit={canEdit}
          canDelete={canDelete}
          onView={(partido) => detalle.open(partido)}
          onEdit={(partido) => form.open(partido)}
          onDelete={(partido) => confirmDelete.open(partido)}
        />
      </Card>

      <PartidoDetalleModal
        open={detalle.isOpen}
        onClose={detalle.close}
        partido={detalle.payload}
        catalogos={catalogos}
        goles={permisosGoles}
        onPartidoChange={replace}
      />

      {(canCreate || canEdit) && (
        <PartidoFormModal
          open={form.isOpen}
          onClose={form.close}
          partido={form.payload}
          catalogos={catalogos}
          onSubmit={async (input) => {
            if (form.payload) {
              const finaliza =
                form.payload.estado === "EN_JUEGO" && input.estado === "FINALIZADO";
              const updated = await businessPartidosApi.update(form.payload.id, input);
              replace(updated);
              notify(
                finaliza
                  ? `Partido “${titulo(updated)}” finalizado. Se enviará el resumen a quienes tienen boleta o apuesta.`
                  : `Partido “${titulo(updated)}” actualizado.`,
              );
            } else {
              const created = await businessPartidosApi.create(input);
              setPartidos((current) => [created, ...current]);
              notify(
                `Partido “${titulo(created)}” registrado. Se notificará por correo a los aficionados de ambos equipos.`,
              );
            }
          }}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.isOpen}
          onClose={confirmDelete.close}
          title="Eliminar partido"
          confirmLabel="Eliminar partido"
          message={
            <>
              ¿Seguro que deseas eliminar el partido{" "}
              <strong>{confirmDelete.payload && titulo(confirmDelete.payload)}</strong>?
              Esta acción no se puede deshacer.
            </>
          }
          onConfirm={async () => {
            const partido = confirmDelete.payload;
            if (!partido) return;
            try {
              await businessPartidosApi.remove(partido.id);
              setPartidos((current) => current.filter((item) => item.id !== partido.id));
              notify(`Partido “${titulo(partido)}” eliminado.`, "error");
            } catch (caught) {
              notify(
                caught instanceof Error ? caught.message : "No se pudo eliminar el partido.",
                "error",
              );
            }
          }}
        />
      )}
    </>
  );
}
