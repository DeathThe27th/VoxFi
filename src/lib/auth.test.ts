import { describe,expect,it,vi } from "vitest";
vi.mock("server-only",()=>({}));

describe("API authentication",()=>{
  it("rejects a request without a bearer token",async()=>{
    const {AuthError,requireUser}=await import("./auth");
    await expect(requireUser(new Request("http://localhost/api/activity"))).rejects.toBeInstanceOf(AuthError);
  });
});
