/* generated admin page */
"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { RichEditor } from "@/components/editor/RichEditor";
import { MediaPicker } from "@/components/editor/MediaPicker";

type Localized={fa:string;en:string};
type Service={_id:string;slug:string;title:Localized;excerpt?:Localized;status?:string;bookingFee?:number;currency?:string};
type ServiceForm={slug:string;title:Localized;excerpt:Localized;content:Localized;suitableFor:Localized;benefits:Localized;limitations:Localized;careInstructions:Localized;faqs:{question:Localized;answer:Localized}[];bookingFee:number;currency:string;coverMediaId:string|null;status:string;seo:{title:Localized;description:Localized;canonical:Localized;keywords:string;index:boolean;follow:boolean}};

const empty:ServiceForm={
  slug:"",title:{fa:"",en:""},excerpt:{fa:"",en:""},content:{fa:"",en:""},suitableFor:{fa:"",en:""},benefits:{fa:"",en:""},limitations:{fa:"",en:""},careInstructions:{fa:"",en:""},faqs:[],bookingFee:0,currency:"IRR",coverMediaId:null,status:"draft",
  seo:{title:{fa:"",en:""},description:{fa:"",en:""},canonical:{fa:"",en:""},keywords:"",index:true,follow:true}
};

export default function ServicesAdmin(){
  const [items,setItems]=useState<Service[]>([]);
  const [form,setForm]=useState<ServiceForm>(structuredClone(empty));
  const [editing,setEditing]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");
  const [pickerOpen,setPickerOpen]=useState(false);
  const [coverUrl,setCoverUrl]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);
    setError("");
    try{
      const q=search?"?search="+encodeURIComponent(search):"";
      const r=await fetch("/api/v1/admin/services"+q,{cache:"no-store"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت خدمات");
      setItems(p.data.items);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
    finally{setLoading(false);}
  },[search]);

  useEffect(()=>{void load();},[load]);

  function reset(){
    setEditing(null);
    setForm(structuredClone(empty));
    setCoverUrl("");
    setError("");
  }

  async function submit(e:FormEvent){
    e.preventDefault();
    setSaving(true);
    setError("");
    try{
      const body={...form,seo:{...form.seo,keywords:form.seo.keywords.split(",").map(x=>x.trim()).filter(Boolean),robots:{index:form.seo.index,follow:form.seo.follow}}};
      const r=await fetch(editing?"/api/v1/admin/services/"+editing:"/api/v1/admin/services",{
        method:editing?"PUT":"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
      });
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره انجام نشد");
      reset();
      await load();
    }catch(err){setError(err instanceof Error?err.message:"خطا");}
    finally{setSaving(false);}
  }

  async function edit(item:Service){
    try{
      const r=await fetch("/api/v1/admin/services/"+item._id,{cache:"no-store"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا");
      const d=p.data;
      setEditing(item._id);
      setForm({
        slug:d.slug,
        title:d.title||{fa:"",en:""},
        excerpt:d.excerpt||{fa:"",en:""},
        content:d.content||{fa:"",en:""},
        suitableFor:d.suitableFor||{fa:"",en:""},
        benefits:d.benefits||{fa:"",en:""},
        limitations:d.limitations||{fa:"",en:""},
        careInstructions:d.careInstructions||{fa:"",en:""},
        faqs:Array.isArray(d.faqs)?d.faqs.map((x:{question?:Localized;answer?:Localized})=>({question:x.question||{fa:"",en:""},answer:x.answer||{fa:"",en:""}})):[],
        bookingFee:d.bookingFee||0,
        currency:d.currency||"IRR",
        coverMediaId:d.coverMediaId?String(d.coverMediaId):null,
        status:d.status||"draft",
        seo:{
          title:d.seo?.title||{fa:"",en:""},
          description:d.seo?.description||{fa:"",en:""},
          canonical:d.seo?.canonical||{fa:"",en:""},
          keywords:Array.isArray(d.seo?.keywords)?d.seo.keywords.join(", "):"",
          index:d.seo?.robots?.index!==false,
          follow:d.seo?.robots?.follow!==false
        }
      });
      setCoverUrl("");
      window.scrollTo({top:0,behavior:"smooth"});
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
  }

  async function archive(id:string){
    if(!window.confirm("این خدمت به بایگانی منتقل شود؟"))return;
    const r=await fetch("/api/v1/admin/services/"+id,{method:"DELETE"});
    const p=await r.json();
    if(!r.ok||!p.success)setError(p.error?.message||"عملیات ناموفق بود");
    else await load();
  }

  return <main>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <div><h1>خدمات</h1><p style={{color:"#666"}}>مدیریت خدمات، قیمت رزرو، محتوای غنی و SEO.</p></div>
      <Link href="/admin/content">بازگشت به محتوا</Link>
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

      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <button type="button" onClick={()=>setPickerOpen(true)}>انتخاب تصویر کاور</button>
        {coverUrl&&<img src={coverUrl} alt="" style={{width:80,height:60,objectFit:"cover",borderRadius:8}}/>}
        {form.coverMediaId&&<span style={{fontSize:12,color:"#666"}}>کاور انتخاب شده</span>}
      </div>

      <label>محتوای فارسی</label>
      <RichEditor value={form.content.fa} onChange={value=>setForm({...form,content:{...form.content,fa:value}})}/>
      <label>English content</label>
      <RichEditor value={form.content.en} onChange={value=>setForm({...form,content:{...form.content,en:value}})} placeholder="Write the service content…"/>

      <details>
        <summary style={{cursor:"pointer",fontWeight:700}}>محتوای تخصصی خدمت</summary>
        <div style={{display:"grid",gap:14,paddingTop:14}}>
          <label>برای چه کسانی مناسب است — فارسی</label>
          <RichEditor value={form.suitableFor.fa} onChange={value=>setForm({...form,suitableFor:{...form.suitableFor,fa:value}})}/>
          <label>Suitable for — English</label>
          <RichEditor value={form.suitableFor.en} onChange={value=>setForm({...form,suitableFor:{...form.suitableFor,en:value}})} placeholder="Who is this treatment suitable for?"/>
          <label>مزایا — فارسی</label>
          <RichEditor value={form.benefits.fa} onChange={value=>setForm({...form,benefits:{...form.benefits,fa:value}})}/>
          <label>Benefits — English</label>
          <RichEditor value={form.benefits.en} onChange={value=>setForm({...form,benefits:{...form.benefits,en:value}})} placeholder="Benefits"/>
          <label>محدودیت‌ها — فارسی</label>
          <RichEditor value={form.limitations.fa} onChange={value=>setForm({...form,limitations:{...form.limitations,fa:value}})}/>
          <label>Limitations — English</label>
          <RichEditor value={form.limitations.en} onChange={value=>setForm({...form,limitations:{...form.limitations,en:value}})} placeholder="Limitations"/>
          <label>مراقبت‌های بعد از درمان — فارسی</label>
          <RichEditor value={form.careInstructions.fa} onChange={value=>setForm({...form,careInstructions:{...form.careInstructions,fa:value}})}/>
          <label>Aftercare — English</label>
          <RichEditor value={form.careInstructions.en} onChange={value=>setForm({...form,careInstructions:{...form.careInstructions,en:value}})} placeholder="Aftercare instructions"/>
          <div>
            <h3>سؤالات متداول</h3>
            {form.faqs.map((faq,index)=><div key={index} style={{border:"1px solid #ddd",borderRadius:10,padding:12,marginBottom:10,display:"grid",gap:10}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10}}><strong>سؤال {index+1}</strong><button type="button" onClick={()=>setForm({...form,faqs:form.faqs.filter((_,i)=>i!==index)})}>حذف</button></div>
              <input value={faq.question.fa} onChange={e=>setForm({...form,faqs:form.faqs.map((x,i)=>i===index?{...x,question:{...x.question,fa:e.target.value}}:x)})} placeholder="سؤال فارسی"/>
              <input value={faq.question.en} onChange={e=>setForm({...form,faqs:form.faqs.map((x,i)=>i===index?{...x,question:{...x.question,en:e.target.value}}:x)})} placeholder="Question in English" dir="ltr"/>
              <RichEditor value={faq.answer.fa} onChange={value=>setForm({...form,faqs:form.faqs.map((x,i)=>i===index?{...x,answer:{...x.answer,fa:value}}:x)})}/>
              <RichEditor value={faq.answer.en} onChange={value=>setForm({...form,faqs:form.faqs.map((x,i)=>i===index?{...x,answer:{...x.answer,en:value}}:x)})} placeholder="Answer in English"/>
            </div>)}
            <button type="button" onClick={()=>setForm({...form,faqs:[...form.faqs,{question:{fa:"",en:""},answer:{fa:"",en:""}}]})}>افزودن سؤال متداول</button>
          </div>
        </div>
      </details>

      <details>
        <summary style={{cursor:"pointer",fontWeight:700}}>تنظیمات SEO</summary>
        <div style={{display:"grid",gap:10,paddingTop:14}}>
          <input value={form.seo.title.fa} onChange={e=>setForm({...form,seo:{...form.seo,title:{...form.seo.title,fa:e.target.value}}})} placeholder="SEO title فارسی"/>
          <input value={form.seo.title.en} onChange={e=>setForm({...form,seo:{...form.seo,title:{...form.seo.title,en:e.target.value}}})} placeholder="SEO title English" dir="ltr"/>
          <textarea value={form.seo.description.fa} onChange={e=>setForm({...form,seo:{...form.seo,description:{...form.seo.description,fa:e.target.value}}})} placeholder="Meta description فارسی" rows={3}/>
          <textarea value={form.seo.description.en} onChange={e=>setForm({...form,seo:{...form.seo,description:{...form.seo.description,en:e.target.value}}})} placeholder="Meta description English" dir="ltr" rows={3}/>
          <input value={form.seo.canonical.fa} onChange={e=>setForm({...form,seo:{...form.seo,canonical:{...form.seo.canonical,fa:e.target.value}}})} placeholder="Canonical URL" dir="ltr"/>
          <input value={form.seo.keywords} onChange={e=>setForm({...form,seo:{...form.seo,keywords:e.target.value}})} placeholder="کلمات کلیدی، با ویرگول جدا کنید"/>
          <div style={{display:"flex",gap:20}}>
            <label><input type="checkbox" checked={form.seo.index} onChange={e=>setForm({...form,seo:{...form.seo,index:e.target.checked}})}/> Index</label>
            <label><input type="checkbox" checked={form.seo.follow} onChange={e=>setForm({...form,seo:{...form.seo,follow:e.target.checked}})}/> Follow</label>
          </div>
        </div>
      </details>

      <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
        <option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option><option value="scheduled">زمان‌بندی‌شده</option><option value="archived">بایگانی</option>
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
          <td style={{padding:12}}>{item.title?.fa||item.title?.en||"—"}</td><td dir="ltr">{item.slug}</td><td>{item.bookingFee||0} {item.currency||"IRR"}</td><td>{item.status||"draft"}</td>
          <td style={{padding:12,display:"flex",gap:8}}><button type="button" onClick={()=>void edit(item)}>ویرایش</button><button type="button" onClick={()=>void archive(item._id)}>بایگانی</button></td>
        </tr>)}</tbody>
      </table>}
    </div>

    <MediaPicker open={pickerOpen} mode="image" onClose={()=>setPickerOpen(false)} onSelect={media=>{setForm({...form,coverMediaId:media._id});setCoverUrl(media.url);setPickerOpen(false);}}/>
  </main>;
}
