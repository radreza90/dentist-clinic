import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { CommentModel, PageModel, ServiceModel, DoctorModel, BlogPostModel, PortfolioItemModel } from "@/models";
import { getAuth, can } from "@/lib/rbac";
import { fail, ok } from "@/lib/api";

const targetTypes=["page","service","doctor","blog","portfolio"] as const;
type TargetType=typeof targetTypes[number];
const models={page:PageModel,service:ServiceModel,doctor:DoctorModel,blog:BlogPostModel,portfolio:PortfolioItemModel} as const;
function labelOf(type:TargetType){return ({page:"صفحه",service:"خدمت",doctor:"پزشک",blog:"مقاله",portfolio:"نمونه‌کار"} as Record<TargetType,string>)[type];}

export async function GET(req:Request){
  const auth=await getAuth(req);if(!auth||!can(String(auth.role),"comments:read"))return fail("Forbidden",403);
  try{
    await connectDB();
    const url=new URL(req.url);
    const page=Math.max(1,Number(url.searchParams.get("page")||1));
    const limit=Math.min(100,Math.max(1,Number(url.searchParams.get("limit")||20)));
    const status=url.searchParams.get("status")||"";
    const targetType=url.searchParams.get("targetType")||"";
    const search=url.searchParams.get("search")?.trim()||"";
    const filter:Record<string,unknown>={};
    if(status)filter.status=status;
    if(targetType)filter.targetType=targetType;
    if(search)filter.$or=[{authorName:{$regex:search,$options:"i"}},{authorEmail:{$regex:search,$options:"i"}},{authorPhone:{$regex:search,$options:"i"}},{body:{$regex:search,$options:"i"}}];
    const skip=(page-1)*limit;
    const [comments,total]=await Promise.all([
      CommentModel.find(filter).sort({createdAt:-1}).skip(skip).limit(limit).lean(),
      CommentModel.countDocuments(filter),
    ]);
    const byType:Record<string,string[]>={page:[],service:[],doctor:[],blog:[],portfolio:[]};
    for(const comment of comments)if(byType[String(comment.targetType)])byType[String(comment.targetType)].push(String(comment.targetId));
    const titles=new Map<string,string>();
    await Promise.all(targetTypes.map(async(type)=>{
      const ids=byType[type].filter(Types.ObjectId.isValid);
      if(!ids.length)return;
      const rows=await models[type].find({_id:{$in:ids}}).select({title:1,name:1,slug:1}).lean();
      for(const row of rows){
        const value=(row as any).name||(row as any).title;
        titles.set(type+":"+String((row as any)._id),value?.fa||value?.en||(row as any).slug||"بدون عنوان");
      }
    }));
    const items=comments.map(comment=>({...comment,targetLabel:labelOf(comment.targetType as TargetType),targetTitle:titles.get(String(comment.targetType)+":"+String(comment.targetId))||"محتوای حذف‌شده"}));
    return ok({items,pagination:{page,limit,total,pages:Math.ceil(total/limit)}});
  }catch(e){return fail(e instanceof Error?e.message:"خطا در دریافت دیدگاه‌ها",500);}
}
