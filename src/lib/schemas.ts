import { z } from "zod";

export const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address");
export const decimalSchema = z.string().regex(/^\d+(\.\d+)?$/, "Expected a positive decimal");

export const amountSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("exact"), value: decimalSchema }),
  z.object({ type: z.literal("usd"), value: decimalSchema }),
  z.object({ type: z.literal("percentage"), value: decimalSchema.refine((v) => Number(v) > 0 && Number(v) <= 100) }),
  z.object({ type: z.literal("target_output"), value: decimalSchema }),
]);

export const swapActionSchema = z.object({
  type: z.literal("swap"),
  tokenIn: z.string().min(1).max(12).transform((v) => v.toUpperCase()),
  tokenOut: z.string().min(1).max(12).transform((v) => v.toUpperCase()),
  amount: amountSchema,
});

export const transferActionSchema = z.object({
  type: z.literal("transfer"),
  token: z.string().min(1).max(12).transform((v) => v.toUpperCase()),
  amount: decimalSchema,
  recipient: addressSchema,
});

export const actionSchema = z.discriminatedUnion("type", [swapActionSchema, transferActionSchema]);
export const planSchema = z.object({
  id: z.string().uuid(),
  actions: z.array(actionSchema).min(1).max(4),
  expiresAt: z.string().datetime(),
  revision: z.number().int().nonnegative(),
});

export const turnTypeSchema = z.enum(["read", "create_plan", "modify_plan", "confirm", "cancel", "clarify"]);
export const agentTurnSchema = z.object({
  turnType: turnTypeSchema,
  transcript: z.string().min(1),
  spokenResponse: z.string().min(1),
  requiresUserResponse: z.boolean(),
  actions: z.array(actionSchema).max(4).optional(),
  confidence: z.number().min(0).max(1),
});

export const voiceTurnResponseSchema = z.object({
  conversationId: z.string().uuid(),
  speak: z.string(),
  requiresResponse: z.boolean(),
  state: z.enum(["IDLE", "NEEDS_CLARIFICATION", "READ_QUERY", "AWAITING_CONFIRMATION", "APPROVED", "CANCELLED", "FAILED"]),
  plan: planSchema.nullable(),
});

export type Action = z.infer<typeof actionSchema>;
export type Plan = z.infer<typeof planSchema>;
export type AgentTurn = z.infer<typeof agentTurnSchema>;
