import "../src/lib/load-env";
import { createPublicClient,createWalletClient,encodeFunctionData,http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xLayerTestnet,rpcUrl } from "../src/lib/chain";
import { testnetDeployments } from "../src/lib/deployments";
import { executeApprovedPlan } from "../src/lib/session-executor";
import type { Plan } from "../src/lib/schemas";
import { compile } from "./contract-utils";

async function main(){
  const ownerRaw=process.env.VOX_DEV_WALLET_PRIVATE_KEY,sessionRaw=process.env.VOX_SESSION_PRIVATE_KEY;if(!ownerRaw||!sessionRaw)throw new Error("Signer configuration missing");
  const owner=privateKeyToAccount(`0x${ownerRaw.replace(/^0x/,"")}`),session=privateKeyToAccount(`0x${sessionRaw.replace(/^0x/,"")}`);const transport=http(rpcUrl),client=createPublicClient({chain:xLayerTestnet,transport}),wallet=createWalletClient({account:owner,chain:xLayerTestnet,transport});
  const accountAbi=compile("VoxSessionAccount.sol","VoxSessionAccount").abi,ammAbi=compile("VoxTestnetAMM.sol","VoxTestnetAMM").abi;
  const selector=encodeFunctionData({abi:ammAbi,functionName:"swapExact",args:[testnetDeployments.tEth,1n,0n,owner.address]}).slice(0,10) as `0x${string}`;
  const expiry=(await client.getBlock()).timestamp+86400n;const configureHash=await wallet.writeContract({address:testnetDeployments.sessionAccount,abi:accountAbi,functionName:"configureSession",args:[session.address,testnetDeployments.amm,selector,expiry,0n,0n]});const configured=await client.waitForTransactionReceipt({hash:configureHash});if(configured.status!=="success")throw new Error(`Session configuration reverted: ${configureHash}`);
  const plan:Plan={id:crypto.randomUUID(),revision:0,expiresAt:new Date(Date.now()+120000).toISOString(),actions:[{type:"swap",tokenIn:"TETH",tokenOut:"TUSDC",amount:{type:"exact",value:"0.1"}}]};
  const results=await executeApprovedPlan(plan,crypto.randomUUID(),testnetDeployments.sessionAccount);console.log("EXECUTION_ENGINE_EVIDENCE",JSON.stringify({configureHash,transactionHashes:results.map(r=>r.hash)}));
}
main().catch(error=>{console.error(error instanceof Error?error.message:"Execution verification failed");process.exitCode=1});
