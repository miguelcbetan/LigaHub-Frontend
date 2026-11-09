const BUSINESS_API_BASE_URL = (
  process.env.BUSINESS_API_BASE_URL ?? "http://localhost:3030"
).replace(/\/+$/, "");

export async function proxyBusinessRequest(
  request: Request,
  resourcePath: string,
): Promise<Response> {
  try {
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const headers = new Headers();
    const authorization = request.headers.get("authorization");
    if (authorization) headers.set("Authorization", authorization);
    if (hasBody) {
      headers.set(
        "Content-Type",
        request.headers.get("content-type") ?? "application/json",
      );
    }

    const upstream = await fetch(`${BUSINESS_API_BASE_URL}${resourcePath}`, {
      method: request.method,
      headers,
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
    });
    const body = await upstream.text();
    const contentType = upstream.headers.get("content-type");

    return new Response(body || null, {
      status: upstream.status,
      headers: contentType ? { "Content-Type": contentType } : undefined,
    });
  } catch {
    return Response.json(
      { message: "No fue posible conectar con el microservicio de torneos." },
      { status: 502 },
    );
  }
}
