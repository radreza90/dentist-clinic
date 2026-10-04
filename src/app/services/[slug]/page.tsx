import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceModel } from "@/models";
import { sanitizeLocalizedHtml } from "@/lib/sanitize";
import { Localized } from "@/components/i18n/Localized";

type Props={params:Promise<{slug:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;
  const service=await ServiceModel.findOne({slug,status:"published"}).lean();
  if(!service)return {title:"Service not found"};
  const title=service.seo?.title?.fa||service.title?.fa||service.title?.en||"Dental Service";
  const description=service.seo?.description?.fa||service.excerpt?.fa||"";
  const canonical=service.seo?.canonical?.fa||undefined;
  return {
    title,
    description,
    alternates: canonical?{canonical}:undefined,
    robots: service.seo?.robots ? {index:service.seo.robots.index,follow:service.seo.robots.follow}:undefined,
    openGraph: {
      title:service.seo?.ogTitle?.fa||title,
      description:service.seo?.ogDescription?.fa||description,
      type:"article",
      url:canonical,
    },
  };
}

export default async function ServiceDetailPage({params}:Props){
  const {slug}=await params;
  const service=await ServiceModel.findOne({slug,status:"published"}).lean();
  if(!service)notFound();
  const content=sanitizeLocalizedHtml(service.content);
  const suitable=sanitizeLocalizedHtml(service.suitableFor);
  const benefits=sanitizeLocalizedHtml(service.benefits);
  const limitations=sanitizeLocalizedHtml(service.limitations);
  const care=sanitizeLocalizedHtml(service.careInstructions);

  return <main dir="rtl" style={{maxWidth:900,margin:"0 auto",padding:"48px 24px"}}>
    <nav style={{marginBottom:24}}><Link href="/services">خدمات</Link> / <span><Localized value={service.title}/></span></nav>
    <h1><Localized value={service.title}/></h1>
    <p style={{fontSize:18,color:"#555"}}><Localized value={service.excerpt}/></p>

    <section style={{marginTop:32}}><Localized value={content} html/></section>

    <section style={{marginTop:32}}><h2>مناسب چه کسانی است؟</h2><Localized value={suitable} html/></section>
    <section style={{marginTop:32}}><h2>مزایا</h2><Localized value={benefits} html/></section>
    <section style={{marginTop:32}}><h2>محدودیت‌ها</h2><Localized value={limitations} html/></section>
    <section style={{marginTop:32}}><h2>مراقبت‌ها</h2><Localized value={care} html/></section>

    {service.faqs?.length ? <section style={{marginTop:32}}>
      <h2>سؤالات متداول</h2>
      {service.faqs.map((faq:any,index:number)=><details key={index} style={{borderTop:"1px solid #ddd",padding:"14px 0"}}>
        <summary><Localized value={faq.question}/></summary>
        <div style={{marginTop:10}}><Localized value={sanitizeLocalizedHtml(faq.answer)} html/></div>
      </details>)}
    </section>:null}

    <section style={{marginTop:40,padding:24,borderRadius:16,background:"#f5f7fa"}}>
      <h2>برای این خدمت وقت بگیرید</h2>
      <p>برای انتخاب زمان مناسب و ثبت درخواست رزرو، وارد بخش نوبت‌دهی شوید.</p>
      <Link href={"/booking?service="+encodeURIComponent(service.slug)} style={{display:"inline-block",padding:"12px 18px",borderRadius:10,background:"#111",color:"#fff"}}>درخواست نوبت</Link>
    </section>
  </main>;
}