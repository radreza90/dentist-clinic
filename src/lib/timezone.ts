const partsFormatter=(timeZone:string)=>new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});

export function zonedDateToUtc(date:string,time:string,timeZone:string){
  const [year,month,day]=date.split("-").map(Number);
  const [hour,minute]=time.split(":").map(Number);
  const guess=Date.UTC(year,month-1,day,hour,minute,0,0);
  const parts=Object.fromEntries(partsFormatter(timeZone).formatToParts(new Date(guess)).filter(p=>p.type!=="literal").map(p=>[p.type,Number(p.value)]));
  const zonedAsUtc=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second);
  return new Date(guess-(zonedAsUtc-guess));
}

export function weekdayForDate(date:string,timeZone:string){
  const base=zonedDateToUtc(date,"12:00",timeZone);
  const weekday=new Intl.DateTimeFormat("en-US",{timeZone,weekday:"short"}).format(base);
  return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(weekday);
}

export function minutesToTime(minutes:number){
  const h=Math.floor(minutes/60).toString().padStart(2,"0");
  const m=(minutes%60).toString().padStart(2,"0");
  return h+":"+m;
}