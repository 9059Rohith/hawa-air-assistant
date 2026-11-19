import {z} from "zod";
const schema=z.object({LLM_API_KEY:z.string().optional(),LLM_MODEL:z.string().default("gpt-4o-mini"),ENABLE_LLM:z.enum(["true","false"]).default("true"),APP_ORIGIN:z.string().url().default("http://localhost:3100")});
export function env(){return schema.parse(process.env);}
