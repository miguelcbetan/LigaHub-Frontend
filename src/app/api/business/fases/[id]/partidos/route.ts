import { proxyBusinessRequest } from "@/lib/server/business-proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Partidos de una fase; Business indica si son de grupos o de la fase final. */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyBusinessRequest(
    request,
    `/fases/${encodeURIComponent(id)}/partidos`,
  );
}
