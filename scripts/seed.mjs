import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const uri=process.env.MONGODB_URI;
if(!uri)throw new Error("MONGODB_URI is required");

const adminEmail=process.env.SEED_ADMIN_EMAIL;
const adminPassword=process.env.SEED_ADMIN_PASSWORD;
if(!adminEmail||!adminPassword)throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required");

await mongoose.connect(uri);

const localized={type:{fa:String,en:String},default:()=>({fa:"",en:""})};
const userSchema=new mongoose.Schema({
  phone:{type:String,unique:true,sparse:true},email:{type:String,unique:true,sparse:true,lowercase:true},
  passwordHash:String,firstName:String,lastName:String,role:String,isActive:Boolean,lastLoginAt:Date
},{timestamps:true});
const serviceSchema=new mongoose.Schema({
  slug:{type:String,unique:true,index:true},title:localized,excerpt:localized,content:localized,
  suitableFor:localized,benefits:localized,limitations:localized,careInstructions:localized,
  bookingFee:{type:Number,default:0},currency:{type:String,default:"IRR"},status:String
},{timestamps:true});
const siteSchema=new mongoose.Schema({
  key:{type:String,unique:true},clinicName:localized,description:localized,
  phones:[String],whatsapp:String,address:localized,timezone:String
},{timestamps:true});

const User=mongoose.models.SeedUser||mongoose.model("SeedUser",userSchema,"users");
const Service=mongoose.models.SeedService||mongoose.model("SeedService",serviceSchema,"services");
const Site=mongoose.models.SeedSite||mongoose.model("SeedSite",siteSchema,"sitesettings");
const integrationSchema=new mongoose.Schema({
  key:{type:String,unique:true,index:true},
  type:String,
  provider:String,
  name:{fa:String,en:String},
  description:{fa:String,en:String},
  enabled:Boolean,
  isDefault:Boolean,
  configEncrypted:String,
  configVersion:Number
},{timestamps:true});
const Integration=mongoose.models.SeedIntegration||mongoose.model("SeedIntegration",integrationSchema,"integrations");


await User.findOneAndUpdate(
  {email:adminEmail.toLowerCase()},
  {email:adminEmail.toLowerCase(),passwordHash:await bcrypt.hash(adminPassword,12),role:"super_admin",isActive:true},
  {upsert:true,setDefaultsOnInsert:true}
);

const services=[
  ["implant","ایمپلنت دندان","Dental Implants"],
  ["laminate","لمینت دندان","Dental Laminate Veneers"],
  ["composite","کامپوزیت دندان","Dental Composite"],
  ["root-canal","عصب‌کشی","Root Canal Treatment"],
  ["crown","روکش دندان","Dental Crowns"],
  ["surgery","جراحی دندان","Dental Surgery"],
  ["bleaching","بلیچینگ","Teeth Bleaching"],
  ["smile-design","طراحی لبخند","Smile Design"],
  ["children-dentistry","دندانپزشکی کودکان","Pediatric Dentistry"],
];

for(const [slug,fa,en] of services){
  await Service.findOneAndUpdate(
    {slug},
    {
      slug,
      title:{fa,en},
      excerpt:{fa:"",en:""},
      content:{fa:"",en:""},
      suitableFor:{fa:"",en:""},
      benefits:{fa:"",en:""},
      limitations:{fa:"",en:""},
      careInstructions:{fa:"",en:""},
      bookingFee:0,
      currency:"IRR",
      status:"draft"
    },
    {upsert:true,setDefaultsOnInsert:true}
  );
}

await Site.findOneAndUpdate(
  {key:"main"},
  {key:"main",timezone:process.env.CLINIC_TIMEZONE||"Asia/Tehran"},
  {upsert:true,setDefaultsOnInsert:true}
);

const integrationModules=[
  ["payment","mock","درگاه آزمایشی","Mock Gateway","درگاه آزمایشی فقط برای توسعه","Development-only mock gateway",process.env.NODE_ENV!=="production"],
  ["payment","zarinpal","زرین‌پال","ZarinPal","درگاه پرداخت آنلاین زرین‌پال","ZarinPal online payment gateway",false],
  ["sms","console","پیامک کنسول","Console SMS","نمایش پیامک در لاگ؛ فقط برای توسعه","Logs SMS to the server console; development only",process.env.NODE_ENV!=="production"],
  ["sms","ippanel","IPPanel","IPPanel","پنل پیامک IPPanel برای OTP و یادآوری نوبت","IPPanel SMS for OTP and appointment reminders",false],
];

for(const [type,provider,fa,en,descriptionFa,descriptionEn,enabled] of integrationModules){
  await Integration.findOneAndUpdate(
    {type,provider},
    {$setOnInsert:{
      key:type+"."+provider,
      type,
      provider,
      name:{fa,en},
      description:{fa:descriptionFa,en:descriptionEn},
      configEncrypted:"",
      configVersion:1,
      enabled,
      isDefault:enabled
    }},
    {upsert:true}
  );
}


await mongoose.disconnect();
console.log("Seed completed.");
