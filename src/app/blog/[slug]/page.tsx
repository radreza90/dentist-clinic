import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostModel } from "@/models";
import { sanitizeLocalizedHtml } from "@/lib/sanitize";
import { Localized } from "@/components/i18n/Localized";

type Props={params:Promise<{slug:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params; const post=await BlogPostModel.findOne({slug,status:"published"}).lean();
  if(!post)return {title:"Article not found"};
  const title=post.seo?.title?.fa||post.title?.fa||post.title?.en||"Dental Article";
  const description=post.seo?.description?.fa||post.excerpt?.fa||"";
  return {title,description,alternates:post.seo?.canonical?.fa?{canonical:post.seo.canonical.fa}:undefined,robots:post.seo?.robots||undefined};
}

export default async function BlogPostPage({params}:Props){
  const {slug}=await params; const post=await BlogPostModel.findOne({slug,status:"published"}).lean();
  if(!post)notFound();
  const content=sanitizeLocalizedHtml(post.content);
  return <main style={{maxWidth:900,margin:"0 auto",padding:"48px 24px"}}>
    <Link href="/blog"><Localized value={{fa:"← بازگشت به مقالات",en:"← Back to articles"}}/></Link>
    <h1 style={{marginTop:24}}><Localized value={post.title}/></h1>
    <p style={{color:"#666"}}><Localized value={post.excerpt}/></p>
    {post.publishedAt?<time dateTime={new Date(post.publishedAt).toISOString()}>{new Date(post.publishedAt).toLocaleDateString("fa-IR")}</time>:null}
    <article style={{marginTop:32,lineHeight:2}}><Localized value={content} html/></article>
  </main>;
}