import { AppointmentModel, DoctorModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";

export async function GET(req:Request){
  const a=await getAuth(req); if(!a||!can(String(a.role),"appointments:read"))return fail("Forbidden",403);
  try{
    await connectDB();
    const url=new URL(req.url);
    const status=url.searchParams.get("status");
    const date=url.searchParams.get("date");
    const filter:Record<string,unknown>={};
    if(status)filter.status=status;
    if(date&&/^\d{4}-\d{2}-\d{2}$/.test(date)){
      const start=new Date(date+"T00:00:00.000Z"),end=new Date(start.getTime()+86400000);
      filter.startsAt={$gte:start,$lt:end};
    }
    const appointments=await AppointmentModel.find(filter).sort({startsAt:1}).limit(200).populate("serviceId","title bookingFee currency").populate("doctorId","name").lean();
    const doctors=await DoctorModel.find({status:"published"}).select("_id name").sort({"name.fa":1}).lean();
    return ok({appointments,doctors});
  }catch(e){return fail(e instanceof Error?e.message:"Unable to load appointments",500);}
}