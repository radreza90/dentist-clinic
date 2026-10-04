import { connectDB } from "@/lib/db";
import { AppointmentModel } from "@/models";
import { getAuth } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";

export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  const a=await getAuth(req);if(!a)return fail("Authentication required",401);
  try{
    await connectDB();const {id}=await params;
    const filter=a.role&&["super_admin","admin","manager"].includes(String(a.role))?{_id:id}:{_id:id,userId:a.sub};
    const current=await AppointmentModel.findOne(filter).lean();
    if(!current)return fail("Appointment not found",404);
    if(current.startsAt.getTime()-Date.now()<2*60*60*1000)return fail("Appointments cannot be cancelled less than 2 hours before start time",409);
    if(["completed","cancelled","no_show"].includes(current.status))return fail("Appointment cannot be cancelled",409);
    const item=await AppointmentModel.findByIdAndUpdate(id,{$set:{status:"cancelled"}},{new:true}).lean();
    return ok(item);
  }catch(e){return fail(e instanceof Error?e.message:"Unable to cancel appointment",500);}
}