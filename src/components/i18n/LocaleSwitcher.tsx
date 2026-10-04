"use client";

import { useEffect, useState } from "react";

export function LocaleSwitcher(){
  const [locale,setLocale]=useState<"fa"|"en">("fa");
  useEffect(()=>setLocale(localStorage.getItem("locale")==="en"?"en":"fa"),[]);
  function change(next:"fa"|"en"){
    localStorage.setItem("locale",next);
    setLocale(next);
    window.dispatchEvent(new Event("localechange"));
    document.documentElement.lang=next;
    document.documentElement.dir=next==="fa"?"rtl":"ltr";
  }
  return <div style={{display:"flex",gap:6}}>
    <button type="button" onClick={()=>change("fa")} aria-pressed={locale==="fa"}>فارسی</button>
    <button type="button" onClick={()=>change("en")} aria-pressed={locale==="en"}>EN</button>
  </div>;
}