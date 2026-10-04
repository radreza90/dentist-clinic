import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models";
import { verifyPassword, signAccessToken, signRefreshToken } from "@/lib/auth";
import { fail } from "@/lib/api";
import { setSessionCookies } from "@/lib/session";

const schema=z.object({email:z.string().trim().email(),password:z.string().min(8).max(128)});

export async function POST(req:Request){
  try{
    const parsed=schema.safeParse(await req.json());
    if(!parsed.success)return fail("Invalid login payload",422,parsed.error.flatten());
    await connectDB();
    const user=await UserModel.findOne({email:parsed.data.email,isActive:true});
    if(!user?.passwordHash||!(await verifyPassword(parsed.data.password,user.passwordHash)))return fail("Invalid credentials",401);
    const accessToken=await signAccessToken(String(user._id),user.role);
    const refreshToken=await signRefreshToken(String(user._id),user.role);
    await UserModel.updateOne({_id:user._id},{$set:{lastLoginAt:new Date()}});
    const response=NextResponse.json({success:true,data:{user:{id:user._id,email:user.email,role:user.role}}});
    setSessionCookies(response,accessToken,refreshToken);
    return response;
  }catch(e){return fail(e instanceof Error?e.message:"Login failed",500);}
}