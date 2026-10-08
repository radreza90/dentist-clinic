import { z } from "zod";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getAuth } from "@/lib/rbac";
import { CommentModel, PageModel, ServiceModel, DoctorModel, BlogPostModel, PortfolioItemModel } from "@/models";

const targetInput=z.enum(["page","service","doctor","blog","portfolio"]);
const targetModels={page:PageModel,service:ServiceModel,doctor:DoctorModel,blog:BlogPostModel,portfolio:PortfolioItemModel} as const;
const input=z.object({
  targetType:targetInput,
  targetId:z.string().refine(Types.ObjectId.isValid,"شناسه محتوا نامعتبر است."),
  body:z.string().trim().min(2).max(5000),
  authorName:z.string().trim().min(2).max(120),
  authorEmail:z.string().trim().email().max(254).optional().nullable(),
  authorPhone:z.string().trim().max(40).optional().nullable(),
  rating:z.coerce.number().int().min(1).max(5).optional().nullable(),
});

function cleanText(value:string){return value.replace(/<[^>]*>/g,"").trim();}

export async function GET(req:Request){
  try{
    const url=new URL(req.url);
    const targetType=targetInput.parse(url.searchParams.get("targetType"));
    const targetId=url.searchParams.get("targetId")||"";
    if(!Types.ObjectId.isValid(targetId)) return fail("شناسه محتوا نامعتبر است.",422);
    await connectDB();
    const items=await CommentModel.find({targetType,targetId,status:"approved"}).sort({createdAt:-1}).limit(100).lean();
    return ok(items);
  }catch(e){return fail(e instanceof Error?e.message:"خطا در دریافت دیدگاه‌ها",400);}
}

export async function POST(req:Request){
  try{
    const parsed=input.safeParse(await req.json());
    if(!parsed.success)return fail("اطلاعات دیدگاه نامعتبر است.",422,parsed.error.flatten());
    const data=parsed.data;
    await connectDB();
    const Model=targetModels[data.targetType];
    const target=await Model.findOne({_id:data.targetId,status:"published"}).lean();
    if(!target)return fail("این محتوا برای ثبت دیدگاه در دسترس نیست.",404);
    const settings=(target as any).commentSettings;
    if(settings?.enabled!==true)return fail("ارسال دیدگاه برای این محتوا فعال نیست.",403);
    const body=cleanText(data.body);
    if(body.length<2)return fail("متن دیدگاه کوتاه یا نامعتبر است.",422);
    if(data.rating!==null&&data.rating!==undefined&&settings?.allowRating!==true)return fail("ثبت امتیاز برای این محتوا فعال نیست.",422);
    const auth=await getAuth(req);
    const userId=auth?.sub && Types.ObjectId.isValid(String(auth.sub)) ? auth.sub : null;
    const kind=data.targetType==="service"||data.targetType==="doctor"||data.targetType==="portfolio" ? "review" : "comment";
    const item=await CommentModel.create({
      targetType:data.targetType,targetId:data.targetId,kind,body,rating:data.rating??null,
      authorName:data.authorName.trim(),authorEmail:data.authorEmail?.trim()||null,authorPhone:data.authorPhone?.trim()||null,
      userId,status:"pending",
    });
    return ok({id:item._id,status:item.status,message:"دیدگاه شما ثبت شد و پس از بررسی مدیر منتشر خواهد شد."},201);
  }catch(e){return fail(e instanceof Error?e.message:"ثبت دیدگاه ناموفق بود",500);}
}
