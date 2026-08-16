import { describe, expect, it } from "vitest";
import { parseEther } from "viem";
import { ensureSpendable, resolveAmount } from "./amounts";

describe("deterministic amounts",()=>{
  it("calculates exact amounts",()=>expect(resolveAmount({type:"exact",value:"0.1"},parseEther("1"),18)).toBe(parseEther("0.1")));
  it("calculates percentage without floats",()=>expect(resolveAmount({type:"percentage",value:"25"},1000n,18)).toBe(250n));
  it("requires a price for USD",()=>expect(()=>resolveAmount({type:"usd",value:"50"},1000n,18)).toThrow("reliable USD price"));
  it("preserves a gas reserve",()=>expect(()=>ensureSpendable(950n,1000n,100n)).toThrow("Insufficient"));
});
