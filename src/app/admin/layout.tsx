import { LogoutButton } from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" style={{ minHeight:"100vh", background:"#f7f8fa", color:"#17181a" }}>
      <header style={{ padding:20, borderBottom:"1px solid #ddd", background:"#fff" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <strong>Dental Clinic CMS</strong>
          <nav style={{ display:"flex", flexWrap:"wrap", gap:16, marginTop:12 }}>
            <a href="/admin">داشبورد</a>
            <a href="/admin/content">محتوا</a>
            <a href="/admin/appointments">نوبت‌ها</a>
            <a href="/admin/schedules">برنامه نوبت‌دهی</a>
            <a href="/admin/media">رسانه</a>
            <a href="/admin/settings">تنظیمات</a>
            <a href="/account">پنل بیمار</a>
            <a href="/" target="_blank" rel="noreferrer">مشاهده سایت</a>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <section style={{ padding:24, maxWidth:1200, margin:"0 auto" }}>{children}</section>
    </div>
  );
}