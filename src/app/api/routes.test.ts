import { describe,expect,it,vi } from "vitest";
vi.mock("@/lib/auth",()=>({requireUser:vi.fn(async()=>({id:"test-user"})),AuthError:class AuthError extends Error{},errorResponse:(error:unknown,fallback:string)=>Response.json({error:error instanceof Error?error.message:fallback},{status:400})}));
import { POST as voiceTurn } from "./voice/turn/route";
import { POST as quotePlan } from "./plan/quote/route";

describe("API boundary validation",()=>{
  it("requires an audio file",async()=>{const response=await voiceTurn(new Request("http://localhost/api/voice/turn",{method:"POST",body:new FormData()}));expect(response.status).toBe(400);expect(await response.json()).toEqual({error:"An audio file is required"});});
  it("rejects unsupported audio MIME",async()=>{const body=new FormData();body.set("audio",new File(["x"],"voice.txt",{type:"text/plain"}));const response=await voiceTurn(new Request("http://localhost/api/voice/turn",{method:"POST",body}));expect(response.status).toBe(415);});
  it("rejects a malformed quote request",async()=>{const response=await quotePlan(new Request("http://localhost/api/plan/quote",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({smartAccount:"0x123",actions:[]})}));expect(response.status).toBe(400);});
});
