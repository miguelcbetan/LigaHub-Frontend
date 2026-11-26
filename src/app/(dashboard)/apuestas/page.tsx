"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Coins, Plus, RefreshCw } from "lucide-react";
import { ApuestaAdminFormModal } from "@/components/features/apuestas/ApuestaAdminFormModal";
import { ApuestasTable, type ApuestaFila } from "@/components/features/apuestas/ApuestasTable";
import { ESTADO_APUESTA_LABEL } from "@/components/features/apuestas/apuesta-utils";
import { etiquetaPartido, mensajeDeError } from "@/components/features/boletos/boleto-utils";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useAccess } from "@/lib/access";
import type { EstadoApuesta } from "@/lib/api/business-aficionados";
import { businessApuestasApi, type ApuestaDTO } from "@/lib/api/business-apuestas";
import {
  businessMetodosPagoAficionadoApi,
  type AficionadoSelectorDTO,
  type MetodoPagoAficionadoDTO,
} from "@/lib/api/business-metodos-pago-aficionado";
import { businessPartidosApi, type PartidoDTO } from "@/lib/api/business-partidos";

type Accion =
  | { tipo: "estado"; apuesta: ApuestaFila; estado: EstadoApuesta }
  | { tipo: "eliminar"; apuesta: ApuestaFila };

/** Un catálogo que falla (por ejemplo, sin permiso) queda vacío. */
const orEmpty = <T,>(promise: Promise<T[]>) => promise.catch(() => [] as T[]);

export default function ApuestasPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/apuestas", "POST");
  const canEdit = access.hasPermission("/apuestas/{id}", "PATCH");
  const canDelete = access.hasPermission("/apuestas/{id}", "DELETE");
  const { notify } = useToast();

  const [apuestas, setApuestas] = useState<ApuestaDTO[]>([]);
  const [aficionados, setAficionados] = useState<AficionadoSelectorDTO[]>([]);
  const [partidos, setPartidos] = useState<PartidoDTO[]>([]);
  const [metodos, setMetodos] = useState<MetodoPagoAficionadoDTO[]>([]);
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
      const [lista, afics, parts, mets] = await Promise.all([
        businessApuestasApi.findAll(),
        orEmpty(businessMetodosPagoAficionadoApi.findAficionados()),
        orEmpty(businessPartidosApi.findAll()),
        orEmpty(businessMetodosPagoAficionadoApi.findAll()),
      ]);
      setApuestas(lista);
      setAficionados(afics);
      setPartidos(parts);
      setMetodos(mets);
    } catch (caught) {
      setError(mensajeDeError(caught, "No se pudieron cargar las apuestas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filas = useMemo<ApuestaFila[]>(() => {
    const aficionadoPorId = new Map(aficionados.map((a) => [a.id, a]));
    const partidoPorId = new Map(partidos.map((p) => [p.id, p]));
    const texto = query.trim().toLowerCase();
    return apuestas
      .filter((a) => !partidoFiltro || a.partido_id === partidoFiltro)
      .map((a) => {
        const aficionado = aficionadoPorId.get(a.aficionado_id);
        const partido = partidoPorId.get(a.partido_id);
        return {
          ...a,
          aficionado: aficionado ? `${aficionado.nombre} · ${aficionado.documento}` : a.aficionado_id,
          partido: partido ? etiquetaPartido(partido) : a.partido_id,
        };
      })
      .filter((a) => !texto || a.aficionado.toLowerCase().includes(texto))
      .sort((a, b) => b.fecha_apuesta.localeCompare(a.fecha_apuesta));
  }, [apuestas, aficionados, partidos, partidoFiltro, query]);

  const ejecutar = async (accion: Accion) => {
    try {
      if (accion.tipo === "eliminar") {
        await businessApuestasApi.remove(accion.apuesta.id);
        setApuestas((actual) => actual.filter((a) => a.id !== accion.apuesta.id));
        notify("Apuesta eliminada.", "error");
      } else {
        const updated = await businessApuestasApi.update(accion.apuesta.id, { estado: accion.estado });
        setApuestas((actual) => actual.map((a) => (a.id === updated.id ? updated : a)));
        notify(`Apuesta marcada como ${ESTADO_APUESTA_LABEL[updated.estado].toLowerCase()}.`);
      }
    } catch (caught) {
      notify(mensajeDeError(caught, "No se pudo actualizar la apuesta."), "error");
    }
  };

  const accion = confirmacion.payload;

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Apuestas"
        description="Consulta las apuestas de todos los aficionados y liquídalas cuando termine el partido."
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
                Registrar apuesta
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
          icon={<Coins />}
          title="Apuestas registradas"
          description={loading ? "Cargando apuestas…" : `${filas.length} de ${apuestas.length} apuestas`}
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
        <ApuestasTable
          apuestas={filas}
          onEstado={canEdit ? (apuesta, estado) => confirmacion.open({ tipo: "estado", apuesta, estado }) : undefined}
          onDelete={canDelete ? (apuesta) => confirmacion.open({ tipo: "eliminar", apuesta }) : undefined}
        />
      </Card>

      {canCreate && (
        <ApuestaAdminFormModal
          open={form.isOpen}
          onClose={form.close}
          aficionados={aficionados}
          partidos={partidos}
          metodos={metodos}
          onSubmit={async (input) => {
            const created = await businessApuestasApi.create(input);
            setApuestas((actual) => [created, ...actual]);
            notify("Apuesta registrada.");
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
              ? `Marcar apuesta como ${ESTADO_APUESTA_LABEL[accion.estado].toLowerCase()}`
              : "Eliminar apuesta"
          }
          confirmLabel={accion?.tipo === "estado" ? "Confirmar" : "Eliminar"}
          message={
            accion?.tipo === "estado"
              ? `La apuesta de ${accion.apuesta.aficionado} para ${accion.apuesta.partido} pasará a ${ESTADO_APUESTA_LABEL[accion.estado].toLowerCase()}.`
              : `¿Eliminar la apuesta de ${accion?.apuesta.aficionado ?? ""}? Esta acción no se puede deshacer.`
          }
          onConfirm={async () => {
            if (accion) await ejecutar(accion);
          }}
        />
      )}
    </>
  );
}
