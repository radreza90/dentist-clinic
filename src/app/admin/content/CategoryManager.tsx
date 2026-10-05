"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Localized={fa:string;en:string};
type Category={_id:string;slug:string;name:Localized;description?:Localized};

const empty=():Category=>({_id:"",slug:"",name:{fa:"",en:""},description:{fa:"",en:""}});

export function CategoryManager({title,endpoint,backHref}:{title:string;endpoint:string;backHref:string}){
  const [items,setItems]=useState<Category[]>([]);
  const [form,setForm]=useState<Category>(empty());
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const r=await fetch(endpoint+"?limit=100",{cache:"no-store"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت دسته‌بندی‌ها");
      setItems(p.data?.items||[]);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
    finally{setLoading(false);}
  },[endpoint]);
  useEffect(()=>{void load();},[load]);

  function reset(){setForm(empty());setMessage("");}

  async function save(e:FormEvent){
    e.preventDefault();setSaving(true);setError("");setMessage("");
    try{
      const r=await fetch(form._id?endpoint+"/"+form._id:endpoint,{method:form._id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        slug:form.slug,name:form.name,description:form.description
      })});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره ناموفق بود");
      setMessage(form._id?"دسته‌بندی ویرایش شد.":"دسته‌بندی ایجاد شد.");
      reset();await load();
    }catch(e){setError(e instanceof Error?e.message:"ذخیره ناموفق بود");}
    finally{setSaving(false);}
  }

  async function remove(item:Category){
    if(!window.confirm(`دسته «${item.name?.fa||item.name?.en||item.slug}» حذف شود؟`))return;
    setError("");setMessage("");
    const r=await fetch(endpoint+"/"+item._id,{method:"DELETE"});const p=await r.json();
    if(!r.ok||!p.success)setError(p.error?.message||"حذف ناموفق بود");else await load();
  }

  return <main>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <div><h1 style={{marginBottom:6}}>{title}</h1><p style={{margin:0,color:"#667085"}}>مدیریت عنوان، slug و توضیحات دسته‌بندی.</p></div>
      <Link href={backHref}>بازگشت</Link>
    </div>

    <form onSubmit={save} style={{marginTop:24,background:"#fff",border:"1px solid #e4e7ec",borderRadius:16,padding:20,display:"grid",gap:14}}>
      <h2 style={{margin:0}}>{form._id?"ویرایش دسته‌بندی":"افزودن دسته‌بندی"}</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
        <input required value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="slug" dir="ltr"/>
        <input required value={form.name.fa} onChange={e=>setForm({...form,name:{...form.name,fa:e.target.value}})} placeholder="نام فارسی"/>
        <input value={form.name.en} onChange={e=>setForm({...form,name:{...form.name,en:e.target.value}})} placeholder="English name" dir="ltr"/>
      </div>
      <textarea value={form.description?.fa||""} onChange={e=>setForm({...form,description:{...form.description,fa:e.target.value}})} placeholder="توضیحات فارسی" rows={3}/>
      <textarea value={form.description?.en||""} onChange={e=>setForm({...form,description:{...form.description,en:e.target.value}})} placeholder="English description" dir="ltr" rows={3}/>
      <div style={{display:"flex",gap:10}}>
        <button type="submit" disabled={saving}>{saving?"در حال ذخیره…":form._id?"ذخیره تغییرات":"ایجاد دسته‌بندی"}</button>
        {form._id&&<button type="button" onClick={reset}>انصراف</button>}
      </div>
    </form>

    {error&&<p style={{color:"#b42318"}}>{error}</p>}
    {message&&<p style={{color:"#027a48"}}>{message}</p>}

    <div style={{marginTop:18,background:"#fff",border:"1px solid #e4e7ec",borderRadius:16,overflow:"auto"}}>
      {loading?<p style={{padding:20}}>در حال بارگذاری…</p>:items.length===0?<p style={{padding:20}}>دسته‌بندی‌ای وجود ندارد.</p>:
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr><th style={{padding:12,textAlign:"right"}}>نام</th><th>Slug</th><th>عملیات</th></tr></thead>
        <tbody>{items.map(item=><tr key={item._id} style={{borderTop:"1px solid #eef0f3"}}>
          <td style={{padding:12}}>{item.name?.fa||item.name?.en||"—"}</td>
          <td dir="ltr">{item.slug}</td>
          <td style={{padding:12,display:"flex",gap:8}}>
            <button type="button" onClick={()=>setForm({...item,description:item.description||{fa:"",en:""}})}>ویرایش</button>
            <button type="button" onClick={()=>void remove(item)}>حذف</button>
          </td>
        </tr>)}</tbody>
      </table>}
    </div>
  </main>;
}
