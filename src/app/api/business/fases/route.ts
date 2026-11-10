import { proxyBusinessRequest } from "@/lib/server/business-proxy";

const TIPOS_FASE = new Set(["GRUPOS", "FINAL"]);

export function GET(request: Request) {
  // Solo se reenvía el filtro `tipo` conocido; Business valida su valor.
  const tipo = new URL(request.url).searchParams.get("tipo");
  const query =
    tipo && TIPOS_FASE.has(tipo) ? `?tipo=${encodeURIComponent(tipo)}` : "";
  return proxyBusinessRequest(request, `/fases${query}`);
}

export function POST(request: Request) {
  return proxyBusinessRequest(request, "/fases");
}
