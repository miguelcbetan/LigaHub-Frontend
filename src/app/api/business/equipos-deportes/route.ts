import { proxyBusinessRequest } from "@/lib/server/business-proxy";

export function GET(request: Request) {
  // Solo se reenvía el filtro `equipo_id`; Business valida que sea un UUID.
  const equipoId = new URL(request.url).searchParams.get("equipo_id");
  const query = equipoId ? `?equipo_id=${encodeURIComponent(equipoId)}` : "";
  return proxyBusinessRequest(request, `/equipos-deportes${query}`);
}

export function POST(request: Request) {
  return proxyBusinessRequest(request, "/equipos-deportes");
}
