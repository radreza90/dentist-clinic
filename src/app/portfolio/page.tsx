import Link from "next/link";
import { PortfolioItemModel, MediaModel } from "@/models";
import { Localized } from "@/components/i18n/Localized";

export const dynamic="force-dynamic";

export default async function PortfolioPage(){
  const items=await PortfolioItemModel.find({status:"published"}).sort({createdAt:-1}).limit(50).lean();
  const mediaIds=items.flatMap(item=>[...(item.afterMediaIds||[])].slice(0,1));
  const media=mediaIds.length?await MediaModel.find({_id:{$in:mediaIds}}).lean():[];
  const mediaMap=new Map(media.map(item=>[String(item._id),item]));
  return <main style={{maxWidth:1200,margin:"0 auto",padding:"48px 24px"}}>
    <h1><Localized value={{fa:"نمونه‌کارهای زیبایی و درمانی",en:"Dental Cases"}}/></h1>
    <p><Localized value={{fa:"نمونه‌هایی از درمان‌های انجام‌شده با حفظ حریم خصوصی بیماران.",en:"Selected treatment cases presented with patient privacy in mind."}}/></p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18,marginTop:32}}>
      {items.map(item=>{const image=item.afterMediaIds?.[0]?mediaMap.get(String(item.afterMediaIds[0])):null;return <article key={String(item._id)} style={{border:"1px solid #ddd",borderRadius:16,padding:20}}>
        {image?<img src={image.url} alt="" style={{width:"100%",height:220,objectFit:"cover",borderRadius:10}}/>:null}
        <h2><Link href={"/portfolio/"+item.slug}><Localized value={item.title}/></Link></h2>
        <p><Localized value={item.description}/></p>
        <Link href={"/portfolio/"+item.slug}><Localized value={{fa:"مشاهده پرونده درمان ←",en:"View case →"}}/></Link>
      </article>})}
    </div>
  </main>;
}