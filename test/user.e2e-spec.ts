import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/users (POST)', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        id: 'test-user-1',
        name: 'Test User',
        biography: 'Test biography',
        category: 'influencer'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBe('test-user-1');
        expect(res.body.name).toBe('Test User');
      });
  });

  it('/users/:id (GET)', () => {
    return request(app.getHttpServer())
      .get('/users/test-user-1')
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
