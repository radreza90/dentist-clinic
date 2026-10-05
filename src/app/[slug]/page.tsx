import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageModel } from "@/models";
import { sanitizeLocalizedHtml } from "@/lib/sanitize";
import { Localized } from "@/components/i18n/Localized";
import { connectDB } from "@/lib/db";

type Props={params:Promise<{slug:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
  await connectDB();
  const {slug}=await params;
  const page=await PageModel.findOne({slug,status:"published"}).lean();
  if(!page)return {title:"Page not found"};
  const title=page.seo?.title?.fa||page.title?.fa||page.title?.en||"Dental Clinic";
  const description=page.seo?.description?.fa||page.excerpt?.fa||"";
  const canonical=page.seo?.canonical?.fa||undefined;
  return {title,description,alternates:canonical?{canonical}:undefined,robots:page.seo?.robots||undefined};
}

export default async function CmsPage({params}:Props){
  await connectDB();
  const {slug}=await params;
  const page=await PageModel.findOne({slug,status:"published"}).lean();
  if(!page)notFound();
  return <main style={{maxWidth:900,margin:"0 auto",padding:"48px 24px"}}>
    <h1><Localized value={page.title}/></h1>
    {page.excerpt&&<p style={{fontSize:18,color:"#666"}}><Localized value={page.excerpt}/></p>}
    <article style={{marginTop:30,lineHeight:2}}><Localized value={sanitizeLocalizedHtml(page.content)} html/></article>
  </main>;
}