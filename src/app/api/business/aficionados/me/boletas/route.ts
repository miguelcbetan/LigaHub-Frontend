import { proxyBusinessRequest } from "@/lib/server/business-proxy";

/** HU-C: boletas del aficionado de la sesión (el token lo identifica). */
export function GET(request: Request) {
  return proxyBusinessRequest(request, "/aficionados/me/boletas");
}

export function POST(request: Request) {
  return proxyBusinessRequest(request, "/aficionados/me/boletas");
}
