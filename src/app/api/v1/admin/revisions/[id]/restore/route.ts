import { connectDB } from "@/lib/db";
import { ContentRevisionModel,PageModel,ServiceModel,DoctorModel,BlogPostModel,PortfolioItemModel } from "@/models";
import { getAuth,can } from "@/lib/rbac";
import { fail,ok } from "@/lib/api";
import { createContentRevision } from "@/lib/revisions";

const models={
  page:PageModel,
  service:ServiceModel,
  doctor:DoctorModel,
  blog:BlogPostModel,
  portfolio:PortfolioItemModel,
} as const;

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getAuth(req);
  if(!auth||!can(String(auth.role),"content:write"))return fail("Forbidden",403);
  try{
    const {id}=await params;
    await connectDB();
    const revision=await ContentRevisionModel.findById(id).lean();
    if(!revision)return fail("Revision not found",404);
    const Model=models[revision.contentType as keyof typeof models];
    if(!Model)return fail("Unsupported revision type",422);

    const snapshot={...(revision.snapshot as Record<string,unknown>)};
    delete snapshot._id;
    delete snapshot.__v;
    delete snapshot.createdAt;
    delete snapshot.updatedAt;

    const current=await Model.findById(revision.contentId).lean();
    if(!current)return fail("Content item not found",404);
    const restored=await Model.findByIdAndUpdate(
      revision.contentId,
      {$set:{...snapshot,updatedBy:auth.sub}},
      {new:true,runValidators:true}
    ).lean();
    if(!restored)return fail("Content item not found",404);

    await createContentRevision(
      revision.contentType as "page"|"service"|"doctor"|"blog"|"portfolio",
      String(revision.contentId),
      restored,
      String(auth.sub),
      "restore",
      "Restore version "+revision.version
    );

    return ok(restored);
  }catch(e){return fail(e instanceof Error?e.message:"Unable to restore revision",500);}
}
