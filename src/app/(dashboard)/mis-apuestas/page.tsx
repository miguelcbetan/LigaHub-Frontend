"use client";

import { useCallback, useEffect, useState } from "react";
import { Dices, Plus, RefreshCw } from "lucide-react";
import { ApostarModal } from "@/components/features/apuestas/ApostarModal";
import { MisApuestasTable } from "@/components/features/apuestas/MisApuestasTable";
import { mensajeDeError } from "@/components/features/boletos/boleto-utils";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useAccess } from "@/lib/access";
import {
  miAficionadoApi,
  type MiApuestaDTO,
  type MiMetodoPagoDTO,
  type PartidoDisponibleDTO,
} from "@/lib/api/business-aficionados";
import { BusinessApiError } from "@/lib/api/business-torneos";

/** null = el usuario aún no es aficionado (404 de las rutas de la sesión). */
const noEsAficionado = (caught: unknown) => {
  if (caught instanceof BusinessApiError && caught.status === 404) return null;
  throw caught;
};

export default function MisApuestasPage() {
  const { notify } = useToast();
  const access = useAccess();
  const canApostar =
    access.hasPermission("/aficionados/me/apuestas", "POST") &&
    access.hasPermission("/aficionados/me/partidos-disponibles", "GET") &&
    access.hasPermission("/aficionados/me/metodos-pago", "GET");

  const [apuestas, setApuestas] = useState<MiApuestaDTO[] | null>(null);
  const [partidos, setPartidos] = useState<PartidoDisponibleDTO[]>([]);
  const [metodos, setMetodos] = useState<MiMetodoPagoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nueva = useDisclosure();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mias, disponibles, misMetodos] = await Promise.all([
        miAficionadoApi.misApuestas().catch(noEsAficionado),
        canApostar ? miAficionadoApi.partidosDisponibles() : [],
        canApostar ? miAficionadoApi.misMetodosPago().catch(() => []) : [],
      ]);
      setApuestas(mias);
      setPartidos(disponibles);
      setMetodos(misMetodos);
    } catch (caught) {
      setError(mensajeDeError(caught, "No se pudieron cargar tus apuestas."));
    } finally {
      setLoading(false);
    }
  }, [canApostar]);

  useEffect(() => {
    void load();
  }, [load]);

  const sinMetodosActivos = !metodos.some((metodo) => metodo.estado === "ACTIVO");

  return (
    <>
      <PageHeader
        title="Mis apuestas"
        description="Apuesta al resultado de los partidos programados con tus métodos de pago."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => void load()}
              disabled={loading}
            >
              Actualizar
            </Button>
            {canApostar && apuestas && !sinMetodosActivos && !error && !loading && (
              <Button leftIcon={<Plus className="size-4" />} onClick={() => nueva.open()}>
                Nueva apuesta
              </Button>
            )}
          </>
        }
      />
      {canApostar && apuestas && sinMetodosActivos && !loading && !error && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-co-yellow/50 bg-co-yellow/10 px-4 py-3 text-sm"
        >
          <span>Para apostar necesitas un método de pago activo.</span>
          <LinkButton href="/mis-metodos-pago" size="sm">
            Ir a Mis métodos de pago
          </LinkButton>
        </div>
      )}
      <Card className="overflow-hidden">
        {loading ? (
          <p role="status" className="p-5 text-sm text-zinc-500">
            Cargando apuestas…
          </p>
        ) : error ? (
          <p role="alert" className="p-5 text-sm text-co-red">
            {error}
          </p>
        ) : apuestas ? (
          <MisApuestasTable apuestas={apuestas} />
        ) : (
          <EmptyState
            icon={<Dices />}
            title="Primero debes hacerte aficionado"
            description="Completa tu registro en Mis equipos para poder apostar."
            action={<LinkButton href="/mis-equipos">Ir a Mis equipos</LinkButton>}
          />
        )}
      </Card>
      {canApostar && (
        <ApostarModal
          open={nueva.isOpen}
          onClose={nueva.close}
          partidos={partidos}
          metodos={metodos}
          onApostar={async (input) => {
            await miAficionadoApi.apostar(input);
            notify("Apuesta registrada.");
            await load();
          }}
        />
      )}
    </>
  );
}
