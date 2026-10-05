import Link from "next/link";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { AdminNavigation } from "./AdminNavigation";
import { LogoutButton } from "./LogoutButton";

const vazirmatn = localFont({
  src: "../fonts/vazirmatn/Vazirmatn[wght].woff2",
  variable: "--font-vazirmatn",
  weight: "100 900",
  display: "swap",
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  if (requestHeaders.get("x-pathname") === "/admin/login") {
    return <div className={vazirmatn.variable}>{children}</div>;
  }

  return (
    <div dir="rtl" className={`${vazirmatn.variable} admin-shell`}>
      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">
            <div className="admin-brand-mark">✚</div>
            <div>
              <strong>Dental Clinic</strong>
              <span>مدیریت کلینیک</span>
            </div>
          </div>
          <div className="admin-nav-section">
            <span className="admin-nav-caption">مدیریت</span>
            <AdminNavigation />
          </div>
        </div>
        <div className="admin-sidebar-footer">
          <Link href="/account" className="admin-mini-card">
            <span className="admin-avatar">ب</span>
            <span><strong>پنل بیمار</strong><small>مشاهده حساب کاربری</small></span>
            <span className="admin-mini-arrow">←</span>
          </Link>
          <Link href="/" target="_blank" rel="noreferrer" className="admin-sidebar-link"><span>↗</span>مشاهده سایت</Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-search">
            <span>⌕</span>
            <input aria-label="جستجوی سریع" placeholder="جستجوی سریع..." />
            <kbd>⌘ K</kbd>
          </div>
          <div className="admin-topbar-actions">
            <button className="admin-icon-button" type="button" aria-label="اعلان‌ها">♧</button>
            <span className="admin-topbar-divider" />
            <div className="admin-user">
              <span className="admin-avatar">م</span>
              <span><strong>مدیر سیستم</strong><small>دسترسی کامل</small></span>
            </div>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
