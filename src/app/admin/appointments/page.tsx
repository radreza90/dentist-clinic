"use client";

import { useCallback, useEffect, useState } from "react";

type Doctor={_id:string;name:{fa?:string;en?:string}};
type Appointment={
  _id:string;startsAt:string;endsAt:string;status:string;paymentStatus:string;
  patientSnapshot?:{name?:string;phone?:string};adminNote?:string;
  serviceId?:{title?:{fa?:string;en?:string};bookingFee?:number;currency?:string}|null;
  doctorId?:Doctor|null;
};

function formatDate(value:string){return new Date(value).toLocaleString("fa-IR",{dateStyle:"medium",timeStyle:"short"});}

export default function AppointmentsAdmin(){
  const [appointments,setAppointments]=useState<Appointment[]>([]);
  const [doctors,setDoctors]=useState<Doctor[]>([]);
  const [status,setStatus]=useState("");
  const [date,setDate]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notes,setNotes]=useState<Record<string,string>>({});
  const [savingNote,setSavingNote]=useState<string|null>(null);

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const params=new URLSearchParams();
      if(status)params.set("status",status); if(date)params.set("date",date);
      const r=await fetch("/api/v1/admin/appointments?"+params.toString(),{cache:"no-store"});
      const p=await r.json(); if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت نوبت‌ها");
      setAppointments(p.data.appointments||[]);setDoctors(p.data.doctors||[]);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
    finally{setLoading(false);}
  },[status,date]);

  useEffect(()=>{void load();},[load]);

  async function assign(id:string,doctorId:string){
    const r=await fetch("/api/v1/admin/appointments/"+id,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({doctorId})});
    const p=await r.json();
    if(!r.ok||!p.success){setError(p.error?.message||"تخصیص پزشک ناموفق بود");return;}
    await load();
  }

  async function saveNote(id:string){
    setSavingNote(id);setError("");
    try{
      const r=await fetch("/api/v1/admin/appointments/"+id,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({adminNote:notes[id]||""})});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره یادداشت ناموفق بود");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"ذخیره یادداشت ناموفق بود");}
    finally{setSavingNote(null);}
  }

  async function updateStatus(id:string,nextStatus:string){
    const r=await fetch("/api/v1/admin/appointments/"+id,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:nextStatus})});
    const p=await r.json();
    if(!r.ok||!p.success)setError(p.error?.message||"تغییر وضعیت ناموفق بود");else await load();
  }

  return <main>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <div><h1>مدیریت نوبت‌ها</h1><p style={{color:"#666"}}>رزروها، پرداخت و تخصیص پزشک از این بخش مدیریت می‌شود.</p></div>
      <button type="button" onClick={()=>void load()}>بازخوانی</button>
    </div>

    <div style={{display:"flex",gap:10,margin:"24px 0",flexWrap:"wrap"}}>
      <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
      <select value={status} onChange={e=>setStatus(e.target.value)}>
        <option value="">همه وضعیت‌ها</option>
        <option value="pending_payment">در انتظار پرداخت</option>
        <option value="paid_pending_assignment">در انتظار تخصیص</option>
        <option value="confirmed">تأیید شده</option>
        <option value="completed">انجام شده</option>
        <option value="cancelled">لغو شده</option>
        <option value="no_show">عدم مراجعه</option>
      </select>
    </div>

    {error&&<p style={{color:"#b42318"}}>{error}</p>}
    <div style={{background:"#fff",border:"1px solid #ddd",borderRadius:14,overflow:"auto"}}>
      {loading?<p style={{padding:20}}>در حال بارگذاری…</p>:appointments.length===0?<p style={{padding:20}}>نوبتی یافت نشد.</p>:
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>
          <th style={{padding:12,textAlign:"right"}}>بیمار</th><th>خدمت</th><th>زمان</th><th>پرداخت</th><th>پزشک</th><th>وضعیت</th><th>یادداشت</th>
        </tr></thead>
        <tbody>{appointments.map(item=><tr key={item._id} style={{borderTop:"1px solid #eee"}}>
          <td style={{padding:12}}><strong>{item.patientSnapshot?.name||"—"}</strong><div dir="ltr">{item.patientSnapshot?.phone||""}</div></td>
          <td>{item.serviceId?.title?.fa||item.serviceId?.title?.en||"—"}</td>
          <td>{formatDate(item.startsAt)}</td>
          <td>{item.paymentStatus}</td>
          <td style={{minWidth:190}}>
            <select disabled={item.paymentStatus!=="paid"} value={item.doctorId?._id||""} onChange={e=>void assign(item._id,e.target.value)} style={{width:"100%"}}>
              <option value="">انتخاب پزشک</option>
              {doctors.map(d=><option key={d._id} value={d._id}>{d.name.fa||d.name.en||d._id}</option>)}
            </select>
          </td>
          <td style={{minWidth:170}}>
            <select value={item.status} onChange={e=>void updateStatus(item._id,e.target.value)} style={{width:"100%"}}>
              <option value="pending_payment">در انتظار پرداخت</option>
              <option value="paid_pending_assignment">در انتظار تخصیص</option>
              <option value="confirmed">تأیید شده</option>
              <option value="completed">انجام شده</option>
              <option value="cancelled">لغو شده</option>
              <option value="no_show">عدم مراجعه</option>
            </select>
          </td>
          <td style={{minWidth:240,padding:10}}>
            <textarea
              value={notes[item._id]??item.adminNote??""}
              onChange={e=>setNotes(prev=>({...prev,[item._id]:e.target.value}))}
              rows={3}
              placeholder="یادداشت داخلی ادمین"
              style={{width:"100%",boxSizing:"border-box"}}
            />
            <button type="button" onClick={()=>void saveNote(item._id)} disabled={savingNote===item._id}>
              {savingNote===item._id?"در حال ذخیره…":"ذخیره یادداشت"}
            </button>
          </td>
        </tr>)}</tbody>
      </table>}
    </div>
  </main>;
}