"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, RefreshCw } from "lucide-react";
import { ConvertirseAficionadoForm } from "@/components/features/aficionados/ConvertirseAficionadoForm";
import { MisEquiposPanel } from "@/components/features/aficionados/MisEquiposPanel";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  miAficionadoApi,
  type EquipoDisponibleDTO,
  type MiAficionadoDTO,
} from "@/lib/api/business-aficionados";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { useAccess } from "@/lib/access";

/**
 * HU-GE-05. Si el usuario aún no es aficionado ve el formulario
 * "Conviértete en aficionado"; si ya lo es, gestiona los equipos que sigue.
 */
export default function MisEquiposPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const access = useAccess();
  const canConvertirse = access.hasPermission("/aficionados/me", "POST");
  const canAsociar = access.hasPermission("/aficionados/me/equipos", "POST");
  const canRetirar = access.hasPermission("/aficionados/me/equipos/{id}", "DELETE");

  const [aficionado, setAficionado] = useState<MiAficionadoDTO | null>(null);
  const [disponibles, setDisponibles] = useState<EquipoDisponibleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mio, equipos] = await Promise.all([
        miAficionadoApi.findMine().catch((caught: unknown) => {
          // 404: el usuario todavía no es aficionado.
          if (caught instanceof BusinessApiError && caught.status === 404) return null;
          throw caught;
        }),
        miAficionadoApi.findEquiposDisponibles(),
      ]);
      setAficionado(mio);
      setDisponibles(equipos);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar tu información.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Cuenta"
        title={aficionado || loading ? "Mis equipos" : "Conviértete en aficionado"}
        description={
          aficionado || loading
            ? "Consulta y gestiona los equipos que sigues en la plataforma."
            : "Regístrate como aficionado y elige los equipos que quieres seguir."
        }
        actions={
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="size-4" />}
            onClick={() => void load()}
          >
            Actualizar
          </Button>
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
          icon={<Heart />}
          title={aficionado ? "Equipos que sigo" : "Registro de aficionado"}
          description={
            loading
              ? "Cargando…"
              : aficionado
                ? `${aficionado.equipos.length} equipos seguidos`
                : "Completa tus datos para continuar"
          }
        />
        {loading || error ? null : aficionado ? (
          <MisEquiposPanel
            aficionado={aficionado}
            disponibles={disponibles}
            canAsociar={canAsociar}
            canRetirar={canRetirar}
            onChange={(equipos) => setAficionado({ ...aficionado, equipos })}
          />
        ) : canConvertirse ? (
          <ConvertirseAficionadoForm
            equipos={disponibles}
            nombreInicial={user?.name ?? ""}
            emailInicial={user?.email ?? ""}
            onSubmit={async (input) => {
              const created = await miAficionadoApi.convertirse(input);
              setAficionado(created);
              notify("¡Ya eres aficionado!");
            }}
          />
        ) : (
          <p className="p-5 text-sm text-zinc-500">
            No tienes permiso para registrarte como aficionado.
          </p>
        )}
      </Card>
    </>
  );
}
