import { NextResponse } from "next/server";
import { createPublicClient, formatEther, formatUnits, http } from "viem";
import { addressSchema } from "@/lib/schemas";
import { rpcUrl, xLayerTestnet } from "@/lib/chain";
import { testnetDeployments } from "@/lib/deployments";
const erc20=[{type:"function",name:"balanceOf",stateMutability:"view",inputs:[{name:"account",type:"address"}],outputs:[{type:"uint256"}]}] as const;
const amm=[{type:"function",name:"reserves",stateMutability:"view",inputs:[],outputs:[{type:"uint256"},{type:"uint256"}]}] as const;

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  const parsed = addressSchema.safeParse(address);
  if (!parsed.success) return NextResponse.json({ error: "A valid wallet address is required" }, { status: 400 });
  try {
    const client = createPublicClient({ chain: xLayerTestnet, transport: http(rpcUrl) });
    const account=parsed.data as `0x${string}`;
    const [balance,tEth,tUsdc,reserves] = await Promise.all([client.getBalance({address:account}),client.readContract({address:testnetDeployments.tEth,abi:erc20,functionName:"balanceOf",args:[account]}),client.readContract({address:testnetDeployments.tUsdc,abi:erc20,functionName:"balanceOf",args:[account]}),client.readContract({address:testnetDeployments.amm,abi:amm,functionName:"reserves"})]);
    const tEthDisplay=Number(formatUnits(tEth,18)),tUsdcDisplay=Number(formatUnits(tUsdc,6));const testEthPrice=Number(formatUnits(reserves[1],6))/Number(formatUnits(reserves[0],18));const estimatedTestUsd=tUsdcDisplay+tEthDisplay*testEthPrice;
    return NextResponse.json({ chainId: xLayerTestnet.id, address: parsed.data, estimatedTestUsd:estimatedTestUsd.toFixed(2),priceSource:"Vox Testnet AMM reserves",balances: [{ symbol: "OKB", raw: balance.toString(), formatted: formatEther(balance) },{symbol:"TETH",raw:tEth.toString(),formatted:formatUnits(tEth,18)},{symbol:"TUSDC",raw:tUsdc.toString(),formatted:formatUnits(tUsdc,6)}] });
  } catch { return NextResponse.json({ error: "X Layer Testnet RPC is unavailable" }, { status: 503 }); }
}
