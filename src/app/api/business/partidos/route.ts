import { proxyBusinessRequest } from "@/lib/server/business-proxy";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const filtro of ["fase_id", "torneo_id"] as const) {
    const value = params.get(filtro);
    if (value) query.set(filtro, value);
  }
  const search = query.toString();
  return proxyBusinessRequest(request, `/partidos${search ? `?${search}` : ""}`);
}

export function POST(request: Request) {
  return proxyBusinessRequest(request, "/partidos");
}
