"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, TicketCheck } from "lucide-react";
import { BoletoAdminFormModal } from "@/components/features/boletos/BoletoAdminFormModal";
import { BoletosTable, type BoletaFila } from "@/components/features/boletos/BoletosTable";
import {
  ESTADO_BOLETA_LABEL,
  etiquetaPartido,
  mensajeDeError,
} from "@/components/features/boletos/boleto-utils";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useAccess } from "@/lib/access";
import type { EstadoBoleta } from "@/lib/api/business-aficionados";
import { businessBoletasApi, type BoletaDTO } from "@/lib/api/business-boletas";
import { businessLocalidadesApi, type LocalidadDTO } from "@/lib/api/business-localidades";
import {
  businessMetodosPagoAficionadoApi,
  type AficionadoSelectorDTO,
} from "@/lib/api/business-metodos-pago-aficionado";
import { businessPartidosApi, type PartidoDTO } from "@/lib/api/business-partidos";

type Accion =
  | { tipo: "estado"; boleta: BoletaFila; estado: EstadoBoleta }
  | { tipo: "eliminar"; boleta: BoletaFila };

/** Un catálogo que falla (por ejemplo, sin permiso) queda vacío. */
const orEmpty = <T,>(promise: Promise<T[]>) => promise.catch(() => [] as T[]);

export default function BoletosPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/boletas", "POST");
  const canEdit = access.hasPermission("/boletas/{id}", "PATCH");
  const canDelete = access.hasPermission("/boletas/{id}", "DELETE");
  const { notify } = useToast();

  const [boletas, setBoletas] = useState<BoletaDTO[]>([]);
  const [aficionados, setAficionados] = useState<AficionadoSelectorDTO[]>([]);
  const [partidos, setPartidos] = useState<PartidoDTO[]>([]);
  const [localidades, setLocalidades] = useState<LocalidadDTO[]>([]);
  const [partidoFiltro, setPartidoFiltro] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useDisclosure();
  const confirmacion = useDisclosure<Accion>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lista, afics, parts, locs] = await Promise.all([
        businessBoletasApi.findAll(),
        orEmpty(businessMetodosPagoAficionadoApi.findAficionados()),
        orEmpty(businessPartidosApi.findAll()),
        orEmpty(businessLocalidadesApi.findAll()),
      ]);
      setBoletas(lista);
      setAficionados(afics);
      setPartidos(parts);
      setLocalidades(locs);
    } catch (caught) {
      setError(mensajeDeError(caught, "No se pudieron cargar las boletas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filas = useMemo<BoletaFila[]>(() => {
    const aficionadoPorId = new Map(aficionados.map((a) => [a.id, a]));
    const partidoPorId = new Map(partidos.map((p) => [p.id, p]));
    const localidadPorId = new Map(localidades.map((l) => [l.id, l.nombre]));
    const texto = query.trim().toLowerCase();
    return boletas
      .filter((b) => !partidoFiltro || b.partido_id === partidoFiltro)
      .map((b) => {
        const aficionado = aficionadoPorId.get(b.aficionado_id);
        const partido = partidoPorId.get(b.partido_id);
        return {
          ...b,
          aficionado: aficionado ? `${aficionado.nombre} · ${aficionado.documento}` : b.aficionado_id,
          partido: partido ? etiquetaPartido(partido) : b.partido_id,
          localidad: localidadPorId.get(b.localidad_id) ?? b.localidad_id,
        };
      })
      .filter((b) => !texto || b.aficionado.toLowerCase().includes(texto))
      .sort((a, b) => b.fecha_compra.localeCompare(a.fecha_compra));
  }, [boletas, aficionados, partidos, localidades, partidoFiltro, query]);

  const ejecutar = async (accion: Accion) => {
    try {
      if (accion.tipo === "eliminar") {
        await businessBoletasApi.remove(accion.boleta.id);
        setBoletas((actual) => actual.filter((b) => b.id !== accion.boleta.id));
        notify("Boleta eliminada.", "error");
      } else {
        const updated = await businessBoletasApi.update(accion.boleta.id, { estado: accion.estado });
        setBoletas((actual) => actual.map((b) => (b.id === updated.id ? updated : b)));
        notify(`Boleta marcada como ${ESTADO_BOLETA_LABEL[updated.estado].toLowerCase()}.`);
      }
    } catch (caught) {
      notify(mensajeDeError(caught, "No se pudo actualizar la boleta."), "error");
    }
  };

  const accion = confirmacion.payload;

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Boletos"
        description="Consulta las boletas de todos los aficionados, regístralas y gestiona su estado."
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
                Registrar boleta
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
          icon={<TicketCheck />}
          title="Boletas registradas"
          description={loading ? "Cargando boletas…" : `${filas.length} de ${boletas.length} boletas`}
          action={
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-64">
                <Select
                  aria-label="Filtrar por partido"
                  value={partidoFiltro}
                  onChange={(event) => setPartidoFiltro(event.target.value)}
                  options={[
                    { value: "", label: "Todos los partidos" },
                    ...partidos.map((p) => ({ value: p.id, label: etiquetaPartido(p) })),
                  ]}
                />
              </div>
              <SearchInput value={query} onChange={setQuery} placeholder="Buscar aficionado" />
            </div>
          }
        />
        <BoletosTable
          boletas={filas}
          onEstado={canEdit ? (boleta, estado) => confirmacion.open({ tipo: "estado", boleta, estado }) : undefined}
          onDelete={canDelete ? (boleta) => confirmacion.open({ tipo: "eliminar", boleta }) : undefined}
        />
      </Card>

      {canCreate && (
        <BoletoAdminFormModal
          open={form.isOpen}
          onClose={form.close}
          aficionados={aficionados}
          partidos={partidos}
          localidades={localidades}
          onSubmit={async (input) => {
            const created = await businessBoletasApi.create(input);
            setBoletas((actual) => [created, ...actual]);
            notify("Boleta registrada.");
          }}
        />
      )}

      {(canEdit || canDelete) && (
        <ConfirmDialog
          open={confirmacion.isOpen}
          onClose={confirmacion.close}
          tone={
            accion?.tipo === "eliminar" || (accion?.tipo === "estado" && accion.estado === "ANULADA")
              ? "danger"
              : "primary"
          }
          title={
            accion?.tipo === "estado"
              ? `Marcar boleta como ${ESTADO_BOLETA_LABEL[accion.estado].toLowerCase()}`
              : "Eliminar boleta"
          }
          confirmLabel={accion?.tipo === "estado" ? "Confirmar" : "Eliminar"}
          message={
            accion?.tipo === "estado"
              ? `La boleta de ${accion.boleta.aficionado} para ${accion.boleta.partido} pasará a ${ESTADO_BOLETA_LABEL[accion.estado].toLowerCase()}.`
              : `¿Eliminar la boleta de ${accion?.boleta.aficionado ?? ""}? Esta acción no se puede deshacer.`
          }
          onConfirm={async () => {
            if (accion) await ejecutar(accion);
          }}
        />
      )}
    </>
  );
}
