import { proxyBusinessRequest } from "@/lib/server/business-proxy";

const FILTROS = ["habilidad_id", "jugador_id"] as const;

export function GET(request: Request) {
  // Solo se reenvían los filtros conocidos; Business valida que sean UUID.
  const params = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const filtro of FILTROS) {
    const value = params.get(filtro);
    if (value) query.set(filtro, value);
  }
  const search = query.toString();
  return proxyBusinessRequest(
    request,
    `/habilidad-jugador${search ? `?${search}` : ""}`,
  );
}

export function POST(request: Request) {
  return proxyBusinessRequest(request, "/habilidad-jugador");
}
