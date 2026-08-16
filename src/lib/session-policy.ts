export type SessionPolicy = { target: `0x${string}`; selector: `0x${string}`; expiresAt: number; maxValuePerCall: bigint; totalValueLimit: bigint; totalValueUsed: bigint; revoked: boolean };
export type ProposedCall = { target: `0x${string}`; data: `0x${string}`; value: bigint; now: number };

export function validateSessionCall(policy: SessionPolicy, call: ProposedCall): void {
  if (policy.revoked) throw new Error("Session revoked");
  if (call.now > policy.expiresAt) throw new Error("Session expired");
  if (call.target.toLowerCase() !== policy.target.toLowerCase()) throw new Error("Target not allowed");
  if (call.data.slice(0, 10).toLowerCase() !== policy.selector.toLowerCase()) throw new Error("Function not allowed");
  if (call.value > policy.maxValuePerCall) throw new Error("Per-call limit exceeded");
  if (policy.totalValueUsed + call.value > policy.totalValueLimit) throw new Error("Session limit exceeded");
}
