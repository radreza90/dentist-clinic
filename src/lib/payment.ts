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
    return {
      authority,
      redirectUrl:input.callbackUrl+"&mock=1&Authority="+encodeURIComponent(authority),
      raw:{mock:true},
    };
  }
  async verify(input:{authority:string}){
    return {ok:true,transactionId:"mock-"+input.authority,raw:{mock:true}};
  }
}

class ZarinPalGateway implements PaymentGateway{
  private readonly merchantId:string;
  private readonly apiBase:string;
  private readonly startPayBase:string;
  private readonly timeoutMs:number;

  constructor(){
    const merchantId=process.env.ZARINPAL_MERCHANT_ID?.trim();
    if(!merchantId)throw new Error("ZARINPAL_MERCHANT_ID is not configured");
    this.merchantId=merchantId;
    this.apiBase=(process.env.ZARINPAL_API_BASE_URL||"https://api.zarinpal.com").replace(/\/$/,"");
    this.startPayBase=(process.env.ZARINPAL_STARTPAY_BASE_URL||"https://www.zarinpal.com/pg/StartPay").replace(/\/$/,"");
    this.timeoutMs=Number(process.env.ZARINPAL_TIMEOUT_MS||15000);
  }

  private async post(path:string,body:Record<string,unknown>){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),this.timeoutMs);
    try{
      const response=await fetch(this.apiBase+path,{
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
    if(!Number.isSafeInteger(input.amount)||input.amount<=0){
      throw new Error("Invalid payment amount; ZarinPal amount must be a positive integer in Rial");
    }
    const payload={
      merchant_id:this.merchantId,
      amount:input.amount,
      callback_url:input.callbackUrl,
      description:input.description||"رزرو نوبت کلینیک دندانپزشکی",
      ...(input.metadata&&Object.keys(input.metadata).length?{metadata:input.metadata}:{}),
    };
    const result=await this.post("/pg/v4/payment/request.json",payload);
    const code=result.data?.code;
    const authority=result.data?.authority;
    if(code!==100||!authority){
      const suffix=result.errors?.message?": "+result.errors.message:"";
      throw new Error("ZarinPal payment request failed"+suffix+(code!==undefined?" (code "+code+")":""));
    }
    return {
      authority,
      redirectUrl:this.startPayBase+"/"+encodeURIComponent(authority),
      raw:result
    };
  }

  async verify(input:{authority:string;amount:number;raw?:unknown}){
    if(!input.authority)throw new Error("ZarinPal authority is required");
    if(!Number.isSafeInteger(input.amount)||input.amount<=0){
      throw new Error("Invalid payment amount; ZarinPal amount must be a positive integer in Rial");
    }
    const result=await this.post("/pg/v4/payment/verify.json",{
      merchant_id:this.merchantId,
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

export function paymentGateway():PaymentGateway{
  const driver=process.env.PAYMENT_DRIVER||"mock";
  if(driver==="mock"){
    if(process.env.NODE_ENV==="production")throw new Error("Mock payment gateway cannot be used in production");
    return new MockGateway();
  }
  if(driver==="zarinpal")return new ZarinPalGateway();
  throw new Error("Unsupported PAYMENT_DRIVER: "+driver);
}
