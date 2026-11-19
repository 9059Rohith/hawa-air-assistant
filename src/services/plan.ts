import {createHash} from "node:crypto";
import {RequestSchema,type Plan} from "@/domain/types";
import {knowledge} from "@/data/knowledge";
import {selectActions} from "@/domain/select";
import {planImpact} from "@/domain/impact";
import {getAir,manualAir} from "./air";
import {language,PROMPT_VERSION} from "./llm";
import {Cache} from "./cache";
const cache=new Cache<Plan>();
export async function buildPlan(input:unknown){
 const request=RequestSchema.parse(input);const {profile,location}=request;
 const air=request.manualPm===undefined?await getAir(location):manualAir(request.manualPm);
 const key=createHash("sha256").update(JSON.stringify([profile,{lat:location.lat.toFixed(2),lon:location.lon.toFixed(2)},air.pm25,request.offline,PROMPT_VERSION,new Date().toISOString().slice(0,10)])).digest("hex");
 const saved=cache.get(key,1800000);if(saved)return {...saved,air,location};
 const actions=selectActions(knowledge,profile,air.pm25);const writing=request.offline?null:await language(actions,profile);
 const plan:Plan={headline:writing?.headline??(profile.lang==="hi"?"आज की साफ हवा योजना":"Your smog game plan"),summary:writing?.summary??(profile.lang==="hi"?"घर, सफ़र और मोहल्ले के लिए छोटे कदम। अनुमान को माप या चिकित्सा सलाह न मानें।":"Practical steps for your home, journey and neighbourhood. Estimates explain scenarios; they do not measure personal exposure."),actions:actions.map(a=>({...a,why:writing?.actions.find(w=>w.id===a.id)?.why??(profile.lang==="hi"?a.hi.summary:a.summary)})),generatedBy:writing?"llm":"rules",air,profile,location,impact:planImpact(actions,profile,air.pm25),createdAt:new Date().toISOString()};
 cache.set(key,plan);return plan;
}
