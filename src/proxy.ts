import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth-token";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get("access_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/admin/login", request.url));

  try {
    const auth = await verifyAccessToken(token);
    if (!auth.sub || !auth.role || auth.role === "patient") throw new Error("Not authorized");
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete("access_token");
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};