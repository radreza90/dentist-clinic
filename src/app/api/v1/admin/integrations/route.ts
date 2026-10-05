import { connectDB } from "@/lib/db";
import { IntegrationModel } from "@/models";
import { getAuth,can } from "@/lib/rbac";
import { fail,ok } from "@/lib/api";
import { integrationRegistry } from "@/lib/integrations/registry";
import { publicIntegration, syncIntegrationRegistry } from "@/lib/integrations/service";

export async function GET(req:Request){
  const auth=await getAuth(req);
  if(!auth||!can(String(auth.role),"settings:read"))return fail("Forbidden",403);
  try{
    await syncIntegrationRegistry();
    await connectDB();
    const items=await IntegrationModel.find({}).sort({type:1,isDefault:-1,provider:1}).lean();
    return ok({
      items:items.map(item=>publicIntegration(item as never)),
      available:integrationRegistry.map(item=>({provider:item.provider,type:item.type,name:item.name,description:item.description,fields:item.fields}))
    });
  }catch(e){return fail(e instanceof Error?e.message:"Unable to load integrations",500);}
}
