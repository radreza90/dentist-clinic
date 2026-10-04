import { z } from "zod";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models";
import { signAccessToken, verifyOtpVerificationToken } from "@/lib/auth";
import { fail } from "@/lib/api";

const input=z.object({verificationToken:z.string().min(20),phone:z.string().trim().min(10).max(20),name:z.string().trim().max(120).optional()});
function normalizePhone(value:string){return value.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d+]/g,"");}

export async function POST(req:Request){
  try{
    const p=input.safeParse(await req.json());if(!p.success)return fail("Invalid OTP login payload",422,p.error.flatten());
    const phone=normalizePhone(p.data.phone);const verification=await verifyOtpVerificationToken(p.data.verificationToken);
    if(verification.purpose!=="login"||verification.phone!==phone)return fail("OTP verification does not match the phone number",403);
    await connectDB();
    const user=await UserModel.findOneAndUpdate(
      {phone},
      {$set:{isActive:true,...(p.data.name?{firstName:p.data.name}:{})},$setOnInsert:{role:"patient"}},
      {upsert:true,new:true,setDefaultsOnInsert:true}
    ).lean();
    const token=await signAccessToken(String(user._id),String(user.role));
    const response=NextResponse.json({success:true,data:{user:{id:user._id,phone:user.phone,role:user.role}}});
    response.cookies.set("access_token",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*7});
    return response;
  }catch(e){return fail(e instanceof Error?e.message:"OTP login failed",500);}
}