import { createPublicClient,createWalletClient,encodeAbiParameters,http,keccak256,parseSignature } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xLayerTestnet,rpcUrl } from "./chain";
import { testnetDeployments } from "./deployments";
import { resolveAndQuote,type ResolvedAction } from "./execution";
import type { Plan } from "./schemas";
import { addActivity } from "./store";

const abi=[{type:"function",name:"nonce",stateMutability:"view",inputs:[],outputs:[{type:"uint256"}]},{type:"function",name:"revoked",stateMutability:"view",inputs:[],outputs:[{type:"bool"}]},{type:"function",name:"expiresAt",stateMutability:"view",inputs:[],outputs:[{type:"uint48"}]},{type:"function",name:"allowedTarget",stateMutability:"view",inputs:[],outputs:[{type:"address"}]},{type:"function",name:"allowedSelector",stateMutability:"view",inputs:[],outputs:[{type:"bytes4"}]},{type:"function",name:"executeSession",stateMutability:"nonpayable",inputs:[{name:"target",type:"address"},{name:"value",type:"uint256"},{name:"data",type:"bytes"},{name:"v",type:"uint8"},{name:"r",type:"bytes32"},{name:"s",type:"bytes32"}],outputs:[{type:"bytes"}]}] as const;
function key(name:string){const raw=process.env[name];if(!raw)throw new Error(`${name} is not configured`);return `0x${raw.replace(/^0x/,"")}` as `0x${string}`;}
export async function executeApprovedPlan(plan:Plan,conversationId:string,smartAccount:`0x${string}`){
  if(smartAccount.toLowerCase()!==testnetDeployments.sessionAccount.toLowerCase())throw new Error("This MVP session signer is authorized only for the deployed Vox demo smart account");
  const session=privateKeyToAccount(key("VOX_SESSION_PRIVATE_KEY"));const relayer=privateKeyToAccount(key("VOX_DEV_WALLET_PRIVATE_KEY"));const transport=http(rpcUrl);const client=createPublicClient({chain:xLayerTestnet,transport});const wallet=createWalletClient({account:relayer,chain:xLayerTestnet,transport});
  const [revoked,expiresAt,allowedTarget,allowedSelector]=await Promise.all([client.readContract({address:smartAccount,abi,functionName:"revoked"}),client.readContract({address:smartAccount,abi,functionName:"expiresAt"}),client.readContract({address:smartAccount,abi,functionName:"allowedTarget"}),client.readContract({address:smartAccount,abi,functionName:"allowedSelector"})]);
  if(revoked)throw new Error("Vox access is revoked. Re-authorize the session in Settings.");if(expiresAt<=(await client.getBlock()).timestamp)throw new Error("Vox session expired. Re-authorize it in Settings.");
  const completed:Array<{action:ResolvedAction;hash:`0x${string}`}> = [];
  for(const sourceAction of plan.actions){const action=await resolveAndQuote(sourceAction,smartAccount);if(action.type!=="swap")throw new Error("Transfers require owner-wallet authorization in this MVP");if(action.target.toLowerCase()!==allowedTarget.toLowerCase()||action.calldata.slice(0,10).toLowerCase()!==allowedSelector.toLowerCase())throw new Error("Smart-session policy rejected this route");
    const nonce=await client.readContract({address:smartAccount,abi,functionName:"nonce"});const payload=keccak256(encodeAbiParameters([{type:"uint256"},{type:"address"},{type:"address"},{type:"uint256"},{type:"bytes32"},{type:"uint256"}],[BigInt(xLayerTestnet.id),smartAccount,action.target,0n,keccak256(action.calldata),nonce]));const sig=parseSignature(await session.signMessage({message:{raw:payload}}));if(sig.v===undefined)throw new Error("Invalid session signature");
    const request=(await client.simulateContract({account:relayer,address:smartAccount,abi,functionName:"executeSession",args:[action.target,0n,action.calldata,Number(sig.v),sig.r,sig.s]})).request;const hash=await wallet.writeContract(request);const receipt=await client.waitForTransactionReceipt({hash});if(receipt.status!=="success")throw new Error(`Transaction reverted: ${hash}`);completed.push({action,hash});addActivity({id:crypto.randomUUID(),conversationId,type:"swap",summary:`${action.amountIn} ${action.tokenIn} → ${action.expectedOut} ${action.tokenOut}`,status:"confirmed",timestamp:new Date().toISOString(),transactionHash:hash});
  }return completed;
}
