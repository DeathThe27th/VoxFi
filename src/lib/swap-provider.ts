import { createPublicClient, encodeFunctionData, http } from "viem";
import type { Address, Hex } from "viem";
import { xLayerTestnet, rpcUrl } from "./chain";
import { testnetDeployments } from "./deployments";
import { createHmac } from "node:crypto";
import { z } from "zod";

export type SwapRequest={tokenIn:Address;tokenOut:Address;amountIn:bigint;recipient:Address;slippageBps:number};
export type SwapQuote={provider:string;amountIn:bigint;expectedOut:bigint;minimumOut:bigint;expiresAt:number};
export type PreparedSwap=SwapQuote&{target:Address;calldata:Hex;value:bigint};
export interface SwapProvider{getQuote(request:SwapRequest):Promise<SwapQuote>;buildSwap(request:SwapRequest):Promise<PreparedSwap>}
const abi=[{type:"function",name:"quote",stateMutability:"view",inputs:[{name:"tokenIn",type:"address"},{name:"amountIn",type:"uint256"}],outputs:[{name:"amountOut",type:"uint256"}]},{type:"function",name:"swapExact",stateMutability:"nonpayable",inputs:[{name:"tokenIn",type:"address"},{name:"amountIn",type:"uint256"},{name:"minOut",type:"uint256"},{name:"recipient",type:"address"}],outputs:[{name:"amountOut",type:"uint256"}]}] as const;

export class VoxTestnetAmmProvider implements SwapProvider{
  readonly name="Vox Testnet AMM";
  async getQuote(r:SwapRequest):Promise<SwapQuote>{
    if(r.slippageBps<1||r.slippageBps>1000)throw new Error("Slippage must be between 0.01% and 10%");
    const client=createPublicClient({chain:xLayerTestnet,transport:http(rpcUrl)});
    const expectedOut=await client.readContract({address:testnetDeployments.amm,abi,functionName:"quote",args:[r.tokenIn,r.amountIn]});
    return{provider:this.name,amountIn:r.amountIn,expectedOut,minimumOut:expectedOut*BigInt(10_000-r.slippageBps)/10_000n,expiresAt:Date.now()+30_000};
  }
  async buildSwap(r:SwapRequest):Promise<PreparedSwap>{const q=await this.getQuote(r);return{...q,target:testnetDeployments.amm,value:0n,calldata:encodeFunctionData({abi,functionName:"swapExact",args:[r.tokenIn,r.amountIn,q.minimumOut,r.recipient]})};}
}

export class OkxSwapProvider implements SwapProvider{
  constructor(private readonly chainIndex="196"){}
  private async request(path:"quote"|"swap",r:SwapRequest){
    if(this.chainIndex==="1952")throw new Error("OKX DEX routing is not verified for X Layer Testnet (chain 1952)");
    const apiKey=process.env.OKX_API_KEY,secret=process.env.OKX_SECRET_KEY,passphrase=process.env.OKX_API_PASSPHRASE;
    if(!apiKey||!secret||!passphrase)throw new Error("OKX server credentials are incomplete");
    const params=new URLSearchParams({chainIndex:this.chainIndex,fromTokenAddress:r.tokenIn,toTokenAddress:r.tokenOut,amount:r.amountIn.toString(),swapMode:"exactIn",slippagePercent:(r.slippageBps/100).toString()});if(path==="swap")params.set("userWalletAddress",r.recipient);
    const requestPath=`/api/v6/dex/aggregator/${path}`;const query=`?${params.toString()}`;const timestamp=new Date().toISOString();const signature=createHmac("sha256",secret).update(timestamp+"GET"+requestPath+query).digest("base64");
    const response=await fetch(`https://web3.okx.com${requestPath}${query}`,{headers:{"OK-ACCESS-KEY":apiKey,"OK-ACCESS-SIGN":signature,"OK-ACCESS-PASSPHRASE":passphrase,"OK-ACCESS-TIMESTAMP":timestamp}});if(!response.ok)throw new Error(`OKX DEX HTTP ${response.status}`);const body=z.object({code:z.string(),msg:z.string().optional(),data:z.array(z.record(z.string(),z.unknown()))}).parse(await response.json());if(body.code!=="0"||!body.data[0])throw new Error(`OKX DEX: ${body.msg??body.code}`);return body.data[0];
  }
  async getQuote(r:SwapRequest):Promise<SwapQuote>{const data=await this.request("quote",r);const expectedOut=BigInt(String(data.toTokenAmount??data.toTokenAmountWithoutFee??"0"));if(expectedOut<=0n)throw new Error("OKX returned an invalid output amount");return{provider:"OKX DEX",amountIn:r.amountIn,expectedOut,minimumOut:expectedOut*BigInt(10_000-r.slippageBps)/10_000n,expiresAt:Date.now()+30_000};}
  async buildSwap(r:SwapRequest):Promise<PreparedSwap>{const data=await this.request("swap",r);const router=z.object({to:z.string().regex(/^0x[a-fA-F0-9]{40}$/),data:z.string().regex(/^0x[a-fA-F0-9]*$/),value:z.string(),gasLimit:z.string().optional()}).parse(data.tx);const result=data.routerResult as Record<string,unknown>|undefined;const expectedOut=BigInt(String(result?.toTokenAmount??"0"));if(expectedOut<=0n)throw new Error("OKX returned invalid swap data");return{provider:"OKX DEX",amountIn:r.amountIn,expectedOut,minimumOut:expectedOut*BigInt(10_000-r.slippageBps)/10_000n,expiresAt:Date.now()+30_000,target:router.to as Address,calldata:router.data as Hex,value:BigInt(router.value)};}
}
