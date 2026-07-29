import { db } from '../config/data-source';
import { schemaService } from './schema.service';

export class CrudService {
  // 1. GET ALL (Hỗ trợ _fields)
  async findAll(tableName: string, fields?: string[]) {
    const validColumns = schemaService.getValidColumns(tableName);
    let selectedFields = validColumns;

    // Lọc whitelist các cột người dùng muốn lấy
    if (fields && fields.length > 0) {
      selectedFields = fields.filter((f) => validColumns.includes(f));
      if (selectedFields.length === 0) {
        selectedFields = validColumns;
      }
    }

    return await db(tableName).select(selectedFields);
  }

  // 2. GET BY ID
  async findById(tableName: string, id: string) {
    return await db(tableName).where({ id }).first();
  }

  // 3. POST (Create)
  async create(tableName: string, data: Record<string, any>) {
    const validColumns = schemaService.getValidColumns(tableName);
    const filteredData: Record<string, any> = {};

    // Chỉ lấy các field nằm trong schema
    for (const key of Object.keys(data)) {
      if (validColumns.includes(key)) {
        filteredData[key] = data[key];
      }
    }

    const [createdRecord] = await db(tableName).insert(filteredData).returning('*');
    return createdRecord;
  }

  // 4. PUT (Full Update) - Ghi đè toàn bộ dữ liệu ngoại trừ ID
  async updatePut(tableName: string, id: string, data: Record<string, any>) {
    const tableDef = schemaService.getTableDef(tableName);
    if (!tableDef) return null;

    const validColumns = schemaService.getValidColumns(tableName);
    const updateData: Record<string, any> = {};

    // Đối với PUT: Các cột không được truyền lên sẽ set null (trừ id và created_at)
    for (const col of tableDef.columns) {
      if (col.name === 'id' || col.name === 'created_at') continue;

      if (col.name === 'updated_at') {
        updateData.updated_at = new Date();
      } else if (data[col.name] !== undefined) {
        updateData[col.name] = data[col.name];
      } else {
        updateData[col.name] = null;
      }
    }

    const [updatedRecord] = await db(tableName).where({ id }).update(updateData).returning('*');
    return updatedRecord || null;
  }

  // 5. PATCH (Partial Update) - Chỉ cập nhật các field được gửi lên
  async updatePatch(tableName: string, id: string, data: Record<string, any>) {
    const validColumns = schemaService.getValidColumns(tableName);
    const updateData: Record<string, any> = {};

    for (const key of Object.keys(data)) {
      if (validColumns.includes(key) && key !== 'id') {
        updateData[key] = data[key];
      }
    }

    // Tự động update updated_at nếu bảng có cột này
    if (validColumns.includes('updated_at')) {
      updateData.updated_at = new Date();
    }

    const [updatedRecord] = await db(tableName).where({ id }).update(updateData).returning('*');
    return updatedRecord || null;
  }

  // 6. DELETE
  async delete(tableName: string, id: string) {
    const deletedCount = await db(tableName).where({ id }).del();
    return deletedCount > 0;
  }
}

export const crudService = new CrudService();