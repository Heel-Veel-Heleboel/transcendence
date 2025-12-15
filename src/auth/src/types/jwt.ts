export interface JwtConfig {
  privateKey: string;
  publicKey: string;
  refreshKey: string,
  expirationAccessToken: string;
  expirationRefreshToken: string;
  algorithm: string;
}