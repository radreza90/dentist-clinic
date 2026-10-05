import Link from "next/link";
import { ContentList } from "../ContentList";
export default function PortfolioAdmin(){return <div><div style={{display:"flex",justifyContent:"flex-start",marginBottom:12}}><Link href="/admin/content/portfolio/categories">مدیریت دسته‌بندی‌ها</Link></div><ContentList title="نمونه‌کارها" endpoint="/api/v1/admin/portfolio" createHref="/admin/content/portfolio/new" editBase="/admin/content/portfolio"/></div>;}
