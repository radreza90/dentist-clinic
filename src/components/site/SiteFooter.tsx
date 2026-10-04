import Link from "next/link";
import { SiteSettingsModel } from "@/models";
import { Localized } from "@/components/i18n/Localized";

export async function SiteFooter(){
  const site=await SiteSettingsModel.findOne({key:"main"}).lean();
  const lat=site?.latitude, lng=site?.longitude;
  const mapUrl=lat!=null&&lng!=null ? "https://www.google.com/maps/search/?api=1&query="+lat+","+lng : null;
  const directionsUrl=lat!=null&&lng!=null ? "https://www.google.com/maps/dir/?api=1&destination="+lat+","+lng : null;
  return <footer style={{marginTop:80,borderTop:"1px solid #ddd",background:"#fafafa"}}>
    <div style={{maxWidth:1200,margin:"0 auto",padding:"36px 24px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:28}}>
      <div><h2><Localized value={site?.clinicName||{fa:"کلینیک دندانپزشکی",en:"Dental Clinic"}}/></h2><p><Localized value={site?.description}/></p></div>
      <div><h3><Localized value={{fa:"تماس",en:"Contact"}}/></h3>
        {site?.phones?.map((phone:string)=><div key={phone}><a href={"tel:"+phone} dir="ltr">{phone}</a></div>)}
        {site?.whatsapp?<div><a href={"https://wa.me/"+site.whatsapp.replace(/\D/g,"")} target="_blank" rel="noreferrer">WhatsApp</a></div>:null}
      </div>
      <div><h3><Localized value={{fa:"آدرس کلینیک",en:"Clinic address"}}/></h3><p><Localized value={site?.address}/></p>
        {mapUrl?<div style={{display:"flex",gap:10,flexWrap:"wrap"}}><a href={mapUrl} target="_blank" rel="noreferrer"><Localized value={{fa:"مشاهده روی نقشه",en:"View on map"}}/></a><a href={directionsUrl!} target="_blank" rel="noreferrer"><Localized value={{fa:"مسیریابی",en:"Directions"}}/></a></div>:null}
      </div>
      <div><h3><Localized value={{fa:"رزرو",en:"Booking"}}/></h3><Link href="/booking"><Localized value={{fa:"نوبت‌دهی آنلاین",en:"Book online"}}/></Link><br/><Link href="/services"><Localized value={{fa:"خدمات",en:"Services"}}/></Link></div>
    </div>
    <div style={{padding:"14px 24px",borderTop:"1px solid #ddd",textAlign:"center",color:"#666"}}>© {new Date().getFullYear()} <Localized value={site?.clinicName||{fa:"کلینیک دندانپزشکی",en:"Dental Clinic"}}/></div>
  </footer>;
}