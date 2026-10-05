import { connectDB } from "@/lib/db";
import { AppointmentModel, PaymentModel } from "@/models";
import { getAuth } from "@/lib/rbac";
import { fail,ok } from "@/lib/api";
import { paymentGateway } from "@/lib/payment";
import { getIntegration } from "@/lib/integrations/service";

export async function POST(req:Request){
  const auth=await getAuth(req);if(!auth)return fail("Authentication required",401);
  try{
    const body=await req.json();
    const paymentId=String(body.paymentId||"");
    if(!paymentId)return fail("paymentId is required",422);

    await connectDB();
    const payment=await PaymentModel.findById(paymentId).lean();
    if(!payment)return fail("Payment not found",404);
    if(String(payment.userId)!==String(auth.sub)&&!["admin","manager","super_admin"].includes(String(auth.role))){
      return fail("Forbidden",403);
    }
    if(payment.status!=="pending")return fail("Payment is not pending",409);

    const appointment=await AppointmentModel.findById(payment.appointmentId)
      .select("_id status patientSnapshot")
      .lean();
    if(!appointment||appointment.status!=="pending_payment")return fail("Appointment is not payable",409);

    const active=await getIntegration("payment");
    if(!active)return fail("No active payment gateway is configured in the admin panel",503);

    const baseUrl=process.env.NEXT_PUBLIC_APP_URL||new URL(req.url).origin;
    const callbackUrl=new URL("/api/v1/payment/callback",baseUrl);
    callbackUrl.searchParams.set("paymentId",String(payment._id));

    const result=await (await paymentGateway(active.item.provider)).request({
      paymentId:String(payment._id),
      amount:payment.amount,
      currency:payment.currency,
      callbackUrl:callbackUrl.toString(),
      description:"رزرو نوبت کلینیک دندانپزشکی",
      metadata:appointment.patientSnapshot?.phone?{mobile:appointment.patientSnapshot.phone}:undefined,
    });

    await PaymentModel.updateOne(
      {_id:payment._id,status:"pending"},
      {$set:{authority:result.authority,gateway:active.item.provider}}
    );

    return ok({redirectUrl:result.redirectUrl,authority:result.authority});
  }catch(e){
    return fail(e instanceof Error?e.message:"Unable to start payment",500);
  }
}
