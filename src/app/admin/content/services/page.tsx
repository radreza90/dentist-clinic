"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { RichEditor } from "@/components/editor/RichEditor";

type Localized = { fa: string; en: string };
type Service = { _id: string; slug: string; title: Localized; excerpt?: Localized; status?: string };
type ServiceForm = { slug: string; title: Localized; excerpt: Localized; content: Localized; bookingFee: number; currency: string; status: string };

const empty: ServiceForm = {
  slug: "", title: { fa: "", en: "" }, excerpt: { fa: "", en: "" }, content: { fa: "", en: "" },
  bookingFee: 0, currency: "IRR", status: "draft",
};

export default function ServicesAdmin() {
  const [items,setItems]=useState<Service[]>([]);
  const [form,setForm]=useState<ServiceForm>({...empty,title:{...empty.title},excerpt:{...empty.excerpt},content:{...empty.content}});
  const [editing,setEditing]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const q=search?"?search="+encodeURIComponent(search):"";
      const r=await fetch("/api/v1/admin/services"+q,{cache:"no-store"}); const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت خدمات");
      setItems(p.data.items);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}finally{setLoading(false);}
  },[search]);

  useEffect(()=>{void load();},[load]);

  function reset(){setEditing(null);setForm({...empty,title:{...empty.title},excerpt:{...empty.excerpt},content:{...empty.content}});setError("");}

  async function submit(e:FormEvent){
    e.preventDefault();setSaving(true);setError("");
    try{
      const r=await fetch(editing?"/api/v1/admin/services/"+editing:"/api/v1/admin/services",{
        method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form),
      });
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره انجام نشد");
      reset();await load();
    }catch(err){setError(err instanceof Error?err.message:"خطا");}finally{setSaving(false);}
  }

  async function edit(item:Service){
    setError("");
    try{
      const r=await fetch("/api/v1/admin/services/"+item._id,{cache:"no-store"});const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت خدمت");
      const data=p.data;
      setEditing(item._id);
      setForm({
        slug:data.slug,title:data.title||{fa:"",en:""},excerpt:data.excerpt||{fa:"",en:""},
        content:data.content||{fa:"",en:""},bookingFee:data.bookingFee||0,currency:data.currency||"IRR",status:data.status||"draft",
      });
      window.scrollTo({top:0,behavior:"smooth"});
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
  }

  async function archive(id:string){
    if(!window.confirm("این خدمت به بایگانی منتقل شود؟"))return;
    const r=await fetch("/api/v1/admin/services/"+id,{method:"DELETE"});const p=await r.json();
    if(!r.ok||!p.success)setError(p.error?.message||"عملیات ناموفق بود");else await load();
  }

  return <main>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <div><h1>خدمات</h1><p style={{color:"#666"}}>ایجاد و مدیریت خدمات قابل رزرو کلینیک.</p></div>
      <a href="/admin/content">بازگشت به محتوا</a>
    </div>

    <form onSubmit={submit} style={{background:"#fff",border:"1px solid #ddd",borderRadius:14,padding:20,margin:"24px 0",display:"grid",gap:14}}>
      <h2 style={{margin:0}}>{editing?"ویرایش خدمت":"افزودن خدمت"}</h2>
      <input required value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="slug" dir="ltr"/>
      <input required value={form.title.fa} onChange={e=>setForm({...form,title:{...form.title,fa:e.target.value}})} placeholder="عنوان فارسی"/>
      <input value={form.title.en} onChange={e=>setForm({...form,title:{...form.title,en:e.target.value}})} placeholder="English title" dir="ltr"/>
      <textarea value={form.excerpt.fa} onChange={e=>setForm({...form,excerpt:{...form.excerpt,fa:e.target.value}})} placeholder="خلاصه فارسی" rows={3}/>
      <textarea value={form.excerpt.en} onChange={e=>setForm({...form,excerpt:{...form.excerpt,en:e.target.value}})} placeholder="English excerpt" dir="ltr" rows={3}/>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
        <input type="number" min={0} value={form.bookingFee} onChange={e=>setForm({...form,bookingFee:Number(e.target.value)})} placeholder="هزینه رزرو"/>
        <input value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} placeholder="IRR" dir="ltr"/>
      </div>

      <label>محتوای فارسی</label>
      <RichEditor value={form.content.fa} onChange={value=>setForm({...form,content:{...form.content,fa:value}})}/>
      <label>English content</label>
      <RichEditor value={form.content.en} onChange={value=>setForm({...form,content:{...form.content,en:value}})} placeholder="Write the service content…"/>

      <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
        <option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option>
        <option value="scheduled">زمان‌بندی‌شده</option><option value="archived">بایگانی</option>
      </select>
      {error&&<p style={{color:"#b42318"}}>{error}</p>}
      <div style={{display:"flex",gap:10}}>
        <button disabled={saving} type="submit">{saving?"در حال ذخیره…":editing?"ذخیره تغییرات":"ایجاد خدمت"}</button>
        {editing&&<button type="button" onClick={reset}>انصراف</button>}
      </div>
    </form>

    <div style={{display:"flex",gap:10,marginBottom:16}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی خدمت..." style={{flex:1}}/>
      <button type="button" onClick={()=>void load()}>بازخوانی</button>
    </div>
    <div style={{background:"#fff",border:"1px solid #ddd",borderRadius:14,overflow:"auto"}}>
      {loading?<p style={{padding:20}}>در حال بارگذاری…</p>:items.length===0?<p style={{padding:20}}>موردی یافت نشد.</p>:
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr><th style={{padding:12,textAlign:"right"}}>عنوان</th><th>Slug</th><th>هزینه</th><th>وضعیت</th><th>عملیات</th></tr></thead>
        <tbody>{items.map(item=><tr key={item._id} style={{borderTop:"1px solid #eee"}}>
          <td style={{padding:12}}>{item.title?.fa||item.title?.en||"—"}</td><td dir="ltr">{item.slug}</td>
          <td>—</td><td>{item.status||"draft"}</td>
          <td style={{padding:12,display:"flex",gap:8}}><button type="button" onClick={()=>void edit(item)}>ویرایش</button><button type="button" onClick={()=>void archive(item._id)}>بایگانی</button></td>
        </tr>)}</tbody>
      </table>}
    </div>
  </main>;
}