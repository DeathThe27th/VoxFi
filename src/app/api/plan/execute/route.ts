import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema } from "@/lib/schemas";
import { getConversation,saveConversation } from "@/lib/store";
import { executeApprovedPlan } from "@/lib/session-executor";
import { getQuote } from "@/lib/quotes";
import { errorResponse,requireUser } from "@/lib/auth";
const input=z.object({conversationId:z.string().uuid(),smartAccount:addressSchema});
export async function POST(request:Request){try{const user=await requireUser(request);const parsed=input.parse(await request.json());const state=getConversation(parsed.conversationId,user.id);if(state.status!=="APPROVED"||!state.pendingPlan)throw new Error("The current plan has not been confirmed");if(new Date(state.pendingPlan.expiresAt)<=new Date())throw new Error("The confirmed plan expired and must be quoted again");const quote=getQuote(state.pendingPlan.id,user.id,state.pendingPlan.revision);if(!quote)throw new Error("The confirmed quote is unavailable; ask Vox to quote the plan again");if(state.pendingPlan.actions.some(a=>a.type==="transfer"))return NextResponse.json({state:"OWNER_AUTH_REQUIRED",actions:quote.actions});const results=await executeApprovedPlan(state.pendingPlan,parsed.conversationId,user.id,parsed.smartAccount as `0x${string}`,quote.actions);saveConversation(parsed.conversationId,user.id,{status:"IDLE",pendingPlan:null});return NextResponse.json({state:"COMPLETED",results,transactionHashes:results.map(r=>r.hash)});}catch(error){const response=errorResponse(error,"Execution failed");const body=await response.json();return NextResponse.json({state:"FAILED",...body},{status:response.status});}}
