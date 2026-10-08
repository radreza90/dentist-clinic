import { ServiceEditor } from "@/components/admin/ServiceEditor";

export default async function EditServicePage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <ServiceEditor id={id}/>;
}
