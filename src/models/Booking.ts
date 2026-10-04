import { Schema, model, models } from "mongoose";

const Appointment=new Schema({
  userId:{type:Schema.Types.ObjectId,ref:"User",default:null},
  patientSnapshot:{phone:String,name:String},
  serviceId:{type:Schema.Types.ObjectId,ref:"Service",required:true},
  doctorId:{type:Schema.Types.ObjectId,ref:"Doctor",default:null},
  startsAt:{type:Date,required:true,index:true},
  endsAt:{type:Date,required:true},
  timezone:{type:String,default:"Asia/Tehran"},
  slotKey:{type:String,required:true},
  customerNote:String,
  adminNote:String,
  status:{type:String,enum:["pending_payment","paid_pending_assignment","confirmed","completed","cancelled","no_show"],default:"pending_payment",index:true},
  paymentStatus:{type:String,enum:["unpaid","pending","paid","failed","refunded"],default:"unpaid"},
  source:{type:String,enum:["web","mobile","admin"],default:"web"}
},{timestamps:true});

Appointment.index(
  {slotKey:1},
  {
    unique:true,
    name:"uniq_active_appointment_slot",
    partialFilterExpression:{status:{$in:["pending_payment","paid_pending_assignment","confirmed"]}}
  }
);

const Payment=new Schema({
  appointmentId:{type:Schema.Types.ObjectId,ref:"Appointment",required:true,index:true},
  userId:{type:Schema.Types.ObjectId,ref:"User"},
  amount:{type:Number,required:true},
  currency:{type:String,default:"IRR"},
  gateway:String,
  status:{type:String,enum:["pending","paid","failed","refunded"],default:"pending"},
  authority:String,
  transactionId:String,
  callbackData:Schema.Types.Mixed,
  paidAt:Date
},{timestamps:true});

const OtpCode=new Schema({
  phone:{type:String,required:true,index:true},
  codeHash:{type:String,required:true},
  purpose:{type:String,enum:["login","register","booking"],default:"login"},
  expiresAt:{type:Date,required:true,index:true},
  attempts:{type:Number,default:0},
  usedAt:Date
},{timestamps:true});
OtpCode.index({expiresAt:1},{expireAfterSeconds:0});

const Schedule=new Schema({
  doctorId:{type:Schema.Types.ObjectId,ref:"Doctor",default:null},
  dayOfWeek:{type:Number,min:0,max:6,required:true},
  startMinutes:{type:Number,min:0,max:1439,required:true},
  endMinutes:{type:Number,min:1,max:1440,required:true},
  slotDuration:{type:Number,min:5,max:240,default:30},
  active:{type:Boolean,default:true}
},{timestamps:true});

const ScheduleException=new Schema({
  date:{type:String,required:true},
  doctorId:{type:Schema.Types.ObjectId,ref:"Doctor",default:null},
  closed:{type:Boolean,default:true},
  startMinutes:{type:Number,min:0,max:1439},
  endMinutes:{type:Number,min:1,max:1440},
  reason:String
},{timestamps:true});
ScheduleException.index({date:1,doctorId:1},{unique:true});

export const AppointmentModel=models.Appointment||model("Appointment",Appointment);
export const PaymentModel=models.Payment||model("Payment",Payment);
export const OtpCodeModel=models.OtpCode||model("OtpCode",OtpCode);
export const ScheduleModel=models.Schedule||model("Schedule",Schedule);
export const ScheduleExceptionModel=models.ScheduleException||model("ScheduleException",ScheduleException);