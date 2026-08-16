import fs from "node:fs";
import path from "node:path";
import solc from "solc";

export function compile(contractFile: string, contractName: string) {
  const source = fs.readFileSync(path.join(process.cwd(), "contracts", contractFile), "utf8");
  const input = { language: "Solidity", sources: { [contractFile]: { content: source } }, settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } } };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors?.filter((e: { severity: string }) => e.severity === "error") ?? [];
  if (errors.length) throw new Error(errors.map((e: { formattedMessage: string }) => e.formattedMessage).join("\n"));
  const result = output.contracts[contractFile][contractName];
  return { abi: result.abi, bytecode: `0x${result.evm.bytecode.object}` as `0x${string}` };
}
