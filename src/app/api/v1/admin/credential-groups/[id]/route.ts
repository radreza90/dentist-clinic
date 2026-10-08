import { connectDB } from "@/lib/db";
import { CredentialGroupModel, CredentialItemModel } from "@/models";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";

function validId(value:string){return /^[a-f\\d]{24}$/i.test(value);}
function normalizeLocalized(value:unknown){
  if(typeof value!=="object"||value===null)return {fa:"",en:""};
  const item=value as Record<string,unknown>;
  return {fa:typeof item.fa==="string"?item.fa.trim():"",en:typeof item.en==="string"?item.en.trim():""};
}

export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req as never);
  if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{
    const {id}=await params;
    if(!validId(id))return fail("Invalid group id",422);
    const body=await req.json();
    const name=normalizeLocalized(body?.name);
    const description=normalizeLocalized(body?.description);
    if(!name.fa&&!name.en)return fail("Group name is required",422);
    const position=Number.isFinite(Number(body?.position))?Number(body.position):0;
    await connectDB();
    const item=await CredentialGroupModel.findByIdAndUpdate(id,{$set:{name,description,position,enabled:body?.enabled!==false,updatedBy:auth.sub||null}},{new:true,runValidators:true}).lean();
    if(!item)return fail("Group not found",404);
    return ok(item);
  }catch(error){
    return fail(error instanceof Error?error.message:"Could not update group",500);
  }
}

export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req as never);
  if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{
    const {id}=await params;
    if(!validId(id))return fail("Invalid group id",422);
    await connectDB();
    if(await CredentialItemModel.exists({groupId:id}))return fail("این گروه دارای مجوز یا تقدیرنامه است؛ ابتدا موارد آن را جابه‌جا یا حذف کنید.",409);
    const deleted=await CredentialGroupModel.findByIdAndDelete(id).lean();
    if(!deleted)return fail("Group not found",404);
    return ok({deleted:true,id});
  }catch(error){
    return fail(error instanceof Error?error.message:"Could not delete group",500);
  }
}