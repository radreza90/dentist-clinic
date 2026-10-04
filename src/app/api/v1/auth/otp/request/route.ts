import { randomInt } from "node:crypto";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { OtpCodeModel } from "@/models";
import { hashPassword } from "@/lib/auth";
import { sendSms } from "@/lib/sms";
import { fail, ok } from "@/lib/api";

const input=z.object({
  phone:z.string().trim().min(10).max(20),
  purpose:z.enum(["booking","login","register"]).default("booking"),
});

function normalizePhone(value:string){
  return value.replace(/[۰-۹]/g,(d)=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^d+]/g,"");
}

export async function POST(req:Request){
  try{
    const p=input.safeParse(await req.json());
    if(!p.success)return fail("Invalid OTP request",422,p.error.flatten());
    const phone=normalizePhone(p.data.phone);
    if(phone.replace("+","").length<10)return fail("Invalid phone number",422);

    await connectDB();
    const windowStart=new Date(Date.now()-10*60*1000);
    const recent=await OtpCodeModel.countDocuments({phone,purpose:p.data.purpose,createdAt:{$gte:windowStart}});
    if(recent>=5)return fail("Too many OTP requests. Try again later.",429);

    const code=String(randomInt(100000,1000000));
    const codeHash=await hashPassword(code);
    const expiresAt=new Date(Date.now()+5*60*1000);
    await OtpCodeModel.create({phone,codeHash,purpose:p.data.purpose,expiresAt});
    await sendSms(phone,`کد تأیید کلینیک: ${code}`);
    return ok({expiresAt});
  }catch(e){return fail(e instanceof Error?e.message:"Unable to send OTP",500);}
}