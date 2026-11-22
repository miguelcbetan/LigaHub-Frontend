import { proxyBusinessRequest } from "@/lib/server/business-proxy";

export function GET(request: Request) {
  // Solo se reenvía el filtro conocido; Business valida que sea UUID.
  const partidoId = new URL(request.url).searchParams.get("partido_id");
  const query = partidoId
    ? `?${new URLSearchParams({ partido_id: partidoId }).toString()}`
    : "";
  return proxyBusinessRequest(request, `/anotaciones${query}`);
}

export function POST(request: Request) {
  return proxyBusinessRequest(request, "/anotaciones");
}
