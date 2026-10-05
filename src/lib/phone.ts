export function normalizeIranianMobile(value:string){
  const raw=value.trim()
    .replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[\s().-]/g,"");
  let normalized=raw;
  if(normalized.startsWith("0098"))normalized="+"+normalized.slice(4);
  else if(normalized.startsWith("98"))normalized="+"+normalized;
  else if(normalized.startsWith("0"))normalized="+98"+normalized.slice(1);
  if(!/^\+989\d{9}$/.test(normalized))throw new Error("Invalid Iranian mobile number");
  return normalized;
}
