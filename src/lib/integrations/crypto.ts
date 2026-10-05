import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const algorithm="aes-256-gcm";

function key(){
  const secret=process.env.INTEGRATION_ENCRYPTION_KEY?.trim();
  if(!secret)throw new Error("INTEGRATION_ENCRYPTION_KEY is not configured");
  return createHash("sha256").update(secret).digest();
}

export function encryptIntegrationConfig(value:Record<string,unknown>){
  const iv=randomBytes(12);
  const cipher=createCipheriv(algorithm,key(),iv);
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);
  const tag=cipher.getAuthTag();
  return [iv.toString("base64url"),tag.toString("base64url"),encrypted.toString("base64url")].join(".");
}

export function decryptIntegrationConfig<T extends Record<string,unknown>=Record<string,unknown>>(payload:string){
  if(!payload) return {} as T;
  const [ivValue,tagValue,dataValue]=payload.split(".");
  if(!ivValue||!tagValue||!dataValue)throw new Error("Invalid encrypted integration configuration");
  const decipher=createDecipheriv(algorithm,key(),Buffer.from(ivValue,"base64url"));
  decipher.setAuthTag(Buffer.from(tagValue,"base64url"));
  const data=Buffer.concat([decipher.update(Buffer.from(dataValue,"base64url")),decipher.final()]).toString("utf8");
  return JSON.parse(data) as T;
}
