import {AppError} from "@/lib/errors";
const hosts=new Set(["api.openai.com","air-quality-api.open-meteo.com","geocoding-api.open-meteo.com"]);
export async function safeFetch(url:string,init:RequestInit={},timeout=8000){const parsed=new URL(url);if(parsed.protocol!=="https:"||!hosts.has(parsed.hostname)||parsed.username||parsed.password||parsed.port)throw new AppError("DESTINATION",400,"Unsupported data provider");return fetch(url,{...init,redirect:"error",signal:AbortSignal.any([AbortSignal.timeout(timeout),...(init.signal?[init.signal]:[])])});}
