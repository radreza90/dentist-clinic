import { AppointmentModel, DoctorModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";
import { z } from "zod";

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
    const item=await AppointmentModel.findByIdAndUpdate(id,{$set:{
      ...(p.data.doctorId!==undefined?{doctorId:p.data.doctorId}:{}),
      ...(nextStatus?{status:nextStatus}:{}),
      ...(p.data.adminNote!==undefined?{adminNote:p.data.adminNote}:{}),
    }},{new:true,runValidators:true}).populate("serviceId","title bookingFee currency").populate("doctorId","name").lean();

    return item?ok(item):fail("Appointment not found",404);
  }catch(e){return fail(e instanceof Error?e.message:"Unable to update appointment",500);}
}