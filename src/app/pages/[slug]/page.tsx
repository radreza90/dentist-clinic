import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageModel } from "@/models";
import { sanitizeLocalizedHtml } from "@/lib/sanitize";
import { Localized } from "@/components/i18n/Localized";

type Props={params:Promise<{slug:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params; const page=await PageModel.findOne({slug,status:"published"}).lean();
  if(!page)return {title:"Page not found"};
  const title=page.seo?.title?.fa||page.title?.fa||page.title?.en||"Dental Clinic";
  return {title,description:page.seo?.description?.fa||page.excerpt?.fa||"",alternates:page.seo?.canonical?.fa?{canonical:page.seo.canonical.fa}:undefined,robots:page.seo?.robots||undefined};
}

export default async function GenericPage({params}:Props){
  const {slug}=await params; const page=await PageModel.findOne({slug,status:"published"}).lean();
  if(!page)notFound();
  return <main style={{maxWidth:900,margin:"0 auto",padding:"48px 24px"}}>
    <h1><Localized value={page.title}/></h1>
    <p style={{color:"#666"}}><Localized value={page.excerpt}/></p>
    <article style={{marginTop:30,lineHeight:2}}><Localized value={sanitizeLocalizedHtml(page.content)} html/></article>
  </main>;
}