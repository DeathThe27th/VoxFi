import type { AgentTurn, Plan } from "./schemas";

export type ConversationState = {
  status: "IDLE" | "NEEDS_CLARIFICATION" | "READ_QUERY" | "AWAITING_CONFIRMATION" | "APPROVED" | "CANCELLED" | "FAILED";
  pendingPlan: Plan | null;
};

export const initialConversation: ConversationState = { status: "IDLE", pendingPlan: null };

function freshPlan(actions: NonNullable<AgentTurn["actions"]>, revision: number): Plan {
  return {
    id: crypto.randomUUID(), actions, revision,
    expiresAt: new Date(Date.now() + 2 * 60_000).toISOString(),
  };
}

export function applyTurn(state: ConversationState, turn: AgentTurn): ConversationState {
  if (turn.confidence < 0.8 && ["create_plan","modify_plan","confirm"].includes(turn.turnType)) return { ...state, status: "NEEDS_CLARIFICATION" };
  if (turn.turnType === "cancel") return { status: "CANCELLED", pendingPlan: null };
  if (turn.turnType === "clarify") return { ...state, status: "NEEDS_CLARIFICATION" };
  if (turn.turnType === "read") return { ...state, status: "READ_QUERY" };
  if (turn.turnType === "create_plan" || turn.turnType === "modify_plan") {
    if (!turn.actions?.length) return { ...state, status: "NEEDS_CLARIFICATION" };
    return { status: "AWAITING_CONFIRMATION", pendingPlan: freshPlan(turn.actions, (state.pendingPlan?.revision ?? -1) + 1) };
  }
  if (turn.turnType === "confirm") {
    if (!state.pendingPlan || new Date(state.pendingPlan.expiresAt) <= new Date()) return { ...state, status: "FAILED" };
    return { ...state, status: "APPROVED" };
  }
  return state;
}
