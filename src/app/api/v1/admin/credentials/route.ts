import { connectDB } from "@/lib/db";
import { CredentialGroupModel, CredentialItemModel, MediaModel } from "@/models";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";

function normalizeLocalized(value:unknown){
  if(typeof value!=="object"||value===null)return {fa:"",en:""};
  const item=value as Record<string,unknown>;
  return {fa:typeof item.fa==="string"?item.fa.trim():"",en:typeof item.en==="string"?item.en.trim():""};
}
function validId(value:string){return /^[a-f\\d]{24}$/i.test(value);}
function parseDate(value:unknown){
  if(value===null||value===undefined||value==="")return null;
  if(typeof value!=="string")return undefined;
  const date=new Date(value);
  return Number.isNaN(date.getTime())?undefined:date;
}
async function populate(query:any){return query.populate({path:"groupId",select:"name position"}).populate({path:"mediaId",select:"key url mimeType size width height title alt folder"});}

export async function GET(req:Request){
  const auth=await getAuth(req as never);
  if(!auth||!can(String(auth.role),"content:read"))return fail("Forbidden",403);
  await connectDB();
  const {searchParams}=new URL(req.url);
  const page=Math.max(1,Number(searchParams.get("page")||1));
  const limit=Math.min(200,Math.max(1,Number(searchParams.get("limit")||200)));
  const search=String(searchParams.get("search")||"").trim();
  const groupId=String(searchParams.get("groupId")||"").trim();
  const type=String(searchParams.get("type")||"").trim();
  const filter:any={};
  if(validId(groupId))filter.groupId=groupId;
  if(["license","certificate","award"].includes(type))filter.type=type;
  if(search)filter.$or=[{"title.fa":{$regex:search,$options:"i"}},{"title.en":{$regex:search,$options:"i"}},{"issuer.fa":{$regex:search,$options:"i"}},{"issuer.en":{$regex:search,$options:"i"}},{credentialNumber:{$regex:search,$options:"i"}}];
  const [items,total]=await Promise.all([
    populate(CredentialItemModel.find(filter).sort({position:1,createdAt:-1}).skip((page-1)*limit).limit(limit).lean()),
    CredentialItemModel.countDocuments(filter),
  ]);
  return ok({items,pagination:{page,limit,total,pages:Math.ceil(total/limit)}});
}

export async function POST(req:Request){
  const auth=await getAuth(req as never);
  if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{
    const body=await req.json();
    const title=normalizeLocalized(body?.title);
    const description=normalizeLocalized(body?.description);
    const issuer=normalizeLocalized(body?.issuer);
    const type=String(body?.type||"");
    const groupId=String(body?.groupId||"");
    const mediaId=String(body?.mediaId||"");
    if(!["license","certificate","award"].includes(type))return fail("Invalid credential type",422);
    if(!title.fa&&!title.en)return fail("Title is required",422);
    if(!validId(groupId)||!validId(mediaId))return fail("Group and media are required",422);
    const issuedAt=parseDate(body?.issuedAt);
    const expiresAt=parseDate(body?.expiresAt);
    if(issuedAt===undefined||expiresAt===undefined)return fail("Invalid date",422);
    if(issuedAt&&expiresAt&&expiresAt<issuedAt)return fail("تاریخ انقضا نمی‌تواند قبل از تاریخ صدور باشد.",422);
    await connectDB();
    const [group,media]=await Promise.all([CredentialGroupModel.exists({_id:groupId}),MediaModel.exists({_id:mediaId})]);
    if(!group)return fail("Group not found",404);
    if(!media)return fail("Media not found",404);
    const item=await CredentialItemModel.create({
      type,title,description,groupId,issuer,
      credentialNumber:typeof body?.credentialNumber==="string"?body.credentialNumber.trim().slice(0,120):"",
      issuedAt,expiresAt,mediaId,
      position:Number.isFinite(Number(body?.position))?Number(body.position):0,
      isPublished:body?.isPublished!==false,
      createdBy:auth.sub||null,updatedBy:auth.sub||null,
    });
    return ok(await populate(CredentialItemModel.findById(item._id).lean()),201);
  }catch(error){
    return fail(error instanceof Error?error.message:"Could not create credential",500);
  }
}