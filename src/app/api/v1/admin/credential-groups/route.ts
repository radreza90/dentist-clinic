import { connectDB } from "@/lib/db";
import { CredentialGroupModel } from "@/models";
import { getAuth, can } from "@/lib/rbac";
import { ok, fail } from "@/lib/api";

function validId(value:string){return /^[a-f\\d]{24}$/i.test(value);}
function normalizeLocalized(value:unknown){
  if(typeof value!=="object"||value===null)return {fa:"",en:""};
  const item=value as Record<string,unknown>;
  return {fa:typeof item.fa==="string"?item.fa.trim():"",en:typeof item.en==="string"?item.en.trim():""};
}

export async function GET(req:Request){
  const auth=await getAuth(req as never);
  if(!auth||!can(String(auth.role),"content:read"))return fail("Forbidden",403);
  await connectDB();
  const {searchParams}=new URL(req.url);
  const page=Math.max(1,Number(searchParams.get("page")||1));
  const limit=Math.min(100,Math.max(1,Number(searchParams.get("limit")||100)));
  const search=String(searchParams.get("search")||"").trim();
  const filter=search?{$or:[{"name.fa":{$regex:search,$options:"i"}},{"name.en":{$regex:search,$options:"i"}},{"description.fa":{$regex:search,$options:"i"}}]}:{};
  const [items,total]=await Promise.all([
    CredentialGroupModel.find(filter).sort({position:1,createdAt:1}).skip((page-1)*limit).limit(limit).lean(),
    CredentialGroupModel.countDocuments(filter),
  ]);
  return ok({items,pagination:{page,limit,total,pages:Math.ceil(total/limit)}});
}

export async function POST(req:Request){
  const auth=await getAuth(req as never);
  if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{
    const body=await req.json();
    const name=normalizeLocalized(body?.name);
    const description=normalizeLocalized(body?.description);
    if(!name.fa&&!name.en)return fail("Group name is required",422);
    const position=Number.isFinite(Number(body?.position))?Number(body.position):0;
    await connectDB();
    const item=await CredentialGroupModel.create({name,description,position,enabled:body?.enabled!==false,createdBy:auth.sub||null,updatedBy:auth.sub||null});
    return ok(item,201);
  }catch(error){
    return fail(error instanceof Error?error.message:"Could not create group",500);
  }
}