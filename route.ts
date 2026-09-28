import { createMcpHandler } from "mcp-handler";
import OpenAI from "openai";
import { z } from "zod";
export const runtime = "nodejs";
export const maxDuration = 60;
const handler = createMcpHandler((server) => {
  server.tool("ask_meta","Ask Meta for an independent second opinion or critique.",{
    prompt:z.string().min(1),
    role:z.enum(["second_opinion","critic","alternative","fact_check"]).default("second_opinion"),
    context:z.string().optional()
  }, async ({prompt,role,context}) => {
    const apiKey=process.env.META_API_KEY, baseURL=process.env.META_BASE_URL, model=process.env.META_MODEL;
    if(!apiKey||!baseURL||!model) return {content:[{type:"text",text:"Set META_API_KEY, META_BASE_URL, and META_MODEL in Vercel."}],isError:true};
    const client=new OpenAI({apiKey,baseURL});
    const jobs:any={
      second_opinion:"Solve independently and identify assumptions, risks, and blind spots.",
      critic:"Critique the reasoning fairly and identify errors, unsupported assumptions, and stronger alternatives.",
      alternative:"Solve independently using a meaningfully different approach.",
      fact_check:"Check supplied claims for consistency and likely factual errors; distinguish confidence from uncertainty."
    };
    try {
      const r=await client.chat.completions.create({model,messages:[
        {role:"system",content:`You are an independent AI reviewer collaborating with another AI. ${jobs[role]}`},
        {role:"user",content:context?`Context:\n${context}\n\nTask:\n${prompt}`:prompt}
      ]});
      return {content:[{type:"text",text:`META SECOND OPINION\n\n${r.choices?.[0]?.message?.content||"No text response."}`}]};
    } catch(e:any) {
      return {content:[{type:"text",text:`Meta API request failed: ${e?.message||String(e)}`}],isError:true};
    }
  });
},{},{basePath:"/api"});
export {handler as GET,handler as POST,handler as DELETE};
