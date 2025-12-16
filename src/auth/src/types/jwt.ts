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