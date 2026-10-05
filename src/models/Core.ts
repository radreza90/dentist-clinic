import {Schema,model,models} from "mongoose";
const User=new Schema({phone:{type:String,unique:true,sparse:true},email:{type:String,unique:true,sparse:true,lowercase:true},passwordHash:String,firstName:String,lastName:String,role:{type:String,enum:["super_admin","admin","manager","editor","patient"],default:"patient"},isActive:{type:Boolean,default:true},lastLoginAt:Date},{timestamps:true});
const Media=new Schema({key:{type:String,unique:true,index:true},url:String,mimeType:String,size:Number,width:Number,height:Number,alt:{fa:String,en:String},title:{fa:String,en:String},caption:{fa:String,en:String},storageDriver:{type:String,enum:["local","s3","r2"],default:"local"},folder:{type:String,default:"general"}},{timestamps:true});
const SiteSettings=new Schema({key:{type:String,unique:true,default:"main"},clinicName:{fa:String,en:String},description:{fa:String,en:String},phones:[String],whatsapp:String,address:{fa:String,en:String},latitude:Number,longitude:Number,socials:{instagram:String,whatsapp:String,telegram:String},workingHours:Schema.Types.Mixed,logoMediaId:{type:Schema.Types.ObjectId,ref:"Media"},faviconMediaId:{type:Schema.Types.ObjectId,ref:"Media"},defaultSeo:Schema.Types.Mixed,timezone:{type:String,default:"Asia/Tehran"}},{timestamps:true});
const MenuItem=new Schema({
  label:{fa:{type:String,default:""},en:{type:String,default:""}},
  href:{type:String,required:true},
  type:{type:String,enum:["internal","external"],default:"internal"},
  targetBlank:{type:Boolean,default:false},
  parentId:{type:String,default:null},
  position:{type:Number,default:0},
  enabled:{type:Boolean,default:true}
},{_id:true});
const Menu=new Schema({
  key:{type:String,unique:true,index:true},
  name:{fa:{type:String,default:""},en:{type:String,default:""}},
  location:{type:String,enum:["header","footer"],required:true,index:true},
  items:[MenuItem]
},{timestamps:true});
const Redirect=new Schema({from:{type:String,unique:true},to:String,statusCode:{type:Number,enum:[301,302],default:301},active:{type:Boolean,default:true}},{timestamps:true});
export const UserModel=models.User||model("User",User); export const MediaModel=models.Media||model("Media",Media); export const SiteSettingsModel=models.SiteSettings||model("SiteSettings",SiteSettings); export const MenuModel=models.Menu||model("Menu",Menu); export const RedirectModel=models.Redirect||model("Redirect",Redirect);