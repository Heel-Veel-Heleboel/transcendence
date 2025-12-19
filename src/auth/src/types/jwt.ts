export interface JwtConfigShape {
  privateKey: string;
  publicKey: string;
  expirationAccessToken: string;
  expirationRefreshToken: string;
  algorithm: string;
}

export interface JwtPayLoadShape {
  sub: number;
  user_email: string;
  jti: string;
};

export  interface DecodedJwtPayload extends JwtPayLoadShape {
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  nbf?: number;
}