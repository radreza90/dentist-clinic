"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PaymentResultPage(){
  const [status,setStatus]=useState<"success"|"failed"|"unknown">("unknown");
  const [appointmentId,setAppointmentId]=useState("");
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const value=params.get("status");setStatus(value==="success"?"success":value==="failed"?"failed":"unknown");setAppointmentId(params.get("appointmentId")||"");
  },[]);
  return <main style={{maxWidth:700,margin:"0 auto",padding:"72px 24px",textAlign:"center"}}>
    {status==="success"?<><h1>پرداخت با موفقیت انجام شد ✅</h1><p>پرداخت شما ثبت شد و نوبت برای تخصیص پزشک در صف قرار گرفت.</p></>:
      status==="failed"?<><h1>پرداخت ناموفق بود</h1><p>پرداخت تأیید نشد. می‌توانید وضعیت نوبت را در پنل بیمار بررسی کنید.</p></>:
      <><h1>نتیجه پرداخت</h1><p>در حال بررسی نتیجه…</p></>}
    {appointmentId&&<p>کد نوبت: <strong>{appointmentId}</strong></p>}
    <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:24}}><Link href="/account">پنل بیمار</Link><Link href="/booking">نوبت‌دهی</Link><Link href="/">صفحه اصلی</Link></div>
  </main>;
}