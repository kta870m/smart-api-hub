import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { db } from '../config/data-source';

// ─────────────────────────────────────────────
// Setup: Tạo user test để lấy token
// ─────────────────────────────────────────────
const CRUD_TEST_EMAIL = `crud_test_${Date.now()}@example.com`;
const CRUD_TEST_PASSWORD = 'password123';

let userToken = ''; // Token của user thường
let createdCategoryId = ''; // ID category được tạo trong TC-12

beforeAll(async () => {
  // Đăng ký user test
  await request(app).post('/auth/register').send({
    email: CRUD_TEST_EMAIL,
    password: CRUD_TEST_PASSWORD,
    role: 'user',
  });

  // Đăng nhập để lấy token
  const loginRes = await request(app).post('/auth/login').send({
    email: CRUD_TEST_EMAIL,
    password: CRUD_TEST_PASSWORD,
  });
  userToken = loginRes.body.access_token;
});

// Dọn dẹp sau test
afterAll(async () => {
  if (createdCategoryId) {
    await db('categories').where({ id: createdCategoryId }).delete();
  }
  await db('users').where({ email: CRUD_TEST_EMAIL }).delete();
});

// ─────────────────────────────────────────────
// GET /:resource
// ─────────────────────────────────────────────
describe('GET /:resource', () => {
  // TC-10: Happy path – Lấy danh sách
  it('TC-10: GET /users → 200, trả về array', async () => {
    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // TC-11: Resource không hợp lệ → 400
  it('TC-11: GET /invalid_table → 400', async () => {
    const res = await request(app).get('/invalid_table');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ─────────────────────────────────────────────
// GET /:resource/:id
// ─────────────────────────────────────────────
describe('GET /:resource/:id', () => {
  // TC-12: id không tồn tại → 404
  it('TC-12: GET /users/00000000-0000-0000-0000-000000000000 → 404', async () => {
    const res = await request(app).get('/users/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ─────────────────────────────────────────────
// POST /:resource
// ─────────────────────────────────────────────
describe('POST /:resource', () => {
  // TC-13: Không có token → 401
  it('TC-13: POST /categories không có token → 401', async () => {
    const res = await request(app).post('/categories').send({
      name: 'Test Category',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  // TC-14: Body rỗng → 400
  it('TC-14: POST /categories body rỗng → 400', async () => {
    const res = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // TC-15: Happy path – Tạo category thành công
  it('TC-15: POST /categories với token hợp lệ → 201', async () => {
    const res = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: `Test Cat ${Date.now()}` });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    createdCategoryId = res.body.id; // Lưu để cleanup
  });
});

// ─────────────────────────────────────────────
// DELETE /:resource/:id
// ─────────────────────────────────────────────
describe('DELETE /:resource/:id', () => {
  // TC-16: User thường (không phải admin) xóa → 403
  it('TC-16: DELETE /categories/:id với token user thường → 403', async () => {
    // Dùng một UUID giả – vẫn phải qua auth trước
    const res = await request(app)
      .delete('/categories/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  // TC-17: Không có token → 401
  it('TC-17: DELETE /categories/:id không có token → 401', async () => {
    const res = await request(app).delete(
      '/categories/00000000-0000-0000-0000-000000000000'
    );

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
