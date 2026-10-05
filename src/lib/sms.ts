import { normalizeIranianMobile } from "@/lib/phone";

function normalizeIranianMobileLegacy(value:string){
  const raw=value.trim().replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[\s().-]/g,"");
  let normalized=raw;
  if(normalized.startsWith("0098"))normalized="+"+normalized.slice(4);
  else if(normalized.startsWith("98"))normalized="+"+normalized;
  else if(normalized.startsWith("0"))normalized="+98"+normalized.slice(1);
  if(!/^\+989\d{9}$/.test(normalized))throw new Error("Invalid Iranian mobile number");
  return normalized;
}

class IPPanelSmsProvider{
  private readonly apiKey:string;
  private readonly fromNumber:string;
  private readonly apiUrl:string;
  private readonly timeoutMs:number;

  constructor(){
    const apiKey=process.env.IPPANEL_API_KEY?.trim();
    const fromNumber=process.env.IPPANEL_FROM_NUMBER?.trim();
    if(!apiKey)throw new Error("IPPANEL_API_KEY is not configured");
    if(!fromNumber)throw new Error("IPPANEL_FROM_NUMBER is not configured");
    this.apiKey=apiKey;
    this.fromNumber=fromNumber;
    this.apiUrl=(process.env.IPPANEL_API_URL||"https://edge.ippanel.com/v1/api/send").trim();
    this.timeoutMs=Number(process.env.IPPANEL_TIMEOUT_MS||15000);
  }

  async send(phone:string,message:string){
    if(!message.trim())throw new Error("SMS message cannot be empty");
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),this.timeoutMs);
    try{
      const response=await fetch(this.apiUrl,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Accept":"application/json",
          "Authorization":this.apiKey
        },
        body:JSON.stringify({
          sending_type:"webservice",
          from_number:this.fromNumber,
          message,
          params:{recipients:[normalizeIranianMobile(phone)]}
        }),
        signal:controller.signal,
        cache:"no-store"
      });
      const text=await response.text();
      let result:unknown=null;
      try{result=text?JSON.parse(text):null;}catch{throw new Error("IPPanel returned an invalid response");}
      const payload=result as {
        meta?:{status?:boolean;message?:string};
        data?:{message_outbox_ids?:unknown[]};
      };
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
  const driver=process.env.SMS_DRIVER||"console";
  if(driver==="console"){
    if(process.env.NODE_ENV==="production")throw new Error("SMS provider is not configured for production");
    console.info("[SMS:console]",phone,message);
    return;
  }
  if(driver==="ippanel")return void await new IPPanelSmsProvider().send(phone,message);
  throw new Error("Unsupported SMS_DRIVER: "+driver);
}
