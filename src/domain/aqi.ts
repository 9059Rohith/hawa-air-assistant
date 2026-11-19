/** EPA 2024 PM2.5 breakpoints. Hourly input is an indicative sub-index, not NowCast. */
export const BANDS=[{lo:0,hi:9,a:0,b:50,label:"Good",hiLabel:"अच्छी"},{lo:9.1,hi:35.4,a:51,b:100,label:"Moderate",hiLabel:"मध्यम"},{lo:35.5,hi:55.4,a:101,b:150,label:"Unhealthy for sensitive groups",hiLabel:"संवेदनशील लोगों के लिए खराब"},{lo:55.5,hi:125.4,a:151,b:200,label:"Unhealthy",hiLabel:"खराब"},{lo:125.5,hi:225.4,a:201,b:300,label:"Very unhealthy",hiLabel:"बहुत खराब"},{lo:225.5,hi:325.4,a:301,b:500,label:"Hazardous",hiLabel:"खतरनाक"}] as const;
export function aqi(pm:number){
 if(!Number.isFinite(pm)||pm<0)throw new RangeError("PM2.5 must be a finite non-negative number");
 const c=Math.floor(pm*10+1e-8)/10;
 const band=BANDS.find(b=>c<=b.hi) ?? BANDS[5];
 return {value:Math.round((band.b-band.a)/(band.hi-band.lo)*(c-band.lo)+band.a),label:band.label,hiLabel:band.hiLabel,level:BANDS.indexOf(band)};
}
/** CPCB concentration band only; not India's multi-pollutant AQI. */
export function cpcb(pm:number){aqi(pm);return pm<=30?"Good":pm<=60?"Satisfactory":pm<=90?"Moderate":pm<=120?"Poor":pm<=250?"Very poor":"Severe";}
export function bestWindow(hours:{time:string;pm25:number}[]){
 const windows=hours.slice(0,-1).flatMap((hour,i)=>{
  const next=hours[i+1];const h=Number(hour.time.slice(11,13));
  if(!next||h<10||h>16||new Date(next.time).getTime()-new Date(hour.time).getTime()!==3600000)return [];
  return [{time:hour.time,mean:(hour.pm25+next.pm25)/2}];
 });return windows.sort((a,b)=>a.mean-b.mean)[0] ?? null;
}
