import { NextResponse } from "next/server";
import { UserModel } from "@/models";
import { connectDB } from "@/lib/db";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth";
import { fail } from "@/lib/api";
import { setSessionCookies } from "@/lib/session";

function cookieValue(header:string|null,name:string){
  if(!header)return null;
  const part=header.split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="));
  return part?decodeURIComponent(part.slice(name.length+1)):null;
}

export async function POST(req:Request){
  try{
    const refreshToken=cookieValue(req.headers.get("cookie"),"refresh_token");
    if(!refreshToken)return fail("Refresh token required",401);
    const payload=await verifyRefreshToken(refreshToken);
    if(!payload.sub||typeof payload.role!=="string")return fail("Invalid refresh token",401);

    await connectDB();
    const user=await UserModel.findById(payload.sub).select("_id role isActive").lean();
    if(!user||!user.isActive)return fail("User not found",401);
    if(String(user.role)!==payload.role)return fail("Session role changed",401);

    const accessToken=await signAccessToken(String(user._id),user.role);
    const nextRefresh=await signRefreshToken(String(user._id),user.role);
    const response=NextResponse.json({success:true,data:{user:{id:user._id,role:user.role}}});
    setSessionCookies(response,accessToken,nextRefresh);
    return response;
  }catch(e){return fail(e instanceof Error?e.message:"Unable to refresh session",401);}
}