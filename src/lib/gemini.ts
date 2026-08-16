import { GoogleGenAI } from "@google/genai";
import { agentTurnSchema, type Plan } from "./schemas";

const outputSchema = {
  type: "object", additionalProperties: false,
  properties: {
    turnType: { type: "string", enum: ["read", "create_plan", "modify_plan", "confirm", "cancel", "clarify"] },
    transcript: { type: "string" }, spokenResponse: { type: "string" },
    requiresUserResponse: { type: "boolean" }, confidence: { type: "number", minimum: 0, maximum: 1 },
    actions: { type: "array", maxItems: 4, items: { oneOf: [
      { type: "object", additionalProperties: false, properties: { type:{const:"swap"}, tokenIn:{type:"string"}, tokenOut:{type:"string"}, amount:{type:"object",additionalProperties:false,properties:{type:{type:"string",enum:["exact","usd","percentage","target_output"]},value:{type:"string"}},required:["type","value"]}}, required:["type","tokenIn","tokenOut","amount"] },
      { type: "object", additionalProperties: false, properties: { type:{const:"transfer"}, token:{type:"string"}, amount:{type:"string"}, recipient:{type:"string"}}, required:["type","token","amount","recipient"] }
    ] } },
  }, required: ["turnType", "transcript", "spokenResponse", "requiresUserResponse", "confidence"]
} as const;

const system = `You are Vox, a precise multilingual financial-intent interpreter for X Layer Testnet.
Return only the requested structured object. Understand the supplied audio in its original language and answer concisely in that language.
Supported assets are OKB and the explicitly labelled X Layer test assets TETH and TUSDC. In testnet swap requests, interpret spoken ETH as TETH and USDC as TUSDC, and clearly call them test assets in the response. Never invent an address, balance, price, quote, or token.
For ambiguous amounts, especially numbers such as 15/50 or 0.15/1.5, use clarify.
If the audio is silent, noise-only, clipped, or unintelligible, return clarify with transcript "[unintelligible]" and confidence 0. Never infer a financial action without clearly audible words.
State-changing requests create_plan. If there is a pending plan, changes are modify_plan. A bare confirmation is confirm only when the pending plan is unchanged. A confirmation containing any change is modify_plan, never confirm. Cancellation is cancel.
Read queries use read. Do not claim execution occurred. A transfer recipient must be a complete EVM address.`;

export async function understandAudio(audio: Uint8Array, mimeType: string, pendingPlan: Plan | null) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const ai = new GoogleGenAI({ apiKey: key });
  const context = pendingPlan ? `Pending plan: ${JSON.stringify(pendingPlan)}` : "There is no pending plan.";
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: context }, { inlineData: { data: Buffer.from(audio).toString("base64"), mimeType } }] }],
    config: { systemInstruction: system, responseMimeType: "application/json", responseJsonSchema: outputSchema },
  });
  if (!response.text) throw new Error("Gemini returned no structured output");
  return agentTurnSchema.parse(JSON.parse(response.text));
}
