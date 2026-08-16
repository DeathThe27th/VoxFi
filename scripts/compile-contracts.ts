import { compile } from "./contract-utils";

for (const [file, name] of [["VoxSessionAccount.sol","VoxSessionAccount"],["VoxTestToken.sol","VoxTestToken"],["VoxTestnetAMM.sol","VoxTestnetAMM"]]) {
  const artifact = compile(file, name);
  console.log(`${name}: ${artifact.bytecode.length / 2 - 1} byte deployment payload, ${artifact.abi.length} ABI entries`);
}
