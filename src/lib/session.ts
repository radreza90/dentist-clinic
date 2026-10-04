import type { NextResponse } from "next/server";

export const ACCESS_COOKIE_MAX_AGE=15*60;
export const REFRESH_COOKIE_MAX_AGE=30*24*60*60;

const base={
  httpOnly:true,
  secure:process.env.NODE_ENV==="production",
  sameSite:"lax" as const,
  path:"/",
};

export function setSessionCookies(response:NextResponse,accessToken:string,refreshToken:string){
  response.cookies.set("access_token",accessToken,{...base,maxAge:ACCESS_COOKIE_MAX_AGE});
  response.cookies.set("refresh_token",refreshToken,{...base,maxAge:REFRESH_COOKIE_MAX_AGE});
}

export function clearSessionCookies(response:NextResponse){
  response.cookies.set("access_token","",{...base,maxAge:0});
  response.cookies.set("refresh_token","",{...base,maxAge:0});
}
