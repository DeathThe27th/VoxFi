import { NextResponse } from "next/server";
import { encodeFunctionData } from "viem";
import { testnetDeployments } from "@/lib/deployments";
const abi=[{type:"function",name:"revokeSession",stateMutability:"nonpayable",inputs:[],outputs:[]}] as const;
export async function POST(){return NextResponse.json({to:testnetDeployments.sessionAccount,data:encodeFunctionData({abi,functionName:"revokeSession"}),message:"Submit this transaction with the owner wallet."});}
