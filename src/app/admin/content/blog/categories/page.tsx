import { CategoryManager } from "../../../CategoryManager";
export default function BlogCategoriesAdmin(){
  return <CategoryManager title="دسته‌بندی مقالات" endpoint="/api/v1/admin/blog-categories" backHref="/admin/content/blog"/>;
}
