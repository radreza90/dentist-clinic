import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { CommentModel } from "@/models";
import { getAuth, can } from "@/lib/rbac";
import { fail, ok } from "@/lib/api";
import { z } from "zod";

const input=z.object({status:z.enum(["pending","approved","rejected","spam"]),adminNote:z.string().trim().max(1000).optional().default("")});

export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req);if(!auth||!can(String(auth.role),"comments:write"))return fail("Forbidden",403);
  try{
    const {id}=await params;
    if(!Types.ObjectId.isValid(id))return fail("دیدگاه نامعتبر است.",400);
    const parsed=input.safeParse(await req.json());if(!parsed.success)return fail("اطلاعات نامعتبر است.",422,parsed.error.flatten());
    await connectDB();
    const update:Record<string,unknown>={status:parsed.data.status,adminNote:parsed.data.adminNote,updatedAt:new Date()};
    if(parsed.data.status==="approved"||parsed.data.status==="rejected"||parsed.data.status==="spam"){update.moderatedBy=auth.sub;update.moderatedAt=new Date();}
    else{update.moderatedBy=null;update.moderatedAt=null;}
    const item=await CommentModel.findByIdAndUpdate(id,{$set:update},{new:true,runValidators:true}).lean();
    return item?ok(item):fail("دیدگاه پیدا نشد.",404);
  }catch(e){return fail(e instanceof Error?e.message:"ویرایش دیدگاه ناموفق بود",500);}
}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req);if(!auth||!can(String(auth.role),"comments:write"))return fail("Forbidden",403);
  try{
    const {id}=await params;
    if(!Types.ObjectId.isValid(id))return fail("دیدگاه نامعتبر است.",400);
    await connectDB();
    const item=await CommentModel.findByIdAndDelete(id).lean();
    return item?ok({id}):fail("دیدگاه پیدا نشد.",404);
  }catch(e){return fail(e instanceof Error?e.message:"حذف دیدگاه ناموفق بود",500);}
}
