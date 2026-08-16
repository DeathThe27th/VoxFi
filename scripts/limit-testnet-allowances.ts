import "../src/lib/load-env";
import { createPublicClient,createWalletClient,encodeFunctionData,http,parseEther,parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { rpcUrl,xLayerTestnet } from "../src/lib/chain";
import { testnetDeployments } from "../src/lib/deployments";
import { compile } from "./contract-utils";

const tokenAbi=[{type:"function",name:"approve",stateMutability:"nonpayable",inputs:[{type:"address"},{type:"uint256"}],outputs:[{type:"bool"}]}] as const;
async function main(){const raw=process.env.VOX_DEV_WALLET_PRIVATE_KEY;if(!raw)throw new Error("Development owner missing");const owner=privateKeyToAccount(`0x${raw.replace(/^0x/,"")}`),transport=http(rpcUrl),wallet=createWalletClient({account:owner,chain:xLayerTestnet,transport}),client=createPublicClient({chain:xLayerTestnet,transport}),accountAbi=compile("VoxSessionAccount.sol","VoxSessionAccount").abi;const hashes=[];for(const[token,amount]of[[testnetDeployments.tEth,parseEther("100")],[testnetDeployments.tUsdc,parseUnits("300000",6)]]as const){const approval=encodeFunctionData({abi:tokenAbi,functionName:"approve",args:[testnetDeployments.amm,amount]});const hash=await wallet.writeContract({address:testnetDeployments.sessionAccount,abi:accountAbi,functionName:"executeOwner",args:[token,0n,approval]});const receipt=await client.waitForTransactionReceipt({hash});if(receipt.status!=="success")throw new Error(`Allowance reduction reverted: ${hash}`);hashes.push(hash)}console.log("FINITE_ALLOWANCE_EVIDENCE",JSON.stringify({hashes}));}
main().catch(error=>{console.error(error instanceof Error?error.message:"Allowance migration failed");process.exitCode=1});
