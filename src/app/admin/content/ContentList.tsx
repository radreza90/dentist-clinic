"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Item={_id:string;slug:string;title?:{fa?:string;en?:string};name?:{fa?:string;en?:string};status?:string};

export function ContentList({title,endpoint,archive=true,createHref,editBase}:{title:string;endpoint:string;archive?:boolean;createHref?:string;editBase?:string}){
  const [items,setItems]=useState<Item[]>([]);const [search,setSearch]=useState("");const [status,setStatus]=useState("");
  const [loading,setLoading]=useState(true);const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      const params=new URLSearchParams();if(search)params.set("search",search);if(status)params.set("status",status);
      const r=await fetch(endpoint+"?"+params.toString(),{cache:"no-store"});const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت اطلاعات");setItems(p.data.items||[]);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}finally{setLoading(false);}
  }
  useEffect(()=>{const timer=setTimeout(()=>void load(),250);return()=>clearTimeout(timer);},[search,status]);

  async function archiveItem(id:string){
    if(!window.confirm("این مورد به بایگانی منتقل شود؟"))return;
    const r=await fetch(endpoint+"/"+id,{method:"DELETE"});const p=await r.json();
    if(!r.ok||!p.success)setError(p.error?.message||"عملیات ناموفق بود");else void load();
  }

  return <main>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
      <div><h1>{title}</h1><p style={{color:"#666"}}>مدیریت محتوای این بخش.</p></div>
      <div style={{display:"flex",gap:8}}>{createHref&&<Link href={createHref} style={{padding:"9px 12px",borderRadius:8,background:"#111",color:"#fff"}}>افزودن</Link>}<Link href="/admin/content">بازگشت به محتوا</Link></div>
    </div>
    <div style={{display:"flex",gap:10,margin:"24px 0",flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو..." style={{flex:"1 1 280px"}}/>
      <select value={status} onChange={e=>setStatus(e.target.value)}><option value="">همه وضعیت‌ها</option><option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option><option value="scheduled">زمان‌بندی‌شده</option><option value="archived">بایگانی</option></select>
      <button onClick={()=>void load()} type="button">بازخوانی</button>
    </div>
    {error&&<p style={{color:"#b42318"}}>{error}</p>}
    <div style={{background:"#fff",border:"1px solid #ddd",borderRadius:14,overflow:"auto"}}>
      {loading?<p style={{padding:20}}>در حال بارگذاری…</p>:items.length===0?<p style={{padding:20}}>موردی یافت نشد.</p>:
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr><th style={{padding:12,textAlign:"right"}}>عنوان</th><th>Slug</th><th>وضعیت</th><th>عملیات</th></tr></thead>
        <tbody>{items.map(item=><tr key={item._id} style={{borderTop:"1px solid #eee"}}>
          <td style={{padding:12}}>{item.title?.fa||item.name?.fa||item.title?.en||item.name?.en||"—"}</td><td dir="ltr">{item.slug}</td><td>{item.status||"—"}</td>
          <td style={{padding:12,display:"flex",gap:8}}>
            {editBase&&<Link href={editBase+"/"+item._id}>ویرایش</Link>}
            {archive&&item.status!=="archived"&&<button onClick={()=>void archiveItem(item._id)} type="button">بایگانی</button>}
          </td>
        </tr>)}</tbody>
      </table>}
    </div>
  </main>;
}