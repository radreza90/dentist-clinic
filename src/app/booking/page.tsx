"use client";

import { useEffect, useMemo, useState } from "react";

type Service={_id:string;slug:string;title:{fa?:string;en?:string};bookingFee?:number;currency?:string};
type Slot={start:string;end:string;label:string;available:boolean};

function tomorrow(){const d=new Date(Date.now()+24*60*60*1000);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}

export default function BookingPage(){
  const initialSlug=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("service")||"":""; 
  const [services,setServices]=useState<Service[]>([]); const [serviceId,setServiceId]=useState("");
  const [date,setDate]=useState(tomorrow()); const [slots,setSlots]=useState<Slot[]>([]); const [slot,setSlot]=useState<Slot|null>(null);
  const [phone,setPhone]=useState(""); const [name,setName]=useState(""); const [otp,setOtp]=useState("");
  const [verificationToken,setVerificationToken]=useState(""); const [step,setStep]=useState(1); const [loading,setLoading]=useState(false);
  const [error,setError]=useState(""); const [result,setResult]=useState<any>(null);
  const service=useMemo(()=>services.find(s=>s._id===serviceId),[services,serviceId]);

  useEffect(()=>{fetch("/api/v1/services",{cache:"no-store"}).then(r=>r.json()).then(p=>{if(!p.success)return;const list=p.data||[];setServices(list);if(initialSlug){const found=list.find((x:Service)=>x.slug===initialSlug);if(found)setServiceId(found._id);}}).catch(()=>setError("خطا در دریافت خدمات"));},[initialSlug]);
  useEffect(()=>{if(!serviceId||!date)return;setSlot(null);setSlots([]);setError("");fetch("/api/v1/booking/availability?date="+encodeURIComponent(date)+"&serviceId="+encodeURIComponent(serviceId),{cache:"no-store"}).then(r=>r.json()).then(p=>{if(!p.success){setError(p.error?.message||"خطا در دریافت زمان‌ها");return;}setSlots(p.data.slots||[]);}).catch(()=>setError("خطا در دریافت زمان‌های آزاد"));},[serviceId,date]);

  async function requestOtp(){setError("");setLoading(true);try{const r=await fetch("/api/v1/auth/otp/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone,purpose:"booking"})});const p=await r.json();if(!r.ok||!p.success)throw new Error(p.error?.message||"ارسال کد ناموفق بود");setStep(3);}catch(e){setError(e instanceof Error?e.message:"خطا");}finally{setLoading(false);}}
  async function verify(){setError("");setLoading(true);try{const r=await fetch("/api/v1/auth/otp/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone,code:otp,purpose:"booking"})});const p=await r.json();if(!r.ok||!p.success)throw new Error(p.error?.message||"کد تأیید نامعتبر است");setVerificationToken(p.data.verificationToken);setStep(4);}catch(e){setError(e instanceof Error?e.message:"خطا");}finally{setLoading(false);}}
  async function submitBooking(){if(!slot||!verificationToken||!serviceId)return;setError("");setLoading(true);try{const r=await fetch("/api/v1/booking/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({verificationToken,phone,name,serviceId,startsAt:slot.start,endsAt:slot.end})});const p=await r.json();if(!r.ok||!p.success)throw new Error(p.error?.message||"ثبت نوبت ناموفق بود");setResult(p.data);setStep(5);}catch(e){setError(e instanceof Error?e.message:"خطا");}finally{setLoading(false);}}

  return <main style={{maxWidth:760,margin:"0 auto",padding:"48px 24px"}}>
    <h1>نوبت‌دهی آنلاین</h1><p style={{color:"#666"}}>انتخاب زمان، تأیید موبایل و ثبت درخواست نوبت.</p>
    <div style={{display:"flex",gap:8,margin:"24px 0",flexWrap:"wrap"}}>{[["1","خدمت و زمان"],["2","اطلاعات تماس"],["3","OTP"],["4","تأیید"],["5","نتیجه"]].map(([n,t])=><span key={n} style={{padding:"7px 10px",borderRadius:20,background:step===Number(n)?"#111":"#eee",color:step===Number(n)?"#fff":"#333"}}>{n}. {t}</span>)}</div>
    {step===1&&<section style={{display:"grid",gap:14}}>
      <label>خدمت<select value={serviceId} onChange={e=>setServiceId(e.target.value)} style={{display:"block",width:"100%",padding:10,marginTop:6}}><option value="">انتخاب کنید</option>{services.map(s=><option value={s._id} key={s._id}>{s.title.fa||s.title.en}</option>)}</select></label>
      <label>تاریخ<input type="date" value={date} min={tomorrow()} onChange={e=>setDate(e.target.value)} style={{display:"block",width:"100%",padding:10,marginTop:6}}/></label>
      <div><strong>زمان‌های آزاد</strong><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginTop:10}}>{slots.filter(s=>s.available).map(s=><button type="button" key={s.start} onClick={()=>setSlot(s)} style={{padding:10,border:slot?.start===s.start?"2px solid #111":"1px solid #ddd",borderRadius:8}}>{s.label}</button>)}</div></div>
      {service&&<p style={{color:"#666"}}>هزینه رزرو: {service.bookingFee||0} {service.currency||"IRR"}</p>}<button disabled={!slot} type="button" onClick={()=>setStep(2)}>ادامه</button>
    </section>}
    {step===2&&<section style={{display:"grid",gap:14}}><h2>اطلاعات تماس</h2><input value={name} onChange={e=>setName(e.target.value)} placeholder="نام و نام خانوادگی" required/><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="شماره موبایل" inputMode="tel" required/><button disabled={!name||!phone||loading} type="button" onClick={()=>void requestOtp()}>{loading?"در حال ارسال…":"ارسال کد تأیید"}</button><button type="button" onClick={()=>setStep(1)}>بازگشت</button></section>}
    {step===3&&<section style={{display:"grid",gap:14}}><h2>تأیید شماره موبایل</h2><p>کد ۶ رقمی ارسال‌شده را وارد کنید.</p><input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="کد تأیید" inputMode="numeric" maxLength={6}/><button disabled={otp.length!==6||loading} type="button" onClick={()=>void verify()}>{loading?"در حال بررسی…":"تأیید کد"}</button><button type="button" onClick={()=>setStep(2)}>تغییر شماره</button></section>}
    {step===4&&<section style={{display:"grid",gap:14}}><h2>خلاصه نوبت</h2><p>خدمت: {service?.title.fa||service?.title.en}</p><p>تاریخ: {date}</p><p>زمان: {slot?.label}</p><p>نام: {name}</p><p>موبایل: {phone}</p><button disabled={loading} type="button" onClick={()=>void submitBooking()}>{loading?"در حال ثبت…":"ثبت درخواست نوبت"}</button><button type="button" onClick={()=>setStep(1)}>ویرایش</button></section>}
    {step===5&&result&&<section style={{padding:24,border:"1px solid #ddd",borderRadius:14}}><h2>درخواست نوبت ثبت شد ✅</h2><p>کد نوبت: <strong>{String(result.appointment?._id||"—")}</strong></p>{result.paymentRequired?<><p>برای نهایی‌شدن نوبت باید هزینه رزرو پرداخت شود.</p><p>درگاه پرداخت در محیط فعلی هنوز پیکربندی نشده است.</p></>:<p>درخواست شما برای تخصیص پزشک در صف قرار گرفت.</p>}<a href="/" style={{display:"inline-block",marginTop:10}}>بازگشت به سایت</a></section>}
    {error&&<p style={{marginTop:20,color:"#b42318"}}>{error}</p>}
  </main>;
}