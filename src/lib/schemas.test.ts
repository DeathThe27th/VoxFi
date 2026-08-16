import { describe, expect, it } from "vitest";
import { actionSchema, agentTurnSchema } from "./schemas";

describe("financial schemas", () => {
  it("accepts a USD swap", () => { const action=actionSchema.parse({type:"swap",tokenIn:"okb",tokenOut:"USDC",amount:{type:"usd",value:"20"}}); expect(action.type === "swap" && action.tokenIn).toBe("OKB"); });
  it("rejects percentage above 100", () => expect(() => actionSchema.parse({type:"swap",tokenIn:"OKB",tokenOut:"USDC",amount:{type:"percentage",value:"101"}})).toThrow());
  it("rejects malformed recipients", () => expect(() => actionSchema.parse({type:"transfer",token:"OKB",amount:"5",recipient:"0x123"})).toThrow());
  it("rejects low confidence outside range", () => expect(() => agentTurnSchema.parse({turnType:"clarify",transcript:"",spokenResponse:"Repeat",requiresUserResponse:true,confidence:2})).toThrow());
});
