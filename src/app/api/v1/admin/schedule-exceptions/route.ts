import { ScheduleExceptionModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth,can } from "@/lib/rbac";
import { ok,fail } from "@/lib/api";
import { z } from "zod";
const input=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),doctorId:z.string().nullable().optional(),closed:z.boolean().default(true),startMinutes:z.number().int().min(0).max(1439).optional(),endMinutes:z.number().int().min(1).max(1440).optional(),reason:z.string().max(500).optional()}).refine(v=>v.closed||v.startMinutes!=null&&v.endMinutes!=null&&v.endMinutes>v.startMinutes,{message:"Open exceptions require a valid time range"});
export async function GET(req:Request){const a=await getAuth(req);if(!a||!can(String(a.role),"appointments:read"))return fail("Forbidden",403);try{await connectDB();return ok(await ScheduleExceptionModel.find().sort({date:1}).populate("doctorId","name").lean());}catch(e){return fail(e instanceof Error?e.message:"Unable to load schedule exceptions",500);}}
export async function POST(req:Request){const a=await getAuth(req);if(!a||!can(String(a.role),"appointments:write"))return fail("Forbidden",403);try{const p=input.safeParse(await req.json());if(!p.success)return fail("Invalid exception payload",422,p.error.flatten());await connectDB();if(await ScheduleExceptionModel.exists({date:p.data.date,doctorId:p.data.doctorId??null}))return fail("An exception already exists for this date",409);return ok(await ScheduleExceptionModel.create(p.data),201);}catch(e){return fail(e instanceof Error?e.message:"Unable to create exception",500);}}
