"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { JugadorDetailModal } from "@/components/features/jugadores/JugadorDetailModal";
import { JugadorFormModal } from "@/components/features/jugadores/JugadorFormModal";
import { JugadoresTable } from "@/components/features/jugadores/JugadoresTable";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { describeError } from "@/lib/api/http";
import type { UserResponseDTO } from "@/lib/api/types";
import { usersApi } from "@/lib/api/users";
import { businessJugadoresApi, type JugadorDTO } from "@/lib/api/business-jugadores";
import { useAccess } from "@/lib/access";

export default function JugadoresPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/jugadores", "POST");
  const canView = access.hasPermission("/jugadores/{id}", "GET");
  const canEdit = access.hasPermission("/jugadores/{id}", "PATCH");
  const canDelete = access.hasPermission("/jugadores/{id}", "DELETE");
  const canListUsuarios = access.hasPermission("/api/users", "GET");
  const canViewEquipos = access.hasPermission("/equipo-jugador", "GET");
  const [jugadores, setJugadores] = useState<JugadorDTO[]>([]);
  const [usuarios, setUsuarios] = useState<UserResponseDTO[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [usuariosError, setUsuariosError] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useDisclosure<JugadorDTO>();
  const detail = useDisclosure<JugadorDTO>();
  const confirmDelete = useDisclosure<JugadorDTO>();
  const { notify } = useToast();

  const loadJugadores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setJugadores(await businessJugadoresApi.findAll());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar los jugadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsuarios = useCallback(async () => {
    if (!canListUsuarios) {
      setUsuariosError("No tienes permiso para consultar los usuarios.");
      return;
    }
    setLoadingUsuarios(true);
    setUsuariosError("");
    try {
      setUsuarios(await usersApi.findAll());
    } catch (caught) {
      setUsuariosError(describeError(caught, "No se pudieron cargar los usuarios."));
    } finally {
      setLoadingUsuarios(false);
    }
  }, [canListUsuarios]);

  useEffect(() => {
    void loadJugadores();
    void loadUsuarios();
  }, [loadJugadores, loadUsuarios]);

  const usuariosPorId = useMemo(
    () => new Map(usuarios.map((usuario) => [usuario.id, usuario])),
    [usuarios],
  );

  const nombreDe = (jugador: JugadorDTO) =>
    usuariosPorId.get(jugador.user_id)?.name ?? `Usuario #${jugador.user_id}`;

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return jugadores.filter((jugador) => {
      if (!normalizedQuery) return true;
      const usuario = usuariosPorId.get(jugador.user_id);
      return [usuario?.name, usuario?.email, jugador.nacionalidad].some((valor) =>
        valor?.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [jugadores, usuariosPorId, query]);

  const replaceJugador = (updated: JugadorDTO) =>
    setJugadores((current) =>
      current.map((jugador) => (jugador.id === updated.id ? updated : jugador)),
    );

  const toggleActivo = async (jugador: JugadorDTO) => {
    try {
      const updated = await businessJugadoresApi.update(jugador.id, { activo: !jugador.activo });
      replaceJugador(updated);
      notify(`Jugador “${nombreDe(updated)}” ${updated.activo ? "activado" : "desactivado"}.`);
    } catch (caught) {
      notify(
        caught instanceof Error ? caught.message : "No se pudo cambiar el estado del jugador.",
        "error",
      );
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Gestión de jugadores"
        description="Registra, consulta, actualiza, desactiva y elimina los jugadores de la plataforma."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => {
                void loadJugadores();
                void loadUsuarios();
              }}
            >
              Actualizar
            </Button>
            {canCreate && (
              <Button leftIcon={<Plus className="size-4" />} onClick={() => form.open()}>
                Nuevo jugador
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
          icon={<UserRound />}
          title="Jugadores registrados"
          description={
            loading ? "Cargando jugadores…" : `${filtered.length} de ${jugadores.length} jugadores`
          }
          action={
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar jugador" />
          }
        />
        <JugadoresTable
          jugadores={filtered}
          usuarios={usuariosPorId}
          canView={canView}
          canEdit={canEdit}
          canDelete={canDelete}
          onView={(jugador) => detail.open(jugador)}
          onEdit={(jugador) => form.open(jugador)}
          onToggleActivo={(jugador) => void toggleActivo(jugador)}
          onDelete={(jugador) => confirmDelete.open(jugador)}
        />
      </Card>

      {(canCreate || canEdit) && (
        <JugadorFormModal
          open={form.isOpen}
          onClose={form.close}
          jugador={form.payload}
          usuarios={usuarios}
          loadingUsuarios={loadingUsuarios}
          usuariosError={usuariosError}
          jugadores={jugadores}
          onCreate={async (input) => {
            const created = await businessJugadoresApi.create(input);
            setJugadores((current) => [created, ...current]);
            notify(`Jugador “${nombreDe(created)}” registrado.`);
          }}
          onUpdate={async (input) => {
            if (!form.payload) return;
            const updated = await businessJugadoresApi.update(form.payload.id, input);
            replaceJugador(updated);
            notify(`Jugador “${nombreDe(updated)}” actualizado.`);
          }}
        />
      )}

      {canView && (
        <JugadorDetailModal
          open={detail.isOpen}
          onClose={detail.close}
          jugador={detail.payload}
          canViewEquipos={canViewEquipos}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.isOpen}
          onClose={confirmDelete.close}
          title="Eliminar jugador"
          confirmLabel="Eliminar jugador"
          message={
            <>
              ¿Seguro que deseas eliminar al jugador{" "}
              <strong>{confirmDelete.payload ? nombreDe(confirmDelete.payload) : ""}</strong>? Se
              elimina solo su registro de jugador; su usuario de la plataforma se conserva. Si
              tiene anotaciones, posiciones, historial de equipos o habilidades no se eliminará;
              desactívalo en su lugar.
            </>
          }
          onConfirm={async () => {
            const jugador = confirmDelete.payload;
            if (!jugador) return;
            try {
              await businessJugadoresApi.remove(jugador.id);
              setJugadores((current) => current.filter((item) => item.id !== jugador.id));
              notify(`Jugador “${nombreDe(jugador)}” eliminado.`, "error");
            } catch (caught) {
              notify(
                caught instanceof Error ? caught.message : "No se pudo eliminar el jugador.",
                "error",
              );
            }
          }}
        />
      )}
    </>
  );
}
