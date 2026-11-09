"use client";

import { useMemo } from "react";
import { useAuth, type SessionPermission } from "@/context/AuthContext";
import { moduleIdFromModel, resolveModuleId } from "@/lib/api/adapters";

/** Qué puede ver el usuario de la sesión según los permisos de sus roles. */
export interface Access {
  /** `true` si tiene al menos un permiso del módulo (p. ej. `m-usuarios`). */
  hasModule: (moduleId: string) => boolean;
  /** `true` si tiene algún permiso sobre esa URL (con `{id}` normalizado). */
  hasUrl: (url: string) => boolean;
  /** Comprueba el permiso exacto de URL + método HTTP. */
  hasPermission: (url: string, method: string) => boolean;
}

const normalizeUrl = (url: string) =>
  url.replace(/\{[^}]*\}/g, "{id}").replace(/\/+$/, "");

/** Mismo criterio que `adaptPermission`: `model` manda; sin él se deriva de la URL. */
const moduleOf = (permission: SessionPermission) =>
  permission.model?.trim()
    ? moduleIdFromModel(permission.model)
    : resolveModuleId(permission.url);

export function buildAccess(permissions: SessionPermission[]): Access {
  const modules = new Set(permissions.map(moduleOf));
  const urls = new Set(
    permissions.map((permission) => normalizeUrl(permission.url)),
  );
  const grants = new Set(
    permissions.map(
      (permission) =>
        `${permission.method.toUpperCase()} ${normalizeUrl(permission.url)}`,
    ),
  );

  return {
    hasModule: (moduleId) => modules.has(moduleId),
    hasUrl: (url) => urls.has(normalizeUrl(url)),
    hasPermission: (url, method) =>
      grants.has(`${method.toUpperCase()} ${normalizeUrl(url)}`),
  };
}

export function useAccess(): Access {
  const { user } = useAuth();
  return useMemo(
    () => buildAccess(user?.permissions ?? []),
    [user?.permissions],
  );
}
