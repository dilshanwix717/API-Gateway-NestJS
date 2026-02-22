import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { AppModule } from '../../src/app.module.js';

const describeIf = process.env['RUN_E2E'] === 'true' ? describe : describe.skip;

describeIf('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/auth/login with invalid body should return 400', () => {
    return request(app.getHttpServer() as Server)
      .post('/v1/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  it('POST /v1/auth/signup with missing fields should return 400', () => {
    return request(app.getHttpServer() as Server)
      .post('/v1/auth/signup')
      .send({ email: 'test@test.com' })
      .expect(400);
  });
});
