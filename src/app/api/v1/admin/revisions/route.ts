import { connectDB } from "@/lib/db";
import { ContentRevisionModel } from "@/models";
import { getAuth,can } from "@/lib/rbac";
import { fail,ok } from "@/lib/api";

const valid=new Set(["page","service","doctor","blog","portfolio"]);

export async function GET(req:Request){
  const auth=await getAuth(req);
  if(!auth||!can(String(auth.role),"content:read"))return fail("Forbidden",403);
  try{
    const url=new URL(req.url);
    const contentType=String(url.searchParams.get("contentType")||"");
    const contentId=String(url.searchParams.get("contentId")||"");
    if(!valid.has(contentType)||!contentId)return fail("contentType and contentId are required",422);
    await connectDB();
    const items=await ContentRevisionModel.find({contentType,contentId})
      .sort({version:-1}).limit(50)
      .populate("changedBy","firstName lastName email phone").lean();
    return ok(items);
  }catch(e){return fail(e instanceof Error?e.message:"Unable to load revisions",500);}
}
