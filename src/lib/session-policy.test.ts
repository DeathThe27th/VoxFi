import { describe, expect, it } from "vitest";
import { validateSessionCall, type SessionPolicy } from "./session-policy";
const target="0x1111111111111111111111111111111111111111" as const;
const base:SessionPolicy={target,selector:"0x12345678",expiresAt:200,maxValuePerCall:10n,totalValueLimit:20n,totalValueUsed:0n,revoked:false};
describe("session policy",()=>{
  it("allows a permitted call",()=>expect(()=>validateSessionCall(base,{target,data:"0x1234567800",value:10n,now:100})).not.toThrow());
  it("rejects over-limit",()=>expect(()=>validateSessionCall(base,{target,data:"0x12345678",value:11n,now:100})).toThrow("Per-call"));
  it("rejects target and function",()=>{expect(()=>validateSessionCall(base,{target:"0x2222222222222222222222222222222222222222",data:"0x12345678",value:1n,now:100})).toThrow("Target");expect(()=>validateSessionCall(base,{target,data:"0xabcdef00",value:1n,now:100})).toThrow("Function")});
  it("rejects expired and revoked",()=>{expect(()=>validateSessionCall(base,{target,data:"0x12345678",value:1n,now:201})).toThrow("expired");expect(()=>validateSessionCall({...base,revoked:true},{target,data:"0x12345678",value:1n,now:100})).toThrow("revoked")});
});
