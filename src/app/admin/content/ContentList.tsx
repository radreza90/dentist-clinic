"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@/components/admin/Pagination";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

type Item={_id:string;slug:string;title?:{fa?:string;en?:string};name?:{fa?:string;en?:string};status?:string;categoryIds?:string[]};
type Category={_id:string;name?:{fa?:string;en?:string};slug:string};
type ListResponse={items:Item[];pagination:{page:number;limit:number;total:number;pages:number}};

export function ContentList({title,endpoint,archive=true,createHref,editBase,categoriesEndpoint,categoriesHref}:{title:string;endpoint:string;archive?:boolean;createHref?:string;editBase?:string;categoriesEndpoint?:string;categoriesHref?:string}){
  const {confirm,toast}=useAdminFeedback();
  const [items,setItems]=useState<Item[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState("");
  const [categoryId,setCategoryId]=useState("");
  const [page,setPage]=useState(1);
  const [perPage,setPerPage]=useState(10);
  const [pagination,setPagination]=useState<ListResponse["pagination"]>({page:1,limit:10,total:0,pages:0});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const params=new URLSearchParams({page:String(page),limit:String(perPage)});
      if(search.trim())params.set("search",search.trim());
      if(status)params.set("status",status);
      if(categoryId)params.set("categoryId",categoryId);
      const response=await fetch(`${endpoint}?${params}`,{cache:"no-store"});
      const payload=await response.json();
      if(!response.ok||!payload.success)throw new Error(payload.error?.message||"خطا در دریافت اطلاعات");
      const data=payload.data as ListResponse;
      setItems(data.items||[]);
      setPagination(data.pagination||{page,limit:perPage,total:(data.items||[]).length,pages:1});
      if(data.pagination?.pages&&page>data.pagination.pages)setPage(data.pagination.pages);
    }catch(error){setError(error instanceof Error?error.message:"خطا در دریافت اطلاعات");}
    finally{setLoading(false);}
  },[endpoint,page,perPage,search,status,categoryId]);

  useEffect(()=>{const timer=window.setTimeout(()=>void load(),250);return()=>window.clearTimeout(timer);},[load]);
  useEffect(()=>{
    if(!categoriesEndpoint)return;
    let active=true;
    fetch(`${categoriesEndpoint}?page=1&limit=100`,{cache:"no-store"})
      .then(async response=>{
        const payload=await response.json();
        if(!response.ok||!payload.success)throw new Error(payload.error?.message||"خطا در دریافت دسته‌بندی‌ها");
        if(active)setCategories(payload.data.items||[]);
      })
      .catch(error=>{if(active)setError(error instanceof Error?error.message:"خطا در دریافت دسته‌بندی‌ها");});
    return()=>{active=false;};
  },[categoriesEndpoint]);

  async function archiveItem(id:string){
    if(!await confirm({title:"انتقال به بایگانی",description:"این مورد از فهرست منتشرشده خارج و به بایگانی منتقل می‌شود.",confirmLabel:"بایگانی",tone:"warning"}))return;
    try{
      const response=await fetch(`${endpoint}/${id}`,{method:"DELETE"});
      const payload=await response.json();
      if(!response.ok||!payload.success)throw new Error(payload.error?.message||"عملیات ناموفق بود");
      toast("مورد به بایگانی منتقل شد.");
      void load();
    }catch(error){setError(error instanceof Error?error.message:"عملیات ناموفق بود");}
  }

  return <main className="content-list-page">
    <header className="content-list-heading">
      <div><span className="dashboard-eyebrow">مدیریت محتوا</span><h1>{title}</h1><p>جست‌وجو، فیلتر و مدیریت {title} از این صفحه.</p></div>
      <div className="content-list-actions">
        {categoriesHref&&<Link className="admin-action-neutral" href={categoriesHref}>مدیریت دسته‌بندی‌ها</Link>}
        {createHref&&<Link className="admin-action-create" href={createHref}>＋ افزودن {title.replace(/ها$/,"")}</Link>}
      </div>
    </header>
    <section className="content-list-filters" aria-label={`جست‌وجو و فیلتر ${title}`}>
      <label className="content-list-search"><span aria-hidden="true">⌕</span><input value={search} onChange={event=>{setSearch(event.target.value);setPage(1);}} placeholder={`جست‌وجوی ${title} یا نشانی…`} aria-label={`جست‌وجوی ${title}`}/></label>
      <label>وضعیت
        <select value={status} onChange={event=>{setStatus(event.target.value);setPage(1);}}>
          <option value="">همه وضعیت‌ها</option><option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option><option value="scheduled">زمان‌بندی‌شده</option><option value="archived">بایگانی</option>
        </select>
      </label>
      {categoriesEndpoint&&<label>دسته‌بندی
        <select value={categoryId} onChange={event=>{setCategoryId(event.target.value);setPage(1);}}>
          <option value="">همه دسته‌بندی‌ها</option>{categories.map(category=><option key={category._id} value={category._id}>{category.name?.fa||category.name?.en||category.slug}</option>)}
        </select>
      </label>}
      <button className="admin-action-neutral" type="button" onClick={()=>void load()} disabled={loading}>↻ بروزرسانی</button>
    </section>
    {error&&<p className="content-list-error" role="alert">{error}</p>}
    <section className="content-list-table-wrap">
      {loading?<div className="content-list-state">در حال بارگذاری {title}…</div>:items.length===0?<div className="content-list-state"><strong>موردی پیدا نشد</strong><span>فیلترها را تغییر دهید یا یک مورد جدید اضافه کنید.</span></div>:
        <div className="content-list-scroll"><table className="content-list-table">
          <thead><tr><th>عنوان</th><th>نشانی</th><th>وضعیت</th><th>عملیات</th></tr></thead>
          <tbody>{items.map(item=><tr key={item._id}>
            <td><strong>{item.title?.fa||item.name?.fa||item.title?.en||item.name?.en||"بدون عنوان"}</strong></td>
            <td dir="ltr"><code>/{item.slug}</code></td>
            <td><span className={`content-status-badge status-${item.status||"draft"}`}>{({draft:"پیش‌نویس",published:"منتشرشده",scheduled:"زمان‌بندی‌شده",archived:"بایگانی"} as Record<string,string>)[item.status||"draft"]||item.status||"—"}</span></td>
            <td><div className="content-row-actions">
              {editBase&&<Link className="admin-action-neutral" href={`${editBase}/${item._id}`}>ویرایش</Link>}
              {archive&&item.status!=="archived"&&<button className="admin-action-warning" onClick={()=>void archiveItem(item._id)} type="button">بایگانی</button>}
            </div></td>
          </tr>)}</tbody>
        </table></div>}
      {!loading&&<Pagination page={page} perPage={perPage} totalItems={pagination.total} onPageChange={setPage} onPerPageChange={value=>{setPerPage(value);setPage(1);}}/>}
    </section>
  </main>;
}
