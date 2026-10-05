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
  return {
    key:menu.key,
    name:menu.name,
    location:menu.location,
    items:menu.items
      .filter((item)=>item.enabled)
      .sort((a,b)=>a.position-b.position)
      .map((item)=>({...item,_id:String(item._id),parentId:item.parentId||null}))
  };
}
