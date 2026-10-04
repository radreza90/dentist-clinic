import type { MetadataRoute } from "next";
import { BlogPostModel, DoctorModel, PageModel, PortfolioItemModel, ServiceModel } from "@/models";

export const dynamic="force-dynamic";

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base=process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000";
  const now=new Date();
  const entries:MetadataRoute.Sitemap=[
    {url:base,lastModified:now,changeFrequency:"daily",priority:1},
    {url:base+"/services",lastModified:now,changeFrequency:"weekly",priority:.9},
    {url:base+"/doctors",lastModified:now,changeFrequency:"monthly",priority:.8},
    {url:base+"/blog",lastModified:now,changeFrequency:"daily",priority:.8},
    {url:base+"/portfolio",lastModified:now,changeFrequency:"weekly",priority:.7},
    {url:base+"/booking",lastModified:now,changeFrequency:"weekly",priority:.9},
  ];
  const [pages,services,doctors,posts,items]=await Promise.all([
    PageModel.find({status:"published"}).select("slug updatedAt").lean(),
    ServiceModel.find({status:"published"}).select("slug updatedAt").lean(),
    DoctorModel.find({status:"published"}).select("slug updatedAt").lean(),
    BlogPostModel.find({status:"published"}).select("slug updatedAt").lean(),
    PortfolioItemModel.find({status:"published"}).select("slug updatedAt").lean(),
  ]);
  entries.push(...pages.map(x=>({url:base+"/"+x.slug,lastModified:x.updatedAt,changeFrequency:"monthly" as const,priority:.7})));
  entries.push(...services.map(x=>({url:base+"/services/"+x.slug,lastModified:x.updatedAt,changeFrequency:"weekly" as const,priority:.8})));
  entries.push(...doctors.map(x=>({url:base+"/doctors/"+x.slug,lastModified:x.updatedAt,changeFrequency:"monthly" as const,priority:.7})));
  entries.push(...posts.map(x=>({url:base+"/blog/"+x.slug,lastModified:x.updatedAt,changeFrequency:"weekly" as const,priority:.7})));
  entries.push(...items.map(x=>({url:base+"/portfolio/"+x.slug,lastModified:x.updatedAt,changeFrequency:"monthly" as const,priority:.6})));
  return entries;
}