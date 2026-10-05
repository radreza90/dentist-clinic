import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const { pathname } = request.nextUrl;
  const isPublicSite = !pathname.startsWith("/api/") && !pathname.startsWith("/admin") && !pathname.startsWith("/media");
  if (isPublicSite) requestHeaders.set("x-public-site", "1");
  else requestHeaders.delete("x-public-site");

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
