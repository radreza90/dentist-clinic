import {NextResponse} from "next/server"; import {z} from "zod";
export function ok<T>(data:T,status=200){return NextResponse.json({success:true,data}, {status});}
export function fail(message:string,status=400,details?:unknown){return NextResponse.json({success:false,error:{message,details}}, {status});}
export function parseJson<T extends z.ZodType>(schema:T,input:unknown){const result=schema.safeParse(input); if(!result.success) throw new Error(result.error.issues.map(i=>i.message).join(", ")); return result.data;}