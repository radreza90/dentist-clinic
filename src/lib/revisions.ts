import { ContentRevisionModel } from "@/models";

export type RevisionContentType="page"|"service"|"doctor"|"blog"|"portfolio";

function serializableSnapshot(value:unknown):Record<string,unknown>{
  const parsed=JSON.parse(JSON.stringify(value)) as Record<string,unknown>;
  delete parsed._id;
  delete parsed.__v;
  delete parsed.createdAt;
  delete parsed.updatedAt;
  return parsed;
}

export async function createContentRevision(
  contentType:RevisionContentType,
  contentId:string,
  snapshot:unknown,
  changedBy:string,
  action:"update"|"restore"="update",
  note?:string
){
  const previous=await ContentRevisionModel.findOne({contentType,contentId}).sort({version:-1}).select("version").lean();
  const version=(previous?.version||0)+1;
  return ContentRevisionModel.create({
    contentType,
    contentId,
    version,
    action,
    snapshot:serializableSnapshot(snapshot),
    changedBy,
    note:note||"",
  });
}
