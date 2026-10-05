import { connectDB } from "@/lib/db";
import { BlogPostModel, DoctorModel, PageModel, PortfolioItemModel, ServiceModel } from "@/models";
import { ok,fail } from "@/lib/api";

function authorized(req:Request){
  const expected=process.env.CRON_SECRET;
  if(!expected)return false;
  const provided=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"")||req.headers.get("x-cron-secret");
  return provided===expected;
}

export async function POST(req:Request){
  if(!authorized(req))return fail("Unauthorized",401);
  try{
    await connectDB();
    const now=new Date();
    const models=[DoctorModel,ServiceModel,PageModel,BlogPostModel,PortfolioItemModel];
    let total=0;
    for(const Model of models){
      const result=await Model.updateMany(
        {status:"scheduled",scheduledAt:{$lte:now}},
        {$set:{status:"published",publishedAt:now}}
      );
      total+=result.modifiedCount;
    }
    return ok({published:total,at:now});
  }catch(e){return fail(e instanceof Error?e.message:"Scheduled publish job failed",500);}
}

export async function GET(req:Request){
  return POST(req);
}
