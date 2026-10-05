"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Revision={_id:string;version:number;action:"update"|"restore";createdAt:string;changedBy?:{firstName?:string;lastName?:string;email?:string;phone?:string}|null;snapshot:Record<string,unknown>};

export default function RevisionsPage(){
  const [items,setItems]=useState<Revision[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState<string|null>(null);
  const params=typeof window!=="undefined"?new URLSearchParams(window.location.search):null;
  const contentType=params?.get("contentType")||"";
  const contentId=params?.get("contentId")||"";

  async function load(){
    if(!contentType||!contentId){setError("شناسه محتوا ناقص است.");setLoading(false);return;}
    setLoading(true);setError("");
    try{
      const r=await fetch("/api/v1/admin/revisions?contentType="+encodeURIComponent(contentType)+"&contentId="+encodeURIComponent(contentId),{cache:"no-store"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت تاریخچه");
      setItems((p.data||[]) as Revision[]);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
    finally{setLoading(false);}
  }

  useEffect(()=>{void load();},[contentType,contentId]);

  async function restore(item:Revision){
    if(!window.confirm("نسخه "+item.version+" بازیابی شود؟"))return;
    setBusy(item._id);setError("");
    try{
      const r=await fetch("/api/v1/admin/revisions/"+item._id+"/restore",{method:"POST"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"بازیابی ناموفق بود");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"بازیابی ناموفق بود");}
    finally{setBusy(null);}
  }

  const title=contentType==="doctor"?"پزشک":contentType==="service"?"خدمت":contentType==="blog"?"مقاله":contentType==="portfolio"?"نمونه‌کار":"صفحه";
  return <main style={{maxWidth:1000}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}>
      <div><h1>تاریخچه {title}</h1><p style={{color:"#667085"}}>نسخه‌های ذخیره‌شده و امکان بازگردانی بدون حذف تاریخچه.</p></div>
      <Link href={"/admin/content/"+(contentType==="doctor"?"doctors":contentType==="service"?"services":contentType==="blog"?"blog":contentType==="portfolio"?"portfolio":"pages")}>بازگشت به محتوا</Link>
    </div>
    {error&&<p style={{color:"#b42318"}}>{error}</p>}
    <div style={{marginTop:20,display:"grid",gap:12}}>
      {loading?<p>در حال بارگذاری…</p>:items.length===0?<p>هنوز Revision‌ای ثبت نشده است.</p>:items.map(item=>{
        const actor=[item.changedBy?.firstName,item.changedBy?.lastName].filter(Boolean).join(" ")||item.changedBy?.email||item.changedBy?.phone||"کاربر";
        return <article key={item._id} style={{background:"#fff",border:"1px solid #e4e7ec",borderRadius:14,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",alignItems:"center"}}>
            <strong>نسخه {item.version} · {item.action==="restore"?"بازیابی":"ویرایش"}</strong>
            <small>{new Date(item.createdAt).toLocaleString("fa-IR")}</small>
          </div>
          <p style={{margin:"8px 0",color:"#667085"}}>توسط: {actor}</p>
          <details><summary>مشاهده Snapshot</summary><pre dir="ltr" style={{whiteSpace:"pre-wrap",overflow:"auto",background:"#f8fafc",padding:12,borderRadius:10}}>{JSON.stringify(item.snapshot,null,2)}</pre></details>
          <button type="button" onClick={()=>void restore(item)} disabled={busy===item._id} style={{marginTop:10}}>{busy===item._id?"در حال بازیابی…":"بازگردانی این نسخه"}</button>
        </article>;
      })}
    </div>
  </main>;
}
