import { proxyBusinessRequest } from "@/lib/server/business-proxy";

/** HU-C: partidos programados con cupo por localidad y cuotas. */
export function GET(request: Request) {
  return proxyBusinessRequest(request, "/aficionados/me/partidos-disponibles");
}
