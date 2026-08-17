import { describe,expect,it } from "vitest";
import { addActivity,getConversation,listActivity,saveConversation } from "./store";

describe("user-scoped server state",()=>{
  it("does not expose another user's conversation",()=>{
    const id=crypto.randomUUID();
    saveConversation(id,"user-a",{status:"IDLE",pendingPlan:null});
    expect(()=>getConversation(id,"user-b")).toThrow("not found");
  });
  it("filters activity by owner",()=>{
    addActivity({id:crypto.randomUUID(),ownerId:"user-a",conversationId:crypto.randomUUID(),type:"swap",summary:"a",status:"confirmed",timestamp:new Date().toISOString()});
    addActivity({id:crypto.randomUUID(),ownerId:"user-b",conversationId:crypto.randomUUID(),type:"swap",summary:"b",status:"confirmed",timestamp:new Date().toISOString()});
    expect(listActivity("user-a").map(item=>item.summary)).toContain("a");
    expect(listActivity("user-a").map(item=>item.summary)).not.toContain("b");
  });
});
