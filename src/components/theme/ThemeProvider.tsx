"use client";

import { ReactNode, useEffect, useState } from "react";

type Theme="light"|"dark";

export function ThemeProvider({children}:{children:ReactNode}){
  const [theme,setTheme]=useState<Theme>("light");

  useEffect(()=>{
    const stored=localStorage.getItem("theme");
    const next:Theme=stored==="dark"?"dark":"light";
    setTheme(next);
    document.documentElement.dataset.theme=next;
  },[]);

  function toggle(){
    const next:Theme=theme==="dark"?"light":"dark";
    setTheme(next);
    localStorage.setItem("theme",next);
    document.documentElement.dataset.theme=next;
  }

  return <div>{children}<button type="button" onClick={toggle} aria-label="Toggle theme" style={{position:"fixed",bottom:16,insetInlineEnd:16,zIndex:1000}}>{theme==="dark"?"☀️":"🌙"}</button></div>;
}