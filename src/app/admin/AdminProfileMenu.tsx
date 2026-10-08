"use client";

import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "./LogoutButton";

export function AdminProfileMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutside(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="admin-profile-menu" ref={containerRef}>
      <button
        type="button"
        className="admin-profile-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="نمایش اطلاعات پروفایل مدیر"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="admin-avatar">م</span>
        <span className="admin-profile-trigger-copy">
          <strong>مدیر سیستم</strong>
          <small>دسترسی کامل</small>
        </span>
        <svg className="admin-profile-chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div className="admin-profile-popover" role="dialog" aria-label="پروفایل مدیر">
          <div className="admin-profile-card">
            <span className="admin-avatar admin-profile-avatar">م</span>
            <div>
              <strong>مدیر سیستم</strong>
              <span>مدیر کلینیک</span>
            </div>
            <span className="admin-profile-status">فعال</span>
          </div>
          <div className="admin-profile-access">
            <span>سطح دسترسی</span>
            <strong>دسترسی کامل</strong>
          </div>
          <div className="admin-profile-divider" />
          <LogoutButton className="admin-profile-logout" />
        </div>
      )}
    </div>
  );
}
