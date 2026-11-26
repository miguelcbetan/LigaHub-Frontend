"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { MetodoPagoAficionadoFormModal } from "@/components/features/metodos-pago/MetodoPagoAficionadoFormModal";
import { MetodosPagoAficionadoTable } from "@/components/features/metodos-pago/MetodosPagoAficionadoTable";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useAccess } from "@/lib/access";
import {
  businessMetodosPagoAficionadoApi as api,
  type AficionadoSelectorDTO,
  type MetodoPagoAficionadoDTO,
  type MetodoPagoCatalogoDTO,
} from "@/lib/api/business-metodos-pago-aficionado";

const endpoint = "/metodos-pago-aficionado";

export default function MetodosPagoAficionadoPage() {
  const { notify } = useToast();
  const access = useAccess();
  const canReadCatalogo = access.hasPermission("/metodos-pago", "GET");
  const canReadAficionados = access.hasPermission("/aficionados", "GET");
  const canCreate = access.hasPermission(endpoint, "POST") && canReadCatalogo && canReadAficionados;
  const canEdit = access.hasPermission(endpoint + "/{id}", "PATCH");
  const canDelete = access.hasPermission(endpoint + "/{id}", "DELETE");

  const [registros, setRegistros] = useState<MetodoPagoAficionadoDTO[]>([]);
  const [catalogo, setCatalogo] = useState<MetodoPagoCatalogoDTO[]>([]);
  const [aficionados, setAficionados] = useState<AficionadoSelectorDTO[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const alta = useDisclosure();
  const edicion = useDisclosure<MetodoPagoAficionadoDTO>();
  const eliminacion = useDisclosure<MetodoPagoAficionadoDTO>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metodos, metodosCatalogo, listadoAficionados] = await Promise.all([
        api.findAll(),
        canReadCatalogo ? api.findCatalogo() : [],
        canReadAficionados ? api.findAficionados() : [],
      ]);
      setRegistros(metodos);
      setCatalogo(metodosCatalogo);
      setAficionados(listadoAficionados);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar los métodos de pago.");
    } finally {
      setLoading(false);
    }
  }, [canReadAficionados, canReadCatalogo]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibles = useMemo(() => {
    const aficionadosPorId = new Map(aficionados.map((item) => [item.id, item]));
    const metodosPorId = new Map(catalogo.map((item) => [item.id, item]));
    const busqueda = query.trim().toLowerCase();
    return registros.map((item) => ({
      ...item,
      aficionado: aficionadosPorId.get(item.aficionado_id),
      metodo: metodosPorId.get(item.metodo_pago_id),
    })).filter(({ aficionado, referencia }) =>
      referencia.toLowerCase().includes(busqueda) ||
      aficionado?.nombre.toLowerCase().includes(busqueda) ||
      aficionado?.documento.toLowerCase().includes(busqueda),
    );
  }, [aficionados, catalogo, query, registros]);

  async function remove(item: MetodoPagoAficionadoDTO) {
    if (deleting) return;
    setDeleting(true);
    try {
      const result = await api.remove(item.id);
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
        title="Métodos de pago de aficionados"
        actions={
          <>
            <Button variant="secondary" leftIcon={<RefreshCw className="size-4" />} onClick={() => void load()} disabled={loading}>
              Actualizar
            </Button>
            {canCreate && !loading && !error && (
              <Button leftIcon={<Plus className="size-4" />} onClick={() => alta.open()}>
                Registrar método
              </Button>
            )}
          </>
        }
      />
      <Card className="overflow-hidden">
        <CardHeader
          title="Métodos registrados"
          action={<SearchInput value={query} onChange={setQuery} placeholder="Buscar por aficionado o referencia" />}
        />
        {loading ? (
          <p role="status" className="p-5 text-sm text-zinc-500">Cargando métodos de pago…</p>
        ) : error ? (
          <p role="alert" className="p-5 text-sm text-co-red">{error}</p>
        ) : (
          <MetodosPagoAficionadoTable
            registros={visibles}
            onEdit={canEdit ? edicion.open : undefined}
            onDelete={canDelete ? eliminacion.open : undefined}
            deleting={deleting}
          />
        )}
      </Card>
      <MetodoPagoAficionadoFormModal
        open={canCreate && alta.isOpen}
        onClose={alta.close}
        aficionados={aficionados}
        catalogo={catalogo}
        onSave={async (input) => {
          await api.create(input);
          notify("Método de pago registrado.");
          await load();
        }}
      />
      {edicion.payload && (
        <MetodoPagoAficionadoFormModal
          open={canEdit && edicion.isOpen}
          onClose={edicion.close}
          registro={edicion.payload}
          onSave={async (input) => {
            if (!edicion.payload) return;
            await api.update(edicion.payload.id, input);
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
        message={eliminacion.payload?.apuestas?.length
          ? "Este método tiene apuestas asociadas. Puedes editarlo y cambiar su estado a INACTIVO."
          : "¿Quieres eliminar este método de pago?"}
      />
    </>
  );
}
