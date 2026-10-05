import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortfolioItemModel, MediaModel, DoctorModel } from "@/models";
import { sanitizeLocalizedHtml } from "@/lib/sanitize";
import { Localized } from "@/components/i18n/Localized";

type Props={params:Promise<{slug:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params; const item=await PortfolioItemModel.findOne({slug,status:"published","privacy.consentStatus":"granted"}).lean();
  if(!item)return {title:"Case not found"};
  const title=item.seo?.title?.fa||item.title?.fa||item.title?.en||"Dental Case";
  return {title,description:item.seo?.description?.fa||item.description?.fa||"",alternates:item.seo?.canonical?.fa?{canonical:item.seo.canonical.fa}:undefined,robots:item.seo?.robots||undefined};
}

export default async function PortfolioDetail({params}:Props){
  const {slug}=await params; const item=await PortfolioItemModel.findOne({slug,status:"published"}).lean();
  if(!item)notFound();
  const ids=[...(item.beforeMediaIds||[]),...(item.afterMediaIds||[])];
  const media=ids.length?await MediaModel.find({_id:{$in:ids}}).lean():[];
  const mediaMap=new Map(media.map(m=>[String(m._id),m]));
  const doctor=item.doctorId?await DoctorModel.findById(item.doctorId).lean():null;
  return <main style={{maxWidth:1000,margin:"0 auto",padding:"48px 24px"}}>
    <Link href="/portfolio"><Localized value={{fa:"← بازگشت به نمونه‌کارها",en:"← Back to cases"}}/></Link>
    <h1 style={{marginTop:24}}><Localized value={item.title}/></h1>
    <section style={{marginTop:28}}><h2><Localized value={{fa:"تصاویر قبل و بعد",en:"Before & After"}}/></h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div><h3><Localized value={{fa:"قبل",en:"Before"}}/></h3>{(item.beforeMediaIds||[]).map((id:any,i:number)=>{const m=mediaMap.get(String(id));return m?<img key={i} src={m.url} alt="" style={{width:"100%",marginBottom:12,borderRadius:10}}/>:null})}</div>
        <div><h3><Localized value={{fa:"بعد",en:"After"}}/></h3>{(item.afterMediaIds||[]).map((id:any,i:number)=>{const m=mediaMap.get(String(id));return m?<img key={i} src={m.url} alt="" style={{width:"100%",marginBottom:12,borderRadius:10}}/>:null})}</div>
      </div>
    </section>
    <section style={{marginTop:32}}><h2><Localized value={{fa:"شرح درمان",en:"Treatment"}}/></h2><Localized value={sanitizeLocalizedHtml(item.treatment)} html/></section>
    {doctor?<section style={{marginTop:24}}><p><Localized value={{fa:"پزشک:",en:"Doctor:"}}/> <Localized value={doctor.name}/></p></section>:null}
  </main>;
}