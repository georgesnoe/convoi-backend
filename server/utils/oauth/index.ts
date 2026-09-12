import { googleProvider } from "./google";
import type { OAuthProvider } from "./provider";

export {
  OAuthRefreshTokenError,
  type OAuthProvider,
  type OAuthTokens,
  type OAuthUserInfo,
} from "./provider";
export { generatePkce, type PkcePair } from "./pkce";

/**
 * Registry of all available OAuth providers.
 * Add new providers here to expose them at `/api/oauth/callback/[provider]`.
 */
export const oauthProviders: Record<string, OAuthProvider> = {
  google: googleProvider,
};
