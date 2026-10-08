"use client";
import { useCallback, useEffect, useState } from "react";
import { Pagination } from "./Pagination";
import { useAdminFeedback } from "./AdminFeedback";

type Status="pending"|"approved"|"rejected"|"spam";
type Item={_id:string;targetType:"page"|"service"|"doctor"|"blog"|"portfolio";targetLabel:string;targetTitle:string;kind:"comment"|"review";body:string;rating:number|null;authorName:string;authorEmail?:string|null;authorPhone?:string|null;status:Status;createdAt:string;adminNote?:string};
type Response={items:Item[];pagination:{page:number;limit:number;total:number;pages:number}};
const statusLabel:Record<Status,string>={pending:"در انتظار بررسی",approved:"تأیید شده",rejected:"رد شده",spam:"اسپم"};
const typeLabel:Record<Item["targetType"],string>={page:"صفحه",service:"خدمت",doctor:"پزشک",blog:"مقاله",portfolio:"نمونه‌کار"};

export function CommentsManager(){
  const {confirm,toast}=useAdminFeedback();
  const [items,setItems]=useState<Item[]>([]);
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState("");
  const [targetType,setTargetType]=useState("");
  const [page,setPage]=useState(1);
  const [perPage,setPerPage]=useState(10);
  const [pagination,setPagination]=useState<Response["pagination"]>({page:1,limit:10,total:0,pages:0});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const params=new URLSearchParams({page:String(page),limit:String(perPage)});
      if(search.trim())params.set("search",search.trim());
      if(status)params.set("status",status);
      if(targetType)params.set("targetType",targetType);
      const r=await fetch("/api/v1/admin/comments?"+params.toString(),{cache:"no-store"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"خطا در دریافت دیدگاه‌ها");
      const data=p.data as Response;
      setItems(data.items||[]);
      setPagination(data.pagination||{page,limit:perPage,total:0,pages:0});
      if(data.pagination?.pages&&page>data.pagination.pages)setPage(data.pagination.pages);
    }catch(e){setError(e instanceof Error?e.message:"خطا در دریافت دیدگاه‌ها");}
    finally{setLoading(false);}
  },[page,perPage,search,status,targetType]);

  useEffect(()=>{const t=window.setTimeout(()=>void load(),220);return()=>window.clearTimeout(t);},[load]);

  async function changeStatus(item:Item,next:Status){
    if(next==="rejected"&&!await confirm({title:"رد این دیدگاه؟",description:"این دیدگاه در سایت عمومی نمایش داده نخواهد شد.",confirmLabel:"رد دیدگاه",tone:"warning"}))return;
    if(next==="spam"&&!await confirm({title:"علامت‌گذاری به‌عنوان اسپم؟",description:"دیدگاه به وضعیت اسپم منتقل می‌شود.",confirmLabel:"اسپم",tone:"danger"}))return;
    try{
      const r=await fetch("/api/v1/admin/comments/"+item._id,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:next,adminNote:item.adminNote||""})});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"عملیات ناموفق بود");
      toast(next==="approved"?"دیدگاه تأیید شد.":next==="pending"?"دیدگاه به حالت بررسی برگشت.":next==="spam"?"دیدگاه به‌عنوان اسپم علامت خورد.":"دیدگاه رد شد.");
      void load();
    }catch(e){setError(e instanceof Error?e.message:"عملیات ناموفق بود");}
  }

  async function remove(item:Item){
    if(!await confirm({title:"حذف دیدگاه؟",description:"این عملیات دائمی است و متن نظر از دیتابیس حذف می‌شود.",confirmLabel:"حذف دائمی",tone:"danger"}))return;
    try{
      const r=await fetch("/api/v1/admin/comments/"+item._id,{method:"DELETE"});
      const p=await r.json();
      if(!r.ok||!p.success)throw new Error(p.error?.message||"حذف ناموفق بود");
      toast("دیدگاه حذف شد.");
      void load();
    }catch(e){setError(e instanceof Error?e.message:"حذف ناموفق بود");}
  }

  return <main className="comments-page">
    <header className="comments-heading">
      <div><span className="dashboard-eyebrow">تعامل کاربران</span><h1>دیدگاه‌ها</h1><p>همه نظرها و تجربه‌های کاربران را از یک مرکز بررسی، تأیید یا رد کنید.</p></div>
      <div className="comments-summary"><strong>{pagination.total}</strong><span>دیدگاه ثبت‌شده</span></div>
    </header>
    <section className="comments-toolbar">
      <label className="comments-search"><span>⌕</span><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="جست‌وجوی نام، تماس یا متن دیدگاه…"/></label>
      <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">همه وضعیت‌ها</option>{Object.entries(statusLabel).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      <select value={targetType} onChange={e=>{setTargetType(e.target.value);setPage(1);}}><option value="">همه محتواها</option>{Object.entries(typeLabel).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      <button className="admin-action-neutral" type="button" onClick={()=>void load()} disabled={loading}>↻ بروزرسانی</button>
    </section>
    {error&&<p className="comments-error" role="alert">{error}</p>}
    <section className="comments-list-card">
      {loading?<div className="comments-state">در حال بارگذاری دیدگاه‌ها…</div>:items.length===0?<div className="comments-state"><strong>دیدگاهی پیدا نشد</strong><span>فیلترها را تغییر دهید یا بعداً دوباره بررسی کنید.</span></div>:
        <div className="comments-list">
          {items.map(item=><article className="comment-row" key={item._id}>
            <div className="comment-avatar">{item.authorName.trim().charAt(0)}</div>
            <div className="comment-main">
              <div className="comment-topline">
                <strong>{item.authorName}</strong>
                <span className={"comment-status comment-status-"+item.status}>{statusLabel[item.status]}</span>
                <span className="comment-target">{typeLabel[item.targetType]}: {item.targetTitle}</span>
                {item.rating? <span className="comment-rating">{"★".repeat(item.rating)}<small>/ ۵</small></span>:null}
              </div>
              <p className="comment-body">{item.body}</p>
              <div className="comment-meta">
                <span>{new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(item.createdAt))}</span>
                {item.authorPhone&&<span dir="ltr">{item.authorPhone}</span>}
                {item.authorEmail&&<span dir="ltr">{item.authorEmail}</span>}
              </div>
              <div className="comment-actions">
                {item.status!=="approved"&&<button className="comment-action-approve" type="button" onClick={()=>void changeStatus(item,"approved")}>✓ تأیید</button>}
                {item.status!=="pending"&&<button className="admin-action-neutral" type="button" onClick={()=>void changeStatus(item,"pending")}>در انتظار بررسی</button>}
                {item.status!=="rejected"&&<button className="admin-action-warning" type="button" onClick={()=>void changeStatus(item,"rejected")}>رد</button>}
                {item.status!=="spam"&&<button className="comment-action-spam" type="button" onClick={()=>void changeStatus(item,"spam")}>اسپم</button>}
                <button className="admin-action-danger" type="button" onClick={()=>void remove(item)}>حذف</button>
              </div>
            </div>
          </article>)}
        </div>}
      {!loading&&<Pagination page={page} perPage={perPage} totalItems={pagination.total} onPageChange={setPage} onPerPageChange={value=>{setPerPage(value);setPage(1);}}/>}
    </section>
  </main>;
}
