import { proxyBusinessRequest } from "@/lib/server/business-proxy";

/** Solo lectura: el formulario de partidos lista los escenarios por nombre. */
export function GET(request: Request) {
  return proxyBusinessRequest(request, "/escenarios");
}
