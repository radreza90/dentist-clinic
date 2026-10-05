import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

const navigation = [
  { label: "داشبورد", href: "/admin", icon: "⌂" },
  { label: "نوبت‌ها", href: "/admin/appointments", icon: "▣" },
  { label: "برنامه نوبت‌دهی", href: "/admin/schedules", icon: "◫" },
  { label: "محتوا", href: "/admin/content", icon: "✦" },
  { label: "رسانه", href: "/admin/media", icon: "▧" },
  { label: "منوها", href: "/admin/menus", icon: "☰" },
  { label: "Redirectها", href: "/admin/redirects", icon: "↗" },
  { label: "تنظیمات", href: "/admin/settings", icon: "⚙" },
  { label: "ماژول‌ها", href: "/admin/integrations", icon: "◈" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="admin-shell">
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
            <nav className="admin-nav">
              {navigation.map((item, index) => (
                <Link key={item.href} href={item.href} className={index === 0 ? "admin-nav-item active" : "admin-nav-item"}>
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {index === 0 ? <span className="admin-nav-dot" /> : null}
                </Link>
              ))}
            </nav>
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
