import { ContentList } from "../ContentList";

export default function ServicesAdminPage() {
  return <ContentList title="خدمات" endpoint="/api/v1/admin/services" createHref="/admin/content/services/new" editBase="/admin/content/services"/>;
}
