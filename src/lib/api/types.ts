/**
 * Tipos espejo de los DTOs de ms-security.
 *
 * Los nombres de campo son EXACTAMENTE los que serializa el backend:
 * no renombrar, no agregar campos que no existan. La traducción a los tipos
 * de dominio del frontend (`@/types`) vive en `adapters.ts`.
 *
 * Los ids del backend son `Long` → aquí son `number`.
 */

// --- Autenticación ---

/**
 * Respuesta de login, verificación 2FA y acceso OAuth. No incluye usuario ni roles.
 * Si `twoFactorRequired` es true todavía NO hay sesión: solo viene el desafío.
 */
export interface AuthResponseDTO {
  /** null mientras el segundo factor está pendiente. */
  accessToken: string | null;
  /** "Bearer" cuando hay sesión. */
  tokenType: string | null;
  /** ISO-8601 con zona: vencimiento de la sesión o del desafío 2FA. */
  expiresAt: string;
  twoFactorRequired: boolean;
  challengeId: string | null;
}

export interface TwoFactorVerifyRequestDTO {
  challengeId: string;
  code: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

/** Claims que emite JwtService. `sub` es el id numérico del usuario en string. */
export interface JwtPayload {
  iss?: string;
  sub?: string;
  email?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

/** Respuesta de GET /api/auth/me: solo exige token, sin permiso asignado. */
export interface CurrentUserResponseDTO {
  id: number;
  name: string;
  email: string;
  /** Data-URL de la foto de perfil; null si no tiene. */
  photoUrl: string | null;
  roles: string[];
  permissions: PermissionResponseDTO[];
  twoFactorEnabled: boolean;
  /** LOCAL (correo y contraseña) u OAUTH (proveedor externo). */
  authMethod: "LOCAL" | "OAUTH";
}

// --- Usuarios ---

export interface UserResponseDTO {
  id: number;
  name: string;
  email: string;
  /** false = desactivado: no puede iniciar sesión ni usar la API. */
  active: boolean;
}

export interface UpdateUserStatusDTO {
  active: boolean;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  name: string;
  email: string;
  /** Opcional: el backend solo re-encripta si llega no vacío. */
  password?: string;
}

/** GET /api/users/{id}/profile — `profile` es null si el usuario no tiene perfil. */
export interface UserDetailResponseDTO extends UserResponseDTO {
  profile: ProfileResponseDTO | null;
}

export interface UserSessionsResponseDTO extends UserResponseDTO {
  sessions: SessionResponseDTO[];
}

export interface UserRolesResponseDTO extends UserResponseDTO {
  roles: UserRoleResponseDTO[];
}

// --- Perfiles ---

export interface ProfileResponseDTO {
  id: number;
  phone: string;
  /** ISO local date, ej. "1999-05-20". */
  birthDate: string;
  /** Imagen como data-URL; null si no hay fotografía. */
  photoUrl: string | null;
}

export interface ProfileRequestDTO {
  phone: string;
  /** Obligatorio y en el pasado (@NotNull @Past en el backend). */
  birthDate: string;
  /** Data-URL PNG/JPEG/WebP. Omitido = conservar la actual; "" = quitarla. */
  photoUrl?: string;
}

// --- Roles ---

export interface RoleResponseDTO {
  id: number;
  name: string;
  description: string;
}

export interface RoleRequestDTO {
  name: string;
  description: string;
}

export interface RolePermissionsResponseDTO extends RoleResponseDTO {
  permissions: RolePermissionResponseDTO[];
}

// --- Permisos ---

export interface PermissionResponseDTO {
  id: number;
  url: string;
  method: string;
  /** Entidad de dominio a la que pertenece el permiso, ej. "User". Vacío en filas antiguas. */
  model: string;
}

export interface PermissionRequestDTO {
  url: string;
  method: string;
  /** Obligatorio (@NotBlank, máx. 255). */
  model: string;
}

// --- Relaciones usuario-rol ---

/** GET /api/user-roles y /api/user-roles/users/{userId}. */
export interface UserRoleResponseDTO {
  id: number;
  userId: number;
  role: RoleResponseDTO;
}

/** GET /api/user-roles/roles/{roleId} — ojo: aquí viene `user`, no `role`. */
export interface RoleUserResponseDTO {
  id: number;
  roleId: number;
  user: UserResponseDTO;
}

export interface AssignRoleRequestDTO {
  userId: number;
  roleId: number;
}

// --- Relaciones rol-permiso ---

/** GET /api/role-permissions y /api/role-permissions/roles/{roleId}. */
export interface RolePermissionResponseDTO {
  id: number;
  roleId: number;
  permission: PermissionResponseDTO;
}

/** GET /api/role-permissions/permissions/{permissionId}. */
export interface PermissionRoleResponseDTO {
  id: number;
  permissionId: number;
  role: RoleResponseDTO;
}

export interface AssignPermissionRequestDTO {
  roleId: number;
  permissionId: number;
}

// --- Sesiones ---

export interface SessionResponseDTO {
  id: number;
  token: string;
  /** ISO local date-time, ej. "2026-12-31T23:59:59". */
  expiration: string;
  code2FA: string | null;
}

export interface SessionRequestDTO {
  token: string;
  expiration: string;
  code2FA?: string;
}

// --- Errores ---

/** Forma que devuelve GlobalExceptionHandler para ApplicationException. */
export interface ApplicationErrorBody {
  errorCase: string;
  message: string | null;
}
