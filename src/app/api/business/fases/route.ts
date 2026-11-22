import { proxyBusinessRequest } from "@/lib/server/business-proxy";

const TIPOS_FASE = new Set(["GRUPOS", "FINAL"]);

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  const tipo = params.get("tipo");
  const torneoId = params.get("torneo_id");
  if (tipo && TIPOS_FASE.has(tipo)) query.set("tipo", tipo);
  if (torneoId) query.set("torneo_id", torneoId);
  const numeroOrden = params.get("numero_orden");
  if (numeroOrden && /^\d+$/.test(numeroOrden)) {
    query.set("numero_orden", numeroOrden);
  }
  const search = query.toString();
  return proxyBusinessRequest(
    request,
    `/fases${search ? `?${search}` : ""}`,
  );
}

export function POST(request: Request) {
  return proxyBusinessRequest(request, "/fases");
}
