import { z } from "zod";
export const ProfileSchema = z.object({
 adults:z.number().int().min(1).max(20), children:z.number().int().min(0).max(15), elders:z.number().int().min(0).max(10), higherRisk:z.boolean(), pregnant:z.boolean(), pets:z.boolean(),
 sealing:z.enum(["sealed","typical","leaky"]), roomArea:z.number().min(5).max(150), purifier:z.boolean(), cadr:z.number().min(0).max(2000), exhaust:z.boolean(),
 cooking:z.enum(["lpg","induction","biomass"]), heating:z.enum(["none","electric","coal_wood"]), mode:z.enum(["car","bus","metro","cycle","walk","ev","motorcycle"]), km:z.number().min(0).max(300), occupancy:z.number().int().min(1).max(8), transit:z.boolean(), schoolRun:z.boolean(),
 outdoorHours:z.number().min(0).max(24), exercise:z.boolean(), wfhDays:z.number().int().min(0).max(7), budget:z.enum(["free","low","medium"]), lang:z.enum(["en","hi"]), simple:z.boolean()
}).strict();
export type Profile = z.infer<typeof ProfileSchema>;
export const LocationSchema=z.object({name:z.string().min(1).max(100),lat:z.number().min(-90).max(90),lon:z.number().min(-180).max(180)}).strict();
export type Location=z.infer<typeof LocationSchema>;
export const RequestSchema=z.object({profile:ProfileSchema,location:LocationSchema,manualPm:z.number().min(0).max(1000).optional(),offline:z.boolean().optional()}).strict();
export const AirSchema=z.object({pm25:z.number().min(0).max(10000),hourly:z.array(z.object({time:z.string(),pm25:z.number().min(0)})),fetchedAt:z.string(),observedAt:z.string(),source:z.enum(["open-meteo","manual","demo"]),stale:z.boolean(),timezone:z.string()});
export type Air=z.infer<typeof AirSchema>;
export const ActionSchema=z.object({id:z.string(),category:z.enum(["Routine","Indoor air","Transport","Cooking & heating","Community","Health"]),title:z.string(),summary:z.string(),hi:z.object({title:z.string(),summary:z.string()}),cost:z.enum(["free","low","medium"]),effort:z.number().min(1).max(3),group:z.string(),effect:z.enum(["none","indoor","filter","mask","transit","carpool","remote"]),condition:z.enum(["always","smog","coal","biomass","car","filter","exercise","risk"]),sources:z.array(z.string()).min(1)});
export type Action=z.infer<typeof ActionSchema>;
export type Impact={baseline:number;after:number;percent:number;co2KgDay:number;cigaretteEq:number;selected:string[]};
export type Plan={headline:string;summary:string;actions:(Action & {why:string})[];generatedBy:"llm"|"rules";air:Air;profile:Profile;location:Location;impact:Impact;createdAt:string};
