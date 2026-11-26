import { proxyBusinessRequest } from "@/lib/server/business-proxy";

/** El formulario de partidos y la gestión de escenarios (HU-A) listan escenarios. */
export function GET(request: Request) {
  return proxyBusinessRequest(request, "/escenarios");
}

export function POST(request: Request) {
  return proxyBusinessRequest(request, "/escenarios");
}
