import { proxyBusinessRequest } from "@/lib/server/business-proxy";

export function GET(request: Request) {
  return proxyBusinessRequest(request, "/jugadores");
}

export function POST(request: Request) {
  return proxyBusinessRequest(request, "/jugadores");
}
