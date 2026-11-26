import { proxyBusinessRequest } from "@/lib/server/business-proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function proxyMetodo(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyBusinessRequest(request, `/metodos-pago-aficionado/${encodeURIComponent(id)}`);
}

export const GET = proxyMetodo;
export const PATCH = proxyMetodo;
export const DELETE = proxyMetodo;
