"use client";

import { useState, type FormEvent } from "react";
import { Heart, TriangleAlert } from "lucide-react";
import type {
  ConvertirseAficionadoInput,
  EquipoDisponibleDTO,
} from "@/lib/api/business-aficionados";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Field";

interface ConvertirseAficionadoFormProps {
  equipos: EquipoDisponibleDTO[];
  /** Datos del usuario de la sesión para precargar el formulario. */
  nombreInicial?: string;
  emailInicial?: string;
  onSubmit: (input: ConvertirseAficionadoInput) => Promise<void>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mensajeDeError(caught: unknown): string {
  if (caught instanceof BusinessApiError && caught.status === 409) {
    return caught.message || "Ya existe un aficionado con ese documento o correo.";
  }
  return caught instanceof Error ? caught.message : "No se pudo completar el registro.";
}

export function ConvertirseAficionadoForm({
  equipos,
  nombreInicial = "",
  emailInicial = "",
  onSubmit,
}: ConvertirseAficionadoFormProps) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [documento, setDocumento] = useState("");
  const [email, setEmail] = useState(emailInicial);
  const [telefono, setTelefono] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const alternar = (id: string) =>
    setSeleccionados((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!nombre.trim() || !documento.trim() || !email.trim()) {
      setError("Completa tu nombre, documento y correo.");
      return;
    }
    if (!EMAIL.test(email.trim())) {
      setError("Ingresa un correo válido.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        documento: documento.trim(),
        email: email.trim(),
        ...(telefono.trim() ? { telefono: telefono.trim() } : {}),
        equipo_ids: equipos.filter(({ id }) => seleccionados.has(id)).map(({ id }) => id),
      });
    } catch (caught) {
      setError(mensajeDeError(caught));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red"
        >
          <TriangleAlert className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          value={nombre}
          maxLength={150}
          onChange={(event) => setNombre(event.target.value)}
          required
        />
        <Input
          label="Documento"
          value={documento}
          maxLength={20}
          onChange={(event) => setDocumento(event.target.value)}
          required
        />
        <Input
          label="Correo"
          type="email"
          value={email}
          maxLength={150}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="Teléfono (opcional)"
          value={telefono}
          maxLength={20}
          onChange={(event) => setTelefono(event.target.value)}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Equipos que quieres seguir
        </legend>
        {equipos.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No hay equipos disponibles por ahora. Podrás agregarlos más adelante.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {equipos.map((equipo) => (
              <Checkbox
                key={equipo.id}
                label={equipo.nombre}
                checked={seleccionados.has(equipo.id)}
                onChange={() => alternar(equipo.id)}
                size="sm"
              />
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" leftIcon={<Heart className="size-4" />} loading={submitting}>
          Convertirme en aficionado
        </Button>
      </div>
    </form>
  );
}
