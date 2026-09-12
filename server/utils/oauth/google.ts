import { HTTPError } from "nitro";
import { env } from "~/server/utils/env";
import {
  OAuthRefreshTokenError,
  type OAuthProvider,
  type OAuthTokens,
  type OAuthUserInfo,
} from "./provider";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

/** Shared refresh flow: exchange a refresh token for new tokens. */
async function refreshTokens(refreshToken: string): Promise<OAuthTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.error === "invalid_grant") {
      throw new OAuthRefreshTokenError();
    }
    throw new HTTPError("Failed to refresh access token with Google", {
      status: 400,
    });
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessTokenExpiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
    idToken: data.id_token,
    scope: data.scope,
  };
}

export const googleProvider: OAuthProvider = {
  id: "google",
  name: "Google",

  getAuthorizationUrl(state, codeChallenge): string {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${env.APP_URL}/api/oauth/callback/google`,
      response_type: "code",
      scope: "openid profile email",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    });
    return `${AUTHORIZE_URL}?${params}`;
  },

  async exchangeCode(code, codeVerifier): Promise<OAuthTokens> {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        code,
        code_verifier: codeVerifier,
        redirect_uri: `${env.APP_URL}/api/oauth/callback/google`,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) {
      throw new HTTPError("Failed to exchange authorization code with Google", {
        status: 400,
      });
    }
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessTokenExpiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      idToken: data.id_token,
      scope: data.scope,
    };
  },

  refreshAccessToken(refreshToken) {
    return refreshTokens(refreshToken);
  },

  refreshRefreshToken(refreshToken) {
    return refreshTokens(refreshToken);
  },

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const res = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new HTTPError("Failed to fetch Google user info", { status: 400 });
    }
    const data = await res.json();
    return {
      providerId: data.sub,
      email: data.email,
      name: data.name,
      image: data.picture,
      emailVerified: data.email_verified === true,
    };
  },
};
