import {z} from "zod";
import {Cache} from "./cache";
import {safeFetch} from "./http";
import type {Air,Location} from "@/domain/types";
const cache=new Cache<Air>();
const payload=z.object({current:z.object({pm2_5:z.number().min(0),time:z.string()}),hourly:z.object({time:z.array(z.string()),pm2_5:z.array(z.number().nullable())}),timezone:z.string()});
export async function getAir(location:Location):Promise<Air>{
 const lat=location.lat.toFixed(2),lon=location.lon.toFixed(2),key=`${lat},${lon}`;
 const fresh=cache.get(key,900000);if(fresh)return fresh;
 try{const response=await safeFetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5&hourly=pm2_5&forecast_days=2&timezone=auto`);
 if(!response.ok)throw new Error("Upstream unavailable");const data=payload.parse(await response.json());
 const hourly=data.hourly.time.flatMap((time,i)=>{const pm25=data.hourly.pm2_5[i];return pm25!==null&&pm25!==undefined&&pm25>=0&&time>=data.current.time?[{time,pm25}]:[];}).slice(0,48);
 const air:Air={pm25:data.current.pm2_5,hourly,fetchedAt:new Date().toISOString(),observedAt:data.current.time,timezone:data.timezone,source:"open-meteo",stale:false};cache.set(key,air);return air;
 }catch(error){const stale=cache.get(key,10800000);if(stale)return {...stale,stale:true};throw error;}
}
export function manualAir(pm25:number):Air{return {pm25,hourly:[],fetchedAt:new Date().toISOString(),observedAt:new Date().toISOString(),source:"manual",stale:false,timezone:"UTC"};}
const geo=z.object({results:z.array(z.object({name:z.string(),latitude:z.number(),longitude:z.number(),country:z.string().optional(),admin1:z.string().optional()})).optional()});
const geocache=new Cache<Location[]>();
export async function geocode(q:string){const cached=geocache.get(q.toLowerCase(),86400000);if(cached)return cached;const response=await safeFetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`);if(!response.ok)throw new Error("Geocoding unavailable");const data=geo.parse(await response.json());const results=(data.results??[]).map(r=>({name:[r.name,r.admin1,r.country].filter(Boolean).join(", ").slice(0,100),lat:r.latitude,lon:r.longitude}));geocache.set(q.toLowerCase(),results);return results;}
