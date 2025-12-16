export interface JwtConfigShape {
  privateKey: string;
  publicKey: string;
  refreshKey: string,
  expirationAccessToken: string;
  expirationRefreshToken: string;
  algorithm: string;
}

export interface PayLoadShape {
  sub: number;
  userEmail: string;
  jti: string;
};


export  interface DecodedJwtPayload extends PayLoadShape {
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  nbf?: number;
}