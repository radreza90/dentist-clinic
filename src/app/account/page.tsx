"use client";

import { FormEvent, useEffect, useState } from "react";

type Appointment={
  _id:string;startsAt:string;endsAt:string;status:string;paymentStatus:string;
  patientSnapshot?:{name?:string;phone?:string};
  serviceId?:{title?:{fa?:string;en?:string}}|string;
  doctorId?:{name?:{fa?:string;en?:string}}|string|null;
};

function formatDate(value:string){return new Date(value).toLocaleString("fa-IR",{dateStyle:"medium",timeStyle:"short"});}

export default function AccountPage(){
  const [authenticated,setAuthenticated]=useState<boolean|null>(null);
  const [appointments,setAppointments]=useState<Appointment[]>([]);
  const [phone,setPhone]=useState("");const [otp,setOtp]=useState("");const [token,setToken]=useState("");
  const [name,setName]=useState("");const [step,setStep]=useState<1|2>(1);
  const [loading,setLoading]=useState(false);const [error,setError]=useState("");

  async function load(){
    const r=await fetch("/api/v1/auth/me",{cache:"no-store"});
    if(!r.ok){setAuthenticated(false);return;}
    setAuthenticated(true);
    const a=await fetch("/api/v1/appointments",{cache:"no-store"});const p=await a.json();
    if(p.success)setAppointments(p.data||[]);
  }
  useEffect(()=>{void load();},[]);

  async function requestOtp(e:FormEvent){
    e.preventDefault();setLoading(true);setError("");
    try{const r=await fetch("/api/v1/auth/otp/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone,purpose:"login"})});const p=await r.json();if(!r.ok||!p.success)throw new Error(p.error?.message||"ارسال کد ناموفق بود");setStep(2);}
    catch(e){setError(e instanceof Error?e.message:"خطا");}finally{setLoading(false);}
  }

  async function login(e:FormEvent){
    e.preventDefault();setLoading(true);setError("");
    try{
      const vr=await fetch("/api/v1/auth/otp/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone,code:otp,purpose:"login"})});
      const vp=await vr.json();if(!vr.ok||!vp.success)throw new Error(vp.error?.message||"کد نامعتبر است");
      setToken(vp.data.verificationToken);
      const lr=await fetch("/api/v1/auth/otp/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone,name,verificationToken:vp.data.verificationToken})});
      const lp=await lr.json();if(!lr.ok||!lp.success)throw new Error(lp.error?.message||"ورود ناموفق بود");
      setAuthenticated(true);setStep(1);setOtp("");await load();
    }catch(e){setError(e instanceof Error?e.message:"خطا");}finally{setLoading(false);}
  }

  async function cancel(id:string){
    if(!window.confirm("این نوبت لغو شود؟"))return;
    const r=await fetch("/api/v1/appointments/"+id,{method:"DELETE"});const p=await r.json();
    if(!r.ok||!p.success){setError(p.error?.message||"لغو ناموفق بود");return;}
    await load();
  }

  async function logout(){
    await fetch("/api/v1/auth/logout",{method:"POST"});setAuthenticated(false);setAppointments([]);
  }

  if(authenticated===null)return <main style={{maxWidth:900,margin:"0 auto",padding:"48px 24px"}}><p>در حال بارگذاری…</p></main>;

  return <main style={{maxWidth:900,margin:"0 auto",padding:"48px 24px"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}><div><h1>پنل بیمار</h1><p style={{color:"#666"}}>مشاهده و مدیریت نوبت‌های شما.</p></div>{authenticated&&<button onClick={()=>void logout()}>خروج</button>}</div>

    {!authenticated&&<section style={{maxWidth:480,border:"1px solid #ddd",borderRadius:14,padding:22,marginTop:24}}>
      {step===1?<form onSubmit={requestOtp} style={{display:"grid",gap:12}}><h2>ورود با موبایل</h2><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="شماره موبایل" inputMode="tel" required/><input value={name} onChange={e=>setName(e.target.value)} placeholder="نام و نام خانوادگی (اختیاری)"/><button disabled={loading}>{loading?"در حال ارسال…":"ارسال کد ورود"}</button></form>:
      <form onSubmit={login} style={{display:"grid",gap:12}}><h2>کد تأیید</h2><input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="کد ۶ رقمی" inputMode="numeric" maxLength={6} required/><button disabled={otp.length!==6||loading}>{loading?"در حال ورود…":"ورود"}</button><button type="button" onClick={()=>setStep(1)}>تغییر شماره</button></form>}
    </section>}

    {authenticated&&<section style={{marginTop:28}}>
      {appointments.length===0?<p>هنوز نوبتی ثبت نشده است.</p>:<div style={{display:"grid",gap:14}}>{appointments.map(a=><article key={a._id} style={{border:"1px solid #ddd",borderRadius:14,padding:20}}>
        <h2 style={{marginTop:0}}>{typeof a.serviceId==="object"?(a.serviceId.title?.fa||a.serviceId.title?.en):"نوبت دندانپزشکی"}</h2>
        <p>زمان: {formatDate(a.startsAt)}</p>
        <p>وضعیت: {a.status}</p>
        <p>پرداخت: {a.paymentStatus}</p>
        {a.doctorId&&typeof a.doctorId==="object"?<p>پزشک: {a.doctorId.name?.fa||a.doctorId.name?.en}</p>:null}
        {a.status!=="cancelled"&&a.status!=="completed"&&a.status!=="no_show"?<button onClick={()=>void cancel(a._id)}>لغو نوبت</button>:null}
      </article>)}</div>}
    </section>}
    {error&&<p style={{color:"#b42318",marginTop:20}}>{error}</p>}
  </main>;
}