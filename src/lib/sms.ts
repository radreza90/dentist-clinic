import { normalizeIranianMobile } from "@/lib/phone";
import { getIntegration } from "@/lib/integrations/service";

function normalizeIPPanelSender(value:string){
  const raw=value.trim().replace(/\s+/g,"");
  if(!raw)throw new Error("IPPanel sender number is not configured");
  if(raw.startsWith("+"))return raw;
  if(raw.startsWith("0098"))return "+"+raw.slice(2);
  if(raw.startsWith("98"))return "+"+raw;
  if(raw.startsWith("0"))return "+98"+raw.slice(1);
  if(/^3\d{6,}$/.test(raw))return "+98"+raw;
  return raw;
}

class ConsoleSmsProvider{
  async send(phone:string,message:string){
    console.info("[SMS:console]",phone,message);
  }
}

class IPPanelSmsProvider{
  constructor(private readonly config:Record<string,unknown>){}

  async send(phone:string,message:string){
    const apiKey=String(this.config.apiKey||"").trim();
    const fromNumber=normalizeIPPanelSender(String(this.config.fromNumber||""));
    const apiUrl=String(this.config.apiUrl||"https://edge.ippanel.com/v1/api/send").trim().replace(/\/$/,"");
    if(!apiKey)throw new Error("IPPanel API Key is not configured");
    if(!message.trim())throw new Error("SMS message cannot be empty");

    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(apiUrl,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Accept":"application/json",
          "Authorization":apiKey
        },
        body:JSON.stringify({
          sending_type:"webservice",
          from_number:fromNumber,
          message,
          params:{recipients:[normalizeIranianMobile(phone)]}
        }),
        signal:controller.signal,
        cache:"no-store"
      });
      const responseText=await response.text();
      let payload:unknown=null;
      try{payload=responseText?JSON.parse(responseText):null;}catch{
        throw new Error("IPPanel returned an invalid response");
      }

      const result=payload as {
        meta?:{status?:boolean;message?:string;message_code?:string};
        data?:{message_outbox_ids?:unknown[]};
      };
      if(!response.ok||result.meta?.status===false){
        const detail=result.meta?.message?": "+result.meta.message:" (HTTP "+response.status+")";
        throw new Error("IPPanel SMS failed"+detail);
      }
      return result.data?.message_outbox_ids||[];
    }catch(e){
      if(e instanceof Error&&e.name==="AbortError")throw new Error("IPPanel SMS request timed out");
      throw e;
    }finally{
      clearTimeout(timer);
    }
  }
}

export async function sendSmsViaProvider(
  provider:string,
  config:Record<string,unknown>,
  phone:string,
  message:string
){
  if(provider==="console"){
    if(process.env.NODE_ENV==="production")throw new Error("Console SMS provider is disabled in production");
    return void await new ConsoleSmsProvider().send(phone,message);
  }
  if(provider==="ippanel")return void await new IPPanelSmsProvider(config).send(phone,message);
  throw new Error("Unsupported SMS module: "+provider);
}

export async function sendSms(phone:string,message:string){
  const active=await getIntegration("sms");
  if(!active)throw new Error("No active SMS provider is configured in the admin panel");
  return sendSmsViaProvider(active.item.provider,active.config,phone,message);
}

export { normalizeIPPanelSender };
