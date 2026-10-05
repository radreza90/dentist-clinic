import { normalizeIranianMobile } from "@/lib/phone";
import { getIntegration } from "@/lib/integrations/service";

class ConsoleSmsProvider{
  async send(phone:string,message:string){
    console.info("[SMS:console]",phone,message);
  }
}

class IPPanelSmsProvider{
  constructor(private readonly config:Record<string,unknown>){}

  async send(phone:string,message:string){
    const apiKey=String(this.config.apiKey||"").trim();
    const fromNumber=String(this.config.fromNumber||"").trim();
    const apiUrl=String(this.config.apiUrl||"https://edge.ippanel.com/v1/api/send").trim();
    if(!apiKey)throw new Error("IPPanel API Key is not configured");
    if(!fromNumber)throw new Error("IPPanel sender number is not configured");
    if(!message.trim())throw new Error("SMS message cannot be empty");

    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(apiUrl,{
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json","Authorization":apiKey},
        body:JSON.stringify({
          sending_type:"webservice",
          from_number:fromNumber,
          message,
          params:{recipients:[normalizeIranianMobile(phone)]}
        }),
        signal:controller.signal,
        cache:"no-store"
      });
      const text=await response.text();
      let result:unknown=null;
      try{result=text?JSON.parse(text):null;}catch{throw new Error("IPPanel returned an invalid response");}
      const payload=result as {meta?:{status?:boolean;message?:string};data?:{message_outbox_ids?:unknown[]}};
      if(!response.ok||payload.meta?.status===false){
        const detail=payload.meta?.message?": "+payload.meta.message:" (HTTP "+response.status+")";
        throw new Error("IPPanel SMS failed"+detail);
      }
      return payload.data?.message_outbox_ids||[];
    }catch(e){
      if(e instanceof Error&&e.name==="AbortError")throw new Error("IPPanel SMS request timed out");
      throw e;
    }finally{
      clearTimeout(timer);
    }
  }
}

export async function sendSms(phone:string,message:string){
  const active=await getIntegration("sms");
  if(!active)throw new Error("No active SMS provider is configured in the admin panel");
  if(active.item.provider==="console"){
    if(process.env.NODE_ENV==="production")throw new Error("Console SMS provider is disabled in production");
    return void await new ConsoleSmsProvider().send(phone,message);
  }
  if(active.item.provider==="ippanel")return void await new IPPanelSmsProvider(active.config).send(phone,message);
  throw new Error("Unsupported SMS module: "+active.item.provider);
}
