import Link from "next/link";
import { ServiceModel } from "@/models";
import { Localized } from "@/components/i18n/Localized";

export const revalidate=60;

export default async function ServicesPage(){
  const services=await ServiceModel.find({status:"published"}).sort({createdAt:1}).lean();
  return <main style={{maxWidth:1200,margin:"0 auto",padding:"48px 24px"}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:20}}>
      <div>
        <h1><Localized value={{fa:"خدمات دندانپزشکی",en:"Dental Services"}}/></h1>
        <p><Localized value={{fa:"خدمات تخصصی کلینیک را بررسی کنید.",en:"Explore our dental services and treatment options."}}/></p>
      </div>
      <Link href="/"><Localized value={{fa:"صفحه اصلی",en:"Home"}}/></Link>
    </header>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18,marginTop:32}}>
      {services.map(service=><article key={String(service._id)} style={{border:"1px solid #ddd",borderRadius:16,padding:20}}>
        <h2><Link href={"/services/"+service.slug}><Localized value={service.title}/></Link></h2>
        <p><Localized value={service.excerpt}/></p>
        <Link href={"/services/"+service.slug}><Localized value={{fa:"مشاهده جزئیات ←",en:"View details →"}}/></Link>
      </article>)}
    </div>
  </main>;
}