import { proxyBusinessRequest } from "@/lib/server/business-proxy";

interface RouteContext {
  params: Promise<{ equipoId: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  const { equipoId } = await context.params;
  return proxyBusinessRequest(
    request,
    `/aficionados/me/equipos/${encodeURIComponent(equipoId)}`,
  );
}
