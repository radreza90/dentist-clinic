"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/localization";

export function Localized({ value, html=false }: { value?: { fa?: string; en?: string } | null; html?: boolean }) {
  const [locale,setLocale]=useState<Locale>("fa");
  useEffect(()=>{
    const read=()=>setLocale(localStorage.getItem("locale")==="en"?"en":"fa");
    read();
    window.addEventListener("localechange",read);
    return ()=>window.removeEventListener("localechange",read);
  },[]);
  const text=value?.[locale]||value?.fa||value?.en||"";
  return html ? <div dangerouslySetInnerHTML={{__html:text}}/> : <>{text}</>;
}