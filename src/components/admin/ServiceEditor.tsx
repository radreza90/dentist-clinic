/* generated admin page */
"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RichEditor } from "@/components/editor/RichEditor";
import { MediaPicker } from "@/components/editor/MediaPicker";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

type Localized={fa:string;en:string};
type ServiceForm={slug:string;title:Localized;excerpt:Localized;content:Localized;suitableFor:Localized;benefits:Localized;limitations:Localized;careInstructions:Localized;faqs:{question:Localized;answer:Localized}[];bookingFee:number;currency:string;coverMediaId:string|null;status:string;commentSettings:{enabled:boolean;allowRating:boolean};seo:{title:Localized;description:Localized;canonical:Localized;keywords:string;index:boolean;follow:boolean}};

const empty:ServiceForm={
  slug:"",title:{fa:"",en:""},excerpt:{fa:"",en:""},content:{fa:"",en:""},suitableFor:{fa:"",en:""},benefits:{fa:"",en:""},limitations:{fa:"",en:""},careInstructions:{fa:"",en:""},faqs:[],bookingFee:0,currency:"IRR",coverMediaId:null,status:"draft",
  commentSettings:{enabled:false,allowRating:true},
  seo:{title:{fa:"",en:""},description:{fa:"",en:""},canonical:{fa:"",en:""},keywords:"",index:true,follow:true}
};

export function ServiceEditor({id}:{id?:string}){
  const router=useRouter();
  const {toast}=useAdminFeedback();
  const [form,setForm]=useState<ServiceForm>(structuredClone(empty));
  const [loading,setLoading]=useState(Boolean(id));
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [pickerOpen,setPickerOpen]=useState(false);
  const [coverUrl,setCoverUrl]=useState("");

  async function submit(e:FormEvent){
    e.preventDefault();
    setSaving(true);
    setError("");
    try{
      const body={...form,seo:{...form.seo,keywords:form.seo.keywords.split(",").map(x=>x.trim()).filter(Boolean),robots:{index:form.seo.index,follow:form.seo.follow}}};
      const r=await fetch(id?"/api/v1/admin/services/"+id:"/api/v1/admin/services",{
        method:id?"PUT":"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
      });
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره انجام نشد");
      toast("خدمت با موفقیت ذخیره شد.");
      if(!id&&p.data?._id)router.replace(`/admin/content/services/${p.data._id}`);
    }catch(err){setError(err instanceof Error?err.message:"خطا");}
    finally{setSaving(false);}
  }

  const edit=useCallback(async(serviceId:string)=>{
    try{
      const r=await fetch("/api/v1/admin/services/"+serviceId,{cache:"no-store"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا");
      const d=p.data;
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
        commentSettings:{enabled:d.commentSettings?.enabled===true,allowRating:d.commentSettings?.allowRating===true},
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
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{if(id)void edit(id);},[edit,id]);

  if(loading)return <main><h1>خدمات</h1><p>در حال بارگذاری خدمت…</p></main>;

  return <main>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <div><h1>{id?"ویرایش خدمت":"افزودن خدمت"}</h1><p style={{color:"#666"}}>اطلاعات، قیمت رزرو، محتوای غنی و SEO.</p></div>
      <Link className="admin-action-neutral" href="/admin/content/services">بازگشت به فهرست خدمات</Link>
    </div>

    <form onSubmit={submit} style={{background:"#fff",border:"1px solid #ddd",borderRadius:14,padding:20,margin:"24px 0",display:"grid",gap:14}}>
      <h2 style={{margin:0}}>{id?"ویرایش خدمت":"افزودن خدمت"}</h2>
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
              <div style={{display:"flex",justifyContent:"space-between",gap:10}}><strong>سؤال {index+1}</strong><button className="admin-action-danger" type="button" onClick={()=>setForm({...form,faqs:form.faqs.filter((_,i)=>i!==index)})}>حذف</button></div>
              <input value={faq.question.fa} onChange={e=>setForm({...form,faqs:form.faqs.map((x,i)=>i===index?{...x,question:{...x.question,fa:e.target.value}}:x)})} placeholder="سؤال فارسی"/>
              <input value={faq.question.en} onChange={e=>setForm({...form,faqs:form.faqs.map((x,i)=>i===index?{...x,question:{...x.question,en:e.target.value}}:x)})} placeholder="Question in English" dir="ltr"/>
              <RichEditor value={faq.answer.fa} onChange={value=>setForm({...form,faqs:form.faqs.map((x,i)=>i===index?{...x,answer:{...x.answer,fa:value}}:x)})}/>
              <RichEditor value={faq.answer.en} onChange={value=>setForm({...form,faqs:form.faqs.map((x,i)=>i===index?{...x,answer:{...x.answer,en:value}}:x)})} placeholder="Answer in English"/>
            </div>)}
            <button className="admin-action-create" type="button" onClick={()=>setForm({...form,faqs:[...form.faqs,{question:{fa:"",en:""},answer:{fa:"",en:""}}]})}>افزودن سؤال متداول</button>
          </div>
        </div>
      </details>


      <details>
        <summary style={{cursor:"pointer",fontWeight:700}}>دیدگاه کاربران</summary>
        <div style={{display:"grid",gap:12,paddingTop:14}}>
          <label style={{display:"flex",gap:10,alignItems:"center"}}><input type="checkbox" checked={form.commentSettings.enabled} onChange={e=>setForm({...form,commentSettings:{...form.commentSettings,enabled:e.target.checked}})}/> ارسال دیدگاه برای این خدمت فعال باشد</label>
          <label style={{display:"flex",gap:10,alignItems:"center"}}><input type="checkbox" checked={form.commentSettings.allowRating} onChange={e=>setForm({...form,commentSettings:{...form.commentSettings,allowRating:e.target.checked}})}/> امکان ثبت امتیاز ۱ تا ۵ برای این خدمت</label>
          <small style={{color:"#667085"}}>همه دیدگاه‌ها ابتدا نیازمند بررسی و تأیید مدیر هستند.</small>
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
        <button disabled={saving} type="submit">{saving?"در حال ذخیره…":id?"ذخیره تغییرات":"ایجاد خدمت"}</button>
        <Link className="admin-action-neutral" href="/admin/content/services">انصراف</Link>
      </div>
    </form>

    <MediaPicker open={pickerOpen} mode="image" onClose={()=>setPickerOpen(false)} onSelect={media=>{setForm({...form,coverMediaId:media._id});setCoverUrl(media.url);setPickerOpen(false);}}/>
  </main>;
}
