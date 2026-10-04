import { ContentList } from "../../ContentList";
export default function BlogCategoriesAdmin(){return <ContentList title="دسته‌بندی مقالات" endpoint="/api/v1/admin/blog/categories" archive={false}/>;}