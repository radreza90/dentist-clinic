import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/session";

export async function POST(){
  const response=NextResponse.json({success:true,data:null});
  clearSessionCookies(response);
  return response;
}