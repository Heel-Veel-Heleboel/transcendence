export interface JwtConfigShape {
  privateKey: string;
  publicKey: string;
  expirationAccessToken: string;
  expirationRefreshToken: string;
  algorithm: string;
}

/**
 * JWT payload shape for access and refresh tokens.
 * 
 * This interface defines the claims that are encoded in the JWT token body.
 * These claims are used to identify the user and track the token instance.
 * 
 * @property {number} sub - Subject claim. The unique identifier (user ID) of the authenticated user.
 * @property {string} user_email - The email address of the authenticated user. Used for user identification and notifications.
 * @property {string} jti - JWT ID claim. A unique identifier for this specific token instance.
 *                         Used to track individual tokens and enable token revocation/blacklisting.
 *                         
 */
export interface JwtPayLoadShape {
  sub: number;
  user_email: string;
  jti: string;
};

/**
 * A decoded JWT access token with all standard registered claims.
 * 
 * This interface extends JwtPayLoadShape with the standard JWT claims that are
 * automatically added by the jwt library during token creation and verification.
 * 
 * @extends {JwtPayLoadShape}
 * @property {number} iat - Issued At claim. Unix timestamp (seconds) when the token was created.
 * @property {number} exp - Expiration Time claim. Unix timestamp (seconds) when the token expires.
 * @property {string} iss - Issuer claim. Identifies the principal that issued the token (set to JWT_ISSUER constant).
 * @property {string} aud - Audience claim. Identifies the intended recipient of the token (set to JWT_AUDIENCE constant).
 * @property {number} [nbf] - Optional. Not Before claim. Unix timestamp (seconds) before which the token is not valid.
 */
export interface DecodedJwtPayload extends JwtPayLoadShape {
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  nbf?: number;
}
