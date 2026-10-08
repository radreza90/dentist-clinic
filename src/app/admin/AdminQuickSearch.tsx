"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const pages = [
  { label: "داشبورد", href: "/admin" },
  { label: "نوبت‌ها", href: "/admin/appointments" },
  { label: "برنامه نوبت‌دهی", href: "/admin/schedules" },
  { label: "خدمات", href: "/admin/content/services" },
  { label: "پزشکان", href: "/admin/content/doctors" },
  { label: "صفحات", href: "/admin/content/pages" },
  { label: "مقالات وبلاگ", href: "/admin/content/blog" },
  { label: "دسته‌بندی مقالات", href: "/admin/content/blog/categories" },
  { label: "نمونه‌کارها", href: "/admin/content/portfolio" },
  { label: "دسته‌بندی نمونه‌کارها", href: "/admin/content/portfolio/categories" },
  { label: "کتابخانه رسانه", href: "/admin/media" },
  { label: "منوها", href: "/admin/menus" },
  { label: "Redirectها", href: "/admin/redirects" },
  { label: "تنظیمات کلینیک", href: "/admin/settings" },
  { label: "ماژول‌ها", href: "/admin/integrations" },
];

export function AdminQuickSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = query.trim()
    ? pages.filter((page) => page.label.toLocaleLowerCase("fa").includes(query.trim().toLocaleLowerCase("fa"))).slice(0, 6)
    : [];

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="admin-topbar-search-wrap">
      <div className="admin-topbar-search">
        <span aria-hidden="true">⌕</span>
        <input
          ref={inputRef}
          aria-label="جستجوی صفحات مدیریت"
          aria-controls={open && query.trim() ? "admin-search-results" : undefined}
          placeholder="جستجوی صفحات مدیریت..."
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        />
        <kbd>⌘ K</kbd>
      </div>
      {open && query.trim() && (
        results.length > 0 ? (
          <nav className="admin-search-results" id="admin-search-results" aria-label="نتایج جستجو">
            {results.map((page) => (
              <Link key={page.href} href={page.href} onClick={() => setOpen(false)}>
                <span>{page.label}</span>
                <small dir="ltr">{page.href}</small>
              </Link>
            ))}
          </nav>
        ) : (
          <p className="admin-search-results admin-search-empty" id="admin-search-results" role="status">
            نتیجه‌ای برای این جستجو پیدا نشد.
          </p>
        )
      )}
    </div>
  );
}
