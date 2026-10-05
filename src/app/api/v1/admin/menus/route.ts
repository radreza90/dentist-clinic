import { connectDB } from "@/lib/db";
import { MenuModel } from "@/models";
import { getAuth,can } from "@/lib/rbac";
import { fail,ok } from "@/lib/api";
import { z } from "zod";

const item=z.object({
  _id:z.string().optional(),
  label:z.object({fa:z.string().max(300),en:z.string().max(300)}),
  href:z.string().trim().min(1).max(1000),
  type:z.enum(["internal","external"]).default("internal"),
  targetBlank:z.boolean().default(false),
  parentId:z.string().nullable().default(null),
  position:z.number().int().min(0),
  enabled:z.boolean().default(true),
});
const input=z.object({
  key:z.string().trim().min(1).max(80),
  name:z.object({fa:z.string().max(300),en:z.string().max(300)}),
  location:z.enum(["header","footer"]),
  items:z.array(item).max(100),
});

export async function GET(req:Request){
  const auth=await getAuth(req);
  if(!auth||!can(String(auth.role),"content:read"))return fail("Forbidden",403);
  try{
    await connectDB();
    const location=new URL(req.url).searchParams.get("location");
    const filter=location==="header"||location==="footer"?{location}:{};
    const menus=await MenuModel.find(filter).sort({location:1}).lean();
    return ok(menus);
  }catch(e){return fail(e instanceof Error?e.message:"Unable to load menus",500);}
}

export async function PUT(req:Request){
  const auth=await getAuth(req);
  if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{
    const parsed=input.safeParse(await req.json());
    if(!parsed.success)return fail("Invalid menu payload",422,parsed.error.flatten());
    const data=parsed.data;
    await connectDB();
    const menu=await MenuModel.findOneAndUpdate(
      {location:data.location},
      {$set:{key:data.key,name:data.name,location:data.location,items:data.items,updatedBy:auth.sub}},
      {upsert:true,new:true,runValidators:true}
    ).lean();
    return ok(menu);
  }catch(e){return fail(e instanceof Error?e.message:"Unable to save menu",500);}
}
