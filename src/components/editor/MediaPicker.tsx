"use client";

import { ChangeEvent, useEffect, useState } from "react";

type Media={_id:string;url:string;mimeType:string;size:number;alt?:{fa?:string;en?:string};title?:{fa?:string;en?:string}};

type Mode="image"|"video"|"file";

export function MediaPicker({open,mode,onClose,onSelect}:{open:boolean;mode:Mode;onClose:()=>void;onSelect:(media:Media)=>void}){
  const [items,setItems]=useState<Media[]>([]);
  const [loading,setLoading]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState("");

  const label=mode==="image"?"تصویر":mode==="video"?"ویدئو":"فایل";
  const accept=mode==="image"?"image/*":mode==="video"?"video/*":".pdf,application/pdf,image/*";
  const matches=(item:Media)=>mode==="image"?item.mimeType.startsWith("image/"):mode==="video"?item.mimeType.startsWith("video/"):item.mimeType==="application/pdf"||item.mimeType.startsWith("image/");

  async function load(){
    setLoading(true);setError("");
    try{
      const r=await fetch("/api/v1/admin/media",{cache:"no-store"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت رسانه");
      setItems((p.data||[]).filter((item:Media)=>matches(item)));
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
    finally{setLoading(false);}
  }

  useEffect(()=>{if(open)void load();},[open,mode]);

  async function upload(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];if(!file)return;
    setUploading(true);setError("");
    try{
      const form=new FormData();form.append("file",file);
      const r=await fetch("/api/v1/admin/media",{method:"POST",body:form});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"آپلود ناموفق بود");
      onSelect(p.data);
    }catch(e){setError(e instanceof Error?e.message:"آپلود ناموفق بود");}
    finally{setUploading(false);event.target.value="";}
  }

  if(!open)return null;

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,padding:24,overflow:"auto"}}>
    <div dir="rtl" style={{maxWidth:1000,margin:"30px auto",background:"#fff",borderRadius:16,padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
        <h2 style={{margin:0}}>انتخاب {label}</h2>
        <button type="button" onClick={onClose}>بستن</button>
      </div>
      <div style={{margin:"16px 0",display:"flex",alignItems:"center",gap:10}}>
        <label style={{border:"1px solid #ddd",padding:"8px 12px",borderRadius:8,cursor:"pointer"}}>
          {uploading?"در حال آپلود…":`آپلود ${label}`}
          <input hidden type="file" accept={accept} onChange={upload} disabled={uploading}/>
        </label>
        <button type="button" onClick={()=>void load()}>بازخوانی</button>
      </div>
      {error&&<p style={{color:"#b42318"}}>{error}</p>}
      {loading?<p>در حال بارگذاری…</p>:items.length===0?<p>رسانه‌ای در این نوع پیدا نشد.</p>:
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12}}>
        {items.map(item=><button key={item._id} type="button" onClick={()=>onSelect(item)} style={{textAlign:"right",padding:8,border:"1px solid #ddd",borderRadius:10,background:"#fff"}}>
          {mode==="image"&&item.mimeType.startsWith("image/")?<img src={item.url} alt={item.alt?.fa||item.title?.fa||""} style={{width:"100%",aspectRatio:"4/3",objectFit:"cover",display:"block",borderRadius:6}}/>:
          <div style={{aspectRatio:"4/3",display:"grid",placeItems:"center",background:"#f2f4f7",color:"#344054",borderRadius:6,fontWeight:700}}>{item.mimeType==="application/pdf"?"PDF":mode==="video"?"▶ ویدئو":"فایل"}</div>}
          <div style={{marginTop:6,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title?.fa||item.alt?.fa||item.mimeType}</div>
        </button>)}
      </div>}
    </div>
  </div>;
}
