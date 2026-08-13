import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Shared Tracker Auth0 Application (web :3000 + capture :3002).
 * Callbacks stay on /api/auth/* to match the Application settings.
 */
export const auth0 = new Auth0Client({
  appBaseUrl: process.env.AUTH0_BASE_URL ?? process.env.APP_BASE_URL,
  /**
   * useUser() + SWR treats 401 as an error and retries forever. 204 = no
   * session, not a failure — stops the /api/auth/profile loop.
   */
  noContentProfileResponseWhenUnauthenticated: true,
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: "openid profile email",
  },
  routes: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    callback: "/api/auth/callback",
    backChannelLogout: "/api/auth/backchannel-logout",
    profile: "/api/auth/profile",
    accessToken: "/api/auth/access-token",
  },
});
