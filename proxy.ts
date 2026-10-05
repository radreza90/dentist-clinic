import { NextRequest, NextResponse } from "next/server";

async function resolveRedirect(request: NextRequest) {
  if (!["GET", "HEAD"].includes(request.method)) return null;
  const url = new URL("/api/v1/redirect", request.url);
  url.searchParams.set("from", request.nextUrl.pathname);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "x-redirect-resolver": "1" },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const payload = await response.json();
    if (!payload?.success || !payload.data?.to) return null;

    const target = new URL(String(payload.data.to), request.url);
    const statusCode = payload.data.statusCode === 302 ? 302 : 301;
    return NextResponse.redirect(target, statusCode);
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isInternal = pathname.startsWith("/api/") || pathname.startsWith("/admin") || pathname.startsWith("/media");

  if (!isInternal) {
    const redirect = await resolveRedirect(request);
    if (redirect) return redirect;
  }

  const requestHeaders = new Headers(request.headers);
  if (!isInternal) requestHeaders.set("x-public-site", "1");
  else requestHeaders.delete("x-public-site");

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
