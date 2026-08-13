import { UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";

type JwksClient = ReturnType<typeof jwksRsa>;

export interface AccessTokenPayload {
  sub: string;
  email?: string;
  activeHouseholdId?: string;
  householdIds?: string[];
}

let jwksClient: JwksClient | null = null;

function getJwksClient(): JwksClient | null {
  const domain = process.env.AUTH0_DOMAIN?.trim();
  if (!domain) return null;
  if (!jwksClient) {
    jwksClient = jwksRsa({
      jwksUri: `https://${domain}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  return jwksClient;
}

/**
 * Auth0 RS256 (JWKS) is the product auth path.
 * HS256 `JWT_SECRET` is a dev-only fallback for curl/scripts when
 * `ALLOW_DEV_JWT=true` — not a login UI path.
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === "string") {
    throw new UnauthorizedException("Invalid or expired token");
  }

  if (decoded.header.alg === "RS256") {
    return verifyRs256(token, decoded.header.kid);
  }

  return verifyHs256(token);
}

async function verifyRs256(
  token: string,
  kid: string | undefined
): Promise<AccessTokenPayload> {
  const domain = process.env.AUTH0_DOMAIN?.trim();
  const audience = process.env.AUTH0_AUDIENCE?.trim();
  const client = getJwksClient();
  if (!domain || !audience || !client || !kid) {
    throw new UnauthorizedException("Invalid or expired token");
  }

  try {
    const key = await client.getSigningKey(kid);
    const payload = jwt.verify(token, key.getPublicKey(), {
      algorithms: ["RS256"],
      audience,
      issuer: [`https://${domain}/`, `https://${domain}`],
    });
    return payload as AccessTokenPayload;
  } catch (err) {
    if (err instanceof UnauthorizedException) throw err;
    throw new UnauthorizedException("Invalid or expired token");
  }
}

function allowDevHs256(): boolean {
  return process.env.ALLOW_DEV_JWT === "true";
}

function verifyHs256(token: string): AccessTokenPayload {
  if (!allowDevHs256()) {
    throw new UnauthorizedException("Invalid or expired token");
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new UnauthorizedException(
      "JWT_SECRET is not configured — cannot verify tokens"
    );
  }
  try {
    return jwt.verify(token, secret) as AccessTokenPayload;
  } catch {
    throw new UnauthorizedException("Invalid or expired token");
  }
}
