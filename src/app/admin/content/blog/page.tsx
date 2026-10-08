import { ContentList } from "../ContentList";
export default function BlogAdmin(){return <ContentList title="مقالات" endpoint="/api/v1/admin/blog" createHref="/admin/content/blog/new" editBase="/admin/content/blog" categoriesEndpoint="/api/v1/admin/blog-categories" categoriesHref="/admin/content/blog/categories"/>;}
