import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Same Tracker Auth0 Application as apps/web; AUTH0_BASE_URL is :3002 here.
 */
export const auth0 = new Auth0Client({
  appBaseUrl: process.env.AUTH0_BASE_URL ?? process.env.APP_BASE_URL,
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
