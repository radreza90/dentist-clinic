import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) redirect("/admin/login");

  try {
    const auth = await verifyAccessToken(token);
    if (!auth.sub || !auth.role || auth.role === "patient") redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f7f8fa", color: "#17181a" }}>
      <header style={{ padding: 20, borderBottom: "1px solid #ddd", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <strong>Dental Clinic CMS</strong>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12 }}>
            <a href="/admin">داشبورد</a>
            <a href="/admin/content">محتوا</a>
            <a href="/admin/appointments">نوبت‌ها</a>
            <a href="/admin/media">رسانه</a>
            <a href="/admin/settings">تنظیمات</a>
            <a href="/" target="_blank" rel="noreferrer">مشاهده سایت</a>
            <form action="/api/v1/auth/logout" method="post">
              <button type="submit">خروج</button>
            </form>
          </nav>
        </div>
      </header>
      <section style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>{children}</section>
    </div>
  );
}