import { UserModel } from "@/models";
import { connectDB } from "@/lib/db";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";

export async function GET(req:Request){
  const auth=await getAuth(req);
  if(!auth||!can(String(auth.role),"content:read"))return fail("Forbidden",403);
  try{
    await connectDB();
    const url=new URL(req.url);
    const mode=url.searchParams.get("role");
    const roles=mode==="content"?["super_admin","admin","manager","editor"]:undefined;
    const filter:Record<string,unknown>={isActive:true};
    if(roles)filter.role={$in:roles};
    const items=await UserModel.find(filter,{_id:1,firstName:1,lastName:1,email:1,phone:1,role:1}).sort({firstName:1,lastName:1,email:1}).limit(100).lean();
    return ok({items});
  }catch(e){return fail(e instanceof Error?e.message:"Unable to load users",500);}
}
