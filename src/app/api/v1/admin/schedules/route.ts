import { ScheduleModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";
import { z } from "zod";

const input=z.object({
  doctorId:z.string().nullable().optional(),
  dayOfWeek:z.number().int().min(0).max(6),
  startMinutes:z.number().int().min(0).max(1439),
  endMinutes:z.number().int().min(1).max(1440),
  slotDuration:z.number().int().min(5).max(240).default(30),
  active:z.boolean().default(true),
}).refine(v=>v.endMinutes>v.startMinutes,{message:"endMinutes must be greater than startMinutes"});

export async function GET(req:Request){
  const a=await getAuth(req);if(!a||!can(String(a.role),"appointments:read"))return fail("Forbidden",403);
  try{await connectDB();return ok(await ScheduleModel.find().sort({doctorId:1,dayOfWeek:1,startMinutes:1}).populate("doctorId","name").lean());}
  catch(e){return fail(e instanceof Error?e.message:"Unable to load schedules",500);}
}
export async function POST(req:Request){
  const a=await getAuth(req);if(!a||!can(String(a.role),"appointments:write"))return fail("Forbidden",403);
  try{
    const p=input.safeParse(await req.json());if(!p.success)return fail("Invalid schedule payload",422,p.error.flatten());
    await connectDB();
    const overlap=await ScheduleModel.exists({
      active:true,doctorId:p.data.doctorId??null,dayOfWeek:p.data.dayOfWeek,
      startMinutes:{$lt:p.data.endMinutes},endMinutes:{$gt:p.data.startMinutes},
    });
    if(overlap)return fail("Schedule overlaps an existing schedule",409);
    return ok(await ScheduleModel.create(p.data),201);
  }catch(e){return fail(e instanceof Error?e.message:"Unable to create schedule",500);}
}