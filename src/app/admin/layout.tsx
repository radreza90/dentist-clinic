import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" style={{ minHeight:"100vh", background:"#f7f8fa", color:"#17181a" }}>
      <header style={{ padding:20, borderBottom:"1px solid #ddd", background:"#fff" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <strong>Dental Clinic CMS</strong>
          <nav style={{ display:"flex", flexWrap:"wrap", gap:16, marginTop:12 }}>
            <Link href="/admin">داشبورد</Link>
            <Link href="/admin/content">محتوا</Link>
            <Link href="/admin/menus">منوها</Link>
            <Link href="/admin/redirects">Redirectها</Link>
            <Link href="/admin/appointments">نوبت‌ها</Link>
            <Link href="/admin/schedules">برنامه نوبت‌دهی</Link>
            <Link href="/admin/media">رسانه</Link>
            <Link href="/admin/settings">تنظیمات</Link>
            <Link href="/admin/integrations">ماژول‌ها</Link>
            <Link href="/account">پنل بیمار</Link>
            <Link href="/" target="_blank" rel="noreferrer">مشاهده سایت</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <section style={{ padding:24, maxWidth:1200, margin:"0 auto" }}>{children}</section>
    </div>
  );
}