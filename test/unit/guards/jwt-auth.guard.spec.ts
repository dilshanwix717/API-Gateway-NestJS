import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'node:crypto';
import { JwtAuthGuard } from '../../../src/cross-cutting/guards/jwt-auth.guard.js';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

function createMockContext(authHeader?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: authHeader },
      }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    const configService = {
      get: jest.fn().mockReturnValue({
        jwt: { publicKey },
      }),
    } as unknown as ConfigService;

    guard = new JwtAuthGuard(reflector, configService);
  });

  it('should allow public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject missing authorization header', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject invalid token format', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext('InvalidToken');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should accept valid token', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = jwt.sign(
      { sub: 'user-1', email: 'test@test.com', roles: ['user'], permissions: [] },
      privateKey,
      { algorithm: 'RS256', expiresIn: '1h' },
    );
    const context = createMockContext(`Bearer ${token}`);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject expired token', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = jwt.sign(
      { sub: 'user-1', email: 'test@test.com', roles: ['user'], permissions: [] },
      privateKey,
      { algorithm: 'RS256', expiresIn: '-1s' },
    );
    const context = createMockContext(`Bearer ${token}`);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject token signed with wrong key', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { privateKey: wrongKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const token = jwt.sign(
      { sub: 'user-1', email: 'test@test.com', roles: ['user'], permissions: [] },
      wrongKey,
      { algorithm: 'RS256' },
    );
    const context = createMockContext(`Bearer ${token}`);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
