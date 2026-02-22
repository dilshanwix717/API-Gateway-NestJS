export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  exp: number;
  iat: number;
}
