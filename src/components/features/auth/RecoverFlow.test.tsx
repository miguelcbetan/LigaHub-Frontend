import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/http";
import { RecoverFlow } from "./RecoverFlow";

const { requestPasswordRecovery, resetPassword } = vi.hoisted(() => ({
  requestPasswordRecovery: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
  authApi: { requestPasswordRecovery, resetPassword },
}));

function openRecoveryPage(search = "") {
  window.history.replaceState({}, "", `/recuperar${search}`);
  return render(<RecoverFlow />);
}

function fillResetForm(password = "Cancha2026!") {
  fireEvent.change(screen.getByLabelText("Nueva contraseña", { exact: true }), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña", { exact: true }), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Restablecer contraseña" }));
}

describe("RecoverFlow", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/recuperar");
  });

  it("solicita un enlace y muestra el mensaje genérico devuelto por el backend", async () => {
    requestPasswordRecovery.mockResolvedValue({
      message: "Si el correo está registrado, recibirás instrucciones.",
    });
    openRecoveryPage();

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "capitan@futbolapp.co" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar enlace de recuperación" }));

    expect(await screen.findByText("Si el correo está registrado, recibirás instrucciones.")).toBeTruthy();
    expect(requestPasswordRecovery).toHaveBeenCalledWith("capitan@futbolapp.co");
  });

  it("abre el formulario de nueva contraseña cuando recibe un token en la URL", async () => {
    openRecoveryPage("?token=reset-token-123");

    expect(await screen.findByLabelText("Nueva contraseña", { exact: true })).toBeTruthy();
    expect(screen.queryByLabelText("Correo electrónico")).toBeNull();
  });

  it("valida la política de contraseña antes de llamar al backend", async () => {
    openRecoveryPage("?token=reset-token");
    await screen.findByLabelText("Nueva contraseña", { exact: true });

    fillResetForm("Abcdefg1#");

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("envía el token y contraseña y presenta éxito cuando el backend responde 204", async () => {
    resetPassword.mockResolvedValue(undefined);
    openRecoveryPage("?token=reset-token-123");
    await screen.findByLabelText("Nueva contraseña", { exact: true });

    fillResetForm();

    expect(await screen.findByText("¡Contraseña actualizada!")).toBeTruthy();
    expect(resetPassword).toHaveBeenCalledWith("reset-token-123", "Cancha2026!");
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toBeTruthy();
  });

  it("permite solicitar otro enlace cuando el token expiró o es inválido", async () => {
    resetPassword.mockRejectedValue(new ApiError(400, "El token de recuperación expiró."));
    openRecoveryPage("?token=expired-token");
    await screen.findByLabelText("Nueva contraseña", { exact: true });

    fillResetForm();

    fireEvent.click(await screen.findByRole("button", { name: "Solicitar otro enlace" }));
    expect(await screen.findByLabelText("Correo electrónico")).toBeTruthy();
    expect(resetPassword).toHaveBeenCalledWith("expired-token", "Cancha2026!");
  });

  it("muestra los errores de red al solicitar recuperación", async () => {
    requestPasswordRecovery.mockRejectedValue(new ApiError(0, "No se pudo contactar el servidor."));
    openRecoveryPage();

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "capitan@futbolapp.co" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar enlace de recuperación" }));

    await waitFor(() => {
      expect(screen.getByText("No se pudo contactar el servidor.")).toBeTruthy();
    });
    expect(screen.getByLabelText("Correo electrónico")).toBeTruthy();
  });

  it("muestra los errores de red al restablecer la contraseña", async () => {
    resetPassword.mockRejectedValue(new ApiError(0, "No se pudo contactar el servidor."));
    openRecoveryPage("?token=reset-token");
    await screen.findByLabelText("Nueva contraseña", { exact: true });

    fillResetForm();

    expect(await screen.findByText("No se pudo contactar el servidor.")).toBeTruthy();
    expect(screen.getByLabelText("Nueva contraseña", { exact: true })).toBeTruthy();
  });
});
