import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema } from "@/lib/schemas";
import { getConversation,saveConversation } from "@/lib/store";
import { executeApprovedPlan } from "@/lib/session-executor";
import { resolveAndQuote } from "@/lib/execution";
const input=z.object({conversationId:z.string().uuid(),smartAccount:addressSchema});
export async function POST(request:Request){try{const parsed=input.parse(await request.json());const state=getConversation(parsed.conversationId);if(state.status!=="APPROVED"||!state.pendingPlan)throw new Error("The current plan has not been confirmed");if(new Date(state.pendingPlan.expiresAt)<=new Date())throw new Error("The confirmed plan expired and must be quoted again");if(state.pendingPlan.actions.some(a=>a.type==="transfer")){const actions=[];for(const action of state.pendingPlan.actions)actions.push(await resolveAndQuote(action,parsed.smartAccount as `0x${string}`));return NextResponse.json({state:"OWNER_AUTH_REQUIRED",actions});}const results=await executeApprovedPlan(state.pendingPlan,parsed.conversationId,parsed.smartAccount as `0x${string}`);saveConversation(parsed.conversationId,{status:"IDLE",pendingPlan:null});return NextResponse.json({state:"COMPLETED",results,transactionHashes:results.map(r=>r.hash)});}catch(error){return NextResponse.json({state:"FAILED",error:error instanceof Error?error.message:"Execution failed"},{status:400});}}
