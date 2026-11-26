"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Plus, RefreshCw } from "lucide-react";
import { MiMetodoPagoFormModal } from "@/components/features/metodos-pago/MiMetodoPagoFormModal";
import { MisMetodosPagoTable } from "@/components/features/metodos-pago/MisMetodosPagoTable";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useAccess } from "@/lib/access";
import {
  miAficionadoApi,
  type MetodoPagoDisponibleDTO,
  type MiMetodoPagoDTO,
} from "@/lib/api/business-aficionados";
import { BusinessApiError } from "@/lib/api/business-torneos";

const endpoint = "/aficionados/me/metodos-pago";

export default function MisMetodosPagoPage() {
  const { notify } = useToast();
  const access = useAccess();
  const canReadCatalogo = access.hasPermission(endpoint + "-disponibles", "GET");
  const canCreate = access.hasPermission(endpoint, "POST") && canReadCatalogo;
  const canEdit = access.hasPermission(endpoint + "/{id}", "PATCH");
  const canDelete = access.hasPermission(endpoint + "/{id}", "DELETE");

  const [registros, setRegistros] = useState<MiMetodoPagoDTO[] | null>(null);
  const [catalogo, setCatalogo] = useState<MetodoPagoDisponibleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const alta = useDisclosure();
  const edicion = useDisclosure<MiMetodoPagoDTO>();
  const eliminacion = useDisclosure<MiMetodoPagoDTO>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metodos, disponibles] = await Promise.all([
        miAficionadoApi.misMetodosPago().catch((caught: unknown) => {
          if (caught instanceof BusinessApiError && caught.status === 404) return null;
          throw caught;
        }),
        canReadCatalogo ? miAficionadoApi.metodosPagoDisponibles() : [],
      ]);
      setRegistros(metodos);
      setCatalogo(disponibles);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar los métodos de pago.");
    } finally {
      setLoading(false);
    }
  }, [canReadCatalogo]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(item: MiMetodoPagoDTO) {
    if (deleting) return;
    setDeleting(true);
    try {
      const result = await miAficionadoApi.eliminarMetodoPago(item.id);
      notify(result.message);
      await load();
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "No se pudo eliminar el método de pago.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Mis métodos de pago"
        actions={
          <>
            <Button variant="secondary" leftIcon={<RefreshCw className="size-4" />} onClick={() => void load()} disabled={loading}>
              Actualizar
            </Button>
            {canCreate && registros && !error && !loading && (
              <Button leftIcon={<Plus className="size-4" />} onClick={() => alta.open()}>
                Registrar método
              </Button>
            )}
          </>
        }
      />
      <Card className="overflow-hidden">
        {loading ? (
          <p role="status" className="p-5 text-sm text-zinc-500">Cargando métodos de pago…</p>
        ) : error ? (
          <p role="alert" className="p-5 text-sm text-co-red">{error}</p>
        ) : registros ? (
          <MisMetodosPagoTable
            registros={registros}
            onEdit={canEdit ? edicion.open : undefined}
            onDelete={canDelete ? eliminacion.open : undefined}
            deleting={deleting}
          />
        ) : (
          <EmptyState
            icon={<CreditCard />}
            title="Primero debes hacerte aficionado"
            description="Completa tu registro en Mis equipos para gestionar tus métodos de pago."
            action={<LinkButton href="/mis-equipos">Ir a Mis equipos</LinkButton>}
          />
        )}
      </Card>
      <MiMetodoPagoFormModal
        open={canCreate && alta.isOpen}
        onClose={alta.close}
        catalogo={catalogo}
        onSave={async (input) => {
          await miAficionadoApi.registrarMetodoPago(input);
          notify("Método de pago registrado.");
          await load();
        }}
      />
      {edicion.payload && (
        <MiMetodoPagoFormModal
          open={canEdit && edicion.isOpen}
          onClose={edicion.close}
          registro={edicion.payload}
          onSave={async (input) => {
            if (!edicion.payload) return;
            await miAficionadoApi.actualizarMetodoPago(edicion.payload.id, input);
            notify("Método de pago actualizado.");
            await load();
          }}
        />
      )}
      <ConfirmDialog
        open={canDelete && eliminacion.isOpen}
        onClose={eliminacion.close}
        onConfirm={() => { if (eliminacion.payload) void remove(eliminacion.payload); }}
        title="Eliminar método de pago"
        confirmLabel="Eliminar"
        message={eliminacion.payload?.tiene_apuestas
          ? "Este método tiene apuestas asociadas. Puedes editarlo y cambiar su estado a INACTIVO."
          : "¿Quieres eliminar este método de pago?"}
      />
    </>
  );
}
