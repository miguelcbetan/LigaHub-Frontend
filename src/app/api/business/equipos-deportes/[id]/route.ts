import { proxyBusinessRequest } from "@/lib/server/business-proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyBusinessRequest(
    request,
    `/equipos-deportes/${encodeURIComponent(id)}`,
  );
}
