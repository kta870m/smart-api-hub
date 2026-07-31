import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart API Hub',
      version: '1.0.0',
      description:
        'A dynamic REST API that auto-generates CRUD endpoints from a JSON schema. Built with Node.js, Express, TypeScript, Knex, and PostgreSQL.',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local Development' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token từ endpoint /auth/login',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Thông báo lỗi chi tiết' },
          },
        },
        RegisterBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 6, example: 'password123' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Đăng nhập thành công' },
            access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          description: 'Kiểm tra trạng thái server và kết nối database.',
          responses: {
            200: {
              description: 'Server và DB đang hoạt động',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                      database: { type: 'string', example: 'connected' },
                    },
                  },
                },
              },
            },
            503: { description: 'DB mất kết nối' },
          },
        },
      },
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Đăng ký tài khoản mới',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterBody' },
              },
            },
          },
          responses: {
            201: { description: 'Đăng ký thành công' },
            400: {
              description: 'Validation thất bại (email sai, password quá ngắn...)',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            409: {
              description: 'Email đã tồn tại',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Đăng nhập, nhận JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginBody' },
              },
            },
          },
          responses: {
            200: {
              description: 'Đăng nhập thành công',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
            },
            400: {
              description: 'Validation thất bại',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            401: {
              description: 'Sai email hoặc mật khẩu',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
      },
      '/{resource}': {
        get: {
          tags: ['CRUD'],
          summary: 'Lấy danh sách bản ghi',
          parameters: [
            { name: 'resource', in: 'path', required: true, schema: { type: 'string' }, description: 'Tên bảng (vd: users, products, categories)', example: 'products' },
            { name: '_page', in: 'query', schema: { type: 'integer' }, description: 'Số trang' },
            { name: '_limit', in: 'query', schema: { type: 'integer' }, description: 'Số bản ghi mỗi trang' },
            { name: '_sort', in: 'query', schema: { type: 'string' }, description: 'Cột sắp xếp' },
            { name: '_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] }, description: 'Chiều sắp xếp' },
            { name: '_fields', in: 'query', schema: { type: 'string' }, description: 'Chọn cột (vd: id,name)' },
            { name: '_expand', in: 'query', schema: { type: 'string' }, description: 'Expand quan hệ cha' },
            { name: '_embed', in: 'query', schema: { type: 'string' }, description: 'Embed quan hệ con' },
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Full-text search' },
          ],
          responses: {
            200: { description: 'Danh sách bản ghi', headers: { 'X-Total-Count': { schema: { type: 'integer' }, description: 'Tổng số bản ghi' } } },
            400: { description: 'Resource không hợp lệ', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
        post: {
          tags: ['CRUD'],
          summary: 'Tạo bản ghi mới (cần JWT)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'resource', in: 'path', required: true, schema: { type: 'string' }, example: 'products' },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', example: { title: 'Sản phẩm mới', price: 99000 } },
              },
            },
          },
          responses: {
            201: { description: 'Tạo thành công' },
            400: { description: 'Body rỗng hoặc resource không hợp lệ', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            401: { description: 'Chưa xác thực', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/{resource}/{id}': {
        get: {
          tags: ['CRUD'],
          summary: 'Lấy bản ghi theo ID',
          parameters: [
            { name: 'resource', in: 'path', required: true, schema: { type: 'string' }, example: 'products' },
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Bản ghi tìm thấy' },
            404: { description: 'Không tìm thấy', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
        put: {
          tags: ['CRUD'],
          summary: 'Cập nhật toàn bộ bản ghi – PUT (cần JWT)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'resource', in: 'path', required: true, schema: { type: 'string' }, example: 'products' },
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', example: { title: 'Tên mới', price: 200000 } } } },
          },
          responses: {
            200: { description: 'Cập nhật thành công' },
            400: { description: 'Validation lỗi' },
            401: { description: 'Chưa xác thực' },
            404: { description: 'Không tìm thấy' },
          },
        },
        patch: {
          tags: ['CRUD'],
          summary: 'Cập nhật một phần bản ghi – PATCH (cần JWT)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'resource', in: 'path', required: true, schema: { type: 'string' }, example: 'products' },
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', example: { price: 150000 } } } },
          },
          responses: {
            200: { description: 'Cập nhật thành công' },
            401: { description: 'Chưa xác thực' },
            404: { description: 'Không tìm thấy' },
          },
        },
        delete: {
          tags: ['CRUD'],
          summary: 'Xóa bản ghi (cần JWT + role Admin)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'resource', in: 'path', required: true, schema: { type: 'string' }, example: 'products' },
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Xóa thành công' },
            401: { description: 'Chưa xác thực' },
            403: { description: 'Không đủ quyền (chỉ Admin)' },
            404: { description: 'Không tìm thấy' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
