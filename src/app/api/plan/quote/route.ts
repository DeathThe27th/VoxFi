import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema,actionSchema } from "@/lib/schemas";
import { resolveAndQuote } from "@/lib/execution";
import { saveQuote } from "@/lib/quotes";
const input=z.object({planId:z.string().uuid().optional(),revision:z.number().int().nonnegative().default(0),smartAccount:addressSchema,actions:z.array(actionSchema).min(1).max(4)});
export async function POST(request:Request){try{const parsed=input.parse(await request.json());const planId=parsed.planId??crypto.randomUUID();const actions=[];for(const action of parsed.actions)actions.push(await resolveAndQuote(action,parsed.smartAccount as `0x${string}`));saveQuote({planId,revision:parsed.revision,actions,createdAt:Date.now()});return NextResponse.json({planId,revision:parsed.revision,actions,authorization:actions.every(a=>a.type==="swap")?"session_eligible":"owner_required"});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Quote failed"},{status:400});}}
