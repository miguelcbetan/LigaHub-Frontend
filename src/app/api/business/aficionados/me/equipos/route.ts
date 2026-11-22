import { proxyBusinessRequest } from "@/lib/server/business-proxy";

export function POST(request: Request) {
  return proxyBusinessRequest(request, "/aficionados/me/equipos");
}
