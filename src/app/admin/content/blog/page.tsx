import Link from "next/link";
import { ContentList } from "../ContentList";
export default function BlogAdmin(){return <div><div style={{display:"flex",justifyContent:"flex-start",marginBottom:12}}><Link href="/admin/content/blog/categories">مدیریت دسته‌بندی‌ها</Link></div><ContentList title="مقالات" endpoint="/api/v1/admin/blog" createHref="/admin/content/blog/new" editBase="/admin/content/blog"/></div>;}
