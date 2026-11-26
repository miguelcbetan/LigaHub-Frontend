"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Ticket } from "lucide-react";
import { ComprarBoletoModal } from "@/components/features/boletos/ComprarBoletoModal";
import { MisBoletosTable } from "@/components/features/boletos/MisBoletosTable";
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
  type MiBoletaDTO,
  type PartidoDisponibleDTO,
} from "@/lib/api/business-aficionados";
import { BusinessApiError } from "@/lib/api/business-torneos";

/** null = el usuario aún no es aficionado (404 de las rutas de la sesión). */
const noEsAficionado = (caught: unknown) => {
  if (caught instanceof BusinessApiError && caught.status === 404) return null;
  throw caught;
};

export default function MisBoletosPage() {
  const { notify } = useToast();
  const access = useAccess();
  const canComprar =
    access.hasPermission("/aficionados/me/boletas", "POST") &&
    access.hasPermission("/aficionados/me/partidos-disponibles", "GET");

  const [boletas, setBoletas] = useState<MiBoletaDTO[] | null>(null);
  const [partidos, setPartidos] = useState<PartidoDisponibleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const compra = useDisclosure();

  const loadPartidos = useCallback(async () => {
    if (!canComprar) return;
    try {
      setPartidos(await miAficionadoApi.partidosDisponibles());
    } catch (caught) {
      notify(mensajeDeError(caught, "No se pudieron cargar los partidos."), "error");
    }
  }, [canComprar, notify]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mias] = await Promise.all([
        miAficionadoApi.misBoletas().catch(noEsAficionado),
        loadPartidos(),
      ]);
      setBoletas(mias);
    } catch (caught) {
      setError(mensajeDeError(caught, "No se pudieron cargar tus boletos."));
    } finally {
      setLoading(false);
    }
  }, [loadPartidos]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Mis boletos"
        description="Compra boletos para los partidos programados y consulta los que tienes."
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
            {canComprar && boletas && !error && !loading && (
              <Button leftIcon={<Plus className="size-4" />} onClick={() => compra.open()}>
                Comprar boleto
              </Button>
            )}
          </>
        }
      />
      <Card className="overflow-hidden">
        {loading ? (
          <p role="status" className="p-5 text-sm text-zinc-500">
            Cargando boletos…
          </p>
        ) : error ? (
          <p role="alert" className="p-5 text-sm text-co-red">
            {error}
          </p>
        ) : boletas ? (
          <MisBoletosTable boletas={boletas} />
        ) : (
          <EmptyState
            icon={<Ticket />}
            title="Primero debes hacerte aficionado"
            description="Completa tu registro en Mis equipos para comprar boletos."
            action={<LinkButton href="/mis-equipos">Ir a Mis equipos</LinkButton>}
          />
        )}
      </Card>
      {canComprar && (
        <ComprarBoletoModal
          open={compra.isOpen}
          onClose={compra.close}
          partidos={partidos}
          onAgotada={loadPartidos}
          onComprar={async (input) => {
            const boleta = await miAficionadoApi.comprarBoleta(input);
            notify(`Boleto comprado en ${boleta.localidad_nombre}.`);
            await load();
          }}
        />
      )}
    </>
  );
}
