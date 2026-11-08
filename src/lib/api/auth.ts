import { request } from "./http";
import type {
  AuthResponseDTO,
  CreateUserDTO,
  CurrentUserResponseDTO,
  LoginRequestDTO,
  PasswordRecoveryResponseDTO,
  TwoFactorVerifyRequestDTO,
  UserResponseDTO,
} from "./types";

/** Rutas de autenticación de ms-security (login, 2FA, OAuth, logout) y registro (POST /api/users). */
export const authApi = {
  /** POST /api/users → 201. Registro sin sesión: el usuario queda con el rol inicial. */
  register(payload: CreateUserDTO) {
    return request<UserResponseDTO>("/api/users", { method: "POST", body: payload, skipAuth: true });
  },

  /** GET /api/auth/me — identidad, roles y permisos del usuario del token. */
  me() {
    return request<CurrentUserResponseDTO>("/api/auth/me");
  },

  /** POST /api/auth/login — devuelve la sesión o, con 2FA activo, solo el desafío. */
  login(credentials: LoginRequestDTO) {
    return request<AuthResponseDTO>("/api/auth/login", {
      method: "POST",
      body: credentials,
      skipAuth: true,
    });
  },

  /** POST /api/auth/2fa/verify — completa el acceso con el código recibido por correo. */
  verifyTwoFactor(payload: TwoFactorVerifyRequestDTO) {
    return request<AuthResponseDTO>("/api/auth/2fa/verify", {
      method: "POST",
      body: payload,
      skipAuth: true,
    });
  },

  /** POST /api/auth/password-recovery — solicita un enlace sin revelar si el correo existe. */
  requestPasswordRecovery(email: string) {
    return request<PasswordRecoveryResponseDTO>("/api/auth/password-recovery", {
      method: "POST",
      body: { email },
      skipAuth: true,
    });
  },

  /** POST /api/auth/password-reset — cambia la contraseña usando el token del enlace. */
  resetPassword(token: string, password: string) {
    return request<void>("/api/auth/password-reset", {
      method: "POST",
      body: { token, password },
      skipAuth: true,
    });
  },

  /** POST /api/auth/oauth — el backend verifica el ID token de Firebase (Google, GitHub o Microsoft). */
  oauthLogin(idToken: string) {
    return request<AuthResponseDTO>("/api/auth/oauth", {
      method: "POST",
      body: { idToken },
      skipAuth: true,
    });
  },

  /** POST /api/auth/logout — revoca la sesión del token actual. */
  logout() {
    return request<void>("/api/auth/logout", { method: "POST" });
  },

  /** PUT /api/auth/2fa-settings — activa o desactiva el segundo factor propio. */
  setTwoFactor(enabled: boolean) {
    return request<void>("/api/auth/2fa-settings", { method: "PUT", body: { enabled } });
  },
};
