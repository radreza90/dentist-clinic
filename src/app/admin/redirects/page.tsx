"use client";

import { useEffect, useState } from "react";

type Redirect={_id:string;from:string;to:string;statusCode:301|302;active:boolean};
const empty=():Omit<Redirect,"_id">=>({from:"",to:"",statusCode:301,active:true});

export default function RedirectsAdmin(){
  const [items,setItems]=useState<Redirect[]>([]);
  const [form,setForm]=useState(empty());
  const [editing,setEditing]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      const r=await fetch("/api/v1/admin/redirects",{cache:"no-store"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت Redirectها");
      setItems(p.data||[]);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);

  function reset(){setForm(empty());setEditing(null);}
  function edit(item:Redirect){setEditing(item._id);setForm({from:item.from,to:item.to,statusCode:item.statusCode,active:item.active});}

  async function save(){
    setSaving(true);setError("");setMessage("");
    try{
      const url=editing?"/api/v1/admin/redirects/"+editing:"/api/v1/admin/redirects";
      const r=await fetch(url,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره Redirect ناموفق بود");
      setMessage(editing?"Redirect به‌روزرسانی شد.":"Redirect ایجاد شد.");reset();await load();
    }catch(e){setError(e instanceof Error?e.message:"ذخیره ناموفق بود");}
    finally{setSaving(false);}
  }

  async function remove(id:string){
    if(!window.confirm("این Redirect حذف شود؟"))return;
    const r=await fetch("/api/v1/admin/redirects/"+id,{method:"DELETE"});
    const p=await r.json();
    if(!r.ok||!p.success){setError(p.error?.message||"حذف ناموفق بود");return;}
    await load();
  }

  if(loading)return <main><h1>Redirectها</h1><p>در حال بارگذاری…</p></main>;
  return <main style={{maxWidth:1100}}>
    <h1>مدیریت Redirectها</h1>
    <p style={{color:"#667085"}}>برای انتقال URLهای قدیمی به آدرس جدید از این بخش استفاده کنید.</p>
    {message&&<p style={{color:"#027a48"}}>{message}</p>}
    {error&&<p style={{color:"#b42318"}}>{error}</p>}

    <section style={{marginTop:20,padding:20,background:"#fff",border:"1px solid #e4e7ec",borderRadius:16,display:"grid",gap:12}}>
      <h2 style={{margin:0}}>{editing?"ویرایش Redirect":"افزودن Redirect"}</h2>
      <input value={form.from} onChange={e=>setForm({...form,from:e.target.value})} placeholder="/old-url" dir="ltr"/>
      <input value={form.to} onChange={e=>setForm({...form,to:e.target.value})} placeholder="/new-url یا https://example.com" dir="ltr"/>
      <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
        <label>کد <select value={form.statusCode} onChange={e=>setForm({...form,statusCode:Number(e.target.value) as 301|302})}><option value={301}>301 دائمی</option><option value={302}>302 موقت</option></select></label>
        <label><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> فعال</label>
      </div>
      <div style={{display:"flex",gap:8}}><button type="button" onClick={()=>void save()} disabled={saving}>{saving?"در حال ذخیره…":"ذخیره"}</button>{editing&&<button type="button" onClick={reset}>انصراف</button>}</div>
    </section>

    <section style={{marginTop:16,padding:20,background:"#fff",border:"1px solid #e4e7ec",borderRadius:16}}>
      <h2 style={{marginTop:0}}>Redirectها</h2>
      {items.length===0?<p>هنوز Redirectی ثبت نشده است.</p>:
      <div style={{display:"grid",gap:10}}>{items.map(item=><div key={item._id} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:12,alignItems:"center",border:"1px solid #eee",padding:12,borderRadius:10}}>
        <div><strong dir="ltr">{item.from}</strong><div dir="ltr" style={{color:"#667085"}}>→ {item.to}</div></div>
        <span>{item.statusCode} · {item.active?"فعال":"غیرفعال"}</span>
        <div style={{display:"flex",gap:6}}><button type="button" onClick={()=>edit(item)}>ویرایش</button><button type="button" onClick={()=>void remove(item._id)}>حذف</button></div>
      </div>)}</div>}
    </section>
  </main>;
}
