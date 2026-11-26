import { proxyBusinessRequest } from "@/lib/server/business-proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function proxyMetodo(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyBusinessRequest(request, `/aficionados/me/metodos-pago/${encodeURIComponent(id)}`);
}

export const PATCH = proxyMetodo;
export const DELETE = proxyMetodo;
