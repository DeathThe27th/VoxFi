import { describe, expect, it } from "vitest";
import { resolveToken } from "./tokens";
describe("token registry",()=>{
  it("resolves supported symbols deterministically",()=>expect(resolveToken("okb").native).toBe(true));
  it("never guesses an unsupported address",()=>expect(()=>resolveToken("USDC")).toThrow("Unsupported token"));
});
