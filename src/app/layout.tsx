import type {Metadata} from "next"; import "./globals.css";
export const metadata:Metadata={title:"Dentist Clinic",description:"Dental clinic website and CMS"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fa" dir="rtl"><body>{children}</body></html>}