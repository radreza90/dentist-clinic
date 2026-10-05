import { CategoryManager } from "../../CategoryManager";
export default function PortfolioCategoriesAdmin(){
  return <CategoryManager title="دسته‌بندی نمونه‌کارها" endpoint="/api/v1/admin/portfolio-categories" backHref="/admin/content/portfolio"/>;
}
