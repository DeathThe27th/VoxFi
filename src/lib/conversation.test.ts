import { describe, expect, it, vi } from "vitest";
import { applyTurn, initialConversation, type ConversationState } from "./conversation";
import type { AgentTurn } from "./schemas";

const base = { transcript: "test", spokenResponse: "test", requiresUserResponse: true, confidence: 1 } as const;
const swap = (value:string) => ({type:"swap",tokenIn:"OKB",tokenOut:"TUSDC",amount:{type:"usd",value}} as const);
describe("conversation authorization", () => {
  it("creates and confirms only a current plan", () => {
    const planned=applyTurn(initialConversation,{...base,turnType:"create_plan",actions:[swap("20")]} as AgentTurn);
    expect(planned.status).toBe("AWAITING_CONFIRMATION"); expect(applyTurn(planned,{...base,turnType:"confirm"} as AgentTurn).status).toBe("APPROVED");
  });
  it("modification gets a new id and requires confirmation", () => {
    const first=applyTurn(initialConversation,{...base,turnType:"create_plan",actions:[swap("20")]} as AgentTurn);
    const changed=applyTurn(first,{...base,turnType:"modify_plan",actions:[swap("50")]} as AgentTurn);
    expect(changed.status).toBe("AWAITING_CONFIRMATION"); expect(changed.pendingPlan?.id).not.toBe(first.pendingPlan?.id); expect(changed.pendingPlan?.revision).toBe(1);
  });
  it("yes with a new action stays unapproved", () => {
    const first=applyTurn(initialConversation,{...base,turnType:"create_plan",actions:[swap("20")]} as AgentTurn);
    const multi=applyTurn(first,{...base,turnType:"modify_plan",actions:[swap("20"),swap("10")]} as AgentTurn);
    expect(multi.status).toBe("AWAITING_CONFIRMATION"); expect(multi.pendingPlan?.actions).toHaveLength(2);
  });
  it("cancel clears pending state", () => { const state=applyTurn(initialConversation,{...base,turnType:"cancel"} as AgentTurn); expect(state).toEqual({status:"CANCELLED",pendingPlan:null}); });
  it("read query keeps a pending plan", () => {
    const planned=applyTurn(initialConversation,{...base,turnType:"create_plan",actions:[swap("20")]} as AgentTurn);
    expect(applyTurn(planned,{...base,turnType:"read"} as AgentTurn).pendingPlan).toEqual(planned.pendingPlan);
  });
  it("rejects expired confirmation", () => {
    vi.useFakeTimers(); const state={status:"AWAITING_CONFIRMATION",pendingPlan:{id:crypto.randomUUID(),actions:[swap("20")],revision:0,expiresAt:new Date(Date.now()-1).toISOString()}} as ConversationState;
    expect(applyTurn(state,{...base,turnType:"confirm"} as AgentTurn).status).toBe("FAILED"); vi.useRealTimers();
  });
});
