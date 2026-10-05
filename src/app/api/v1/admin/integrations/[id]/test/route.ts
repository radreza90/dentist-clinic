import { connectDB } from "@/lib/db";
import { IntegrationModel } from "@/models";
import { getAuth,can } from "@/lib/rbac";
import { fail,ok } from "@/lib/api";
import { decryptIntegrationConfig } from "@/lib/integrations/crypto";
import { getIntegrationDefinition } from "@/lib/integrations/registry";
import { validateIntegrationConfig } from "@/lib/integrations/service";

async function checkReachability(url:string,headers:Record<string,string>={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),10000);
  try{
    const response=await fetch(url,{method:"GET",headers,signal:controller.signal,cache:"no-store"});
    const text=await response.text();
    return {response,text};
  }catch(e){
    if(e instanceof Error&&e.name==="AbortError")throw new Error("درخواست تست اتصال timeout شد.");
    throw e;
  }finally{clearTimeout(timer);}
}

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

    let message="تنظیمات ماژول معتبر است.";
    let detail="";

    if(item.provider==="ippanel"){
      const apiUrl=String(config.apiUrl||"https://edge.ippanel.com/v1/api/send").replace(/\/$/,"");
      const countUrl=apiUrl.replace(/\/send$/,"/send/banks/provinces");
      const result=await checkReachability(countUrl,{"Accept":"application/json","Authorization":String(config.apiKey||"")});
      let payload:{meta?:{status?:boolean;message?:string}}|null=null;
      try{payload=result.text?JSON.parse(result.text):null;}catch{}
      if(!result.response.ok||payload?.meta?.status===false){
        throw new Error(payload?.meta?.message||("IPPanel connection failed (HTTP "+result.response.status+")"));
      }
      message="اتصال IPPanel با API Key معتبر با موفقیت بررسی شد.";
      detail="HTTP "+result.response.status;
    }else if(item.provider==="zarinpal"){
      const apiBase=String(config.apiBaseUrl||"https://api.zarinpal.com").replace(/\/$/,"");
      const result=await checkReachability(apiBase);
      if(result.response.status>=500)throw new Error("ZarinPal API unavailable (HTTP "+result.response.status+")");
      message="دسترسی شبکه به API زرین‌پال برقرار است. اعتبار Merchant ID در اولین درخواست پرداخت واقعی تأیید می‌شود.";
      detail="HTTP "+result.response.status;
    }

    item.lastTestAt=new Date();
    item.lastTestOk=true;
    item.lastTestMessage=message+(detail?" · "+detail:"");
    item.updatedBy=auth.sub as never;
    await item.save();
    return ok({ok:true,message:item.lastTestMessage});
  }catch(e){
    const message=e instanceof Error?e.message:"Integration test failed";
    try{
      const {id}=await params;
      await connectDB();
      await IntegrationModel.updateOne({_id:id},{$set:{lastTestAt:new Date(),lastTestOk:false,lastTestMessage:message}});
    }catch{}
    return fail(message,422);
  }
}
