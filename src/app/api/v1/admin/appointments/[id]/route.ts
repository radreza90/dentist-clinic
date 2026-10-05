import { AppointmentModel, DoctorModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";
import { z } from "zod";
import { sendSms } from "@/lib/sms";

function formatAppointmentDate(date:Date,timeZone:string){
  return new Intl.DateTimeFormat("fa-IR",{timeZone,dateStyle:"medium",timeStyle:"short"}).format(date);
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
    if(nextStatus==="confirmed"&&current.paymentStatus!=="paid")return fail("Paid appointment is required before confirmation",409);
    const wasNotConfirmed=current.status!=="confirmed";
    const item=await AppointmentModel.findByIdAndUpdate(id,{$set:{
      ...(p.data.doctorId!==undefined?{doctorId:p.data.doctorId}:{}),
      ...(nextStatus?{status:nextStatus}:{}),
      ...(p.data.adminNote!==undefined?{adminNote:p.data.adminNote}:{}),
      ...(nextStatus==="confirmed"&&wasNotConfirmed?{confirmedSmsSentAt:null}:{}),
    }},{new:true,runValidators:true}).populate("serviceId","title bookingFee currency").populate("doctorId","name").lean();

    if(item&&nextStatus==="confirmed"&&wasNotConfirmed&&item.patientSnapshot?.phone){
      try{
        const doctorName=item.doctorId?.name?.fa||item.doctorId?.name?.en||"";
        const serviceName=item.serviceId?.title?.fa||item.serviceId?.title?.en||"نوبت شما";
        const doctorPart=doctorName?" پزشک: "+doctorName:"";
        await sendSms(item.patientSnapshot.phone,"نوبت شما تأیید شد. "+serviceName+doctorPart+" زمان: "+formatAppointmentDate(new Date(item.startsAt),item.timezone||process.env.CLINIC_TIMEZONE||"Asia/Tehran"));
        await AppointmentModel.updateOne({_id:item._id,confirmedSmsSentAt:null},{$set:{confirmedSmsSentAt:new Date()}});
      }catch{
        // SMS failure must not roll back the appointment confirmation.
      }
    }

    return item?ok(item):fail("Appointment not found",404);
  }catch(e){return fail(e instanceof Error?e.message:"Unable to update appointment",500);}
}