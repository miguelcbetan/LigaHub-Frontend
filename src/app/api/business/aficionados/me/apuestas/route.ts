import { proxyBusinessRequest } from "@/lib/server/business-proxy";

/** HU-C: apuestas del aficionado de la sesión (el token lo identifica). */
export function GET(request: Request) {
  return proxyBusinessRequest(request, "/aficionados/me/apuestas");
}

export function POST(request: Request) {
  return proxyBusinessRequest(request, "/aficionados/me/apuestas");
}
