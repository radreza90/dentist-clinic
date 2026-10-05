import { MenuModel } from "@/models";
import { connectDB } from "@/lib/db";

export type MenuItemRecord={
  _id:string;
  label:{fa?:string;en?:string};
  href:string;
  type:"internal"|"external";
  targetBlank:boolean;
  parentId:string|null;
  position:number;
  enabled:boolean;
};

export async function getMenu(location:"header"|"footer"){
  await connectDB();
  const menu=await MenuModel.findOne({location}).lean();
  if(!menu)return null;
  const items=menu.items as unknown as MenuItemRecord[];
  return {
    key:menu.key,
    name:menu.name,
    location:menu.location,
    items:items
      .filter((item:MenuItemRecord)=>item.enabled)
      .sort((a:MenuItemRecord,b:MenuItemRecord)=>a.position-b.position)
      .map((item:MenuItemRecord)=>({...item,_id:String(item._id),parentId:item.parentId||null}))
  };
}

export type MenuTreeItem=MenuItemRecord&{children:MenuTreeItem[]};

export function buildMenuTree(items:MenuItemRecord[]){
  const byId=new Map(items.map(item=>[item._id,{...item,children:[] as MenuTreeItem[]}] as const));
  const roots:MenuTreeItem[]=[];
  for(const item of byId.values()){
    const parent=item.parentId?byId.get(item.parentId):undefined;
    if(parent)parent.children.push(item);
    else roots.push(item);
  }
  const sort=(list:MenuTreeItem[])=>{
    list.sort((a,b)=>a.position-b.position);
    list.forEach(item=>sort(item.children));
  };
  sort(roots);
  return roots;
}
