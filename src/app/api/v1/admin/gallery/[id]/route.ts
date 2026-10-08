import { connectDB } from "@/lib/db";
import { GalleryGroupModel, GalleryItemModel, MediaModel } from "@/models";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";

function validId(value:string){return /^[a-f\d]{24}$/i.test(value);}
function normalizeLocalized(value:unknown){
  if(typeof value!=="object"||value===null)return {fa:"",en:""};
  const item=value as Record<string,unknown>;
  return {fa:typeof item.fa==="string"?item.fa.trim():"",en:typeof item.en==="string"?item.en.trim():""};
}
async function populate(query:any){return query.populate({path:"groupId",select:"name position"}).populate({path:"mediaId",select:"key url mimeType size width height title alt folder"});}
async function resolveMedia(mediaId:string){
  const media=await MediaModel.findById(mediaId).lean();
  if(!media)return {error:fail("Media not found",404)};
  const mediaType=String(media.mimeType||"").startsWith("image/")?"image":String(media.mimeType||"").startsWith("video/")?"video":null;
  if(!mediaType)return {error:fail("Only image and video media can be added to the gallery",422)};
  return {media,mediaType};
}
export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req as never);
  if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{
    const {id}=await params;
    if(!validId(id))return fail("Invalid gallery item id",422);
    const body=await req.json();
    const title=normalizeLocalized(body?.title);
    const caption=normalizeLocalized(body?.caption);
    const groupId=String(body?.groupId||"");
    const mediaId=String(body?.mediaId||"");
    if(!validId(groupId)||!validId(mediaId))return fail("Group and media are required",422);
    await connectDB();
    if(!await GalleryGroupModel.exists({_id:groupId}))return fail("Group not found",404);
    const resolved=await resolveMedia(mediaId);
    if(resolved.error)return resolved.error;
    const item=await GalleryItemModel.findByIdAndUpdate(id,{$set:{
      title,caption,groupId,mediaId,mediaType:resolved.mediaType,
      position:Number.isFinite(Number(body?.position))?Number(body.position):0,
      isPublished:body?.isPublished!==false,
      updatedBy:auth.sub||null
    }},{new:true,runValidators:true});
    if(!item)return fail("Gallery item not found",404);
    return ok(await populate(GalleryItemModel.findById(item._id).lean()));
  }catch(error){return fail(error instanceof Error?error.message:"Could not update gallery item",500);}
}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req as never);
  if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{
    const {id}=await params;
    if(!validId(id))return fail("Invalid gallery item id",422);
    await connectDB();
    const deleted=await GalleryItemModel.findByIdAndDelete(id).lean();
    if(!deleted)return fail("Gallery item not found",404);
    return ok({deleted:true,id});
  }catch(error){return fail(error instanceof Error?error.message:"Could not delete gallery item",500);}
}
