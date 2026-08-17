import { describe,expect,it } from "vitest";
import { getQuote,saveQuote } from "./quotes";

describe("confirmed quotes",()=>{
  it("requires the same owner and revision",()=>{
    const planId=crypto.randomUUID();
    saveQuote({ownerId:"user-a",planId,revision:2,actions:[],createdAt:Date.now()});
    expect(getQuote(planId,"user-a",2)).toBeDefined();
    expect(getQuote(planId,"user-b",2)).toBeUndefined();
    expect(getQuote(planId,"user-a",3)).toBeUndefined();
  });
});
