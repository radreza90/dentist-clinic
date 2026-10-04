import Link from "next/link";
import { ServiceModel } from "@/models";
import { Localized, } from "@/components/i18n/Localized";

export const revalidate = 60;

export default async function ServicesPage(){
  const services=await ServiceModel.find({status:"published"}).sort({createdAt:1}).lean();
  return <main dir="rtl" style={{maxWidth:1200,margin:"0 auto",padding:"48px 24px"}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:20}}>
      <div><h1>خدمات دندانپزشکی</h1><p>خدمات تخصصی کلینیک را بررسی کنید.</p></div>
      <Link href="/">صفحه اصلی</Link>
    </header>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18,marginTop:32}}>
      {services.map(service=><article key={String(service._id)} style={{border:"1px solid #ddd",borderRadius:16,padding:20}}>
        <h2><Link href={"/services/"+service.slug}><Localized value={service.title}/></Link></h2>
        <p><Localized value={service.excerpt}/></p>
        <Link href={"/services/"+service.slug}>مشاهده جزئیات ←</Link>
      </article>)}
    </div>
  </main>;
}