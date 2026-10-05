import { Schema, model, models } from "mongoose";

const Integration=new Schema({
  key:{type:String,required:true,unique:true,index:true},
  type:{type:String,enum:["payment","sms"],required:true,index:true},
  provider:{type:String,required:true,index:true},
  name:{fa:{type:String,required:true},en:{type:String,required:true}},
  description:{fa:String,en:String},
  enabled:{type:Boolean,default:false,index:true},
  isDefault:{type:Boolean,default:false,index:true},
  configEncrypted:{type:String,default:""},
  configVersion:{type:Number,default:1},
  lastTestAt:Date,
  lastTestOk:Boolean,
  lastTestMessage:String,
  createdBy:{type:Schema.Types.ObjectId,ref:"User"},
  updatedBy:{type:Schema.Types.ObjectId,ref:"User"}
},{timestamps:true});

Integration.index({type:1,provider:1},{unique:true,name:"uniq_integration_provider"});
Integration.index({type:1,enabled:1,isDefault:1});

export const IntegrationModel=models.Integration||model("Integration",Integration);
