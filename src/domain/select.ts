import type {Action,Profile} from "./types";
export function selectActions(items:Action[],p:Profile,pm:number){
 const match={always:true,smog:pm>35.4,coal:p.heating==="coal_wood",biomass:p.cooking==="biomass",car:p.mode==="car",filter:p.purifier||p.budget==="medium",exercise:p.exercise&&pm>35.4,risk:p.higherRisk||p.children>0||p.elders>0||p.pregnant};
 const budget={free:0,low:1,medium:2};const groups=new Set<string>();
 return items.filter(a=>match[a.condition]&&(a.condition==="coal"||budget[a.cost]<=budget[p.budget])).sort((a,b)=>score(b)-score(a)).filter(a=>{if(groups.has(a.group))return false;groups.add(a.group);return true;}).slice(0,10);
 function score(a:Action){return (a.condition==="coal"?100:a.condition==="risk"?90:a.condition==="exercise"?80:a.effect!=="none"?70:40)-a.effort;}
}
