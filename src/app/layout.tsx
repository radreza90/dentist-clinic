import type { Metadata } from "next";
import "./globals.css";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";

export const metadata: Metadata = {
  title: "Dentist Clinic",
  description: "Dental clinic website and CMS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <div style={{ position: "fixed", top: 12, insetInlineEnd: 12, zIndex: 100 }}>
          <LocaleSwitcher />
        </div>
        {children}
      </body>
    </html>
  );
}