import {Schema,model,models} from "mongoose"; import {localizedStringSchema,localizedTextSchema,seoSchema,contentStatus,auditFields} from "./common";

const scheduleFields={publishedAt:Date,scheduledAt:Date};
const commentSettingsSchema=new Schema({enabled:{type:Boolean,default:false},allowRating:{type:Boolean,default:false}},{_id:false});
const Doctor=new Schema({slug:{type:String,unique:true,index:true},name:localizedStringSchema,shortBio:localizedTextSchema,bio:localizedTextSchema,photoMediaId:{type:Schema.Types.ObjectId,ref:"Media"},cv:localizedTextSchema,university:localizedStringSchema,certificates:[{title:localizedStringSchema,issuer:localizedStringSchema,year:Number,mediaId:{type:Schema.Types.ObjectId,ref:"Media"}}],courses:[{title:localizedStringSchema,provider:localizedStringSchema,year:Number}],credentials:[{title:localizedStringSchema,description:localizedTextSchema}],services:[{type:Schema.Types.ObjectId,ref:"Service"}],status:contentStatus,seo:seoSchema,commentSettings:{type:commentSettingsSchema,default:()=>({allowRating:true})},...scheduleFields,...auditFields},{timestamps:true});
const Service=new Schema({slug:{type:String,unique:true,index:true},title:localizedStringSchema,excerpt:localizedTextSchema,content:localizedTextSchema,suitableFor:localizedTextSchema,benefits:localizedTextSchema,limitations:localizedTextSchema,careInstructions:localizedTextSchema,faqs:[{question:localizedStringSchema,answer:localizedTextSchema}],icon:String,coverMediaId:{type:Schema.Types.ObjectId,ref:"Media"},bookingFee:{type:Number,min:0,default:0},currency:{type:String,default:"IRR"},status:contentStatus,seo:seoSchema,commentSettings:{type:commentSettingsSchema,default:()=>({allowRating:true})},...scheduleFields,...auditFields},{timestamps:true});
const Page=new Schema({slug:{type:String,unique:true,index:true},title:localizedStringSchema,excerpt:localizedTextSchema,content:localizedTextSchema,status:contentStatus,seo:seoSchema,commentSettings:{type:commentSettingsSchema,default:()=>({})},...scheduleFields,...auditFields},{timestamps:true});
const BlogCategory=new Schema({slug:{type:String,unique:true,index:true},name:localizedStringSchema,description:localizedTextSchema,seo:seoSchema,...auditFields},{timestamps:true});
const BlogPost=new Schema({slug:{type:String,unique:true,index:true},title:localizedStringSchema,excerpt:localizedTextSchema,content:localizedTextSchema,categoryIds:[{type:Schema.Types.ObjectId,ref:"BlogCategory"}],authorId:{type:Schema.Types.ObjectId,ref:"User"},coverMediaId:{type:Schema.Types.ObjectId,ref:"Media"},status:contentStatus,publishedAt:Date,scheduledAt:Date,seo:seoSchema,commentSettings:{type:commentSettingsSchema,default:()=>({})},...auditFields},{timestamps:true});
const PortfolioCategory=new Schema({slug:{type:String,unique:true,index:true},name:localizedStringSchema,description:localizedTextSchema,seo:seoSchema,...auditFields},{timestamps:true});
const PortfolioPrivacy=new Schema({consentStatus:{type:String,enum:["unknown","granted","revoked"],default:"unknown"},hideIdentity:{type:Boolean,default:true}},{_id:false});
const ContentRevision=new Schema({contentType:{type:String,enum:["page","service","doctor","blog","portfolio"],required:true,index:true},contentId:{type:Schema.Types.ObjectId,required:true,index:true},version:{type:Number,required:true},action:{type:String,enum:["update","restore"],default:"update"},snapshot:{type:Schema.Types.Mixed,required:true},changedBy:{type:Schema.Types.ObjectId,ref:"User",default:null},note:String},{timestamps:true});
ContentRevision.index({contentType:1,contentId:1,version:1},{unique:true});

const PortfolioItem=new Schema({slug:{type:String,unique:true,index:true},title:localizedStringSchema,description:localizedTextSchema,treatment:localizedTextSchema,categoryIds:[{type:Schema.Types.ObjectId,ref:"PortfolioCategory"}],beforeMediaIds:[{type:Schema.Types.ObjectId,ref:"Media"}],afterMediaIds:[{type:Schema.Types.ObjectId,ref:"Media"}],doctorId:{type:Schema.Types.ObjectId,ref:"Doctor"},privacy:{type:PortfolioPrivacy,default:()=>({})},status:contentStatus,seo:seoSchema,commentSettings:{type:commentSettingsSchema,default:()=>({allowRating:true})},...scheduleFields,...auditFields},{timestamps:true});

const CredentialGroup=new Schema({
  name:{type:localizedStringSchema,required:true},
  description:localizedTextSchema,
  position:{type:Number,default:0,index:true},
  enabled:{type:Boolean,default:true,index:true},
  ...auditFields
},{timestamps:true});
const CredentialItem=new Schema({
  type:{type:String,enum:["license","certificate","award"],required:true,index:true},
  title:{type:localizedStringSchema,required:true},
  description:localizedTextSchema,
  groupId:{type:Schema.Types.ObjectId,ref:"CredentialGroup",required:true,index:true},
  issuer:{type:localizedStringSchema,default:()=>({fa:"",en:""})},
  credentialNumber:{type:String,default:""},
  issuedAt:Date,
  expiresAt:Date,
  mediaId:{type:Schema.Types.ObjectId,ref:"Media",required:true},
  position:{type:Number,default:0},
  isPublished:{type:Boolean,default:true,index:true},
  ...auditFields
},{timestamps:true});
CredentialItem.index({groupId:1,position:1,createdAt:-1});
CredentialItem.index({type:1,isPublished:1,position:1});

const GalleryGroup=new Schema({
  name:{type:localizedStringSchema,required:true},
  description:localizedTextSchema,
  position:{type:Number,default:0,index:true},
  enabled:{type:Boolean,default:true,index:true},
  ...auditFields
},{timestamps:true});
const Comment=new Schema({
  targetType:{type:String,enum:["page","service","doctor","blog","portfolio"],required:true,index:true},
  targetId:{type:Schema.Types.ObjectId,required:true,index:true},
  kind:{type:String,enum:["comment","review"],required:true,index:true},
  body:{type:String,required:true,trim:true,maxlength:5000},
  rating:{type:Number,min:1,max:5,default:null},
  authorName:{type:String,required:true,trim:true,maxlength:120},
  authorEmail:{type:String,trim:true,lowercase:true,maxlength:254,default:null},
  authorPhone:{type:String,trim:true,maxlength:40,default:null},
  userId:{type:Schema.Types.ObjectId,ref:"User",default:null,index:true},
  status:{type:String,enum:["pending","approved","rejected","spam"],default:"pending",index:true},
  adminNote:{type:String,trim:true,maxlength:1000,default:""},
  moderatedBy:{type:Schema.Types.ObjectId,ref:"User",default:null},
  moderatedAt:{type:Date,default:null},
},{timestamps:true});
Comment.index({targetType:1,targetId:1,status:1,createdAt:-1});
Comment.index({status:1,createdAt:-1});

const GalleryItem=new Schema({
  title:{type:localizedStringSchema,default:()=>({fa:"",en:""})},
  caption:localizedTextSchema,
  groupId:{type:Schema.Types.ObjectId,ref:"GalleryGroup",required:true,index:true},
  mediaId:{type:Schema.Types.ObjectId,ref:"Media",required:true},
  mediaType:{type:String,enum:["image","video"],required:true,index:true},
  position:{type:Number,default:0},
  isPublished:{type:Boolean,default:true,index:true},
  ...auditFields
},{timestamps:true});
GalleryItem.index({groupId:1,position:1,createdAt:-1});
GalleryItem.index({mediaType:1,isPublished:1,position:1});

export const DoctorModel=models.Doctor||model("Doctor",Doctor); export const ServiceModel=models.Service||model("Service",Service); export const PageModel=models.Page||model("Page",Page); export const BlogCategoryModel=models.BlogCategory||model("BlogCategory",BlogCategory); export const BlogPostModel=models.BlogPost||model("BlogPost",BlogPost); export const PortfolioCategoryModel=models.PortfolioCategory||model("PortfolioCategory",PortfolioCategory); export const PortfolioItemModel=models.PortfolioItem||model("PortfolioItem",PortfolioItem); export const ContentRevisionModel=models.ContentRevision||model("ContentRevision",ContentRevision); export const CredentialGroupModel=models.CredentialGroup||model("CredentialGroup",CredentialGroup); export const CredentialItemModel=models.CredentialItem||model("CredentialItem",CredentialItem); export const GalleryGroupModel=models.GalleryGroup||model("GalleryGroup",GalleryGroup); export const GalleryItemModel=models.GalleryItem||model("GalleryItem",GalleryItem); export const CommentModel=models.Comment||model("Comment",Comment);
