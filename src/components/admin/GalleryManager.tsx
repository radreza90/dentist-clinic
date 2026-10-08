"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

type Localized={fa:string;en:string};
type Group={_id:string;name:Localized;description?:Localized;position:number;enabled:boolean};
type Media={_id:string;key:string;url:string;mimeType:string;size:number;width?:number;height?:number};
type Item={_id:string;title:Localized;caption?:Localized;groupId:Group;mediaId:Media;mediaType:"image"|"video";position:number;isPublished:boolean};

const emptyGroup=()=>({name:{fa:"",en:""},description:{fa:"",en:""},position:0,enabled:true});
const emptyItem=()=>({title:{fa:"",en:""},caption:{fa:"",en:""},groupId:"",mediaId:"",position:0,isPublished:true});
const kindLabel=(kind:Item["mediaType"])=>kind==="image"?"تصویر":"ویدیو";

export function GalleryManager(){
 const {confirm,toast}=useAdminFeedback();
 const [groups,setGroups]=useState<Group[]>([]),[items,setItems]=useState<Item[]>([]),[media,setMedia]=useState<Media[]>([]);
 const [groupForm,setGroupForm]=useState(emptyGroup()),[editingGroup,setEditingGroup]=useState("");
 const [itemForm,setItemForm]=useState(emptyItem()),[editingItem,setEditingItem]=useState("");
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const [search,setSearch]=useState(""),[filterGroup,setFilterGroup]=useState(""),[filterType,setFilterType]=useState("");
 const [pickerOpen,setPickerOpen]=useState(false);

 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const [gr,ir,mr]=await Promise.all([
    fetch("/api/v1/admin/gallery-groups?limit=100",{cache:"no-store"}),
    fetch("/api/v1/admin/gallery?limit=200",{cache:"no-store"}),
    fetch("/api/v1/admin/media?limit=100",{cache:"no-store"})
   ]);
   const gp=await gr.json(),ip=await ir.json(),mp=await mr.json();
   if(!gr.ok||!gp.success)throw new Error(gp.error?.message||"خطا در دریافت گروه‌ها");
   if(!ir.ok||!ip.success)throw new Error(ip.error?.message||"خطا در دریافت گالری");
   if(mr.ok&&mp.success)setMedia((mp.data||[]).filter((m:Media)=>m.mimeType.startsWith("image/")||m.mimeType.startsWith("video/")));
   setGroups(gp.data.items||[]);setItems(ip.data.items||[]);
  }catch(e){setError(e instanceof Error?e.message:"خطا در دریافت اطلاعات")}finally{setLoading(false)}
 },[]);
 useEffect(()=>{void load()},[load]);

 async function saveGroup(e:FormEvent){
  e.preventDefault();setSaving(true);setError("");
  try{
   const r=await fetch(editingGroup?"/api/v1/admin/gallery-groups/"+editingGroup:"/api/v1/admin/gallery-groups",{method:editingGroup?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(groupForm)});
   const p=await r.json();if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره گروه ناموفق بود");
   toast(editingGroup?"گروه ویرایش شد.":"گروه جدید ایجاد شد.");setEditingGroup("");setGroupForm(emptyGroup());await load();
  }catch(e){setError(e instanceof Error?e.message:"ذخیره گروه ناموفق بود")}finally{setSaving(false)}
 }
 async function removeGroup(group:Group){
  if(!await confirm({title:"حذف گروه گالری",description:"گروه فقط زمانی حذف می‌شود که هیچ تصویر یا ویدیویی داخل آن نباشد.",confirmLabel:"حذف گروه",tone:"danger"}))return;
  const r=await fetch("/api/v1/admin/gallery-groups/"+group._id,{method:"DELETE"});const p=await r.json();
  if(!r.ok||!p.success){setError(p.error?.message||"حذف گروه ناموفق بود");return}
  toast("گروه حذف شد.");await load();
 }
 async function saveItem(e:FormEvent){
  e.preventDefault();setSaving(true);setError("");
  try{
   if(!itemForm.groupId||!itemForm.mediaId)throw new Error("گروه و تصویر/ویدیو الزامی هستند.");
   const r=await fetch(editingItem?"/api/v1/admin/gallery/"+editingItem:"/api/v1/admin/gallery",{method:editingItem?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(itemForm)});
   const p=await r.json();if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره مورد ناموفق بود");
   toast(editingItem?"آیتم گالری ویرایش شد.":"آیتم گالری ثبت شد.");setEditingItem("");setItemForm(emptyItem());await load();
  }catch(e){setError(e instanceof Error?e.message:"ذخیره ناموفق بود")}finally{setSaving(false)}
 }
 async function removeItem(item:Item){
  if(!await confirm({title:"حذف آیتم گالری",description:"این رکورد حذف می‌شود؛ فایل اصلی از کتابخانه رسانه حذف نخواهد شد.",confirmLabel:"حذف آیتم",tone:"danger"}))return;
  const r=await fetch("/api/v1/admin/gallery/"+item._id,{method:"DELETE"});const p=await r.json();
  if(!r.ok||!p.success){setError(p.error?.message||"حذف ناموفق بود");return}
  toast("آیتم حذف شد.");await load();
 }
 const visible=useMemo(()=>items.filter(i=>{
  const q=search.trim().toLocaleLowerCase("fa");
  return (!filterGroup||i.groupId?._id===filterGroup)&&(!filterType||i.mediaType===filterType)&&(!q||[i.title?.fa,i.title?.en,i.caption?.fa,i.caption?.en].join(" ").toLocaleLowerCase("fa").includes(q));
 }),[items,search,filterGroup,filterType]);
 const selectedMedia=media.find(m=>m._id===itemForm.mediaId)||items.find(i=>i.mediaId?._id===itemForm.mediaId)?.mediaId;

 return <main className="gallery-page" dir="rtl">
  <header className="gallery-heading">
   <div><span className="dashboard-eyebrow">محتوای تصویری کلینیک</span><h1>گالری تصاویر</h1><p>تصاویر و ویدیوهای کلینیک را در گروه‌های مختلف مدیریت و مرتب کنید.</p></div>
   <div className="gallery-stats"><span><strong>{groups.length}</strong> گروه</span><span><strong>{items.length}</strong> رسانه</span></div>
  </header>
  {error&&<p className="gallery-error" role="alert">{error}</p>}
  <section className="gallery-workspace">
   <div className="gallery-column">
    <div className="gallery-card">
     <div className="gallery-card-heading"><div><span className="card-kicker">ساختار</span><h2>{editingGroup?"ویرایش گروه":"افزودن گروه"}</h2></div></div>
     <form onSubmit={saveGroup} className="gallery-form">
      <label>نام گروه فارسی<input required value={groupForm.name.fa} onChange={e=>setGroupForm({...groupForm,name:{...groupForm.name,fa:e.target.value}})} placeholder="مثلاً فضای کلینیک"/></label>
      <label>نام گروه انگلیسی<input dir="ltr" value={groupForm.name.en} onChange={e=>setGroupForm({...groupForm,name:{...groupForm.name,en:e.target.value}})} placeholder="Clinic Interior"/></label>
      <label>توضیح<textarea rows={2} value={groupForm.description?.fa||""} onChange={e=>setGroupForm({...groupForm,description:{fa:e.target.value,en:groupForm.description?.en||""}})} /></label>
      <div className="gallery-inline"><label>ترتیب<input type="number" value={groupForm.position} onChange={e=>setGroupForm({...groupForm,position:Number(e.target.value)})}/></label><label className="gallery-check"><input type="checkbox" checked={groupForm.enabled} onChange={e=>setGroupForm({...groupForm,enabled:e.target.checked})}/> فعال</label></div>
      <div className="gallery-actions"><button className="gallery-primary" disabled={saving}>{saving?"در حال ذخیره…":editingGroup?"ذخیره گروه":"ایجاد گروه"}</button>{editingGroup&&<button type="button" className="gallery-secondary" onClick={()=>{setEditingGroup("");setGroupForm(emptyGroup())}}>انصراف</button>}</div>
     </form>
    </div>
    <div className="gallery-card">
     <div className="gallery-card-heading"><div><span className="card-kicker">گروه‌بندی</span><h2>گروه‌ها</h2></div></div>
     <div className="gallery-groups-list">{groups.length===0?<div className="gallery-empty">هنوز گروهی ایجاد نشده است.</div>:groups.map(g=>
      <div key={g._id} className={"gallery-group-row"+(filterGroup===g._id?" is-selected":"")}>
       <button type="button" onClick={()=>setFilterGroup(filterGroup===g._id?"":g._id)}><strong>{g.name.fa||g.name.en}</strong><span>{items.filter(i=>i.groupId?._id===g._id).length} مورد</span></button>
       <div><button type="button" onClick={()=>{setEditingGroup(g._id);setGroupForm({name:g.name,description:g.description||{fa:"",en:""},position:g.position,enabled:g.enabled})}}>✎</button><button type="button" onClick={()=>void removeGroup(g)}>×</button></div>
      </div>
     )}</div>
    </div>
   </div>

   <div className="gallery-column gallery-main">
    <div className="gallery-card">
     <div className="gallery-card-heading"><div><span className="card-kicker">رسانه</span><h2>{editingItem?"ویرایش آیتم":"افزودن تصویر یا ویدیو"}</h2></div></div>
     <form onSubmit={saveItem} className="gallery-form">
      <div className="gallery-grid-2">
       <label>گروه<select required value={itemForm.groupId} onChange={e=>setItemForm({...itemForm,groupId:e.target.value})}><option value="">انتخاب گروه…</option>{groups.filter(g=>g.enabled).map(g=><option key={g._id} value={g._id}>{g.name.fa||g.name.en}</option>)}</select></label>
       <label>عنوان فارسی<input value={itemForm.title.fa} onChange={e=>setItemForm({...itemForm,title:{...itemForm.title,fa:e.target.value}})} placeholder="عنوان اختیاری"/></label>
      </div>
      <label>عنوان انگلیسی<input dir="ltr" value={itemForm.title.en} onChange={e=>setItemForm({...itemForm,title:{...itemForm.title,en:e.target.value}})} placeholder="Optional title"/></label>
      <label>توضیحات<textarea rows={3} value={itemForm.caption.fa} onChange={e=>setItemForm({...itemForm,caption:{...itemForm.caption,fa:e.target.value}})} placeholder="توضیح کوتاه برای تصویر یا ویدیو"/></label>
      <div className="gallery-media-field">
       <span className="gallery-media-label">فایل گالری</span>
       {selectedMedia?<div className="gallery-selected-media">
        {selectedMedia.mimeType.startsWith("image/")?<Image src={selectedMedia.url} alt="" width={90} height={64} style={{objectFit:"cover",borderRadius:10}}/>:<span className="gallery-video-mark">▶</span>}
        <div><strong>{selectedMedia.title?.fa||selectedMedia.key}</strong><small>{selectedMedia.mimeType}</small></div>
        <button type="button" onClick={()=>setItemForm({...itemForm,mediaId:""})}>حذف انتخاب</button>
       </div>:<button type="button" className="gallery-media-picker" onClick={()=>setPickerOpen(true)}>＋ انتخاب تصویر یا ویدیو از کتابخانه رسانه</button>}
      </div>
      <div className="gallery-inline"><label>ترتیب نمایش<input type="number" value={itemForm.position} onChange={e=>setItemForm({...itemForm,position:Number(e.target.value)})}/></label><label className="gallery-check"><input type="checkbox" checked={itemForm.isPublished} onChange={e=>setItemForm({...itemForm,isPublished:e.target.checked})}/> نمایش در سایت</label></div>
      <div className="gallery-actions"><button className="gallery-primary" disabled={saving}>{saving?"در حال ذخیره…":editingItem?"ذخیره تغییرات":"افزودن به گالری"}</button>{editingItem&&<button type="button" className="gallery-secondary" onClick={()=>{setEditingItem("");setItemForm(emptyItem())}}>انصراف</button>}</div>
     </form>
    </div>

    <div className="gallery-card">
     <div className="gallery-toolbar">
      <label className="gallery-search">⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جست‌وجوی عنوان یا توضیحات…"/></label>
      <select value={filterType} onChange={e=>setFilterType(e.target.value)}><option value="">همه رسانه‌ها</option><option value="image">تصاویر</option><option value="video">ویدیوها</option></select>
      <button className="gallery-secondary" type="button" onClick={()=>void load()} disabled={loading}>↻ بروزرسانی</button>
     </div>
     {loading?<div className="gallery-empty">در حال بارگذاری…</div>:visible.length===0?<div className="gallery-empty"><strong>موردی پیدا نشد</strong><span>گروه یا عبارت جست‌وجو را تغییر دهید.</span></div>:<div className="gallery-grid">
      {visible.map(item=><article key={item._id} className="gallery-item-card">
       <div className="gallery-item-preview">{item.mediaType==="image"?<Image src={item.mediaId.url} alt={item.title?.fa||""} fill sizes="(max-width:900px) 50vw, 220px" style={{objectFit:"cover"}}/>:<><video src={item.mediaId.url} preload="metadata"/><span className="gallery-play">▶</span></>}</div>
       <div className="gallery-item-copy"><div className="gallery-item-meta"><span>{kindLabel(item.mediaType)}</span><span>{item.groupId?.name?.fa||"بدون گروه"}</span></div><h3>{item.title.fa||item.title.en||"بدون عنوان"}</h3><p>{item.caption?.fa||item.caption?.en||"بدون توضیحات"}</p></div>
       <div className="gallery-item-actions"><button type="button" onClick={()=>{setEditingItem(item._id);setItemForm({title:item.title||{fa:"",en:""},caption:item.caption||{fa:"",en:""},groupId:item.groupId?._id||"",mediaId:item.mediaId?._id||"",position:item.position||0,isPublished:item.isPublished})}}>ویرایش</button><button type="button" className="danger" onClick={()=>void removeItem(item)}>حذف</button></div>
      </article>)}
     </div>}
    </div>
   </div>
  </section>

  {pickerOpen&&<div className="gallery-picker-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setPickerOpen(false)}}><section className="gallery-picker">
   <header><div><span className="card-kicker">کتابخانه رسانه</span><h2>انتخاب تصویر یا ویدیو</h2></div><button type="button" onClick={()=>setPickerOpen(false)}>×</button></header>
   <div className="gallery-picker-grid">{media.map(m=><button key={m._id} type="button" onClick={()=>{setItemForm({...itemForm,mediaId:m._id});setPickerOpen(false)}}>{m.mimeType.startsWith("image/")?<Image src={m.url} alt="" fill sizes="150px" style={{objectFit:"cover"}}/>:<><video src={m.url} preload="metadata"/><span className="gallery-play">▶</span></>}<small>{m.title?.fa||m.key}</small></button>)}</div>
  </section></div>}
 </main>;
}
