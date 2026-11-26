import { proxyBusinessRequest } from "@/lib/server/business-proxy";

export function GET(request: Request) {
  return proxyBusinessRequest(request, "/metodos-pago-aficionado");
}

export function POST(request: Request) {
  return proxyBusinessRequest(request, "/metodos-pago-aficionado");
}
