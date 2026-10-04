export async function sendSms(phone:string,message:string){
  const driver=process.env.SMS_DRIVER||"console";
  if(driver==="console"){
    if(process.env.NODE_ENV==="production")throw new Error("SMS provider is not configured for production");
    console.info("[SMS:console]",phone,message);
    return;
  }
  throw new Error(`Unsupported SMS_DRIVER: ${driver}`);
}