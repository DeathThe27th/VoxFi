import { NextResponse } from "next/server";
import { applyTurn } from "@/lib/conversation";
import { understandAudio } from "@/lib/gemini";
import { getConversation, saveConversation } from "@/lib/store";
import { addressSchema } from "@/lib/schemas";
import { resolveAndQuote } from "@/lib/execution";
import { saveQuote } from "@/lib/quotes";
import { executeApprovedPlan } from "@/lib/session-executor";
import { createPublicClient,formatEther,formatUnits,http } from "viem";
import { rpcUrl,xLayerTestnet } from "@/lib/chain";
import { testnetDeployments } from "@/lib/deployments";
import { AuthError,requireUser } from "@/lib/auth";
import { getQuote } from "@/lib/quotes";

export const runtime = "nodejs";
export const maxDuration = 60;
const allowedTypes = new Set(["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-m4a", "audio/aac", "audio/ogg"]);
const maxBytes = 12 * 1024 * 1024;
const rateGlobal=globalThis as typeof globalThis&{voxVoiceRate?:Map<string,{count:number;reset:number}>};const rates=rateGlobal.voxVoiceRate??new Map<string,{count:number;reset:number}>();rateGlobal.voxVoiceRate=rates;
const erc20=[{type:"function",name:"balanceOf",stateMutability:"view",inputs:[{name:"account",type:"address"}],outputs:[{type:"uint256"}]}] as const;
async function deterministicRead(address:`0x${string}`){const client=createPublicClient({chain:xLayerTestnet,transport:http(rpcUrl)});const[native,tEth,tUsdc]=await Promise.all([client.getBalance({address}),client.readContract({address:testnetDeployments.tEth,abi:erc20,functionName:"balanceOf",args:[address]}),client.readContract({address:testnetDeployments.tUsdc,abi:erc20,functionName:"balanceOf",args:[address]})]);return `Your Vox testnet account has ${formatEther(native)} OKB, ${formatUnits(tEth,18)} test ETH, and ${formatUnits(tUsdc,6)} test USDC.`;}

export async function POST(request: Request) {
  try {
    const user=await requireUser(request);
    const ip=request.headers.get("x-forwarded-for")?.split(",")[0]??"local";const now=Date.now();const current=rates.get(ip);if(current&&current.reset>now&&current.count>=20)return NextResponse.json({error:"Voice rate limit reached; try again shortly"},{status:429});rates.set(ip,!current||current.reset<=now?{count:1,reset:now+60_000}:{count:current.count+1,reset:current.reset});
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > maxBytes) return NextResponse.json({ error: "Audio exceeds the 12 MB limit" }, { status: 413 });
    const data = await request.formData();
    const audio = data.get("audio");
    if (!(audio instanceof File)) return NextResponse.json({ error: "An audio file is required" }, { status: 400 });
    const mimeType = audio.type.split(";")[0];
    if (!allowedTypes.has(mimeType)) return NextResponse.json({ error: `Unsupported audio type: ${mimeType || "unknown"}` }, { status: 415 });
    if (!audio.size || audio.size > maxBytes) return NextResponse.json({ error: "Audio must be between 1 byte and 12 MB" }, { status: 400 });
    const suppliedId = data.get("conversationId");
    const conversationId = typeof suppliedId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(suppliedId) ? suppliedId : crypto.randomUUID();
    const wallet = data.get("smartAccount") ?? data.get("walletAddress");
    if (typeof wallet === "string" && wallet && !addressSchema.safeParse(wallet).success) return NextResponse.json({ error: "Invalid smart-account address" }, { status: 400 });
    const previous = getConversation(conversationId,user.id);
    const turn = await understandAudio(new Uint8Array(await audio.arrayBuffer()), mimeType, previous.pendingPlan);
    const next = applyTurn(previous, turn);
    saveConversation(conversationId,user.id, next);
    let resolvedActions:Awaited<ReturnType<typeof resolveAndQuote>>[]|undefined;
    if(next.status==="AWAITING_CONFIRMATION"&&next.pendingPlan&&typeof wallet==="string"&&wallet){resolvedActions=[];for(const action of next.pendingPlan.actions)resolvedActions.push(await resolveAndQuote(action,wallet as `0x${string}`));saveQuote({ownerId:user.id,planId:next.pendingPlan.id,revision:next.pendingPlan.revision,actions:resolvedActions,createdAt:Date.now()});}
    if(next.status==="APPROVED"&&next.pendingPlan){if(typeof wallet!=="string"||!wallet)throw new Error("A smart account is required for execution");const quote=getQuote(next.pendingPlan.id,user.id,next.pendingPlan.revision);if(!quote)throw new Error("The confirmed quote is unavailable; ask Vox to quote the plan again");if(next.pendingPlan.actions.some(action=>action.type==="transfer"))return NextResponse.json({conversationId,speak:"This transfer is outside the delegated voice policy. Open Vox and approve it with the demo owner wallet.",requiresResponse:false,state:"OWNER_AUTH_REQUIRED",plan:next.pendingPlan,ownerActions:quote.actions,transcript:turn.transcript});const results=await executeApprovedPlan(next.pendingPlan,conversationId,user.id,wallet as `0x${string}`,quote.actions);saveConversation(conversationId,user.id,{status:"IDLE",pendingPlan:null});return NextResponse.json({conversationId,speak:`Done. ${results.length} onchain action${results.length===1?"":"s"} confirmed.`,requiresResponse:false,state:"COMPLETED",plan:null,results,transcript:turn.transcript});}
    const speak=turn.confidence<0.8?"I didn’t hear that clearly. Please repeat the amount and asset.":next.status==="READ_QUERY"&&typeof wallet==="string"&&wallet?await deterministicRead(wallet as `0x${string}`):turn.spokenResponse;
    return NextResponse.json({ conversationId, speak, requiresResponse: turn.requiresUserResponse, state: next.status, plan: next.pendingPlan, resolvedActions, transcript:turn.transcript });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process this voice turn";
    const unavailable = /not configured|returned no structured output|timed out|timeout|RPC/i.test(message);
    return NextResponse.json({ error: error instanceof AuthError?message:unavailable?"A required service is temporarily unavailable":message }, { status: error instanceof AuthError?401:unavailable ? 503 : 500 });
  }
}
