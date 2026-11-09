import { proxyBusinessRequest } from "@/lib/server/business-proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function forward(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyBusinessRequest(request, `/torneos/${encodeURIComponent(id)}`);
}

export function GET(request: Request, context: RouteContext) {
  return forward(request, context);
}

export function PATCH(request: Request, context: RouteContext) {
  return forward(request, context);
}

export function DELETE(request: Request, context: RouteContext) {
  return forward(request, context);
}
