import { expect, it } from "vitest";
import { validarReferencia } from "./metodo-pago-utils";

it.each(["**** 4242", "***-***-4567", "Nequi ***1234", "*".repeat(30)])(
  "acepta la referencia enmascarada %s",
  (referencia) => expect(validarReferencia(referencia)).toBeUndefined(),
);

it.each(["", "   ", "*".repeat(31), "Cuenta 12345", "4111 1111 1111 1111"])(
  "rechaza la referencia inválida %s",
  (referencia) => expect(validarReferencia(referencia)).toBeTruthy(),
);
