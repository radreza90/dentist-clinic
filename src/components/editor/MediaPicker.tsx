"use client";

import { useEffect, useState } from "react";
import { MediaLibrary } from "@/components/media/MediaLibrary";

type Media={_id:string;url:string;mimeType:string;size:number;alt?:{fa?:string;en?:string};title?:{fa?:string;en?:string}};
type Mode="image"|"video"|"file";

export function MediaPicker({open,mode,onClose,onSelect}:{open:boolean;mode:Mode;onClose:()=>void;onSelect:(media:Media)=>void}){
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  if(!open||!mounted)return null;
  return <MediaLibrary selectionMode={mode} onClose={onClose} onSelect={onSelect}/>;
}
