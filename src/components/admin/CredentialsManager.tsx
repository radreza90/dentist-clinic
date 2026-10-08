"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

type Localized={fa:string;en:string};
type Group={_id:string;name:Localized;description?:Localized;position:number;enabled:boolean};
type Media={_id:string;key:string;url:string;mimeType:string;size:number};
type Credential={_id:string;type:"license"|"certificate"|"award";title:Localized;description?:Localized;groupId:Group;issuer:Localized;credentialNumber:string;issuedAt?:string;expiresAt?:string;mediaId:Media;position:number;isPublished:boolean};

const emptyGroup=()=>({name:{fa:"",en:""},description:{fa:"",en:""},position:0,enabled:true});
const emptyItem=()=>({type:"license" as const,title:{fa:"",en:""},description:{fa:"",en:""},groupId:"",issuer:{fa:"",en:""},credentialNumber:"",issuedAt:"",expiresAt:"",mediaId:"",position:0,isPublished:true});
const typeLabel=(t:Credential["type"])=>t==="license"?"مجوز فعالیت":t==="certificate"?"گواهی / مدرک":"تقدیرنامه / جایزه";
const mediaKind=(m:string)=>m.startsWith("image/")?"image":m.startsWith("video/")?"video":"file";

export function CredentialsManager(){
 const {confirm,toast}=useAdminFeedback();
 const [groups,setGroups]=useState<Group[]>([]),[items,setItems]=useState<Credential[]>([]);
 const [groupForm,setGroupForm]=useState(emptyGroup()),[editingGroup,setEditingGroup]=useState("");
 const [itemForm,setItemForm]=useState(emptyItem()),[editingItem,setEditingItem]=useState("");
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const [search,setSearch]=useState(""),[filterGroup,setFilterGroup]=useState(""),[filterType,setFilterType]=useState("");
 const [pickerOpen,setPickerOpen]=useState(false),[media,setMedia]=useState<Media[]>([]);

 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const [gr,ir]=await Promise.all([fetch("/api/v1/admin/credential-groups?limit=100",{cache:"no-store"}),fetch("/api/v1/admin/credentials?limit=200",{cache:"no-store"})]);
   const gp=await gr.json(),ip=await ir.json();
   if(!gr.ok||!gp.success)throw new Error(gp.error?.message||"خطا در دریافت گروه‌ها");
   if(!ir.ok||!ip.success)throw new Error(ip.error?.message||"خطا در دریافت موارد");
   setGroups(gp.data.items||[]);setItems(ip.data.items||[]);
  }catch(e){setError(e instanceof Error?e.message:"خطا در دریافت اطلاعات")}finally{setLoading(false)}
 },[]);
 useEffect(()=>{void load()},[load]);

 async function saveGroup(e:FormEvent){e.preventDefault();setSaving(true);setError("");try{
  const r=await fetch(editingGroup?"/api/v1/admin/credential-groups/"+editingGroup:"/api/v1/admin/credential-groups",{method:editingGroup?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(groupForm)});
  const p=await r.json();if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره گروه ناموفق بود");
  toast(editingGroup?"گروه ویرایش شد.":"گروه جدید ایجاد شد.");setEditingGroup("");setGroupForm(emptyGroup());await load();
 }catch(e){setError(e instanceof Error?e.message:"ذخیره گروه ناموفق بود")}finally{setSaving(false)}}
 async function removeGroup(g:Group){if(!await confirm({title:"حذف گروه",description:"گروه فقط در صورتی حذف می‌شود که هیچ موردی داخل آن نباشد.",confirmLabel:"حذف گروه",tone:"danger"}))return;const r=await fetch("/api/v1/admin/credential-groups/"+g._id,{method:"DELETE"});const p=await r.json();if(!r.ok||!p.success){setError(p.error?.message||"حذف ناموفق بود");return}toast("گروه حذف شد.");await load()}
 async function saveItem(e:FormEvent){e.preventDefault();setSaving(true);setError("");try{
  if(!itemForm.groupId||!itemForm.mediaId)throw new Error("گروه و فایل مدرک الزامی هستند.");
  const r=await fetch(editingItem?"/api/v1/admin/credentials/"+editingItem:"/api/v1/admin/credentials",{method:editingItem?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(itemForm)});
  const p=await r.json();if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره ناموفق بود");
  toast(editingItem?"مورد ویرایش شد.":"مورد جدید ثبت شد.");setEditingItem("");setItemForm(emptyItem());await load();
 }catch(e){setError(e instanceof Error?e.message:"ذخیره ناموفق بود")}finally{setSaving(false)}}
 async function removeItem(i:Credential){if(!await confirm({title:"حذف مدرک",description:"این رکورد حذف می‌شود؛ فایل اصلی کتابخانه رسانه حذف نخواهد شد.",confirmLabel:"حذف رکورد",tone:"danger"}))return;const r=await fetch("/api/v1/admin/credentials/"+i._id,{method:"DELETE"});const p=await r.json();if(!r.ok||!p.success){setError(p.error?.message||"حذف ناموفق بود");return}toast("رکورد حذف شد.");await load()}
 async function openPicker(){setPickerOpen(true);try{const r=await fetch("/api/v1/admin/media",{cache:"no-store"});const p=await r.json();if(r.ok&&p.success)setMedia(p.data||[])}catch{}}

 const visible=useMemo(()=>items.filter(i=>{const q=search.trim().toLocaleLowerCase("fa");return(!filterGroup||i.groupId?._id===filterGroup)&&(!filterType||i.type===filterType)&&(!q||[i.title?.fa,i.title?.en,i.issuer?.fa,i.issuer?.en,i.credentialNumber].join(" ").toLocaleLowerCase("fa").includes(q))}),[items,search,filterGroup,filterType]);
 const selectedMedia=media.find(m=>m._id===itemForm.mediaId)||items.find(i=>i.mediaId?._id===itemForm.mediaId)?.mediaId;

 return <main className="credentials-page" dir="rtl">
  <header className="credentials-heading"><div><span className="dashboard-eyebrow">اعتبار و سوابق کلینیک</span><h1>مجوزها و تقدیرنامه‌ها</h1><p>مجوزهای فعالیت، مدارک، گواهی‌ها و تقدیرنامه‌ها را گروه‌بندی و مدیریت کنید.</p></div><div className="credentials-stats"><span><strong>{groups.length}</strong> گروه</span><span><strong>{items.length}</strong> مدرک</span></div></header>
  {error&&<p className="credentials-error" role="alert">{error}</p>}
  <section className="credentials-workspace">
   <div className="credentials-column">
    <div className="credentials-card"><div className="credentials-card-heading"><div><span className="card-kicker">ساختار</span><h2>{editingGroup?"ویرایش گروه":"افزودن گروه"}</h2></div></div>
     <form onSubmit={saveGroup} className="credentials-form">
      <label>نام گروه فارسی<input required value={groupForm.name.fa} onChange={e=>setGroupForm({...groupForm,name:{...groupForm.name,fa:e.target.value}})} placeholder="مثلاً مجوزهای فعالیت"/></label>
      <label>نام گروه انگلیسی<input dir="ltr" value={groupForm.name.en} onChange={e=>setGroupForm({...groupForm,name:{...groupForm.name,en:e.target.value}})} placeholder="Activity Licenses"/></label>
      <label>توضیح<textarea rows={2} value={groupForm.description?.fa||""} onChange={e=>setGroupForm({...groupForm,description:{fa:e.target.value,en:groupForm.description?.en||""}})} /></label>
      <div className="credentials-inline"><label>ترتیب<input type="number" value={groupForm.position} onChange={e=>setGroupForm({...groupForm,position:Number(e.target.value)})}/></label><label className="credentials-check"><input type="checkbox" checked={groupForm.enabled} onChange={e=>setGroupForm({...groupForm,enabled:e.target.checked})}/> فعال</label></div>
      <div className="credentials-actions"><button className="credentials-primary" disabled={saving}>{saving?"در حال ذخیره…":editingGroup?"ذخیره گروه":"ایجاد گروه"}</button>{editingGroup&&<button type="button" className="credentials-secondary" onClick={()=>{setEditingGroup("");setGroupForm(emptyGroup())}}>انصراف</button>}</div>
     </form>
    </div>
    <div className="credentials-card"><div className="credentials-card-heading"><div><span className="card-kicker">گروه‌بندی</span><h2>گروه‌ها</h2></div></div>
     <div className="credential-groups-list">{groups.length===0?<div className="credentials-empty">هنوز گروهی ایجاد نشده است.</div>:groups.map(g=><div key={g._id} className={"credential-group-row"+(filterGroup===g._id?" is-selected":"")}><button type="button" onClick={()=>setFilterGroup(filterGroup===g._id?"":g._id)}><strong>{g.name.fa||g.name.en}</strong><span>{items.filter(i=>i.groupId?._id===g._id).length} مورد</span></button><div><button type="button" onClick={()=>{setEditingGroup(g._id);setGroupForm({name:g.name,description:g.description||{fa:"",en:""},position:g.position,enabled:g.enabled})}}>✎</button><button type="button" onClick={()=>void removeGroup(g)}>×</button></div></div>)}</div>
    </div>
   </div>
   <div className="credentials-column credentials-main">
    <div className="credentials-card"><div className="credentials-card-heading"><div><span className="card-kicker">مدارک</span><h2>{editingItem?"ویرایش مورد":"افزودن مدرک / تقدیرنامه"}</h2></div></div>
     <form onSubmit={saveItem} className="credentials-form">
      <div className="credentials-grid-3"><label>نوع<select value={itemForm.type} onChange={e=>setItemForm({...itemForm,type:e.target.value as Credential["type"]})}><option value="license">مجوز فعالیت</option><option value="certificate">گواهی / مدرک</option><option value="award">تقدیرنامه / جایزه</option></select></label><label>گروه<select required value={itemForm.groupId} onChange={e=>setItemForm({...itemForm,groupId:e.target.value})}><option value="">انتخاب گروه…</option>{groups.filter(g=>g.enabled).map(g=><option key={g._id} value={g._id}>{g.name.fa||g.name.en}</option>)}</select></label><label>شماره<input value={itemForm.credentialNumber} onChange={e=>setItemForm({...itemForm,credentialNumber:e.target.value})}/></label></div>
      <div className="credentials-grid-2"><label>عنوان فارسی<input required value={itemForm.title.fa} onChange={e=>setItemForm({...itemForm,title:{...itemForm.title,fa:e.target.value}})}/></label><label>عنوان انگلیسی<input dir="ltr" value={itemForm.title.en} onChange={e=>setItemForm({...itemForm,title:{...itemForm.title,en:e.target.value}})}/></label><label>صادرکننده فارسی<input value={itemForm.issuer.fa} onChange={e=>setItemForm({...itemForm,issuer:{...itemForm.issuer,fa:e.target.value}})}/></label><label>صادرکننده انگلیسی<input dir="ltr" value={itemForm.issuer.en} onChange={e=>setItemForm({...itemForm,issuer:{...itemForm.issuer,en:e.target.value}})}/></label></div>
      <label>توضیحات<textarea rows={3} value={itemForm.description.fa} onChange={e=>setItemForm({...itemForm,description:{...itemForm.description,fa:e.target.value}})}/></label>
      <div className="credentials-grid-2"><label>تاریخ صدور<input type="date" value={itemForm.issuedAt} onChange={e=>setItemForm({...itemForm,issuedAt:e.target.value})}/></label><label>تاریخ انقضا<input type="date" value={itemForm.expiresAt} onChange={e=>setItemForm({...itemForm,expiresAt:e.target.value})}/></label></div>
      <div className="credential-media-field"><span className="credential-media-label">فایل مدرک</span>{selectedMedia?<div className="credential-selected-media">{mediaKind(selectedMedia.mimeType)==="image"?<Image src={selectedMedia.url} alt="" width={72} height={56} style={{objectFit:"cover",borderRadius:10}}/>:<span>{mediaKind(selectedMedia.mimeType)==="video"?"▶":"PDF"}</span>}<strong>{selectedMedia.key}</strong><button type="button" onClick={()=>setItemForm({...itemForm,mediaId:""})}>حذف انتخاب</button></div>:<button type="button" className="credential-media-picker" onClick={()=>void openPicker()}>＋ انتخاب از کتابخانه رسانه</button>}</div>
      <div className="credentials-inline"><label>ترتیب<input type="number" value={itemForm.position} onChange={e=>setItemForm({...itemForm,position:Number(e.target.value)})}/></label><label className="credentials-check"><input type="checkbox" checked={itemForm.isPublished} onChange={e=>setItemForm({...itemForm,isPublished:e.target.checked})}/> نمایش در سایت</label></div>
      <div className="credentials-actions"><button className="credentials-primary" disabled={saving}>{saving?"در حال ذخیره…":editingItem?"ذخیره تغییرات":"ثبت مدرک"}</button>{editingItem&&<button type="button" className="credentials-secondary" onClick={()=>{setEditingItem("");setItemForm(emptyItem())}}>انصراف</button>}</div>
     </form>
    </div>
    <div className="credentials-card"><div className="credentials-toolbar"><label className="credentials-search">⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جست‌وجوی عنوان، صادرکننده یا شماره…"/></label><select value={filterType} onChange={e=>setFilterType(e.target.value)}><option value="">همه انواع</option><option value="license">مجوزها</option><option value="certificate">گواهی‌ها</option><option value="award">تقدیرنامه‌ها</option></select><button className="credentials-secondary" type="button" onClick={()=>void load()} disabled={loading}>↻ بروزرسانی</button></div>
     {loading?<div className="credentials-empty">در حال بارگذاری…</div>:visible.length===0?<div className="credentials-empty"><strong>موردی پیدا نشد</strong><span>گروه یا فیلتر جست‌وجو را تغییر دهید.</span></div>:<div className="credentials-list">{visible.map(i=><article key={i._id} className="credential-item-row"><div className="credential-item-preview">{i.mediaId&&mediaKind(i.mediaId.mimeType)==="image"?<Image src={i.mediaId.url} alt="" fill sizes="90px" style={{objectFit:"cover"}}/>:<span>{i.mediaId&&mediaKind(i.mediaId.mimeType)==="video"?"▶":"PDF"}</span>}</div><div className="credential-item-copy"><div className="credential-item-top"><span className={"credential-type credential-type-"+i.type}>{typeLabel(i.type)}</span><span>{i.groupId?.name?.fa||"بدون گروه"}</span></div><h3>{i.title.fa||i.title.en}</h3><p>{i.issuer.fa||i.issuer.en||"صادرکننده ثبت نشده"} {i.credentialNumber&&" · "+i.credentialNumber}</p><small>صدور: {i.issuedAt?new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium"}).format(new Date(i.issuedAt)):"—"} · {i.expiresAt?"انقضا: "+new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium"}).format(new Date(i.expiresAt)):"بدون تاریخ انقضا"}</small></div><div className="credential-item-actions"><button type="button" onClick={()=>{setEditingItem(i._id);setItemForm({type:i.type,title:i.title,description:i.description||{fa:"",en:""},groupId:i.groupId?._id||"",issuer:i.issuer||{fa:"",en:""},credentialNumber:i.credentialNumber||"",issuedAt:i.issuedAt?.slice(0,10)||"",expiresAt:i.expiresAt?.slice(0,10)||"",mediaId:i.mediaId?._id||"",position:i.position||0,isPublished:i.isPublished})}}>ویرایش</button><button type="button" className="danger" onClick={()=>void removeItem(i)}>حذف</button></div></article>)}</div>}
    </div>
   </div>
  </section>
  {pickerOpen&&<div className="credentials-picker-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setPickerOpen(false)}}><section className="credentials-picker"><header><div><span className="card-kicker">کتابخانه رسانه</span><h2>انتخاب فایل مدرک</h2></div><button type="button" onClick={()=>setPickerOpen(false)}>×</button></header><div className="credentials-picker-grid">{media.filter(m=>m.mimeType.startsWith("image/")||m.mimeType.startsWith("video/")||m.mimeType==="application/pdf").map(m=><button key={m._id} type="button" onClick={()=>{setItemForm({...itemForm,mediaId:m._id});setPickerOpen(false)}}>{m.mimeType.startsWith("image/")?<Image src={m.url} alt="" fill sizes="140px" style={{objectFit:"cover"}}/>:<span>{m.mimeType.startsWith("video/")?"▶":"PDF"}</span>}<small>{m.key}</small></button>)}</div></section></div>}
 </main>;
}
