import { connectDB } from "@/lib/db";
import { IntegrationModel } from "@/models";
import { getAuth,can } from "@/lib/rbac";
import { fail,ok } from "@/lib/api";
import { decryptIntegrationConfig } from "@/lib/integrations/crypto";
import { getIntegrationDefinition } from "@/lib/integrations/registry";
import { validateIntegrationConfig } from "@/lib/integrations/service";

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req);
  if(!auth||!can(String(auth.role),"settings:write"))return fail("Forbidden",403);
  try{
    const {id}=await params;
    await connectDB();
    const item=await IntegrationModel.findById(id);
    if(!item)return fail("Integration module not found",404);
    const definition=getIntegrationDefinition(item.type,item.provider);
    if(!definition)return fail("Integration module is not supported",422);
    const config=decryptIntegrationConfig(item.configEncrypted);
    await validateIntegrationConfig(definition,config,config);
    item.lastTestAt=new Date();
    item.lastTestOk=true;
    item.lastTestMessage="تنظیمات ماژول معتبر است.";
    item.updatedBy=auth.sub as never;
    await item.save();
    return ok({ok:true,message:item.lastTestMessage});
  }catch(e){
    try{
      const {id}=await params;
      await connectDB();
      await IntegrationModel.updateOne({_id:id},{$set:{lastTestAt:new Date(),lastTestOk:false,lastTestMessage:e instanceof Error?e.message:"Integration test failed"}});
    }catch{}
    return fail(e instanceof Error?e.message:"Integration test failed",422);
  }
}
