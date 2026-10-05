"use client";

import { useEffect, useState } from "react";

type MenuItem={_id?:string;label:{fa:string;en:string};href:string;type:"internal"|"external";targetBlank:boolean;parentId:string|null;position:number;enabled:boolean};
type Menu={key:string;name:{fa:string;en:string};location:"header"|"footer";items:MenuItem[]};

const emptyItem=():MenuItem=>({label:{fa:"",en:""},href:"",type:"internal",targetBlank:false,parentId:null,position:0,enabled:true});
const emptyMenu=(location:"header"|"footer"):Menu=>({key:location,name:{fa:location==="header"?"منوی اصلی":"منوی فوتر",en:location==="header"?"Main menu":"Footer menu"},location,items:[]});

export default function MenusAdmin(){
  const [location,setLocation]=useState<"header"|"footer">("header");
  const [form,setForm]=useState<Menu>(()=>emptyMenu("header"));
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [draft,setDraft]=useState<MenuItem>(emptyItem());
  const [editing,setEditing]=useState<number|null>(null);

  async function load(nextLocation=location){
    setLoading(true);setError("");setMessage("");
    try{
      const r=await fetch("/api/v1/admin/menus?location="+nextLocation,{cache:"no-store"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت منو");
      const found=(p.data||[])[0] as Menu|undefined;
      setForm(found?{...found,items:(found.items||[]).map(x=>({...x,parentId:x.parentId||null}))}:emptyMenu(nextLocation));
      setDraft(emptyItem());setEditing(null);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
    finally{setLoading(false);}
  }

  useEffect(()=>{void load(location);},[location]);

  function addOrUpdateItem(){
    if(!draft.href.trim()||!draft.label.fa.trim())return;
    const item={...draft,href:draft.href.trim(),position:editing===null?form.items.length:draft.position};
    const items=[...form.items];
    if(editing===null)items.push(item);
    else items[editing]=item;
    setForm({...form,items});
    setDraft(emptyItem());setEditing(null);
  }

  function editItem(index:number){setDraft({...form.items[index]});setEditing(index);}
  function removeItem(index:number){setForm({...form,items:form.items.filter((_,i)=>i!==index).map((x,i)=>({...x,position:i}))});}
  function move(index:number,direction:-1|1){
    const target=index+direction;if(target<0||target>=form.items.length)return;
    const items=[...form.items];[items[index],items[target]]=[items[target],items[index]];
    setForm({...form,items:items.map((x,i)=>({...x,position:i}))});
  }

  async function save(){
    setSaving(true);setError("");setMessage("");
    try{
      const r=await fetch("/api/v1/admin/menus",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره منو ناموفق بود");
      setMessage("منو ذخیره شد.");await load();
    }catch(e){setError(e instanceof Error?e.message:"ذخیره ناموفق بود");}
    finally{setSaving(false);}
  }

  if(loading)return <main><h1>منوها</h1><p>در حال بارگذاری…</p></main>;

  return <main style={{maxWidth:1100}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}>
      <div><h1>مدیریت منوها</h1><p style={{color:"#667085"}}>منوی سربرگ و فوتر را مدیریت کنید، ترتیب آیتم‌ها را تغییر دهید و لینک داخلی یا خارجی بسازید.</p></div>
      <div style={{display:"flex",gap:8}}><button type="button" onClick={()=>setLocation("header")}>سربرگ</button><button type="button" onClick={()=>setLocation("footer")}>فوتر</button></div>
    </div>

    {message&&<p style={{color:"#027a48"}}>{message}</p>}{error&&<p style={{color:"#b42318"}}>{error}</p>}

    <section style={{marginTop:20,padding:20,background:"#fff",border:"1px solid #e4e7ec",borderRadius:16,display:"grid",gap:14}}>
      <h2 style={{margin:0}}>مشخصات منو</h2>
      <input value={form.key} onChange={e=>setForm({...form,key:e.target.value})} placeholder="menu key" dir="ltr"/>
      <input value={form.name.fa} onChange={e=>setForm({...form,name:{...form.name,fa:e.target.value}})} placeholder="نام فارسی"/>
      <input value={form.name.en} onChange={e=>setForm({...form,name:{...form.name,en:e.target.value}})} placeholder="English name" dir="ltr"/>
    </section>

    <section style={{marginTop:16,padding:20,background:"#fff",border:"1px solid #e4e7ec",borderRadius:16,display:"grid",gap:14}}>
      <h2 style={{margin:0}}>{editing===null?"افزودن آیتم":"ویرایش آیتم"}</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
        <input value={draft.label.fa} onChange={e=>setDraft({...draft,label:{...draft.label,fa:e.target.value}})} placeholder="عنوان فارسی"/>
        <input value={draft.label.en} onChange={e=>setDraft({...draft,label:{...draft.label,en:e.target.value}})} placeholder="English label" dir="ltr"/>
        <input value={draft.href} onChange={e=>setDraft({...draft,href:e.target.value})} placeholder="/services یا https://example.com" dir="ltr"/>
        <select value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value as MenuItem["type"]})}><option value="internal">داخلی</option><option value="external">خارجی</option></select>
        <select value={draft.parentId||""} onChange={e=>setDraft({...draft,parentId:e.target.value||null})}>
          <option value="">بدون والد</option>
          {form.items.map((item,index)=><option key={item._id||index} value={item._id||String(index)}>{item.label.fa||item.label.en||item.href}</option>)}
        </select>
      </div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
        <label><input type="checkbox" checked={draft.targetBlank} onChange={e=>setDraft({...draft,targetBlank:e.target.checked})}/> باز شدن در تب جدید</label>
        <label><input type="checkbox" checked={draft.enabled} onChange={e=>setDraft({...draft,enabled:e.target.checked})}/> فعال</label>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button type="button" onClick={addOrUpdateItem}>{editing===null?"افزودن آیتم":"ذخیره آیتم"}</button>
        {editing!==null&&<button type="button" onClick={()=>{setDraft(emptyItem());setEditing(null);}}>انصراف</button>}
      </div>
    </section>

    <section style={{marginTop:16,padding:20,background:"#fff",border:"1px solid #e4e7ec",borderRadius:16}}>
      <h2 style={{marginTop:0}}>آیتم‌ها</h2>
      {form.items.length===0?<p>هنوز آیتمی ثبت نشده است.</p>:
      <div style={{display:"grid",gap:10}}>{form.items.map((item,index)=><div key={item._id||index} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:10,alignItems:"center",border:"1px solid #eee",padding:12,borderRadius:10}}>
        <div><strong>{item.label.fa||item.label.en}</strong><div dir="ltr" style={{color:"#667085",fontSize:12}}>{item.href}</div>{item.parentId&&<small>زیرمجموعه</small>}</div>
        <span>{item.enabled?"فعال":"غیرفعال"}</span>
        <div style={{display:"flex",gap:6}}><button type="button" onClick={()=>move(index,-1)}>↑</button><button type="button" onClick={()=>move(index,1)}>↓</button></div>
        <div style={{display:"flex",gap:6}}><button type="button" onClick={()=>editItem(index)}>ویرایش</button><button type="button" onClick={()=>removeItem(index)}>حذف</button></div>
      </div>)}</div>}
    </section>

    <button type="button" onClick={()=>void save()} disabled={saving} style={{marginTop:16}}>{saving?"در حال ذخیره…":"ذخیره منو"}</button>
  </main>;
}
