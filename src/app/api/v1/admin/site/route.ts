import { connectDB } from "@/lib/db";
import { SiteSettingsModel } from "@/models";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";
import { siteSettingsInput } from "@/lib/site-settings";

export async function GET(req:Request){
  const auth=await getAuth(req);
  if(!auth||!can(String(auth.role),"settings:read"))return fail("Forbidden",403);
  try{
    await connectDB();
    return ok(await SiteSettingsModel.findOne({key:"main"}).lean());
  }catch(e){return fail(e instanceof Error?e.message:"Unable to load settings",500);}
}

export async function PUT(req:Request){
  const auth=await getAuth(req);
  if(!auth||!can(String(auth.role),"settings:write"))return fail("Forbidden",403);
  try{
    const parsed=siteSettingsInput.safeParse(await req.json());
    if(!parsed.success)return fail("Invalid site settings",422,parsed.error.flatten());
    await connectDB();
    const item=await SiteSettingsModel.findOneAndUpdate(
      {key:"main"},{$set:{...parsed.data,key:"main",updatedBy:auth.sub}},{upsert:true,new:true,runValidators:true}
    ).lean();
    return ok(item);
  }catch(e){return fail(e instanceof Error?e.message:"Update failed",500);}
}
