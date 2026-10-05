import Link from "next/link";
import { getMenu,buildMenuTree,type MenuTreeItem } from "@/lib/menus";
import { Localized } from "@/components/i18n/Localized";

function Item({item}:{item:MenuTreeItem}){
  const external=item.type==="external"||/^https?:\\/\\//i.test(item.href);
  const link=external?<a href={item.href} target={item.targetBlank?"_blank":undefined} rel={item.targetBlank?"noreferrer":undefined}><Localized value={item.label}/></a>:<Link href={item.href} target={item.targetBlank?"_blank":undefined}><Localized value={item.label}/></Link>;
  return <li style={{position:"relative"}}>
    {link}
    {item.children.length>0&&<ul style={{listStyle:"none",padding:"8px 12px",margin:0,display:"grid",gap:8,position:"absolute",top:"100%",insetInlineStart:0,minWidth:190,background:"#fff",border:"1px solid #e4e7ec",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.08)",zIndex:20}}>
      {item.children.map(child=><Item key={child._id} item={child}/>)}
    </ul>}
  </li>;
}

export async function SiteHeader(){
  const menu=await getMenu("header");
  const items=menu?buildMenuTree(menu.items):[];
  return <header style={{borderBottom:"1px solid #e4e7ec",background:"#fff",position:"relative",zIndex:10}}>
    <div style={{maxWidth:1200,margin:"0 auto",padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:20,flexWrap:"wrap"}}>
      <Link href="/" style={{fontWeight:800,textDecoration:"none"}}><Localized value={menu?.name||{fa:"کلینیک دندانپزشکی",en:"Dental Clinic"}}/></Link>
      <nav aria-label="navigation">
        <ul style={{listStyle:"none",display:"flex",gap:18,alignItems:"center",padding:0,margin:0,flexWrap:"wrap"}}>
          {(items.length?items:[
            {_id:"booking",label:{fa:"نوبت‌دهی",en:"Booking"},href:"/booking",type:"internal" as const,targetBlank:false,parentId:null,position:0,enabled:true,children:[]},
            {_id:"services",label:{fa:"خدمات",en:"Services"},href:"/services",type:"internal" as const,targetBlank:false,parentId:null,position:1,enabled:true,children:[]},
            {_id:"doctors",label:{fa:"پزشکان",en:"Doctors"},href:"/doctors",type:"internal" as const,targetBlank:false,parentId:null,position:2,enabled:true,children:[]},
            {_id:"blog",label:{fa:"مجله",en:"Journal"},href:"/blog",type:"internal" as const,targetBlank:false,parentId:null,position:3,enabled:true,children:[]},
          ] as MenuTreeItem[]).map(item=><Item key={item._id} item={item}/>)}
        </ul>
      </nav>
    </div>
  </header>;
}
