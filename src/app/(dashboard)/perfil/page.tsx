"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { describeError } from "@/lib/api/http";
import { profilesApi } from "@/lib/api/profiles";
import type { UserDetailResponseDTO } from "@/lib/api/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProfileForm } from "@/components/features/users/ProfileForm";
import { TwoFactorSettings } from "@/components/features/users/TwoFactorSettings";

/**
 * Perfil del usuario autenticado (teléfono, fecha y fotografía).
 * Usa /api/profile/me: el backend identifica al usuario por su token, así que
 * la pantalla funciona con cualquier rol y nunca maneja ids ajenos.
 */
export default function PerfilPage() {
  const { refresh } = useData();
  const { refreshUser } = useAuth();
  const { notify } = useToast();

  const [detail, setDetail] = useState<UserDetailResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();

  useEffect(() => {
    let active = true;

    profilesApi
      .findMine()
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch((error) => {
        if (active) setLoadError(describeError(error, "No se pudo cargar tu perfil."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const me = useMemo<User | null>(
    () =>
      detail && {
        id: String(detail.id),
        name: detail.name,
        email: detail.email,
        phone: detail.profile?.phone ?? "",
        avatarUrl: detail.profile?.photoUrl ?? undefined,
        roleIds: [],
        status: "activo",
        createdAt: "",
      },
    [detail],
  );

  return (
    <>
      <PageHeader
        title="Mi perfil"
        description="Actualiza tu número de contacto y tu foto para el álbum del equipo."
      />
      {me && detail ? (
        <ProfileForm
          user={me}
          birthDate={detail.profile?.birthDate ?? ""}
          onSave={async (patch) => {
            const saved = await profilesApi.saveMine({
              phone: patch.phone.trim(),
              birthDate: patch.birthDate,
              // "" le indica al backend que quite la fotografía.
              photoUrl: patch.avatarUrl ?? "",
            });
            setDetail((current) => current && { ...current, profile: saved });
            notify("Perfil actualizado. ¡Listo para el partido!");
            // Mantiene al día los listados y el avatar del topbar.
            void refresh();
            void refreshUser();
          }}
        />
      ) : loading ? (
        <EmptyState title="Cargando tu perfil…" description="Consultando los datos en el servidor." />
      ) : (
        <EmptyState
          title="Perfil no disponible"
          description={loadError ?? "No pudimos leer tu perfil. Verifica que tu rol tenga permiso de consulta."}
        />
      )}
      <TwoFactorSettings />
    </>
  );
}
