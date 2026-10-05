import { connectDB } from "@/lib/db";
import { IntegrationModel } from "@/models";
import { getAuth,can } from "@/lib/rbac";
import { fail,ok } from "@/lib/api";
import { decryptIntegrationConfig } from "@/lib/integrations/crypto";
import { sendSmsViaProvider } from "@/lib/sms";
import { normalizeIranianMobile } from "@/lib/phone";

function maskMobile(phone:string){
  return phone.length>7?phone.slice(0,5)+"*****"+phone.slice(-2):"***";
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req);
  if(!auth||!can(String(auth.role),"settings:write"))return fail("Forbidden",403);

  try{
    const {id}=await params;
    const body=await req.json().catch(()=>({})) as {recipient?:string;message?:string};
    const recipient=normalizeIranianMobile(String(body.recipient||""));
    const message=String(body.message||"تست ارسال پیامک از کلینیک دندانپزشکی").trim();

    if(message.length<1||message.length>1000)return fail("متن پیامک نامعتبر است",422);

    await connectDB();
    const item=await IntegrationModel.findById(id);
    if(!item)return fail("Integration module not found",404);
    if(item.type!=="sms")return fail("این ماژول از نوع پیامک نیست",422);
    if(item.provider!=="ippanel")return fail("ارسال تستی فعلاً برای IPPanel فعال است",422);
    if(!item.enabled)return fail("ابتدا ماژول IPPanel را فعال کنید",422);

    const config=decryptIntegrationConfig(item.configEncrypted);
    const result=await sendSmsViaProvider(item.provider,config,recipient,message);

    item.lastTestAt=new Date();
    item.lastTestOk=true;
    item.lastTestMessage="پیامک تستی با موفقیت به "+maskMobile(recipient)+" ارسال شد.";
    item.updatedBy=auth.sub as never;
    await item.save();

    return ok({
      ok:true,
      message:item.lastTestMessage,
      outboxIds:Array.isArray(result)?result:undefined
    });
  }catch(e){
    const message=e instanceof Error?e.message:"ارسال پیامک تستی ناموفق بود";
    return fail(message,422);
  }
}
