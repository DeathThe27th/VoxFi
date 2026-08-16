import { formatUnits, parseUnits } from "viem";
import type { z } from "zod";
import type { amountSchema } from "./schemas";

type Amount = z.infer<typeof amountSchema>;

export function resolveAmount(amount: Amount, balance: bigint, decimals: number, usdPrice?: number): bigint {
  if (amount.type === "exact") return parseUnits(amount.value, decimals);
  if (amount.type === "percentage") return (balance * BigInt(Math.round(Number(amount.value) * 100))) / 10_000n;
  if (amount.type === "usd") {
    if (!usdPrice || usdPrice <= 0) throw new Error("A reliable USD price is required");
    return parseUnits((Number(amount.value) / usdPrice).toFixed(decimals), decimals);
  }
  throw new Error("Target-output amounts require a provider quote");
}

export function ensureSpendable(amount: bigint, balance: bigint, reserve = 0n): void {
  if (amount <= 0n) throw new Error("Amount must be greater than zero");
  if (amount + reserve > balance) throw new Error(`Insufficient balance: ${formatUnits(balance, 18)} available`);
}
