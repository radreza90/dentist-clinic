import Link from "next/link";
import { ServiceModel, DoctorModel, BlogPostModel, PortfolioItemModel, SiteSettingsModel } from "@/models";
import { Localized } from "@/components/i18n/Localized";
import { SiteFooter } from "@/components/site/SiteFooter";

export const revalidate=60;

export default async function Home(){
  const [site,services,doctors,posts,cases]=await Promise.all([
    SiteSettingsModel.findOne({key:"main"}).lean(),
    ServiceModel.find({status:"published"}).sort({createdAt:1}).limit(6).lean(),
    DoctorModel.find({status:"published"}).sort({createdAt:1}).limit(4).lean(),
    BlogPostModel.find({status:"published"}).sort({publishedAt:-1,createdAt:-1}).limit(3).lean(),
    PortfolioItemModel.find({status:"published"}).sort({createdAt:-1}).limit(3).lean(),
  ]);
  const clinicName=site?.clinicName||{fa:"کلینیک دندانپزشکی",en:"Dental Clinic"};

  return <div>
    <main>
      <section style={{background:"linear-gradient(135deg,#f5f7ff,#fff)",padding:"96px 24px 72px"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{maxWidth:760}}>
            <p style={{fontWeight:700,color:"#555"}}><Localized value={clinicName}/></p>
            <h1 style={{fontSize:"clamp(2.4rem,6vw,4.8rem)",lineHeight:1.1,margin:"16px 0"}}><Localized value={{fa:"سلامت، زیبایی و آرامش لبخند شما",en:"Healthy, beautiful smiles with thoughtful care"}}/></h1>
            <p style={{fontSize:19,lineHeight:1.9,color:"#555"}}><Localized value={site?.description||{fa:"خدمات تخصصی دندانپزشکی، پزشکان مجرب و نوبت‌دهی آنلاین.",en:"Specialized dental care, experienced doctors, and online booking."}}/></p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:28}}>
              <Link href="/booking" style={{padding:"13px 20px",borderRadius:10,background:"#111",color:"#fff"}}><Localized value={{fa:"نوبت‌دهی آنلاین",en:"Book an appointment"}}/></Link>
              <Link href="/services" style={{padding:"13px 20px",borderRadius:10,border:"1px solid #ccc"}}><Localized value={{fa:"مشاهده خدمات",en:"Explore services"}}/></Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{maxWidth:1200,margin:"0 auto",padding:"64px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"end",flexWrap:"wrap"}}>
          <div><h2><Localized value={{fa:"خدمات ما",en:"Our services"}}/></h2><p><Localized value={{fa:"از درمان‌های ترمیمی تا زیبایی.",en:"From restorative care to aesthetic treatments."}}/></p></div>
          <Link href="/services"><Localized value={{fa:"همه خدمات ←",en:"All services →"}}/></Link>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16,marginTop:24}}>
          {services.map(service=><article key={String(service._id)} style={{border:"1px solid #ddd",borderRadius:16,padding:20}}>
            <h3><Link href={"/services/"+service.slug}><Localized value={service.title}/></Link></h3>
            <p><Localized value={service.excerpt}/></p>
          </article>)}
        </div>
      </section>

      <section style={{background:"#fafafa"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"64px 24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"end",flexWrap:"wrap"}}>
            <div><h2><Localized value={{fa:"پزشکان ما",en:"Our doctors"}}/></h2><p><Localized value={{fa:"آشنایی با تیم درمانی کلینیک.",en:"Meet our dental team."}}/></p></div>
            <Link href="/doctors"><Localized value={{fa:"مشاهده همه پزشکان ←",en:"All doctors →"}}/></Link>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16,marginTop:24}}>
            {doctors.map(doctor=><article key={String(doctor._id)} style={{background:"#fff",border:"1px solid #ddd",borderRadius:16,padding:20}}>
              <h3><Link href={"/doctors/"+doctor.slug}><Localized value={doctor.name}/></Link></h3>
              <p><Localized value={doctor.shortBio}/></p>
            </article>)}
          </div>
        </div>
      </section>

      {cases.length>0&&<section style={{maxWidth:1200,margin:"0 auto",padding:"64px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"end",flexWrap:"wrap"}}>
          <h2><Localized value={{fa:"نمونه‌کارها",en:"Selected cases"}}/></h2>
          <Link href="/portfolio"><Localized value={{fa:"مشاهده همه ←",en:"View all →"}}/></Link>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16,marginTop:24}}>
          {cases.map(item=><article key={String(item._id)} style={{border:"1px solid #ddd",borderRadius:16,padding:20}}><h3><Link href={"/portfolio/"+item.slug}><Localized value={item.title}/></Link></h3><p><Localized value={item.description}/></p></article>)}
        </div>
      </section>}

      {posts.length>0&&<section style={{background:"#fafafa"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"64px 24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"end",flexWrap:"wrap"}}>
            <h2><Localized value={{fa:"مجله دندانپزشکی",en:"Dental journal"}}/></h2>
            <Link href="/blog"><Localized value={{fa:"همه مقالات ←",en:"All articles →"}}/></Link>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16,marginTop:24}}>
            {posts.map(post=><article key={String(post._id)} style={{background:"#fff",border:"1px solid #ddd",borderRadius:16,padding:20}}><h3><Link href={"/blog/"+post.slug}><Localized value={post.title}/></Link></h3><p><Localized value={post.excerpt}/></p></article>)}
          </div>
        </div>
      </section>}
    </main>
    <SiteFooter/>
  </div>;
}