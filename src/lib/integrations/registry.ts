export type IntegrationField={
  key:string;
  label:string;
  type:"text"|"password"|"url";
  required?:boolean;
  secret?:boolean;
  placeholder?:string;
};

export type IntegrationDefinition={
  provider:string;
  type:"payment"|"sms";
  name:{fa:string;en:string};
  description:{fa:string;en:string};
  fields:IntegrationField[];
};

export const integrationRegistry:IntegrationDefinition[]=[
  {
    provider:"mock",
    type:"payment",
    name:{fa:"درگاه آزمایشی",en:"Mock Gateway"},
    description:{fa:"درگاه آزمایشی فقط برای محیط توسعه",en:"Development-only mock payment gateway"},
    fields:[]
  },
  {
    provider:"console",
    type:"sms",
    name:{fa:"پیامک کنسول",en:"Console SMS"},
    description:{fa:"نمایش پیامک در لاگ برنامه؛ فقط برای توسعه",en:"Logs SMS messages to the server console; development only"},
    fields:[]
  },
  {
    provider:"zarinpal",
    type:"payment",
    name:{fa:"زرین‌پال",en:"ZarinPal"},
    description:{fa:"درگاه پرداخت آنلاین زرین‌پال",en:"ZarinPal online payment gateway"},
    fields:[
      {key:"merchantId",label:"Merchant ID",type:"password",required:true,secret:true},
      {key:"apiBaseUrl",label:"API Base URL",type:"url",placeholder:"https://api.zarinpal.com"},
      {key:"startPayBaseUrl",label:"StartPay Base URL",type:"url",placeholder:"https://www.zarinpal.com/pg/StartPay"}
    ]
  },
  {
    provider:"ippanel",
    type:"sms",
    name:{fa:"IPPanel",en:"IPPanel"},
    description:{fa:"پنل پیامک IPPanel برای OTP و یادآوری نوبت",en:"IPPanel SMS for OTP and appointment reminders"},
    fields:[
      {key:"apiKey",label:"API Key",type:"password",required:true,secret:true},
      {key:"fromNumber",label:"Sender Number",type:"text",required:true,placeholder:"3000505"},
      {key:"apiUrl",label:"API URL",type:"url",placeholder:"https://edge.ippanel.com/v1/api/send"}
    ]
  }
];

export function getIntegrationDefinition(type:string,provider:string){
  return integrationRegistry.find(item=>item.type===type&&item.provider===provider);
}
