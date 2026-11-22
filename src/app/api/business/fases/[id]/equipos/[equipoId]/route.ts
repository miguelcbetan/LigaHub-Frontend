import { proxyBusinessRequest } from "@/lib/server/business-proxy";

interface RouteContext {
  params: Promise<{ id: string; equipoId: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id, equipoId } = await context.params;
  return proxyBusinessRequest(
    request,
    `/fases/${encodeURIComponent(id)}/equipos/${encodeURIComponent(equipoId)}`,
  );
}
