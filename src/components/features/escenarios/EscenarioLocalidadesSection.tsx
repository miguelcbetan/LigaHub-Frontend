"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Ticket, Trash2, TriangleAlert } from "lucide-react";
import {
  businessLocalidadesApi,
  type LocalidadDTO,
} from "@/lib/api/business-localidades";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/context/ToastContext";
import {
  LOCALIDAD_NOMBRE_MAX,
  esEnteroPositivo,
  esPrecioValido,
  formatearPrecio,
  mensajeDeError,
  porNombre,
} from "./escenario-utils";

interface EscenarioLocalidadesSectionProps {
  escenarioId: string;
  localidades: LocalidadDTO[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** Se invoca tras cada cambio guardado para refrescar el escenario. */
  onChange: () => void | Promise<void>;
}

interface Borrador {
  id?: string;
  nombre: string;
  capacidad: string;
  precio: string;
}

interface Errores {
  nombre?: string;
  capacidad?: string;
  precio?: string;
}

const VACIO: Borrador = { nombre: "", capacidad: "", precio: "" };

export function EscenarioLocalidadesSection({
  escenarioId,
  localidades,
  canCreate,
  canEdit,
  canDelete,
  onChange,
}: EscenarioLocalidadesSectionProps) {
  const { notify } = useToast();
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [formError, setFormError] = useState("");
  const [porEliminar, setPorEliminar] = useState<LocalidadDTO | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const ordenadas = [...localidades].sort(porNombre);

  const abrir = (localidad?: LocalidadDTO) => {
    setPorEliminar(null);
    setErrores({});
    setFormError("");
    setError("");
    setBorrador(
      localidad
        ? {
            id: localidad.id,
            nombre: localidad.nombre,
            capacidad: String(localidad.capacidad),
            precio: String(localidad.precio),
          }
        : VACIO,
    );
  };

  const validar = (datos: Borrador): Errores => {
    const encontrados: Errores = {};
    if (!datos.nombre.trim()) encontrados.nombre = "Ingresa el nombre de la localidad.";
    if (!esEnteroPositivo(datos.capacidad)) {
      encontrados.capacidad = "Debe ser un entero mayor o igual a 1.";
    }
    if (!esPrecioValido(datos.precio)) {
      encontrados.precio = "Debe ser mayor o igual a 0 y tener máximo 2 decimales.";
    }
    return encontrados;
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!borrador || saving) return;

    const encontrados = validar(borrador);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    const datos = {
      nombre: borrador.nombre.trim(),
      capacidad: Number(borrador.capacidad),
      precio: Number(borrador.precio),
    };
    setFormError("");
    setSaving(true);
    try {
      if (borrador.id) {
        await businessLocalidadesApi.update(borrador.id, datos);
        notify(`Localidad “${datos.nombre}” actualizada.`);
      } else {
        await businessLocalidadesApi.create({ ...datos, escenario_id: escenarioId });
        notify(`Localidad “${datos.nombre}” creada.`);
      }
      setBorrador(null);
      await onChange();
    } catch (caught) {
      setFormError(mensajeDeError(caught, "No se pudo guardar la localidad."));
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!porEliminar || saving) return;
    setSaving(true);
    setError("");
    try {
      await businessLocalidadesApi.remove(porEliminar.id);
      notify(`Localidad “${porEliminar.nombre}” eliminada.`, "error");
      setPorEliminar(null);
      await onChange();
    } catch (caught) {
      setError(mensajeDeError(caught, "No se pudo eliminar la localidad."));
      setPorEliminar(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      aria-labelledby="localidades-titulo"
      className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3
          id="localidades-titulo"
          className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          <Ticket className="size-4 text-co-blue" />
          Localidades ({localidades.length})
        </h3>
        {canCreate && !borrador && (
          <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => abrir()}>
            Nueva localidad
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm text-co-red">
          {error}
        </p>
      )}

      {ordenadas.length === 0 ? (
        <p className="text-sm text-zinc-500">Este escenario aún no tiene localidades.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {ordenadas.map((localidad) => {
            const vendidas = localidad.boletas?.length ?? 0;
            return (
              <li key={localidad.id} className="flex items-center gap-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {localidad.nombre}
                  </div>
                  <div className="text-zinc-500">
                    Capacidad {localidad.capacidad.toLocaleString("es-CO")} ·{" "}
                    {formatearPrecio(localidad.precio)} · {vendidas}{" "}
                    {vendidas === 1 ? "boleta vendida" : "boletas vendidas"}
                  </div>
                </div>
                {porEliminar?.id === localidad.id ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-zinc-500">¿Eliminar?</span>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={saving}
                      onClick={() => void eliminar()}
                    >
                      Eliminar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setPorEliminar(null)}>
                      No
                    </Button>
                  </div>
                ) : (
                  <div className="flex shrink-0 gap-0.5">
                    {canEdit && (
                      <IconButton
                        label={`Editar localidad ${localidad.nombre}`}
                        tone="blue"
                        onClick={() => abrir(localidad)}
                      >
                        <Pencil />
                      </IconButton>
                    )}
                    {canDelete && (
                      <IconButton
                        label={`Eliminar localidad ${localidad.nombre}`}
                        tone="red"
                        onClick={() => {
                          setBorrador(null);
                          setError("");
                          setPorEliminar(localidad);
                        }}
                      >
                        <Trash2 />
                      </IconButton>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {borrador && (
        <form
          aria-label={borrador.id ? "Editar localidad" : "Nueva localidad"}
          onSubmit={guardar}
          noValidate
          className="mt-4 space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
        >
          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2 text-sm text-co-red"
            >
              <TriangleAlert className="size-4 shrink-0" />
              {formError}
            </div>
          )}
          <Input
            label="Nombre de la localidad"
            placeholder="Ej. Oriental"
            maxLength={LOCALIDAD_NOMBRE_MAX}
            value={borrador.nombre}
            onChange={(event) => setBorrador({ ...borrador, nombre: event.target.value })}
            error={errores.nombre}
            autoFocus
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Capacidad"
              type="number"
              min={1}
              step={1}
              value={borrador.capacidad}
              onChange={(event) => setBorrador({ ...borrador, capacidad: event.target.value })}
              error={errores.capacidad}
            />
            <Input
              label="Precio"
              type="number"
              min={0}
              step="0.01"
              value={borrador.precio}
              onChange={(event) => setBorrador({ ...borrador, precio: event.target.value })}
              error={errores.precio}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setBorrador(null)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              {borrador.id ? "Guardar localidad" : "Crear localidad"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
