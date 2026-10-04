import { connectDB } from "@/lib/db";
import { AppointmentModel, ScheduleExceptionModel, ScheduleModel, ServiceModel, SiteSettingsModel } from "@/models";
import { ok, fail } from "@/lib/api";
import { minutesToTime, weekdayForDate, zonedDateToUtc } from "@/lib/timezone";

function validDate(value:string|null){
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value+"T00:00:00Z").getTime());
}

export async function GET(req:Request){
  try{
    const url=new URL(req.url);
    const date=url.searchParams.get("date");
    const serviceId=url.searchParams.get("serviceId");
    if(!validDate(date))return fail("A valid date (YYYY-MM-DD) is required",422);
    if(!serviceId)return fail("serviceId is required",422);

    await connectDB();
    const [service,settings]=await Promise.all([
      ServiceModel.findOne({_id:serviceId,status:"published"}).select("_id").lean(),
      SiteSettingsModel.findOne({key:"main"}).select("timezone").lean(),
    ]);
    if(!service)return fail("Service not found",404);

    const timezone=settings?.timezone||process.env.CLINIC_TIMEZONE||"Asia/Tehran";
    const weekday=weekdayForDate(date!,timezone);

    const exception=await ScheduleExceptionModel.findOne({date,doctorId:null}).lean();
    if(exception?.closed)return ok({date,timezone,slots:[]});

    let schedules=await ScheduleModel.find({active:true,dayOfWeek:weekday,doctorId:null}).lean();
    if(!schedules.length)schedules=await ScheduleModel.find({active:true,dayOfWeek:weekday}).lean();
    if(!schedules.length)return ok({date,timezone,slots:[]});

    const dayStart=zonedDateToUtc(date!,"00:00",timezone);
    const nextDay=new Date(zonedDateToUtc(date!,"00:00",timezone).getTime()+24*60*60*1000);
    const appointments=await AppointmentModel.find({
      startsAt:{$gte:dayStart,$lt:nextDay},
      status:{$in:["pending_payment","paid_pending_assignment","confirmed"]},
    }).select("slotKey startsAt").lean();
    const booked=new Set(appointments.map(item=>item.slotKey));

    const now=Date.now();
    const seen=new Set<string>();
    const slots:{start:string;end:string;label:string;available:boolean}[]=[];

    for(const schedule of schedules){
      for(let minute=schedule.startMinutes;minute+schedule.slotDuration<=schedule.endMinutes;minute+=schedule.slotDuration){
        const startTime=minutesToTime(minute);
        const endTime=minutesToTime(minute+schedule.slotDuration);
        const start=zonedDateToUtc(date!,startTime,timezone);
        const end=zonedDateToUtc(date!,endTime,timezone);
        const slotKey=start.toISOString();
        if(seen.has(slotKey))continue;
        seen.add(slotKey);
        const available=start.getTime()>now&&!booked.has(slotKey);
        slots.push({start:start.toISOString(),end:end.toISOString(),label:startTime+" - "+endTime,available});
      }
    }

    slots.sort((a,b)=>a.start.localeCompare(b.start));
    return ok({date,timezone,slots});
  }catch(e){return fail(e instanceof Error?e.message:"Unable to load availability",500);}
}