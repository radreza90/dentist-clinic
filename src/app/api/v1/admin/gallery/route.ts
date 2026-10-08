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
export async function GET(req:Request){
  const auth=await getAuth(req as never);if(!auth||!can(String(auth.role),"content:read"))return fail("Forbidden",403);
  await connectDB();const {searchParams}=new URL(req.url);
  const page=Math.max(1,Number(searchParams.get("page")||1));const limit=Math.min(200,Math.max(1,Number(searchParams.get("limit")||200)));
  const search=String(searchParams.get("search")||"").trim();const groupId=String(searchParams.get("groupId")||"").trim();const mediaType=String(searchParams.get("mediaType")||"").trim();
  const filter:any={};if(validId(groupId))filter.groupId=groupId;if(["image","video"].includes(mediaType))filter.mediaType=mediaType;
  if(search)filter.$or=[{"title.fa":{$regex:search,$options:"i"}},{"title.en":{$regex:search,$options:"i"}},{"caption.fa":{$regex:search,$options:"i"}}];
  const [items,total]=await Promise.all([
    populate(GalleryItemModel.find(filter).sort({position:1,createdAt:-1}).skip((page-1)*limit).limit(limit).lean()),
    GalleryItemModel.countDocuments(filter)
  ]);
  return ok({items,pagination:{page,limit,total,pages:Math.ceil(total/limit)}});
}
export async function POST(req:Request){
  const auth=await getAuth(req as never);if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{
    const body=await req.json();const title=normalizeLocalized(body?.title);const caption=normalizeLocalized(body?.caption);
    const groupId=String(body?.groupId||"");const mediaId=String(body?.mediaId||"");
    if(!validId(groupId)||!validId(mediaId))return fail("Group and media are required",422);
    await connectDB();if(!await GalleryGroupModel.exists({_id:groupId}))return fail("Group not found",404);
    const resolved=await resolveMedia(mediaId);if(resolved.error)return resolved.error;
    const item=await GalleryItemModel.create({title,caption,groupId,mediaId,mediaType:resolved.mediaType,position:Number.isFinite(Number(body?.position))?Number(body.position):0,isPublished:body?.isPublished!==false,createdBy:auth.sub||null,updatedBy:auth.sub||null});
    return ok(await populate(GalleryItemModel.findById(item._id).lean()),201);
  }catch(error){return fail(error instanceof Error?error.message:"Could not create gallery item",500);}
}
