import { NextRequest, NextResponse } from "next/server";
import { signAccessToken, verifyAccessToken, verifyRefreshToken } from "@/lib/auth-token";
import { ACCESS_COOKIE_MAX_AGE } from "@/lib/session";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") return NextResponse.next();

  const accessToken=request.cookies.get("access_token")?.value;
  const refreshToken=request.cookies.get("refresh_token")?.value;

  if(accessToken){
    try{
      const auth=await verifyAccessToken(accessToken);
      if(auth.sub&&auth.role&&auth.role!=="patient")return NextResponse.next();
    }catch{
      // Try refresh below.
    }
  }

  if(refreshToken){
    try{
      const auth=await verifyRefreshToken(refreshToken);
      if(!auth.sub||!auth.role||auth.role==="patient")throw new Error("Not authorized");
      const access=await signAccessToken(String(auth.sub),String(auth.role));
      const response=NextResponse.next();
      response.cookies.set("access_token",access,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:"lax",
        path:"/",
        maxAge:ACCESS_COOKIE_MAX_AGE,
      });
      return response;
    }catch{
      // Redirect below.
    }
  }

  const response=NextResponse.redirect(new URL("/admin/login",request.url));
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  return response;
}

export const config={matcher:["/admin/:path*"]};
