import { connectDB } from "@/lib/db";
import { IntegrationModel } from "@/models";
import { getAuth,can } from "@/lib/rbac";
import { fail,ok } from "@/lib/api";
import { decryptIntegrationConfig,encryptIntegrationConfig } from "@/lib/integrations/crypto";
import { getIntegrationDefinition } from "@/lib/integrations/registry";
import { publicIntegration,syncIntegrationRegistry,validateIntegrationConfig } from "@/lib/integrations/service";

export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req);
  if(!auth||!can(String(auth.role),"settings:write"))return fail("Forbidden",403);
  try{
    const {id}=await params;
    await syncIntegrationRegistry();
    await connectDB();
    const item=await IntegrationModel.findById(id);
    if(!item)return fail("Integration module not found",404);
    const definition=getIntegrationDefinition(item.type,item.provider);
    if(!definition)return fail("Integration module is not supported",422);
    const body=await req.json() as {enabled?:boolean;isDefault?:boolean;config?:Record<string,unknown>};
    const existing=decryptIntegrationConfig(item.configEncrypted);
    const config=enabled
      ? (body.config===undefined?await validateIntegrationConfig(definition,existing,existing):await validateIntegrationConfig(definition,body.config,existing))
      : existing;
    const enabled=body.enabled===undefined?item.enabled:Boolean(body.enabled);
    const isDefault=body.isDefault===undefined?item.isDefault:Boolean(body.isDefault);
    if(isDefault&&!enabled)return fail("A disabled integration cannot be the default",422);
    if(enabled)Object.assign(item,{configEncrypted:Object.keys(config).length?encryptIntegrationConfig(config):""});
    if(!enabled&&body.config===undefined)Object.assign(item,{});
    item.enabled=enabled;
    item.isDefault=isDefault;
    item.updatedBy=auth.sub as never;
    await item.save();
    if(isDefault){
      await IntegrationModel.updateMany(
        {type:item.type,_id:{$ne:item._id},isDefault:true},
        {$set:{isDefault:false,updatedBy:auth.sub}}
      );
    }
    return ok(publicIntegration(item));
  }catch(e){return fail(e instanceof Error?e.message:"Unable to update integration",500);}
}

