import type { Address } from "viem";

export type Token = { symbol: string; name: string; decimals: number; address: Address | null; native: boolean };

const registry = {
  OKB: { symbol: "OKB", name: "OKB", decimals: 18, address: null, native: true },
  TETH: { symbol: "TETH", name: "Vox Test Ether", decimals: 18, address: "0x61ae26d50f87eed5403a6be8f173f4da55c99bcf", native: false },
  TUSDC: { symbol: "TUSDC", name: "Vox Test USD Coin", decimals: 6, address: "0xc286b5ddba9ceed6a295d432f1aae16418b93bac", native: false },
} as const satisfies Record<string, Token>;

export function resolveToken(symbol: string): Token {
  const token = registry[symbol.toUpperCase() as keyof typeof registry];
  if (!token) throw new Error(`Unsupported token: ${symbol}`);
  return token;
}

export function supportedTokens(): Token[] {
  return Object.values(registry);
}
