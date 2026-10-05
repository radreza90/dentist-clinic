import { AppointmentModel, DoctorModel, SiteSettingsModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";
import { z } from "zod";
import { sendSms } from "@/lib/sms";

function formatAppointmentDate(date:Date,timeZone:string){
  return new Intl.DateTimeFormat("fa-IR",{timeZone,dateStyle:"medium",timeStyle:"short"}).format(date);
}

const allowedTransitions:Record<string,string[]>={
  pending_payment:["paid_pending_assignment","cancelled"],
  paid_pending_assignment:["confirmed","cancelled"],
  confirmed:["completed","cancelled","no_show"],
  completed:[],
  cancelled:[],
  no_show:[],
};

function buildConfirmationSms(
  template:string,
  includeAppointmentTime:boolean,
  includeDoctorName:boolean,
  appointmentTime:string,
  doctorName:string
){
  let message=(template||"نوبت شما تأیید شد. زمان: {appointmentTime}").trim();

  if(includeAppointmentTime&&message.includes("{appointmentTime}")){
    message=message.replace(/\{appointmentTime\}/g,appointmentTime);
  }else{
    message=message.replace(/\{appointmentTime\}/g,"");
    if(includeAppointmentTime&&!message.includes(appointmentTime)){
      message=(message+"\nزمان نوبت: "+appointmentTime).trim();
    }
  }

  if(includeDoctorName&&doctorName&&message.includes("{doctorName}")){
    message=message.replace(/\{doctorName\}/g,doctorName);
  }else{
    message=message.replace(/\{doctorName\}/g,"");
    if(includeDoctorName&&doctorName&&!message.includes(doctorName)){
      message=(message+"\nپزشک: "+doctorName).trim();
    }
  }

  return message.replace(/\s+\n/g,"\n").replace(/\n\s+/g,"\n").trim();
}

const input=z.object({
  doctorId:z.string().nullable().optional(),
  status:z.enum(["pending_payment","paid_pending_assignment","confirmed","completed","cancelled","no_show"]).optional(),
  adminNote:z.string().trim().max(5000).optional(),
});

export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){
  const a=await getAuth(req);if(!a||!can(String(a.role),"appointments:write"))return fail("Forbidden",403);
  try{
    const p=input.safeParse(await req.json());if(!p.success)return fail("Invalid appointment payload",422,p.error.flatten());
    await connectDB();const {id}=await params;
    const current=await AppointmentModel.findById(id).lean();
    if(!current)return fail("Appointment not found",404);

    if(p.data.doctorId!==undefined){
      if(current.paymentStatus!=="paid")return fail("Doctor can only be assigned after payment",409);
      if(!["paid_pending_assignment","confirmed"].includes(current.status))return fail("Doctor cannot be assigned for this appointment status",409);
      if(p.data.doctorId){
        const doctor=await DoctorModel.findOne({_id:p.data.doctorId,status:"published"}).select("_id").lean();
        if(!doctor)return fail("Doctor not found",404);
        const conflict=await AppointmentModel.exists({
          _id:{$ne:id},doctorId:doctor._id,slotKey:current.slotKey,
          status:{$in:["paid_pending_assignment","confirmed"]}
        });
        if(conflict)return fail("Doctor is already booked for this time slot",409);
      }
    }

    const nextStatus=p.data.status||(p.data.doctorId? "confirmed":undefined);
    if(nextStatus&&nextStatus!==current.status&&!allowedTransitions[current.status]?.includes(nextStatus))return fail("Invalid appointment status transition",409);
    if(nextStatus==="confirmed"&&current.paymentStatus!=="paid")return fail("Paid appointment is required before confirmation",409);
    const wasNotConfirmed=current.status!=="confirmed";
    const item=await AppointmentModel.findByIdAndUpdate(id,{$set:{
      ...(p.data.doctorId!==undefined?{doctorId:p.data.doctorId}:{}),
      ...(nextStatus?{status:nextStatus}:{}),
      ...(p.data.adminNote!==undefined?{adminNote:p.data.adminNote}:{}),
      ...(nextStatus==="confirmed"&&wasNotConfirmed?{confirmedSmsSentAt:null}:{}),
    }},{new:true,runValidators:true}).populate("serviceId","title bookingFee currency").populate("doctorId","name").lean();

    if(item&&nextStatus==="confirmed"&&!item.confirmedSmsSentAt&&item.patientSnapshot?.phone){
      await connectDB();
      const siteSettings=await SiteSettingsModel.findOne({key:"main"}).select("appointmentSms timezone").lean();
      const smsSettings=siteSettings?.appointmentSms;
      if(smsSettings?.enabled!==false){
        try{
          const doctorName=item.doctorId?.name?.fa||item.doctorId?.name?.en||"";
          const appointmentTime=formatAppointmentDate(
            new Date(item.startsAt),
            item.timezone||siteSettings?.timezone||process.env.CLINIC_TIMEZONE||"Asia/Tehran"
          );
          const message=buildConfirmationSms(
            smsSettings?.template||"نوبت شما تأیید شد. زمان: {appointmentTime}",
            smsSettings?.includeAppointmentTime!==false,
            smsSettings?.includeDoctorName===true,
            appointmentTime,
            doctorName
          );
          if(message)await sendSms(item.patientSnapshot.phone,message);
          await AppointmentModel.updateOne({_id:item._id,confirmedSmsSentAt:null},{$set:{confirmedSmsSentAt:new Date()}});
        }catch{
          // SMS failure must not roll back the appointment confirmation.
        }
      }
    }

    return item?ok(item):fail("Appointment not found",404);
  }catch(e){return fail(e instanceof Error?e.message:"Unable to update appointment",500);}
}