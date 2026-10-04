"use client";

import { ChangeEvent, useEffect, useState } from "react";

type Media={_id:string;url:string;mimeType:string;size:number;alt?:{fa?:string;en?:string};title?:{fa?:string;en?:string}};

export default function MediaAdmin(){
  const [items,setItems]=useState<Media[]>([]);
  const [loading,setLoading]=useState(true);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      const r=await fetch("/api/v1/admin/media",{cache:"no-store"});const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت رسانه");
      setItems(p.data||[]);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);

  async function upload(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return;
    setUploading(true);setError("");
    try{
      const form=new FormData();form.append("file",file);
      const r=await fetch("/api/v1/admin/media",{method:"POST",body:form});const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"آپلود ناموفق بود");
      await load();
    }catch(err){setError(err instanceof Error?err.message:"آپلود ناموفق بود");}
    finally{setUploading(false);e.target.value="";}
  }

  return <main>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <div><h1>کتابخانه رسانه</h1><p style={{color:"#666"}}>فایل‌های مرکزی قابل استفاده در صفحات، مقالات، پزشکان و نمونه‌کارها.</p></div>
      <label style={{border:"1px solid #ddd",padding:"10px 14px",borderRadius:8,cursor:"pointer"}}>
        {uploading?"در حال آپلود…":"آپلود فایل"}
        <input hidden type="file" accept="image/*,video/*,application/pdf" onChange={upload} disabled={uploading}/>
      </label>
    </div>
    {error&&<p style={{color:"#b42318"}}>{error}</p>}
    {loading?<p>در حال بارگذاری…</p>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:14,marginTop:24}}>
      {items.map(item=><article key={item._id} style={{border:"1px solid #ddd",borderRadius:12,padding:10,background:"#fff"}}>
        {item.mimeType.startsWith("image/")?<img src={item.url} alt={item.alt?.fa||item.title?.fa||""} style={{width:"100%",height:150,objectFit:"cover",borderRadius:8}}/>:
        item.mimeType.startsWith("video/")?<video src={item.url} controls style={{width:"100%",height:150,objectFit:"cover",borderRadius:8}}/>:
        <div style={{height:150,display:"grid",placeItems:"center",background:"#f2f3f5",borderRadius:8}}>PDF</div>}
        <div style={{fontSize:12,marginTop:8,wordBreak:"break-all"}}>{item.title?.fa||item.alt?.fa||item.mimeType}</div>
        <div style={{fontSize:11,color:"#777",marginTop:4}}>{Math.ceil(item.size/1024)} KB</div>
      </article>)}
    </div>}
  </main>;
}