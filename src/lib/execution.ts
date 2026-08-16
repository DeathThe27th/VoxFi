import { createPublicClient,encodeFunctionData,formatUnits,http,parseUnits } from "viem";
import type { Address,Hex } from "viem";
import { rpcUrl,xLayerTestnet } from "./chain";
import { resolveToken } from "./tokens";
import type { Action } from "./schemas";
import { VoxTestnetAmmProvider } from "./swap-provider";
import { testnetDeployments } from "./deployments";

const erc20=[{type:"function",name:"balanceOf",stateMutability:"view",inputs:[{name:"account",type:"address"}],outputs:[{type:"uint256"}]}] as const;
const ammReserves=[{type:"function",name:"reserves",stateMutability:"view",inputs:[],outputs:[{type:"uint256"},{type:"uint256"}]}] as const;
export type ResolvedAction={type:"swap";tokenIn:string;tokenOut:string;amountIn:string;amountInRaw:string;expectedOut:string;expectedOutRaw:string;minimumOut:string;minimumOutRaw:string;provider:string;target:Address;calldata:Hex;expiresAt:number;network:string}|{type:"transfer";token:string;amount:string;recipient:Address;authorization:"owner_required";ownerTransaction:{to:Address;data:Hex;value:"0x0"}};

export async function resolveAndQuote(action:Action,smartAccount:Address):Promise<ResolvedAction>{
  if(action.type==="transfer"){
    const token=resolveToken(action.token);const amount=parseUnits(action.amount,token.decimals);const client=createPublicClient({chain:xLayerTestnet,transport:http(rpcUrl)});let target:Address,data:Hex,value:bigint;
    if(token.native){const balance=await client.getBalance({address:smartAccount});if(amount>balance)throw new Error("Insufficient OKB balance");target=action.recipient as Address;data="0x";value=amount;}
    else{if(!token.address)throw new Error("Unsupported transfer token");const balance=await client.readContract({address:token.address,abi:erc20,functionName:"balanceOf",args:[smartAccount]});if(amount>balance)throw new Error(`Insufficient ${token.symbol} balance`);target=token.address;data=encodeFunctionData({abi:[{type:"function",name:"transfer",stateMutability:"nonpayable",inputs:[{type:"address"},{type:"uint256"}],outputs:[{type:"bool"}]}] as const,functionName:"transfer",args:[action.recipient as Address,amount]});value=0n;}
    const ownerData=encodeFunctionData({abi:[{type:"function",name:"executeOwner",stateMutability:"nonpayable",inputs:[{type:"address"},{type:"uint256"},{type:"bytes"}],outputs:[{type:"bytes"}]}] as const,functionName:"executeOwner",args:[target,value,data]});return{type:"transfer",token:token.symbol,amount:action.amount,recipient:action.recipient as Address,authorization:"owner_required",ownerTransaction:{to:smartAccount,data:ownerData,value:"0x0"}};
  }
  const tokenIn=resolveToken(action.tokenIn),tokenOut=resolveToken(action.tokenOut);
  if(!tokenIn.address||!tokenOut.address)throw new Error("Testnet swaps support TETH and TUSDC; native OKB swaps are unavailable");
  const client=createPublicClient({chain:xLayerTestnet,transport:http(rpcUrl)});
  const balance=await client.readContract({address:tokenIn.address,abi:erc20,functionName:"balanceOf",args:[smartAccount]});
  let amountIn:bigint;
  if(action.amount.type==="exact")amountIn=parseUnits(action.amount.value,tokenIn.decimals);
  else if(action.amount.type==="percentage")amountIn=balance*BigInt(Math.round(Number(action.amount.value)*100))/10_000n;
  else if(action.amount.type==="usd"){
    if(tokenIn.symbol==="TUSDC")amountIn=parseUnits(action.amount.value,6);
    else {const unit=10n**BigInt(tokenIn.decimals);const unitQuote=await new VoxTestnetAmmProvider().getQuote({tokenIn:tokenIn.address,tokenOut:tokenOut.address,amountIn:unit,recipient:smartAccount,slippageBps:100});const dollarsPerToken=Number(formatUnits(unitQuote.expectedOut,tokenOut.decimals));if(!dollarsPerToken)throw new Error("USD price unavailable");amountIn=parseUnits((Number(action.amount.value)/dollarsPerToken).toFixed(tokenIn.decimals),tokenIn.decimals);}
  } else {
    const desired=parseUnits(action.amount.value,tokenOut.decimals);const [r0,r1]=await client.readContract({address:testnetDeployments.amm,abi:ammReserves,functionName:"reserves"});
    const inIs0=tokenIn.symbol==="TETH";const reserveIn=inIs0?r0:r1,reserveOut=inIs0?r1:r0;if(desired<=0n||desired>=reserveOut)throw new Error("Target output exceeds available liquidity");
    amountIn=(reserveIn*desired*1000n)/((reserveOut-desired)*997n)+1n;
  }
  if(amountIn<=0n)throw new Error("Amount must be greater than zero"); if(amountIn>balance)throw new Error(`Insufficient ${tokenIn.symbol} balance`);
  const prepared=await new VoxTestnetAmmProvider().buildSwap({tokenIn:tokenIn.address,tokenOut:tokenOut.address,amountIn,recipient:smartAccount,slippageBps:100});
  return{type:"swap",tokenIn:tokenIn.symbol,tokenOut:tokenOut.symbol,amountIn:formatUnits(amountIn,tokenIn.decimals),amountInRaw:amountIn.toString(),expectedOut:formatUnits(prepared.expectedOut,tokenOut.decimals),expectedOutRaw:prepared.expectedOut.toString(),minimumOut:formatUnits(prepared.minimumOut,tokenOut.decimals),minimumOutRaw:prepared.minimumOut.toString(),provider:prepared.provider,target:prepared.target,calldata:prepared.calldata,expiresAt:prepared.expiresAt,network:xLayerTestnet.name};
}
