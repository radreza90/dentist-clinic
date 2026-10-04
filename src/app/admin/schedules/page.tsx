"use client";

import { useEffect, useState } from "react";

type Schedule={_id:string;doctorId?:{_id:string;name?:{fa?:string;en?:string}}|null;dayOfWeek:number;startMinutes:number;endMinutes:number;slotDuration:number;active:boolean};
type Doctor={_id:string;name:{fa?:string;en?:string}};
type Exception={_id:string;date:string;doctorId?:{_id:string;name?:{fa?:string;en?:string}}|null;closed:boolean;reason?:string};

const days=["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];

function hm(value:number){return String(Math.floor(value/60)).padStart(2,"0")+":"+String(value%60).padStart(2,"0");}
function mins(value:string){const [h,m]=value.split(":").map(Number);return h*60+m;}

export default function SchedulesAdmin(){
  const [schedules,setSchedules]=useState<Schedule[]>([]);const [exceptions,setExceptions]=useState<Exception[]>([]);const [doctors,setDoctors]=useState<Doctor[]>([]);
  const [day,setDay]=useState(0);const [start,setStart]=useState("09:00");const [end,setEnd]=useState("17:00");const [duration,setDuration]=useState(30);
  const [exceptionDate,setExceptionDate]=useState("");const [reason,setReason]=useState("");const [loading,setLoading]=useState(true);const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      const [sr,er,dr]=await Promise.all([
        fetch("/api/v1/admin/schedules",{cache:"no-store"}),fetch("/api/v1/admin/schedule-exceptions",{cache:"no-store"}),fetch("/api/v1/admin/doctors?limit=100",{cache:"no-store"})
      ]);
      const [sp,ep,dp]=await Promise.all([sr.json(),er.json(),dr.json()]);
      if(!sp.success)throw new Error(sp.error?.message||"خطا در ساعات کاری");
      if(!ep.success)throw new Error(ep.error?.message||"خطا در تعطیلی‌ها");
      setSchedules(sp.data||[]);setExceptions(ep.data||[]);setDoctors(dp.data?.items||[]);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);

  async function addSchedule(){
    setError("");const r=await fetch("/api/v1/admin/schedules",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({dayOfWeek:day,startMinutes:mins(start),endMinutes:mins(end),slotDuration:duration,doctorId:null,active:true})});const p=await r.json();
    if(!r.ok||!p.success)setError(p.error?.message||"ثبت برنامه ناموفق بود");else load();
  }
  async function removeSchedule(id:string){
    if(!window.confirm("این بازه حذف شود؟"))return;
    const r=await fetch("/api/v1/admin/schedules/"+id,{method:"DELETE"});const p=await r.json();if(!r.ok||!p.success)setError(p.error?.message||"حذف ناموفق بود");else load();
  }
  async function addException(){
    setError("");if(!exceptionDate){setError("تاریخ تعطیلی را وارد کنید");return;}
    const r=await fetch("/api/v1/admin/schedule-exceptions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date:exceptionDate,closed:true,reason})});const p=await r.json();
    if(!r.ok||!p.success)setError(p.error?.message||"ثبت تعطیلی ناموفق بود");else{setExceptionDate("");setReason("");load();}
  }
  async function removeException(id:string){
    if(!window.confirm("این استثنا حذف شود؟"))return;
    const r=await fetch("/api/v1/admin/schedule-exceptions/"+id,{method:"DELETE"});const p=await r.json();if(!r.ok||!p.success)setError(p.error?.message||"حذف ناموفق بود");else load();
  }

  return <main>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}><div><h1>برنامه نوبت‌دهی</h1><p style={{color:"#666"}}>ساعات هفتگی کلینیک و روزهای تعطیل.</p></div><button type="button" onClick={()=>void load()}>بازخوانی</button></div>

    <section style={{background:"#fff",border:"1px solid #ddd",borderRadius:14,padding:20,marginTop:24}}>
      <h2>افزودن بازه کاری کلینیک</h2>
      <p style={{color:"#777",fontSize:13}}>برای V1 برنامه‌ی عمومی کلینیک استفاده می‌شود؛ بعداً می‌توان برای هر پزشک برنامه‌ی اختصاصی تعریف کرد.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
        <select value={day} onChange={e=>setDay(Number(e.target.value))}>{days.map((x,i)=><option key={i} value={i}>{x}</option>)}</select>
        <input type="time" value={start} onChange={e=>setStart(e.target.value)}/>
        <input type="time" value={end} onChange={e=>setEnd(e.target.value)}/>
        <select value={duration} onChange={e=>setDuration(Number(e.target.value))}><option value={15}>۱۵ دقیقه</option><option value={30}>۳۰ دقیقه</option><option value={45}>۴۵ دقیقه</option><option value={60}>۶۰ دقیقه</option></select>
        <button type="button" onClick={()=>void addSchedule()}>افزودن</button>
      </div>
    </section>

    <section style={{marginTop:24}}><h2>برنامه فعلی</h2>
      {loading?<p>در حال بارگذاری…</p>:<div style={{display:"grid",gap:8}}>{schedules.map(s=><div key={s._id} style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",padding:"12px 14px",background:"#fff",border:"1px solid #ddd",borderRadius:10}}>
        <strong>{days[s.dayOfWeek]}</strong><span dir="ltr">{hm(s.startMinutes)} - {hm(s.endMinutes)}</span><span>{s.slotDuration} دقیقه</span><span>کلینیک</span><button onClick={()=>void removeSchedule(s._id)}>حذف</button>
      </div>)}</div>}
    </section>

    <section style={{background:"#fff",border:"1px solid #ddd",borderRadius:14,padding:20,marginTop:24}}>
      <h2>تعطیلی / استثنای تقویم</h2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><input type="date" value={exceptionDate} onChange={e=>setExceptionDate(e.target.value)}/><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="دلیل (اختیاری)" /><button type="button" onClick={()=>void addException()}>ثبت تعطیلی</button></div>
      <div style={{display:"grid",gap:8,marginTop:14}}>{exceptions.map(x=><div key={x._id} style={{display:"flex",gap:12,alignItems:"center",padding:10,borderTop:"1px solid #eee"}}><strong dir="ltr">{x.date}</strong><span>{x.reason||"تعطیلی کلینیک"}</span><button onClick={()=>void removeException(x._id)}>حذف</button></div>)}</div>
    </section>
    {error&&<p style={{color:"#b42318"}}>{error}</p>}
    <p style={{marginTop:20,fontSize:13,color:"#777"}}>پزشکان موجود برای توسعه‌ی برنامه‌ی اختصاصی: {doctors.length}</p>
  </main>;
}