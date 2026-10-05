import { connectDB } from "@/lib/db";
import { AppointmentModel,PaymentModel } from "@/models";
import { ok,fail } from "@/lib/api";
import { paymentGateway } from "@/lib/payment";

function wantsJson(req:Request){
  return (req.headers.get("accept")||"").includes("application/json");
}
function resultUrl(req:Request,status:string,appointmentId:string){
  const url=new URL("/booking/payment-result",req.url);
  url.searchParams.set("status",status);
  url.searchParams.set("appointmentId",appointmentId);
  return url;
}

export async function GET(req:Request){
  try{
    const url=new URL(req.url);
    const paymentId=url.searchParams.get("paymentId");
    const authority=url.searchParams.get("Authority")||url.searchParams.get("authority");
    const driver=process.env.PAYMENT_DRIVER||"mock";

    if(!paymentId||!authority)return fail("Payment callback is missing required parameters",400);

    await connectDB();
    const payment=await PaymentModel.findById(paymentId);
    if(!payment)return fail("Payment not found",404);

    if(payment.status==="paid"){
      if(wantsJson(req))return ok({paid:true,appointmentId:payment.appointmentId});
      return Response.redirect(resultUrl(req,"success",String(payment.appointmentId)));
    }

    if(!payment.authority||payment.authority!==authority)return fail("Invalid payment authority",400);

    const status=url.searchParams.get("Status");
    if(driver==="zarinpal"&&status!=="OK"){
      await PaymentModel.updateOne(
        {_id:payment._id,status:"pending"},
        {$set:{status:"failed",callbackData:Object.fromEntries(url.searchParams.entries())}}
      );
      if(wantsJson(req))return fail("Payment was cancelled or not completed",400);
      return Response.redirect(resultUrl(req,"failed",String(payment.appointmentId)));
    }

    const raw=Object.fromEntries(url.searchParams.entries());
    const verified=await paymentGateway().verify({authority,amount:payment.amount,raw});
    if(!verified.ok){
      await PaymentModel.updateOne(
        {_id:payment._id,status:"pending"},
        {$set:{status:"failed",callbackData:verified.raw||raw}}
      );
      if(wantsJson(req))return fail("Payment verification failed",400);
      return Response.redirect(resultUrl(req,"failed",String(payment.appointmentId)));
    }

    await PaymentModel.updateOne(
      {_id:payment._id,status:"pending"},
      {$set:{
        status:"paid",
        transactionId:verified.transactionId,
        callbackData:verified.raw||raw,
        paidAt:new Date()
      }}
    );
    await AppointmentModel.updateOne(
      {_id:payment.appointmentId,status:"pending_payment"},
      {$set:{paymentStatus:"paid",status:"paid_pending_assignment"}}
    );

    if(wantsJson(req)){
      return ok({
        paid:true,
        transactionId:verified.transactionId,
        appointmentId:payment.appointmentId
      });
    }
    return Response.redirect(resultUrl(req,"success",String(payment.appointmentId)));
  }catch(e){
    return fail(e instanceof Error?e.message:"Payment callback failed",500);
  }
}
