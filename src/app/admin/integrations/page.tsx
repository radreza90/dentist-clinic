"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

type Field={key:string;label:string;type:"text"|"password"|"url";required?:boolean;secret?:boolean;placeholder?:string};
type Integration={
  id:string;key:string;type:"payment"|"sms";provider:string;
  name:{fa:string;en:string};description?:{fa?:string;en?:string};
  enabled:boolean;isDefault:boolean;config:Record<string,string>;secretSet:Record<string,boolean>;
  fields:Field[];lastTestAt:string|null;lastTestOk:boolean|null;lastTestMessage:string;
};

export default function IntegrationsAdmin(){
  const {toast}=useAdminFeedback();
  const [items,setItems]=useState<Integration[]>([]);
  const [configs,setConfigs]=useState<Record<string,Record<string,string>>>({});
  const [testRecipients,setTestRecipients]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState<string|null>(null);
  const [testing,setTesting]=useState<string|null>(null);
  const [smsTesting,setSmsTesting]=useState<string|null>(null);
  const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      const r=await fetch("/api/v1/admin/integrations",{cache:"no-store"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت ماژول‌ها");
      const list=(p.data.items||[]) as Integration[];
      setItems(list);
      const next:Record<string,Record<string,string>>={};
      for(const item of list)next[item.id]={...(item.config||{})};
      setConfigs(next);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
    finally{setLoading(false);}
  }

  useEffect(()=>{void load();},[]);

  const grouped=useMemo(()=>({
    payment:items.filter(x=>x.type==="payment"),
    sms:items.filter(x=>x.type==="sms")
  }),[items]);

  function setConfig(id:string,key:string,value:string){
    setConfigs(prev=>({...prev,[id]:{...(prev[id]||{}),[key]:value}}));
  }

  async function save(item:Integration){
    setSaving(item.id);setError("");
    try{
      const r=await fetch("/api/v1/admin/integrations/"+item.id,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          enabled:item.enabled,
          isDefault:item.isDefault,
          config:configs[item.id]||{}
        })
      });
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره ماژول ناموفق بود");
      toast("تنظیمات "+(item.name?.fa||item.provider)+" ذخیره شد.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
    finally{setSaving(null);}
  }

  async function toggle(item:Integration,enabled:boolean){
    const next={...item,enabled,isDefault:enabled?item.isDefault:false};
    setItems(items.map(x=>x.id===item.id?next:x));
    await save(next);
  }

  async function makeDefault(item:Integration){
    const nextItems=items.map(x=>x.id===item.id?{...x,enabled:true,isDefault:true}:x);
    setItems(nextItems);
    await save({...item,enabled:true,isDefault:true});
  }

  async function testConnection(item:Integration){
    setTesting(item.id);setError("");
    try{
      const r=await fetch("/api/v1/admin/integrations/"+item.id+"/test",{method:"POST"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"بررسی اتصال ناموفق بود");
      toast(p.data?.message||"اتصال بررسی شد.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"بررسی ناموفق بود");await load();}
    finally{setTesting(null);}
  }

  async function sendSmsTest(item:Integration){
    const recipient=testRecipients[item.id]?.trim()||"";
    if(!recipient){
      setError("برای تست واقعی IPPanel ابتدا شماره مقصد را وارد کنید.");
      return;
    }

    setSmsTesting(item.id);setError("");
    try{
      const r=await fetch("/api/v1/admin/integrations/"+item.id+"/sms-test",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({recipient})
      });
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"ارسال پیامک تستی ناموفق بود");
      toast(p.data?.message||"پیامک تستی ارسال شد.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"ارسال پیامک تستی ناموفق بود");await load();}
    finally{setSmsTesting(null);}
  }

  function card(item:Integration){
    return <article key={item.id} style={{background:"#fff",border:"1px solid #ddd",borderRadius:16,padding:20,display:"grid",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"start",flexWrap:"wrap"}}>
        <div><h2 style={{margin:"0 0 6px"}}>{item.name.fa||item.provider}</h2><p style={{margin:0,color:"#666"}}>{item.description?.fa||""}</p><small dir="ltr">{item.provider}</small></div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <label><input type="checkbox" checked={item.enabled} onChange={e=>void toggle(item,e.target.checked)}/> فعال</label>
          <button className="admin-action-create" type="button" onClick={()=>void makeDefault(item)} disabled={!item.enabled}>{item.isDefault?"پیش‌فرض":"انتخاب به‌عنوان پیش‌فرض"}</button>
        </div>
      </div>

      {item.fields.length>0&&<div style={{display:"grid",gap:10}}>
        {item.fields.map(field=>{
          const value=configs[item.id]?.[field.key]||"";
          return <label key={field.key} style={{display:"grid",gap:6}}>
            <span>{field.label}{field.required?" *":""}</span>
            <input
              type={field.type==="password"?"password":"text"}
              value={value}
              onChange={e=>setConfig(item.id,field.key,e.target.value)}
              placeholder={field.secret&&item.secretSet[field.key]?"مقدار فعلی حفظ می‌شود؛ برای تغییر مقدار جدید وارد کنید":field.placeholder}
              dir={field.type==="url"||field.secret?"ltr":undefined}
            />
          </label>;
        })}
      </div>}

      {item.provider==="ippanel"&&item.type==="sms"&&<div style={{border:"1px dashed #bbb",borderRadius:12,padding:14,display:"grid",gap:10}}>
        <strong>تست واقعی ارسال پیامک</strong>
        <span style={{fontSize:13,color:"#666"}}>این دکمه واقعاً یک SMS ارسال می‌کند و فقط بعد از وارد کردن شماره مقصد فعال می‌شود.</span>
        <input
          value={testRecipients[item.id]||""}
          onChange={e=>setTestRecipients(prev=>({...prev,[item.id]:e.target.value}))}
          placeholder="مثال: 09120000000"
          dir="ltr"
          inputMode="tel"
        />
        <button className="admin-action-warning" type="button" onClick={()=>void sendSmsTest(item)} disabled={smsTesting===item.id||!item.enabled}>
          {smsTesting===item.id?"در حال ارسال…":"ارسال پیامک تستی"}
        </button>
      </div>}

      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button className="admin-action-success" type="button" onClick={()=>void save(item)} disabled={saving===item.id}>{saving===item.id?"در حال ذخیره…":"ذخیره تنظیمات"}</button>
        <button className="admin-action-neutral" type="button" onClick={()=>void testConnection(item)} disabled={testing===item.id}>{testing===item.id?"در حال بررسی…":"بررسی اتصال بدون ارسال"}</button>
      </div>

      {item.lastTestAt&&<small style={{color:item.lastTestOk?"green":"#b42318"}}>{item.lastTestMessage||"نتیجه آخرین بررسی"} · {new Date(item.lastTestAt).toLocaleString("fa-IR")}</small>}
    </article>;
  }

  if(loading)return <main><h1>ماژول‌ها</h1><p>در حال بارگذاری…</p></main>;

  return <main>
    <h1>ماژول‌ها</h1>
    <p style={{color:"#666",maxWidth:900}}>درگاه پرداخت و سرویس پیامک از این بخش مدیریت می‌شوند. تنظیمات provider در دیتابیس ذخیره و credentialهای حساس رمزنگاری می‌شوند. فعال‌سازی هر ماژول و انتخاب provider پیش‌فرض کاملاً مستقل از کد نوبت‌دهی است.</p>
    {error&&<p style={{color:"#b42318"}}>{error}</p>}

    <section style={{display:"grid",gap:16,marginTop:24}}>
      <h2 style={{marginBottom:0}}>درگاه‌های پرداخت</h2>
      {grouped.payment.length?grouped.payment.map(card):<p>درگاهی ثبت نشده است.</p>}
    </section>
    <section style={{display:"grid",gap:16,marginTop:36}}>
      <h2 style={{marginBottom:0}}>سرویس‌های پیامک</h2>
      {grouped.sms.length?grouped.sms.map(card):<p>سرویس پیامکی ثبت نشده است.</p>}
    </section>
  </main>;
}
