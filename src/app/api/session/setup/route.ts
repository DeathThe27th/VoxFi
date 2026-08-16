import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, encodeFunctionData, http, parseEther, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xLayerTestnet, rpcUrl } from "@/lib/chain";
import { testnetDeployments } from "@/lib/deployments";

const sessionAbi = [
  { type:"function",name:"configureSession",stateMutability:"nonpayable",inputs:[{name:"key",type:"address"},{name:"target",type:"address"},{name:"selector",type:"bytes4"},{name:"expiry",type:"uint48"},{name:"perCall",type:"uint96"},{name:"total",type:"uint96"}],outputs:[] },
  { type:"function",name:"executeOwner",stateMutability:"nonpayable",inputs:[{name:"target",type:"address"},{name:"value",type:"uint256"},{name:"data",type:"bytes"}],outputs:[{type:"bytes"}] },
  { type:"function",name:"owner",stateMutability:"view",inputs:[],outputs:[{type:"address"}] },
  { type:"function",name:"revoked",stateMutability:"view",inputs:[],outputs:[{type:"bool"}] },
  { type:"function",name:"expiresAt",stateMutability:"view",inputs:[],outputs:[{type:"uint48"}] },
] as const;
const tokenAbi = [
  { type:"function",name:"mint",stateMutability:"nonpayable",inputs:[{name:"to",type:"address"},{name:"amount",type:"uint256"}],outputs:[] },
  { type:"function",name:"approve",stateMutability:"nonpayable",inputs:[{name:"spender",type:"address"},{name:"amount",type:"uint256"}],outputs:[{type:"bool"}] },
  { type:"function",name:"allowance",stateMutability:"view",inputs:[{name:"owner",type:"address"},{name:"spender",type:"address"}],outputs:[{type:"uint256"}] },
  { type:"function",name:"balanceOf",stateMutability:"view",inputs:[{name:"account",type:"address"}],outputs:[{type:"uint256"}] },
] as const;
const ammAbi = [{ type:"function",name:"swapExact",stateMutability:"nonpayable",inputs:[{name:"tokenIn",type:"address"},{name:"amountIn",type:"uint256"},{name:"minOut",type:"uint256"},{name:"recipient",type:"address"}],outputs:[{type:"uint256"}] }] as const;

function sessionAccount() {
  const raw=process.env.VOX_SESSION_PRIVATE_KEY;
  if(!raw) throw new Error("Session signer is not configured");
  return privateKeyToAccount(`0x${raw.replace(/^0x/,"")}`);
}

export async function GET() {
  try {
    const client=createPublicClient({chain:xLayerTestnet,transport:http(rpcUrl)});
    const [owner,revoked,expiresAt,tEthAllowance,tUsdcAllowance]=await Promise.all([
      client.readContract({address:testnetDeployments.sessionAccount,abi:sessionAbi,functionName:"owner"}),
      client.readContract({address:testnetDeployments.sessionAccount,abi:sessionAbi,functionName:"revoked"}),
      client.readContract({address:testnetDeployments.sessionAccount,abi:sessionAbi,functionName:"expiresAt"}),
      client.readContract({address:testnetDeployments.tEth,abi:tokenAbi,functionName:"allowance",args:[testnetDeployments.sessionAccount,testnetDeployments.amm]}),
      client.readContract({address:testnetDeployments.tUsdc,abi:tokenAbi,functionName:"allowance",args:[testnetDeployments.sessionAccount,testnetDeployments.amm]}),
    ]);
    const selector=encodeFunctionData({abi:ammAbi,functionName:"swapExact",args:[testnetDeployments.tEth,1n,0n,owner]}).slice(0,10) as `0x${string}`;
    const configureData=encodeFunctionData({abi:sessionAbi,functionName:"configureSession",args:[sessionAccount().address,testnetDeployments.amm,selector,Math.floor(Date.now()/1000)+86400,0n,0n]});
    const transactions:Array<{label:string;description:string;to:`0x${string}`;data:`0x${string}`}> = [];
    const finiteTEth=parseEther("100"),finiteTUsdc=parseUnits("300000",6);
    if(tEthAllowance<finiteTEth){const approval=encodeFunctionData({abi:tokenAbi,functionName:"approve",args:[testnetDeployments.amm,finiteTEth]});transactions.push({label:"Allow test ETH swaps",description:"A finite 100 tETH test-only allowance to the immutable Vox test AMM.",to:testnetDeployments.sessionAccount,data:encodeFunctionData({abi:sessionAbi,functionName:"executeOwner",args:[testnetDeployments.tEth,0n,approval]})});}
    if(tUsdcAllowance<finiteTUsdc){const approval=encodeFunctionData({abi:tokenAbi,functionName:"approve",args:[testnetDeployments.amm,finiteTUsdc]});transactions.push({label:"Allow test USDC swaps",description:"A finite 300,000 tUSDC test-only allowance to the immutable Vox test AMM.",to:testnetDeployments.sessionAccount,data:encodeFunctionData({abi:sessionAbi,functionName:"executeOwner",args:[testnetDeployments.tUsdc,0n,approval]})});}
    transactions.push({label:"Authorize Vox session",description:"Authorize the separate Vox session key for AMM swaps only, expiring in 24 hours.",to:testnetDeployments.sessionAccount,data:configureData});
    return NextResponse.json({chainId:xLayerTestnet.id,owner,smartAccount:testnetDeployments.sessionAccount,sessionAddress:sessionAccount().address,revoked,expiresAt:Number(expiresAt),transactions});
  } catch(error) { return NextResponse.json({error:error instanceof Error?error.message:"Session setup failed"},{status:500}); }
}

export async function POST() {
  try {
    const raw=process.env.VOX_DEV_WALLET_PRIVATE_KEY;
    if(!raw) throw new Error("Development relayer not configured");
    const account=privateKeyToAccount(`0x${raw.replace(/^0x/,"")}`); const transport=http(rpcUrl);
    const wallet=createWalletClient({account,chain:xLayerTestnet,transport}); const client=createPublicClient({chain:xLayerTestnet,transport}); const hashes=[];
    for(const [address,target] of [[testnetDeployments.tEth,parseEther("10")],[testnetDeployments.tUsdc,parseUnits("30000",6)]] as const) {
      const balance=await client.readContract({address,abi:tokenAbi,functionName:"balanceOf",args:[testnetDeployments.sessionAccount]});if(balance>=target)continue;const amount=target-balance;
      const hash=await wallet.writeContract({address,abi:tokenAbi,functionName:"mint",args:[testnetDeployments.sessionAccount,amount]}); const receipt=await client.waitForTransactionReceipt({hash});if(receipt.status!=="success")throw new Error(`Test-asset funding reverted: ${hash}`);hashes.push(hash);
    }
    return NextResponse.json({funded:true,hashes});
  } catch(error) { return NextResponse.json({error:error instanceof Error?error.message:"Funding failed"},{status:500}); }
}
