"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

type Media={
  _id:string;key:string;url:string;mimeType:string;size:number;width?:number;height?:number;
  alt?:{fa?:string;en?:string};title?:{fa?:string;en?:string};caption?:{fa?:string;en?:string};
  storageDriver?:string;folder?:string;createdAt?:string;updatedAt?:string;
};
type MediaKind="all"|"image"|"video"|"document";

type PickerMode="image"|"video"|"file";

function Icon({name}:{name:"upload"|"search"|"copy"|"close"|"image"|"video"|"file"|"check"|"trash"}){
  const paths:Record<typeof name,React.ReactNode>={
    upload:<><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16.5v3A1.5 1.5 0 0 1 18.5 21h-13A1.5 1.5 0 0 1 4 19.5v-3"/></>,
    search:<><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4"/></>,
    copy:<><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></>,
    close:<><path d="m18 6-12 12M6 6l12 12"/></>,
    image:<><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
    video:<><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/></>,
    file:<><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7M8 14h8M8 18h8"/></>,
    check:<path d="m5 12 4 4L19 6"/>,
    trash:<><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function formatSize(size:number){
  if(size<1024)return `${size} بایت`;
  if(size<1024*1024)return `${(size/1024).toFixed(1)} کیلوبایت`;
  return `${(size/(1024*1024)).toFixed(2)} مگابایت`;
}

function kindOf(item:Media):Exclude<MediaKind,"all">{
  if(item.mimeType.startsWith("image/"))return "image";
  if(item.mimeType.startsWith("video/"))return "video";
  return "document";
}

export function MediaLibrary({selectionMode,onSelect,onClose}:{selectionMode?:PickerMode;onSelect?:(media:Media)=>void;onClose?:()=>void}={}){
  const {confirm,toast}=useAdminFeedback();
  const [items,setItems]=useState<Media[]>([]);
  const [loading,setLoading]=useState(true);
  const [uploading,setUploading]=useState(false);
  const [uploadOpen,setUploadOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [deleting,setDeleting]=useState(false);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  const [kind,setKind]=useState<MediaKind>("all");
  const [selected,setSelected]=useState<Media|null>(null);
  const [copied,setCopied]=useState(false);
  const [draft,setDraft]=useState({titleFa:"",altFa:"",captionFa:"",folder:"general"});

  async function load(){
    setLoading(true);setError("");
    try{
      const r=await fetch("/api/v1/admin/media",{cache:"no-store"});const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت رسانه");
      setItems(p.data||[]);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  useEffect(()=>{
    if(!selected&&!uploadOpen&&!selectionMode)return;
    function onKeyDown(event:KeyboardEvent){if(event.key==="Escape"){setSelected(null);setUploadOpen(false);if(selectionMode)onClose?.();}}
    window.addEventListener("keydown",onKeyDown);
    return ()=>window.removeEventListener("keydown",onKeyDown);
  },[selected,uploadOpen,selectionMode,onClose]);

  const visibleItems=useMemo(()=>items.filter(item=>{
    const matchesKind=selectionMode
      ? selectionMode==="file" ? item.mimeType==="application/pdf"||item.mimeType.startsWith("image/") : item.mimeType.startsWith(`${selectionMode}/`)
      : kind==="all"||kindOf(item)===kind;
    const haystack=[item.title?.fa,item.alt?.fa,item.caption?.fa,item.key,item.mimeType,item.folder].join(" ").toLocaleLowerCase("fa");
    return matchesKind&&haystack.includes(query.trim().toLocaleLowerCase("fa"));
  }),[items,kind,query,selectionMode]);
  const counts=useMemo(()=>({all:items.length,image:items.filter(i=>kindOf(i)==="image").length,video:items.filter(i=>kindOf(i)==="video").length,document:items.filter(i=>kindOf(i)==="document").length}),[items]);

  function openDetails(item:Media){
    setSelected(item);setCopied(false);setError("");
    setDraft({titleFa:item.title?.fa||"",altFa:item.alt?.fa||"",captionFa:item.caption?.fa||"",folder:item.folder||"general"});
  }

  async function upload(file:File){
    setUploading(true);setError("");
    try{
      const form=new FormData();form.append("file",file);
      const r=await fetch("/api/v1/admin/media",{method:"POST",body:form});const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"آپلود ناموفق بود");
      if(selectionMode){chooseMedia(p.data);}
      else{await load();setUploadOpen(false);toast("فایل با موفقیت بارگذاری شد.");}
    }catch(err){setError(err instanceof Error?err.message:"آپلود ناموفق بود");}
    finally{setUploading(false);}
  }

  function onFileChange(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    if(file)void upload(file);
    event.target.value="";
  }

  function chooseMedia(item:Media){
    onSelect?.(item);
    onClose?.();
  }

  async function copyLink(){
    if(!selected)return;
    try{
      await navigator.clipboard.writeText(new URL(selected.url,window.location.origin).href);
      setCopied(true);window.setTimeout(()=>setCopied(false),1800);
    }catch{setError("کپی لینک انجام نشد؛ دسترسی کلیپ‌بورد مرورگر را بررسی کنید.");}
  }

  async function saveDetails(){
    if(!selected)return;
    setSaving(true);setError("");
    try{
      const r=await fetch("/api/v1/admin/media",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selected._id,...draft})});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره اطلاعات ناموفق بود");
      setItems(current=>current.map(item=>item._id===p.data._id?p.data:item));
      setSelected(p.data);
      toast("اطلاعات فایل ذخیره شد.");
    }catch(err){setError(err instanceof Error?err.message:"ذخیره اطلاعات ناموفق بود");}
    finally{setSaving(false);}
  }

  async function deleteMedia(){
    if(!selected||!await confirm({title:"حذف دائمی فایل",description:"این فایل برای همیشه از کتابخانه حذف می‌شود. اگر در محتوای سایت استفاده شده باشد، ابتدا باید از آن محتوا جدا شود.",confirmLabel:"حذف دائمی",tone:"danger"}))return;
    setDeleting(true);setError("");
    try{
      const response=await fetch("/api/v1/admin/media",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selected._id})});
      const payload=await response.json();
      if(!response.ok||!payload.success)throw new Error(payload.error?.message||"حذف فایل ناموفق بود");
      setItems(current=>current.filter(item=>item._id!==selected._id));
      setSelected(null);
      toast("فایل حذف شد.");
    }catch(err){setError(err instanceof Error?err.message:"حذف فایل ناموفق بود");}
    finally{setDeleting(false);}
  }

  const content=<main className="media-library" dir="rtl">
    <header className="media-heading">
      <div><span className="media-eyebrow">{selectionMode?"کتابخانه رسانه":"مدیریت فایل‌ها"}</span><h1>{selectionMode?`انتخاب ${selectionMode==="image"?"تصویر":selectionMode==="video"?"ویدیو":"فایل"}`:"کتابخانه رسانه"}</h1><p>{selectionMode?"از کتابخانه انتخاب کنید یا فایل تازه‌ای بارگذاری کنید.":"همه‌ی تصاویر، ویدیوها و فایل‌های سایت در یک‌جا."}</p></div>
      <div className="media-heading-actions">
        {selectionMode&&<button type="button" className="media-secondary-button" onClick={()=>void load()}>بروزرسانی</button>}
        <button type="button" className="media-upload-button" onClick={()=>{setError("");setUploadOpen(true);}}><Icon name="upload"/><span>بارگذاری فایل</span></button>
      </div>
    </header>

    <section className="media-toolbar" aria-label="جست‌وجو و فیلتر رسانه">
      <label className="media-search"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جست‌وجوی نام، پوشه یا فرمت…" aria-label="جست‌وجوی فایل‌ها"/></label>
      {!selectionMode&&<div className="media-filters" role="group" aria-label="فیلتر نوع فایل">
        {([ ["all","همه"],["image","تصویر"],["video","ویدیو"],["document","سند"] ] as const).map(([value,label])=><button type="button" key={value} className={kind===value?"is-active":""} onClick={()=>setKind(value)}>{label}<span>{counts[value]}</span></button>)}
      </div>}
      <span className="media-total">{visibleItems.length} فایل</span>
    </section>

    {error&&!selected&&<p className="media-alert" role="alert">{error}</p>}
    {loading?<div className="media-state">در حال بارگذاری فایل‌ها…</div>:visibleItems.length===0?<div className="media-state media-empty"><span className="media-empty-icon"><Icon name="image"/></span><strong>{items.length?"فایلی با این مشخصات پیدا نشد":"هنوز فایلی بارگذاری نشده است"}</strong><span>{items.length?"عبارت جست‌وجو یا فیلتر را تغییر دهید.":"اولین فایل کتابخانه را بارگذاری کنید."}</span></div>:<div className="media-grid">
      {visibleItems.map(item=><button type="button" key={item._id} className="media-tile" onClick={()=>selectionMode?chooseMedia(item):openDetails(item)} aria-label={`${selectionMode?"انتخاب":"نمایش جزئیات"} ${item.title?.fa||item.key}`}>
        <span className="media-thumb">
          {kindOf(item)==="image"?<Image src={item.url} alt={item.alt?.fa||item.title?.fa||""} fill sizes="(max-width: 720px) 50vw, 20vw" style={{objectFit:"cover"}}/>:kindOf(item)==="video"?<><video src={item.url} preload="metadata"/><span className="media-thumb-type"><Icon name="video"/></span></>:<span className="media-file-preview"><Icon name="file"/><small>{item.mimeType.split("/").pop()?.toUpperCase()}</small></span>}
          <span className="media-open-hint">{selectionMode?"انتخاب فایل":"مشاهده جزئیات"}</span>
        </span>
        <span className="media-tile-meta"><strong>{item.title?.fa||item.key}</strong><span>{formatSize(item.size)} <i/> {item.mimeType}</span></span>
      </button>)}
    </div>}

    {selected&&!selectionMode&&<div className="media-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setSelected(null);}}>
      <section className="media-modal" role="dialog" aria-modal="true" aria-labelledby="media-modal-title" dir="rtl">
        <header className="media-modal-header"><div><span className="media-eyebrow">جزئیات و ویرایش</span><h2 id="media-modal-title">اطلاعات فایل</h2></div><button type="button" className="media-icon-button" onClick={()=>setSelected(null)} aria-label="بستن"><Icon name="close"/></button></header>
        <div className="media-modal-body">
          <div className="media-detail-preview">
            {kindOf(selected)==="image"?<Image src={selected.url} alt={selected.alt?.fa||selected.title?.fa||"پیش‌نمایش فایل"} fill sizes="(max-width: 720px) 100vw, 40vw" style={{objectFit:"contain"}}/>:kindOf(selected)==="video"?<video src={selected.url} controls/>:<div className="media-file-preview"><Icon name="file"/><small>{selected.mimeType.split("/").pop()?.toUpperCase()}</small></div>}
          </div>
          <div className="media-detail-column">
            <div className="media-info-grid">
              <div><span>نام فایل</span><strong dir="ltr">{selected.key}</strong></div>
              <div><span>نوع فایل</span><strong dir="ltr">{selected.mimeType}</strong></div>
              <div><span>حجم</span><strong>{formatSize(selected.size)}</strong></div>
              <div><span>ابعاد</span><strong>{selected.width&&selected.height?`${selected.width} × ${selected.height} پیکسل`:"ثبت نشده"}</strong></div>
              <div><span>فضای ذخیره‌سازی</span><strong dir="ltr">{selected.storageDriver||"local"}</strong></div>
              <div><span>تاریخ بارگذاری</span><strong>{selected.createdAt?new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(selected.createdAt)):"ثبت نشده"}</strong></div>
            </div>
            <div className="media-link-row"><div><span>لینک فایل</span><code dir="ltr">{selected.url}</code></div><button type="button" className="media-copy-button" onClick={copyLink} aria-label={copied?"لینک کپی شد":"کپی لینک فایل"} title={copied?"کپی شد":"کپی لینک"}><Icon name={copied?"check":"copy"}/></button></div>
            <form className="media-edit-form" onSubmit={event=>{event.preventDefault();void saveDetails();}}>
              <label>عنوان فارسی<input value={draft.titleFa} onChange={e=>setDraft({...draft,titleFa:e.target.value})} maxLength={160}/></label>
              <label>متن جایگزین فارسی<input value={draft.altFa} onChange={e=>setDraft({...draft,altFa:e.target.value})} maxLength={300}/></label>
              <label>توضیح فارسی<textarea value={draft.captionFa} onChange={e=>setDraft({...draft,captionFa:e.target.value})} maxLength={500}/></label>
              <label>پوشه<input value={draft.folder} onChange={e=>setDraft({...draft,folder:e.target.value})} maxLength={80}/></label>
              {error&&<p className="media-alert" role="alert">{error}</p>}
              <div className="media-modal-actions"><button className="media-delete-button" type="button" onClick={()=>void deleteMedia()} disabled={deleting||saving}><Icon name="trash"/>{deleting?"در حال حذف…":"حذف فایل"}</button><button className="media-save-button" type="submit" disabled={saving||deleting}>{saving?"در حال ذخیره…":"ذخیره تغییرات"}</button></div>
            </form>
          </div>
        </div>
      </section>
    </div>}
    {uploadOpen&&<div className="media-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!uploading)setUploadOpen(false);}}>
      <section className="media-upload-modal" role="dialog" aria-modal="true" aria-labelledby="media-upload-title" dir="rtl">
        <header className="media-modal-header"><div><span className="media-eyebrow">افزودن به کتابخانه</span><h2 id="media-upload-title">بارگذاری فایل جدید</h2></div><button type="button" className="media-icon-button" onClick={()=>setUploadOpen(false)} aria-label="بستن" disabled={uploading}><Icon name="close"/></button></header>
        <label className={`media-dropzone${uploading?" is-uploading":""}`} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const file=event.dataTransfer.files[0];if(file&&!uploading)void upload(file);}}>
          <input hidden type="file" accept={selectionMode==="image"?"image/*":selectionMode==="video"?"video/*":selectionMode==="file"?".pdf,application/pdf,image/*":"image/*,video/*,application/pdf"} onChange={onFileChange} disabled={uploading}/>
          <span className="media-dropzone-icon"><Icon name="upload"/></span><strong>{uploading?"در حال بارگذاری فایل…":"فایل را اینجا رها کنید"}</strong><span>یا برای انتخاب از دستگاه کلیک کنید</span><small>تصویر، ویدیو یا PDF · حداکثر ۱۰ مگابایت</small>
        </label>
        {error&&<p className="media-alert" role="alert">{error}</p>}
        <button type="button" className="media-secondary-button media-upload-cancel" onClick={()=>setUploadOpen(false)} disabled={uploading}>انصراف</button>
      </section>
    </div>}
  </main>;

  if(selectionMode)return <div className="media-modal-backdrop media-picker-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose?.();}}>
    <section className="media-picker-dialog" role="dialog" aria-modal="true" aria-label={`انتخاب ${selectionMode}`} dir="rtl">
      <button type="button" className="media-picker-close media-icon-button" onClick={onClose} aria-label="بستن"><Icon name="close"/></button>
      {content}
    </section>
  </div>;
  return content;
}