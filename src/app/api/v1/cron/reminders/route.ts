import { connectDB } from "@/lib/db";
import { AppointmentModel, ServiceModel } from "@/models";
import { sendSms } from "@/lib/sms";
import { ok,fail } from "@/lib/api";

function authorized(req:Request){
  const expected=process.env.CRON_SECRET;
  if(!expected)return false;
  const provided=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"")||req.headers.get("x-cron-secret");
  return provided===expected;
}
function format(date:Date,timeZone:string){
  return new Intl.DateTimeFormat("fa-IR",{timeZone,dateStyle:"medium",timeStyle:"short"}).format(date);
}

export async function POST(req:Request){
  if(!authorized(req))return fail("Unauthorized",401);
  try{
    await connectDB();
    const now=Date.now();
    const h24Start=new Date(now+23*60*60*1000);
    const h24End=new Date(now+25*60*60*1000);
    const h2Start=new Date(now+90*60*1000);
    const h2End=new Date(now+150*60*1000);

    const items=await AppointmentModel.find({
      status:"confirmed",
      $or:[
        {startsAt:{$gte:h24Start,$lt:h24End},reminder24SentAt:null},
        {startsAt:{$gte:h2Start,$lt:h2End},reminder2SentAt:null},
      ],
    }).limit(100).lean();

    let sent24=0,sent2=0,failed=0;
    for(const appointment of items){
      const phone=appointment.patientSnapshot?.phone;
      if(!phone)continue;
      const is24=appointment.startsAt>=h24Start&&appointment.startsAt<h24End&&!appointment.reminder24SentAt;
      const message="یادآوری نوبت کلینیک: "+format(new Date(appointment.startsAt),appointment.timezone||process.env.CLINIC_TIMEZONE||"Asia/Tehran");
      try{
        await sendSms(phone,message);
        if(is24){
          await AppointmentModel.updateOne({_id:appointment._id,reminder24SentAt:null},{$set:{reminder24SentAt:new Date()}});
          sent24++;
        }else{
          await AppointmentModel.updateOne({_id:appointment._id,reminder2SentAt:null},{$set:{reminder2SentAt:new Date()}});
          sent2++;
        }
      }catch{failed++;}
    }
    return ok({processed:items.length,sent24,sent2,failed});
  }catch(e){return fail(e instanceof Error?e.message:"Reminder job failed",500);}
}