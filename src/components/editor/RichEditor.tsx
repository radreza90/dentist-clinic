"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { MediaPicker } from "./MediaPicker";
import { Video } from "./Video";

const AlignedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes: { align?: string }) => ({ "data-align": attributes.align || "center" }),
      },
    };
  },
});

export function RichEditor({value,onChange,placeholder="محتوا را وارد کنید…"}:{value:string;onChange:(html:string)=>void;placeholder?:string}){
  const [picker,setPicker]=useState<"image"|"video"|null>(null);
  const editor=useEditor({
    immediatelyRender:false,
    extensions:[
      StarterKit,
      TextAlign.configure({types:["heading","paragraph"]}),
      AlignedImage.configure({
        resize:{enabled:true,directions:["top","bottom","left","right"],minWidth:80,minHeight:50,alwaysPreserveAspectRatio:true},
        HTMLAttributes:{class:"editor-image"},
      }),
      Video,
    ],
    content:value||"",
    editorProps:{attributes:{class:"rich-editor-content",dir:"rtl","data-placeholder":placeholder}},
    onUpdate:({editor:instance})=>onChange(instance.getHTML()),
  });

  useEffect(()=>{
    if(editor && value!==editor.getHTML()) editor.commands.setContent(value||"",{emitUpdate:false});
  },[editor,value]);

  if(!editor)return <div style={{minHeight:260,border:"1px solid #ddd",borderRadius:10}}/>;

  const selected=editor.state.selection;
  const node=editor.state.doc.nodeAt(selected.from);
  const isMedia=node?.type.name==="image"||node?.type.name==="video";

  function alignMedia(align:string){if(node?.type.name==="image")editor!.commands.updateAttributes("image",{align});if(node?.type.name==="video")editor!.commands.updateAttributes("video",{align});}
  function setVideoSize(width:number){if(node?.type.name==="video")editor!.commands.updateAttributes("video",{width,height:Math.round(width*9/16)});}

  return <div style={{border:"1px solid #d7d9dd",borderRadius:12,overflow:"hidden",background:"#fff"}}>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:8,borderBottom:"1px solid #ddd",background:"#fafafa"}}>
      <button type="button" onClick={()=>editor.chain().focus().toggleBold().run()}>B</button>
      <button type="button" onClick={()=>editor.chain().focus().toggleItalic().run()}>I</button>
      <button type="button" onClick={()=>editor.chain().focus().toggleBulletList().run()}>• لیست</button>
      <button type="button" onClick={()=>editor.chain().focus().toggleOrderedList().run()}>۱. لیست</button>
      <button type="button" onClick={()=>editor.chain().focus().toggleHeading({level:2}).run()}>H2</button>
      <button type="button" onClick={()=>editor.chain().focus().setTextAlign("right").run()}>راست</button>
      <button type="button" onClick={()=>editor.chain().focus().setTextAlign("center").run()}>وسط</button>
      <button type="button" onClick={()=>editor.chain().focus().setTextAlign("left").run()}>چپ</button>
      <button type="button" onClick={()=>setPicker("image")}>تصویر</button>
      <button type="button" onClick={()=>setPicker("video")}>ویدئو</button>
      {isMedia&&<><button type="button" onClick={()=>alignMedia("right")}>رسانه راست</button><button type="button" onClick={()=>alignMedia("center")}>رسانه وسط</button><button type="button" onClick={()=>alignMedia("left")}>رسانه چپ</button></>}
      {node?.type.name==="video"&&<><button type="button" onClick={()=>setVideoSize(480)}>480px</button><button type="button" onClick={()=>setVideoSize(720)}>720px</button></>}
    </div>
    <div style={{padding:14}}>
      <EditorContent editor={editor}/>
    </div>
    <MediaPicker open={picker==="image"} mode="image" onClose={()=>setPicker(null)} onSelect={(media)=>{editor.chain().focus().setImage({src:media.url,alt:media.alt?.fa||media.title?.fa||""}).run();setPicker(null);}}/>
    <MediaPicker open={picker==="video"} mode="video" onClose={()=>setPicker(null)} onSelect={(media)=>{editor.chain().focus().insertContent({type:"video",attrs:{src:media.url}}).run();setPicker(null);}}/>
  </div>;
}