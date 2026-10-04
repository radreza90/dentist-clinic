export type PaymentRequest={paymentId:string;amount:number;currency:string;callbackUrl:string};
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
      redirectUrl:input.callbackUrl+"?mock=1&paymentId="+encodeURIComponent(input.paymentId)+"&Authority="+encodeURIComponent(authority),
    };
  }
  async verify(input:{authority:string}){
    return {ok:true,transactionId:"mock-"+input.authority,raw:{mock:true}};
  }
}

export function paymentGateway():PaymentGateway{
  const driver=process.env.PAYMENT_DRIVER||"mock";
  if(driver==="mock"){
    if(process.env.NODE_ENV==="production")throw new Error("Mock payment gateway cannot be used in production");
    return new MockGateway();
  }
  throw new Error("Unsupported PAYMENT_DRIVER: "+driver);
}