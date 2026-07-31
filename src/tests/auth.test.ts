import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { db } from '../config/data-source';

// Email dùng riêng cho test để tránh xung đột với data thật
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'password123';

// Dọn dẹp user test sau khi chạy xong
afterAll(async () => {
  await db('users').where({ email: TEST_EMAIL }).delete();
});

// ─────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────
describe('POST /auth/register', () => {
  // TC-01: Happy path – Đăng ký thành công
  it('TC-01: Đăng ký thành công → 201', async () => {
    const res = await request(app).post('/auth/register').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user).not.toHaveProperty('password'); // Không lộ password
  });

  // TC-02: Thiếu email → 400
  it('TC-02: Thiếu email → 400', async () => {
    const res = await request(app).post('/auth/register').send({
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // TC-03: Email sai format → 400
  it('TC-03: Email sai format → 400', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'not-a-valid-email',
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/email/i);
  });

  // TC-04: Password quá ngắn (< 6 ký tự) → 400
  it('TC-04: Password quá ngắn → 400', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'valid@example.com',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/password/i);
  });

  // TC-05: Email đã tồn tại → 404 hoặc 409
  it('TC-05: Email đã tồn tại → 404 hoặc 409', async () => {
    const res = await request(app).post('/auth/register').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect([404, 409]).toContain(res.status);
    expect(res.body).toHaveProperty('error');
  });
});

// ─────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────
describe('POST /auth/login', () => {
  // TC-06: Happy path – Đăng nhập thành công
  it('TC-06: Đăng nhập thành công → 200 + access_token', async () => {
    const res = await request(app).post('/auth/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('user');
    expect(typeof res.body.access_token).toBe('string');
  });

  // TC-07: Thiếu password → 400
  it('TC-07: Thiếu password → 400', async () => {
    const res = await request(app).post('/auth/login').send({
      email: TEST_EMAIL,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // TC-08: Email sai format → 400
  it('TC-08: Email sai format khi login → 400', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'bad-email',
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // TC-09: Sai mật khẩu → 401
  it('TC-09: Sai mật khẩu → 401', async () => {
    const res = await request(app).post('/auth/login').send({
      email: TEST_EMAIL,
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
