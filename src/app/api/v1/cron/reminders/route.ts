import { connectDB } from "@/lib/db";
import { AppointmentModel } from "@/models";
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

async function runReminders(req:Request){
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
    const staleBefore=new Date(now-5*60*1000);
    for(const appointment of items){
      const phone=appointment.patientSnapshot?.phone;
      if(!phone)continue;
      const is24=appointment.startsAt>=h24Start&&appointment.startsAt<h24End&&!appointment.reminder24SentAt;
      const sentField=is24?"reminder24SentAt":"reminder2SentAt";
      const processingField=is24?"reminder24ProcessingAt":"reminder2ProcessingAt";
      const claimAt=new Date();
      const claimed=await AppointmentModel.findOneAndUpdate(
        {
          _id:appointment._id,
          status:"confirmed",
          [sentField]:null,
          $or:[{[processingField]:null},{[processingField]:{$lt:staleBefore}}],
        },
        {$set:{[processingField]:claimAt}},
        {new:true}
      ).lean();
      if(!claimed)continue;

      const message="یادآوری نوبت کلینیک: "+format(new Date(claimed.startsAt),claimed.timezone||process.env.CLINIC_TIMEZONE||"Asia/Tehran");
      try{
        await sendSms(phone,message);
        const updated=await AppointmentModel.updateOne(
          {_id:claimed._id,status:"confirmed",[sentField]:null,[processingField]:claimAt},
          {$set:{[sentField]:new Date()},$unset:{[processingField]:1}}
        );
        if(!updated.matchedCount)continue;
        if(is24)sent24++;else sent2++;
      }catch{
        failed++;
        await AppointmentModel.updateOne(
          {_id:claimed._id,[processingField]:claimAt},
          {$unset:{[processingField]:1}}
        );
      }
    }
    return ok({processed:items.length,sent24,sent2,failed});
  }catch(e){return fail(e instanceof Error?e.message:"Reminder job failed",500);}
}

export async function POST(req:Request){
  return runReminders(req);
}

export async function GET(req:Request){
  return runReminders(req);
}
