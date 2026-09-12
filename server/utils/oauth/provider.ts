/**
 * Contract every OAuth provider must implement
 *
 * To add a new provider (eg. GitHub, Facebook, Discord, ...):
 * 1. Create a file in `server/utils/oauth/` exporting an `OAuthProvider`.
 * 2. Register it in `server/utils/oauth/index.ts`.
 * 3. Add the matching `*_CLIENT_ID` / `*_CLIENT_SECRET` env vars to
 *    `server/utils/env.ts` and `.env.example`.
 */

/**
 * Thrown when a refresh token is invalid/revoked.
 * The client must re-run the authorization flow to obtain a new refresh token.
 */
export class OAuthRefreshTokenError extends Error {
  constructor(
    message = "Refresh token is invalid or expired, re-authentication required",
  ) {
    super(message);
    this.name = "OAuthRefreshTokenError";
  }
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  idToken?: string;
  scope?: string;
}

export interface OAuthUserInfo {
  providerId: string;
  email: string;
  name: string;
  image?: string;
  emailVerified: boolean;
}

export interface OAuthProvider {
  /** Unique identifier used in the URL, e.g. "google". */
  id: string;

  /** Human readable name, e.g. "Google". */
  name: string;

  /**
   * Build the provider authorization URL (PKCE).
   * The client starts the flow by redirecting the user here.
   */
  getAuthorizationUrl(state: string, codeChallenge: string): string;

  /**
   * Exchange the authorization `code` for tokens, using the PKCE
   * `codeVerifier` that was used to build the authorization URL.
   */
  exchangeCode(code: string, codeVerifier: string): Promise<OAuthTokens>;

  /**
   * Get a new access token from a refresh token once the current one is
   * expired. Providers may also rotate the refresh token in the response.
   */
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;

  /**
   * Get a new refresh token once the current one is invalid.
   * Throws `OAuthRefreshTokenError` when re-authentication is required.
   */
  refreshRefreshToken(refreshToken: string): Promise<OAuthTokens>;

  /** Fetch the authenticated user's profile with the access token. */
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
}
