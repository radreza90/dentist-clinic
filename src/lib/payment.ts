import { getIntegration } from "@/lib/integrations/service";

export type PaymentRequest={
  paymentId:string;
  amount:number;
  currency:string;
  callbackUrl:string;
  description?:string;
  metadata?:Record<string,string>;
};
export type PaymentResult={authority:string;redirectUrl:string;raw?:unknown};

export interface PaymentGateway{
  request(input:PaymentRequest):Promise<PaymentResult>;
  verify(input:{authority:string;amount:number;raw?:unknown}):Promise<{ok:boolean;transactionId?:string;raw?:unknown}>;
}

class MockGateway implements PaymentGateway{
  async request(input:PaymentRequest){
    const authority=input.paymentId;
    const callback=new URL(input.callbackUrl);
    callback.searchParams.set("mock","1");
    callback.searchParams.set("Authority",authority);
    return {authority,redirectUrl:callback.toString(),raw:{mock:true}};
  }
  async verify(input:{authority:string}){
    return {ok:true,transactionId:"mock-"+input.authority,raw:{mock:true}};
  }
}

class ZarinPalGateway implements PaymentGateway{
  constructor(private readonly config:Record<string,unknown>){}

  private async post(path:string,body:Record<string,unknown>){
    const apiBase=String(this.config.apiBaseUrl||"https://api.zarinpal.com").replace(/\/$/,"");
    const timeoutMs=15000;
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const response=await fetch(apiBase+path,{
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify(body),
        signal:controller.signal,
        cache:"no-store"
      });
      const text=await response.text();
      let json:unknown=null;
      try{json=text?JSON.parse(text):null;}catch{throw new Error("ZarinPal returned an invalid response");}
      if(!response.ok)throw new Error("ZarinPal HTTP "+response.status);
      return json as {
        data?:{code?:number;message?:string;authority?:string;ref_id?:string|number};
        errors?:{code?:unknown;message?:string}
      };
    }catch(e){
      if(e instanceof Error&&e.name==="AbortError")throw new Error("ZarinPal request timed out");
      throw e;
    }finally{
      clearTimeout(timer);
    }
  }

  async request(input:PaymentRequest){
    const merchantId=String(this.config.merchantId||"").trim();
    if(!merchantId)throw new Error("ZarinPal Merchant ID is not configured");
    if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw new Error("Invalid payment amount; ZarinPal requires a positive integer in Rial");
    if(input.currency!=="IRR")throw new Error("ZarinPal payments must use IRR amounts");

    const result=await this.post("/pg/v4/payment/request.json",{
      merchant_id:merchantId,
      amount:input.amount,
      callback_url:input.callbackUrl,
      description:input.description||"رزرو نوبت کلینیک دندانپزشکی",
      ...(input.metadata&&Object.keys(input.metadata).length?{metadata:input.metadata}:{}),
    });
    const code=result.data?.code;
    const authority=result.data?.authority;
    if(code!==100||!authority){
      const suffix=result.errors?.message?": "+result.errors.message:"";
      throw new Error("ZarinPal payment request failed"+suffix+(code!==undefined?" (code "+code+")":""));
    }
    const startPayBase=String(this.config.startPayBaseUrl||"https://www.zarinpal.com/pg/StartPay").replace(/\/$/,"");
    return {authority,redirectUrl:startPayBase+"/"+encodeURIComponent(authority),raw:result};
  }

  async verify(input:{authority:string;amount:number;raw?:unknown}){
    const merchantId=String(this.config.merchantId||"").trim();
    if(!merchantId)throw new Error("ZarinPal Merchant ID is not configured");
    if(!input.authority)throw new Error("ZarinPal authority is required");
    if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw new Error("Invalid payment amount; ZarinPal requires a positive integer in Rial");
    if(typeof input.amount!=="number")throw new Error("Invalid payment amount");

    const result=await this.post("/pg/v4/payment/verify.json",{
      merchant_id:merchantId,
      amount:input.amount,
      authority:input.authority
    });
    const code=result.data?.code;
    return {
      ok:code===100||code===101,
      transactionId:result.data?.ref_id!==undefined?String(result.data.ref_id):undefined,
      raw:result
    };
  }
}

export async function paymentGateway(provider?:string):Promise<PaymentGateway>{
  const active=await getIntegration("payment",provider,!provider);
  if(!active)throw new Error("No active payment gateway is configured in the admin panel");
  if(active.item.provider==="mock")return new MockGateway();
  if(active.item.provider==="zarinpal")return new ZarinPalGateway(active.config);
  throw new Error("Unsupported payment module: "+active.item.provider);
}
