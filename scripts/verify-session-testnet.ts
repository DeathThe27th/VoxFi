import "../src/lib/load-env";
import { createPublicClient, createWalletClient, encodeAbiParameters, encodeFunctionData, getAddress, http, keccak256, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xLayerTestnet, rpcUrl } from "../src/lib/chain";
import { testnetDeployments } from "../src/lib/deployments";
import { compile } from "./contract-utils";

const ownerRaw=process.env.VOX_DEV_WALLET_PRIVATE_KEY; const sessionRaw=process.env.VOX_SESSION_PRIVATE_KEY;
if(!ownerRaw||!sessionRaw)throw new Error("Test owner/session signer is not configured");
const owner=privateKeyToAccount(`0x${ownerRaw.replace(/^0x/,"")}`); const session=privateKeyToAccount(`0x${sessionRaw.replace(/^0x/,"")}`);
const transport=http(rpcUrl); const publicClient=createPublicClient({chain:xLayerTestnet,transport}); const wallet=createWalletClient({account:owner,chain:xLayerTestnet,transport});
const sessionAbi=compile("VoxSessionAccount.sol","VoxSessionAccount").abi; const tokenAbi=compile("VoxTestToken.sol","VoxTestToken").abi; const ammAbi=compile("VoxTestnetAMM.sol","VoxTestnetAMM").abi;
const smart=getAddress(testnetDeployments.sessionAccount); const token=getAddress(testnetDeployments.tEth); const amm=getAddress(testnetDeployments.amm);
const swapSelector=encodeFunctionData({abi:ammAbi,functionName:"swapExact",args:[token,1n,0n,owner.address]}).slice(0,10) as `0x${string}`;

async function write(address:`0x${string}`,abi:unknown[],functionName:string,args:unknown[]){const hash=await wallet.writeContract({address,abi,functionName,args} as never);const receipt=await publicClient.waitForTransactionReceipt({hash});if(receipt.status!=="success")throw new Error(`${functionName} reverted: ${hash}`);return hash;}
async function sessionSignature(target:`0x${string}`,value:bigint,data:`0x${string}`){const nonce=await publicClient.readContract({address:smart,abi:sessionAbi,functionName:"nonce"}) as bigint;const payload=keccak256(encodeAbiParameters([{type:"uint256"},{type:"address"},{type:"address"},{type:"uint256"},{type:"bytes32"},{type:"uint256"}],[BigInt(xLayerTestnet.id),smart,target,value,keccak256(data),nonce]));return session.signMessage({message:{raw:payload}});}
function split(signature:`0x${string}`){return {r:`0x${signature.slice(2,66)}` as `0x${string}`,s:`0x${signature.slice(66,130)}` as `0x${string}`,v:parseInt(signature.slice(130,132),16)};}
async function expectPolicyReject(label:string,target:`0x${string}`,value:bigint,data:`0x${string}`){const sig=split(await sessionSignature(target,value,data));try{await publicClient.simulateContract({account:owner,address:smart,abi:sessionAbi,functionName:"executeSession",args:[target,value,data,sig.v,sig.r,sig.s]});throw new Error(`${label} unexpectedly passed`);}catch(error){if(error instanceof Error&&error.message.includes("unexpectedly passed"))throw error;console.log(`${label}: rejected as required`);}}

async function main(){
  const mintHash=await write(token,tokenAbi,"mint",[smart,parseEther("10")]);
  const approveData=encodeFunctionData({abi:tokenAbi,functionName:"approve",args:[amm,2n**256n-1n]});
  const approveHash=await write(smart,sessionAbi,"executeOwner",[token,0n,approveData]);
  const now=BigInt(Math.floor(Date.now()/1000)); const configureHash=await write(smart,sessionAbi,"configureSession",[session.address,amm,swapSelector,now+3600n,0n,0n]);
  const expected=await publicClient.readContract({address:amm,abi:ammAbi,functionName:"quote",args:[token,parseEther("1")]}) as bigint;
  const swapData=encodeFunctionData({abi:ammAbi,functionName:"swapExact",args:[token,parseEther("1"),expected*99n/100n,owner.address]});
  const allowedSig=split(await sessionSignature(amm,0n,swapData)); const allowedHash=await write(smart,sessionAbi,"executeSession",[amm,0n,swapData,allowedSig.v,allowedSig.r,allowedSig.s]);
  await expectPolicyReject("over-limit call",amm,1n,swapData);
  await expectPolicyReject("disallowed target",token,0n,swapData);
  await expectPolicyReject("disallowed function",amm,0n,approveData);
  const chainNow=(await publicClient.getBlock()).timestamp;
  const shortHash=await write(smart,sessionAbi,"configureSession",[session.address,amm,swapSelector,chainNow+10n,0n,0n]);
  await new Promise(resolve=>setTimeout(resolve,12000)); await publicClient.waitForTransactionReceipt({hash:await wallet.sendTransaction({to:owner.address,value:0n})});
  await expectPolicyReject("expired session",amm,0n,swapData);
  const reconfigureHash=await write(smart,sessionAbi,"configureSession",[session.address,amm,swapSelector,(await publicClient.getBlock()).timestamp+3600n,0n,0n]);
  const revokeHash=await write(smart,sessionAbi,"revokeSession",[]); await expectPolicyReject("revoked session",amm,0n,swapData);
  const recoverData=encodeFunctionData({abi:tokenAbi,functionName:"transfer",args:[owner.address,parseEther("0.1")]}); const recoveryHash=await write(smart,sessionAbi,"executeOwner",[token,0n,recoverData]);
  console.log("SESSION_TEST_EVIDENCE",JSON.stringify({mintHash,approveHash,configureHash,allowedHash,shortHash,reconfigureHash,revokeHash,recoveryHash}));
}
main().catch(error=>{console.error(error instanceof Error?error.message:"Session test failed");process.exitCode=1;});
