import { NextResponse } from "next/server";
import { encodeFunctionData } from "viem";
import { testnetDeployments } from "@/lib/deployments";
import { errorResponse,requireUser } from "@/lib/auth";
const abi=[{type:"function",name:"revokeSession",stateMutability:"nonpayable",inputs:[],outputs:[]}] as const;
export async function POST(request:Request){try{await requireUser(request);return NextResponse.json({to:testnetDeployments.sessionAccount,data:encodeFunctionData({abi,functionName:"revokeSession"}),message:"Submit this transaction with the demo owner wallet."});}catch(error){return errorResponse(error,"Unable to prepare revocation");}}
