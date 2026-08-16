import { NextResponse } from "next/server";
import { createPublicClient,http } from "viem";
import { z } from "zod";
import { rpcUrl,xLayerTestnet } from "@/lib/chain";
const hash=z.string().regex(/^0x[a-fA-F0-9]{64}$/);
export async function GET(request:Request){const parsed=hash.safeParse(new URL(request.url).searchParams.get("hash"));if(!parsed.success)return NextResponse.json({error:"Valid transaction hash required"},{status:400});try{const client=createPublicClient({chain:xLayerTestnet,transport:http(rpcUrl)});const receipt=await client.getTransactionReceipt({hash:parsed.data as `0x${string}`});return NextResponse.json({hash:parsed.data,status:receipt.status,blockNumber:receipt.blockNumber.toString(),explorer:`${xLayerTestnet.blockExplorers.default.url}/tx/${parsed.data}`});}catch{return NextResponse.json({error:"Transaction not found"},{status:404});}}
