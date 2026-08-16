import "../src/lib/load-env";
import { createPublicClient, createWalletClient, http, parseEther, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xLayerTestnet, rpcUrl } from "../src/lib/chain";
import { compile } from "./contract-utils";

const rawKey = process.env.VOX_DEV_WALLET_PRIVATE_KEY;
const expectedAddress = process.env.VOX_DEV_WALLET_ADDRESS;
if (!rawKey || !expectedAddress) throw new Error("Development wallet environment is incomplete");
const account = privateKeyToAccount((rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`);
if (account.address.toLowerCase() !== expectedAddress.toLowerCase()) throw new Error("Development private key does not match VOX_DEV_WALLET_ADDRESS");
const transport = http(rpcUrl); const publicClient = createPublicClient({ chain: xLayerTestnet, transport });
const wallet = createWalletClient({ account, chain: xLayerTestnet, transport });

async function deploy(file:string,name:string,args:readonly unknown[]=[]){
  const artifact=compile(file,name); const hash=await wallet.deployContract({abi:artifact.abi,bytecode:artifact.bytecode,args});
  const receipt=await publicClient.waitForTransactionReceipt({hash}); if(receipt.status!=="success"||!receipt.contractAddress)throw new Error(`${name} deployment failed: ${hash}`);
  console.log(`${name}: ${receipt.contractAddress} tx ${hash}`); return {address:receipt.contractAddress,abi:artifact.abi};
}

async function main() {
const balance=await publicClient.getBalance({address:account.address});
if(balance<parseEther("0.01"))throw new Error("Development wallet needs at least 0.01 testnet OKB for deployment");
const tEth=await deploy("VoxTestToken.sol","VoxTestToken",["Vox Test Ether","tETH",18]);
const tUsdc=await deploy("VoxTestToken.sol","VoxTestToken",["Vox Test USD Coin","tUSDC",6]);
const amm=await deploy("VoxTestnetAMM.sol","VoxTestnetAMM",[tEth.address,tUsdc.address]);
await publicClient.waitForTransactionReceipt({hash:await wallet.writeContract({address:tEth.address,abi:tEth.abi,functionName:"mint",args:[account.address,parseEther("100")]})});
await publicClient.waitForTransactionReceipt({hash:await wallet.writeContract({address:tUsdc.address,abi:tUsdc.abi,functionName:"mint",args:[account.address,parseUnits("300000",6)]})});
await publicClient.waitForTransactionReceipt({hash:await wallet.writeContract({address:tEth.address,abi:tEth.abi,functionName:"transfer",args:[amm.address,parseEther("50")]})});
await publicClient.waitForTransactionReceipt({hash:await wallet.writeContract({address:tUsdc.address,abi:tUsdc.abi,functionName:"transfer",args:[amm.address,parseUnits("150000",6)]})});
await deploy("VoxSessionAccount.sol","VoxSessionAccount",[account.address]);
console.log("Real testnet contracts deployed. Save the printed public addresses and hashes; no secrets were logged.");
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Deployment failed"); process.exitCode = 1; });
