import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: { path?: string[] } };
const hopByHop = ["host", "connection", "content-length", "transfer-encoding", "keep-alive", "upgrade", "proxy-authenticate", "proxy-authorization", "te", "trailer"];

async function proxy(req: NextRequest, { params }: RouteContext) {
  const base = (process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000").replace(/\/+$/, "").replace(/\/api\/v1$/, "");
  const path = (params.path || []).map(encodeURIComponent).join("/");
  const headers = new Headers(req.headers);
  hopByHop.forEach((name) => headers.delete(name));
  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer();
  try {
    const response = await fetch(`${base}/api/v1/${path}${req.nextUrl.search}`, {
      method: req.method, headers, body, cache: "no-store", redirect: "manual",
      signal: AbortSignal.timeout(120_000),
    });
    const responseHeaders = new Headers(response.headers);
    hopByHop.forEach((name) => responseHeaders.delete(name));
    responseHeaders.delete("content-encoding");
    const data = req.method === "HEAD" || [204, 304].includes(response.status) ? null : await response.arrayBuffer();
    return new NextResponse(data, { status: response.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ detail: "The backend is unavailable. Please retry when the service is running." }, { status: 503 });
  }
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
