import { proxyBusinessRequest } from "@/lib/server/business-proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyBusinessRequest(
    request,
    `/jugadores/${encodeURIComponent(id)}/perfil`,
  );
}
