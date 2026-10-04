import { z } from "zod";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AppointmentModel, PaymentModel, ScheduleExceptionModel, ScheduleModel, ServiceModel, SiteSettingsModel, UserModel } from "@/models";
import { signAccessToken, verifyOtpVerificationToken } from "@/lib/auth";
import { fail } from "@/lib/api";
import { weekdayForDate } from "@/lib/timezone";

const input=z.object({verificationToken:z.string().min(20),phone:z.string().trim().min(10).max(20),name:z.string().trim().min(2).max(120),serviceId:z.string().min(1),startsAt:z.string().datetime(),endsAt:z.string().datetime(),customerNote:z.string().trim().max(2000).optional()});

function normalizePhone(value:string){return value.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d+]/g,"");}
function localDateParts(date:Date,timeZone:string){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
  const value=Object.fromEntries(parts.filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
  return {date:String(value.year)+"-"+String(value.month)+"-"+String(value.day),minute:Number(value.hour)*60+Number(value.minute)};
}

export async function POST(req:Request){
  try{
    const p=input.safeParse(await req.json()); if(!p.success)return fail("Invalid booking payload",422,p.error.flatten());
    const phone=normalizePhone(p.data.phone); const verification=await verifyOtpVerificationToken(p.data.verificationToken);
    if(verification.purpose!=="booking"||verification.phone!==phone)return fail("OTP verification does not match the phone number",403);
    const startsAt=new Date(p.data.startsAt),endsAt=new Date(p.data.endsAt);
    if(!(endsAt>startsAt)||startsAt.getTime()<=Date.now())return fail("Invalid appointment time",422);
    const duration=Math.round((endsAt.getTime()-startsAt.getTime())/60000); if(duration<5||duration>240)return fail("Invalid appointment duration",422);

    await connectDB();
    const [service,settings]=await Promise.all([
      ServiceModel.findOne({_id:p.data.serviceId,status:"published"}).lean(),
      SiteSettingsModel.findOne({key:"main"}).select("timezone").lean()
    ]);
    if(!service)return fail("Service not found",404);
    const timezone=settings?.timezone||process.env.CLINIC_TIMEZONE||"Asia/Tehran";
    const local=localDateParts(startsAt,timezone),weekday=weekdayForDate(local.date,timezone);
    const exception=await ScheduleExceptionModel.findOne({date:local.date,doctorId:null}).lean();
    if(exception?.closed)return fail("The clinic is closed on this date",409);
    let schedules=await ScheduleModel.find({active:true,dayOfWeek:weekday,doctorId:null}).lean();
    if(!schedules.length)schedules=await ScheduleModel.find({active:true,dayOfWeek:weekday}).lean();
    const scheduleMatch=schedules.some(s=>local.minute>=s.startMinutes&&local.minute+duration<=s.endMinutes&&(local.minute-s.startMinutes)%s.slotDuration===0&&duration===s.slotDuration);
    if(!scheduleMatch)return fail("Selected time is outside clinic availability",409);

    const slotKey=startsAt.toISOString();
    if(await AppointmentModel.exists({slotKey,status:{$in:["pending_payment","paid_pending_assignment","confirmed"]}}))return fail("This time slot has just been booked",409);

    const existingUser=await UserModel.findOne({phone}).select("_id role isActive").lean();
    const user=existingUser||await UserModel.create({phone,role:"patient",isActive:true,firstName:p.data.name});
    const requiresPayment=(service.bookingFee||0)>0;
    const appointment=await AppointmentModel.create({
      userId:user._id,patientSnapshot:{phone,name:p.data.name},serviceId:service._id,doctorId:null,startsAt,endsAt,timezone,slotKey,
      customerNote:p.data.customerNote||"",status:requiresPayment?"pending_payment":"paid_pending_assignment",
      paymentStatus:requiresPayment?"pending":"paid",source:"web"
    });
    const payment=requiresPayment?await PaymentModel.create({
      appointmentId:appointment._id,userId:user._id,amount:service.bookingFee,currency:service.currency||"IRR",
      gateway:process.env.PAYMENT_GATEWAY||"unconfigured",status:"pending"
    }):null;

    const accessToken=await signAccessToken(String(user._id),String(user.role||"patient"));
    const response=NextResponse.json({
      success:true,
      data:{appointment,paymentRequired:requiresPayment,payment:payment?{id:payment._id,amount:payment.amount,currency:payment.currency,status:payment.status}:null}
    },{status:201});
    response.cookies.set("access_token",accessToken,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*7});
    return response;
  }catch(e){
    if(typeof e==="object"&&e!==null&&"code" in e&&(e as {code?:number}).code===11000)return fail("This time slot has just been booked",409);
    return fail(e instanceof Error?e.message:"Unable to create booking",500);
  }
}