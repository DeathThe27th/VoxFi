import "server-only";
import { PrivyClient } from "@privy-io/server-auth";

export type AuthenticatedUser = { id: string };

let client: PrivyClient | undefined;

function privyClient() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Privy server authentication is not configured");
  return (client ??= new PrivyClient(appId, appSecret, { timeout: 8_000 }));
}

export async function requireUser(request: Request): Promise<AuthenticatedUser> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new AuthError("Authentication required");
  try {
    const claims = await privyClient().verifyAuthToken(header.slice(7));
    return { id: claims.userId };
  } catch {
    throw new AuthError("Invalid or expired authentication");
  }
}

export class AuthError extends Error {
  readonly status = 401;
}

export function errorResponse(error: unknown, fallback: string) {
  const status = error instanceof AuthError ? error.status : 400;
  const message = error instanceof AuthError ? error.message : fallback;
  return Response.json({ error: message }, { status });
}
