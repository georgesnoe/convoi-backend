import { createHash, randomBytes } from "crypto";

export interface PkcePair {
  verifier: string;
  challenge: string;
}

/**
 * Generate a PKCE (RFC 7636) verifier/challenge pair.
 * The client keeps the `verifier` secret and sends the `challenge`
 * in the authorization URL (`code_challenge`).
 */
export function generatePkce(): PkcePair {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}
