"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Pagination } from "@/components/admin/Pagination";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

type Localized={fa:string;en:string};
type Category={_id:string;slug:string;name:Localized;description?:Localized};

const empty=():Category=>({_id:"",slug:"",name:{fa:"",en:""},description:{fa:"",en:""}});

export function CategoryManager({title,endpoint,backHref}:{title:string;endpoint:string;backHref:string}){
  const {confirm,toast}=useAdminFeedback();
  const [items,setItems]=useState<Category[]>([]);
  const [form,setForm]=useState<Category>(empty());
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(1);
  const [perPage,setPerPage]=useState(10);
  const [total,setTotal]=useState(0);

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const params=new URLSearchParams({page:String(page),limit:String(perPage)});
      if(search.trim())params.set("search",search.trim());
      const r=await fetch(endpoint+"?"+params.toString(),{cache:"no-store"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت دسته‌بندی‌ها");
      setItems(p.data?.items||[]);
      setTotal(p.data?.pagination?.total||0);
      if(p.data?.pagination?.pages&&page>p.data.pagination.pages)setPage(p.data.pagination.pages);
    }catch(e){setError(e instanceof Error?e.message:"خطا");}
    finally{setLoading(false);}
  },[endpoint,page,perPage,search]);
  useEffect(()=>{const timer=setTimeout(()=>void load(),250);return()=>clearTimeout(timer);},[load]);

  function reset(){setForm(empty());}

  async function save(e:FormEvent){
    e.preventDefault();setSaving(true);setError("");
    try{
      const r=await fetch(form._id?endpoint+"/"+form._id:endpoint,{method:form._id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        slug:form.slug,name:form.name,description:form.description
      })});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"ذخیره ناموفق بود");
      toast(form._id?"دسته‌بندی ویرایش شد.":"دسته‌بندی ایجاد شد.");
      reset();await load();
    }catch(e){setError(e instanceof Error?e.message:"ذخیره ناموفق بود");}
    finally{setSaving(false);}
  }

  async function remove(item:Category){
    if(!await confirm({title:"حذف دسته‌بندی",description:`دسته «${item.name?.fa||item.name?.en||item.slug}» حذف شود؟ این عملیات ممکن است روی محتوای مرتبط اثر بگذارد.`,confirmLabel:"حذف دسته‌بندی",tone:"danger"}))return;
    setError("");
    try{
      const r=await fetch(endpoint+"/"+item._id,{method:"DELETE"});const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"حذف ناموفق بود");
      toast("دسته‌بندی حذف شد.");
      await load();
    }catch(error){setError(error instanceof Error?error.message:"حذف ناموفق بود");}
  }

  return <main>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <div><h1 style={{marginBottom:6}}>{title}</h1><p style={{margin:0,color:"#667085"}}>مدیریت عنوان، slug و توضیحات دسته‌بندی.</p></div>
      <Link href={backHref}>بازگشت</Link>
    </div>

    <form onSubmit={save} style={{marginTop:24,background:"#fff",border:"1px solid #e4e7ec",borderRadius:16,padding:20,display:"grid",gap:14}}>
      <h2 style={{margin:0}}>{form._id?"ویرایش دسته‌بندی":"افزودن دسته‌بندی"}</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
        <input required value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="slug" dir="ltr"/>
        <input required value={form.name.fa} onChange={e=>setForm({...form,name:{...form.name,fa:e.target.value}})} placeholder="نام فارسی"/>
        <input value={form.name.en} onChange={e=>setForm({...form,name:{...form.name,en:e.target.value}})} placeholder="English name" dir="ltr"/>
      </div>
      <textarea value={form.description?.fa||""} onChange={e=>setForm({...form,description:{fa:e.target.value,en:form.description?.en||""}})} placeholder="توضیحات فارسی" rows={3}/>
      <textarea value={form.description?.en||""} onChange={e=>setForm({...form,description:{fa:form.description?.fa||"",en:e.target.value}})} placeholder="English description" dir="ltr" rows={3}/>
      <div style={{display:"flex",gap:10}}>
        <button type="submit" disabled={saving}>{saving?"در حال ذخیره…":form._id?"ذخیره تغییرات":"ایجاد دسته‌بندی"}</button>
        {form._id&&<button className="admin-action-neutral" type="button" onClick={reset}>انصراف</button>}
      </div>
    </form>

    {error&&<p style={{color:"#b42318"}}>{error}</p>}

    <section className="content-list-table-wrap category-list-wrap">
      <label className="content-list-search category-list-search"><span aria-hidden="true">⌕</span><input value={search} onChange={event=>{setSearch(event.target.value);setPage(1);}} placeholder="جست‌وجوی دسته‌بندی یا نشانی…" aria-label="جست‌وجوی دسته‌بندی‌ها"/></label>
      {loading?<p style={{padding:20}}>در حال بارگذاری…</p>:items.length===0?<p style={{padding:20}}>دسته‌بندی‌ای وجود ندارد.</p>:
      <div className="content-list-scroll"><table className="content-list-table">
        <thead><tr><th style={{padding:12,textAlign:"right"}}>نام</th><th>Slug</th><th>عملیات</th></tr></thead>
        <tbody>{items.map(item=><tr key={item._id} style={{borderTop:"1px solid #eef0f3"}}>
          <td style={{padding:12}}>{item.name?.fa||item.name?.en||"—"}</td>
          <td dir="ltr">{item.slug}</td>
          <td style={{padding:12,display:"flex",gap:8}}>
            <button className="admin-action-neutral" type="button" onClick={()=>setForm({...item,description:item.description||{fa:"",en:""}})}>ویرایش</button>
            <button className="admin-action-danger" type="button" onClick={()=>void remove(item)}>حذف</button>
          </td>
        </tr>)}</tbody>
      </table></div>}
      {!loading&&<Pagination page={page} perPage={perPage} totalItems={total} onPageChange={setPage} onPerPageChange={value=>{setPerPage(value);setPage(1);}}/>}
    </section>
  </main>;
}
