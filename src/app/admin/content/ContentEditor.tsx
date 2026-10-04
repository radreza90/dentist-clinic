"use client";

import { FormEvent, useEffect, useState } from "react";
import { RichEditor } from "@/components/editor/RichEditor";
import { MediaPicker } from "@/components/editor/MediaPicker";

type Kind = "page"|"blog"|"doctor"|"portfolio";
type Localized = { fa:string; en:string };
type Props = { kind:Kind; title:string; endpoint:string; id?:string };

const emptyLocalized = ():Localized => ({ fa:"", en:"" });
const emptyForm = (kind:Kind) => ({
  slug:"", title:emptyLocalized(), name:emptyLocalized(), excerpt:emptyLocalized(), shortBio:emptyLocalized(), bio:emptyLocalized(),
  content:emptyLocalized(), description:emptyLocalized(), treatment:emptyLocalized(), university:emptyLocalized(),
  photoMediaId:null as string|null, coverMediaId:null as string|null, status:"draft", seo:{
    title:emptyLocalized(),description:emptyLocalized(),canonical:"",keywords:"",index:true,follow:true
  }, kind
});

export function ContentEditor({ kind, title, endpoint, id }:Props) {
  const [form,setForm] = useState<any>(() => emptyForm(kind));
  const [loading,setLoading] = useState(!!id);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [picker,setPicker] = useState<"photo"|"cover"|null>(null);
  const [preview,setPreview] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(endpoint+"/"+id,{cache:"no-store"}).then(r=>r.json()).then(p=>{
      if (!p.success) { setError(p.error?.message || "خطا در دریافت محتوا"); return; }
      const d=p.data;
      setForm((x:any)=>({
        ...x,...d,
        title:d.title||emptyLocalized(), name:d.name||emptyLocalized(), excerpt:d.excerpt||emptyLocalized(), shortBio:d.shortBio||emptyLocalized(),
        bio:d.bio||emptyLocalized(), content:d.content||emptyLocalized(), description:d.description||emptyLocalized(), treatment:d.treatment||emptyLocalized(),
        university:d.university||emptyLocalized(),
        photoMediaId:d.photoMediaId?String(d.photoMediaId):null, coverMediaId:d.coverMediaId?String(d.coverMediaId):null,
        seo:{...x.seo,title:d.seo?.title||emptyLocalized(),description:d.seo?.description||emptyLocalized(),canonical:d.seo?.canonical?.fa||"",
          keywords:Array.isArray(d.seo?.keywords)?d.seo.keywords.join(", "):"",index:d.seo?.robots?.index!==false,follow:d.seo?.robots?.follow!==false}
      }));
    }).catch(()=>setError("خطا در دریافت محتوا")).finally(()=>setLoading(false));
  },[id,endpoint]);

  function setLocal(field:string, locale:"fa"|"en", value:string) {
    setForm((x:any)=>({...x,[field]:{...x[field],[locale]:value}}));
  }
  function setSeo(field:string, value:unknown) {
    setForm((x:any)=>({...x,seo:{...x.seo,[field]:value}}));
  }
  function setSeoLocal(field:"title"|"description", locale:"fa"|"en", value:string) {
    setForm((x:any)=>({...x,seo:{...x.seo,[field]:{...x.seo[field],[locale]:value}}}));
  }

  async function save(e:FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const body:any={...form,seo:{
        ...form.seo,
        keywords:form.seo.keywords.split(",").map((x:string)=>x.trim()).filter(Boolean),
        canonical:{fa:form.seo.canonical,en:form.seo.canonical},
        robots:{index:form.seo.index,follow:form.seo.follow}
      }};
      delete body.kind;
      const response=await fetch(id?endpoint+"/"+id:endpoint,{
        method:id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)
      });
      const payload=await response.json();
      if(!response.ok||!payload.success)throw new Error(payload.error?.message||"ذخیره انجام نشد");
      setMessage("ذخیره شد.");
    } catch(e) { setError(e instanceof Error?e.message:"ذخیره ناموفق بود"); }
    finally { setSaving(false); }
  }

  if(loading)return <main><p>در حال بارگذاری…</p></main>;
  const titleField=kind==="doctor"?"name":"title";
  const base=kind==="doctor"?"doctors":kind==="blog"?"blog":kind==="portfolio"?"portfolio":"pages";

  return <main style={{maxWidth:950}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center"}}>
      <div><h1>{id?"ویرایش ":"افزودن "}{title}</h1><p style={{color:"#666"}}>محتوای دو زبانه، رسانه و SEO.</p></div>
      <a href={"/admin/content/"+base}>بازگشت</a>
    </div>
    <form onSubmit={save} style={{display:"grid",gap:14,marginTop:24}}>
      <input required value={form.slug||""} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="slug" dir="ltr"/>
      <input required value={form[titleField]?.fa||""} onChange={e=>setLocal(titleField,"fa",e.target.value)} placeholder={kind==="doctor"?"نام فارسی":"عنوان فارسی"}/>
      <input value={form[titleField]?.en||""} onChange={e=>setLocal(titleField,"en",e.target.value)} placeholder={kind==="doctor"?"English name":"English title"} dir="ltr"/>

      {kind==="doctor"&&<><input value={form.university.fa} onChange={e=>setLocal("university","fa",e.target.value)} placeholder="دانشگاه"/><textarea value={form.shortBio.fa} onChange={e=>setLocal("shortBio","fa",e.target.value)} placeholder="معرفی کوتاه" rows={3}/><label>بیوگرافی فارسی</label><RichEditor value={form.bio.fa} onChange={v=>setLocal("bio","fa",v)}/><label>English biography</label><RichEditor value={form.bio.en} onChange={v=>setLocal("bio","en",v)} placeholder="Write biography…"/></>}

      {kind==="portfolio"&&<><textarea value={form.description.fa} onChange={e=>setLocal("description","fa",e.target.value)} placeholder="شرح فارسی" rows={3}/><RichEditor value={form.treatment.fa} onChange={v=>setLocal("treatment","fa",v)}/><label>English treatment</label><RichEditor value={form.treatment.en} onChange={v=>setLocal("treatment","en",v)} placeholder="Write treatment…"/></>}

      {kind!=="doctor"&&kind!=="portfolio"&&<><textarea value={form.excerpt.fa} onChange={e=>setLocal("excerpt","fa",e.target.value)} placeholder="خلاصه فارسی" rows={3}/><label>محتوای فارسی</label><RichEditor value={form.content.fa} onChange={v=>setLocal("content","fa",v)}/><label>English content</label><RichEditor value={form.content.en} onChange={v=>setLocal("content","en",v)} placeholder="Write content…"/></>}

      {(kind==="doctor"||kind==="blog")&&<button type="button" onClick={()=>setPicker(kind==="doctor"?"photo":"cover")}>{kind==="doctor"?"انتخاب عکس پزشک":"انتخاب کاور مقاله"}</button>}
      {preview&&<img src={preview} alt="" style={{width:120,height:90,objectFit:"cover",borderRadius:8}}/>}

      <details><summary style={{cursor:"pointer",fontWeight:700}}>SEO</summary><div style={{display:"grid",gap:10,paddingTop:12}}>
        <input value={form.seo.title.fa} onChange={e=>setSeoLocal("title","fa",e.target.value)} placeholder="SEO title فارسی"/>
        <input value={form.seo.title.en} onChange={e=>setSeoLocal("title","en",e.target.value)} placeholder="SEO title English" dir="ltr"/>
        <textarea value={form.seo.description.fa} onChange={e=>setSeoLocal("description","fa",e.target.value)} placeholder="Meta description فارسی" rows={3}/>
        <textarea value={form.seo.description.en} onChange={e=>setSeoLocal("description","en",e.target.value)} placeholder="Meta description English" dir="ltr" rows={3}/>
        <input value={form.seo.canonical} onChange={e=>setSeo("canonical",e.target.value)} placeholder="Canonical URL" dir="ltr"/>
        <input value={form.seo.keywords} onChange={e=>setSeo("keywords",e.target.value)} placeholder="کلمات کلیدی، با ویرگول جدا شوند"/>
        <div><label><input type="checkbox" checked={form.seo.index} onChange={e=>setSeo("index",e.target.checked)}/> index</label><label style={{marginInlineStart:20}}><input type="checkbox" checked={form.seo.follow} onChange={e=>setSeo("follow",e.target.checked)}/> follow</label></div>
      </div></details>

      <select value={form.status||"draft"} onChange={e=>setForm({...form,status:e.target.value})}><option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option><option value="scheduled">زمان‌بندی‌شده</option><option value="archived">بایگانی</option></select>
      {error&&<p style={{color:"#b42318"}}>{error}</p>}{message&&<p style={{color:"green"}}>{message}</p>}
      <button disabled={saving}>{saving?"در حال ذخیره…":"ذخیره"}</button>
    </form>

    <MediaPicker open={picker!==null} mode="image" onClose={()=>setPicker(null)} onSelect={media=>{
      if(picker==="photo")setForm((x:any)=>({...x,photoMediaId:media._id}));
      if(picker==="cover")setForm((x:any)=>({...x,coverMediaId:media._id}));
      setPreview(media.url);setPicker(null);
    }}/>
  </main>;
}