import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Dentist Clinic",
  description: "Dental clinic website and CMS",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const isPublicSite = requestHeaders.get("x-public-site") === "1";

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {isPublicSite && (
            <div style={{ position: "fixed", top: 12, insetInlineEnd: 12, zIndex: 100 }}>
              <LocaleSwitcher />
            </div>
          )}
          {isPublicSite && <SiteHeader />}
          {children}
          {isPublicSite && <SiteFooter />}
        </ThemeProvider>
      </body>
    </html>
  );
}
