import { connectDB } from "@/lib/db";
import { IntegrationModel } from "@/models";
import { decryptIntegrationConfig } from "@/lib/integrations/crypto";
import { integrationRegistry, getIntegrationDefinition, type IntegrationDefinition } from "@/lib/integrations/registry";

export async function syncIntegrationRegistry(){
  await connectDB();
  for(const definition of integrationRegistry){
    await IntegrationModel.updateOne(
      {type:definition.type,provider:definition.provider},
      {$set:{
        name:definition.name,
        description:definition.description
      },$setOnInsert:{
        key:definition.type+"."+definition.provider,
        type:definition.type,
        provider:definition.provider,
        enabled:false,
        isDefault:false,
        configEncrypted:""
      }},
      {upsert:true}
    );
  }
}

export async function getIntegration(type:"payment"|"sms",provider?:string,activeOnly=true){
  await connectDB();
  const filter:Record<string,unknown>={type};
  if(provider)filter.provider=provider;
  if(activeOnly)filter.enabled=true;
  const item=await IntegrationModel.findOne(filter).sort({isDefault:-1,updatedAt:-1});
  if(!item)return null;
  const definition=getIntegrationDefinition(type,item.provider);
  if(!definition)return null;
  return {
    item,
    definition,
    config:decryptIntegrationConfig(item.configEncrypted)
  };
}

export async function validateIntegrationConfig(definition:IntegrationDefinition, input:Record<string,unknown>, existing?:Record<string,unknown>){
  const config:Record<string,unknown>={};
  for(const field of definition.fields){
    const raw=input[field.key];
    if(field.secret&&typeof raw==="string"&&raw.trim()===""){
      if(existing&&existing[field.key]!==undefined&&String(existing[field.key]).length>0){
        config[field.key]=existing[field.key];
        continue;
      }
    }
    if(raw!==undefined&&raw!==null&&String(raw).trim()!=="")config[field.key]=String(raw).trim();
    if(field.required&&(!config[field.key]||String(config[field.key]).trim()==="")){
      throw new Error(field.label+" is required");
    }
    if(field.type==="url"&&config[field.key]){
      try{new URL(String(config[field.key]));}catch{throw new Error(field.label+" must be a valid URL");}
    }
  }
  return config;
}

type IntegrationRecord={_id:unknown;key:string;type:"payment"|"sms";provider:string;name:{fa:string;en:string};description?:{fa?:string;en?:string};enabled:boolean;isDefault:boolean;configEncrypted:string;lastTestAt?:Date|null;lastTestOk?:boolean|null;lastTestMessage?:string|null};

export function publicIntegration(item:IntegrationRecord){
  const definition=getIntegrationDefinition(item.type,item.provider);
  const stored=decryptIntegrationConfig(item.configEncrypted);
  const config=definition?.fields.reduce<Record<string,string>>((acc,field)=>{
    acc[field.key]=field.secret?"":String(stored[field.key]??"");
    return acc;
  },{})||{};
  const secretSet=definition?.fields.reduce<Record<string,boolean>>((acc,field)=>{
    if(field.secret)acc[field.key]=Boolean(stored[field.key]);
    return acc;
  },{})||{};
  return {
    id:String(item._id),
    key:item.key,
    type:item.type,
    provider:item.provider,
    name:item.name,
    description:item.description,
    enabled:item.enabled,
    isDefault:item.isDefault,
    config,
    secretSet,
    fields:definition?.fields||[],
    lastTestAt:item.lastTestAt||null,
    lastTestOk:item.lastTestOk??null,
    lastTestMessage:item.lastTestMessage||""
  };
}
