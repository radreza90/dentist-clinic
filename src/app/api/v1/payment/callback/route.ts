import { connectDB } from "@/lib/db";
import { AppointmentModel,PaymentModel } from "@/models";
import { ok,fail } from "@/lib/api";
import { paymentGateway } from "@/lib/payment";

export async function GET(req:Request){
  try{
    const url=new URL(req.url);
    const paymentId=url.searchParams.get("paymentId");
    const authority=url.searchParams.get("Authority")||url.searchParams.get("authority");
    if(!paymentId||!authority)return fail("Payment callback is missing required parameters",400);
    await connectDB();
    const payment=await PaymentModel.findById(paymentId);
    if(!payment)return fail("Payment not found",404);
    if(payment.status==="paid")return ok({paid:true,appointmentId:payment.appointmentId});
    if(!payment.authority||payment.authority!==authority)return fail("Invalid payment authority",400);

    const verified=await paymentGateway().verify({authority,amount:payment.amount,raw:Object.fromEntries(url.searchParams.entries())});
    if(!verified.ok){await PaymentModel.updateOne({_id:payment._id},{$set:{status:"failed",callbackData:Object.fromEntries(url.searchParams.entries())}});return fail("Payment verification failed",400);}

    await PaymentModel.updateOne({_id:payment._id},{$set:{status:"paid",transactionId:verified.transactionId,callbackData:verified.raw||Object.fromEntries(url.searchParams.entries()),paidAt:new Date()}});
    await AppointmentModel.updateOne({_id:payment.appointmentId},{$set:{paymentStatus:"paid",status:"paid_pending_assignment"}});
    return ok({paid:true,transactionId:verified.transactionId,appointmentId:payment.appointmentId});
  }catch(e){return fail(e instanceof Error?e.message:"Payment callback failed",500);}
}