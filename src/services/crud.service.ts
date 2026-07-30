import { db } from '../config/data-source';
import { schemaService } from './schema.service';

export interface QueryOptions {
  _page?: number;
  _limit?: number;
  _sort?: string;
  _order?: 'asc' | 'desc';
  _fields?: string[];
  q?: string;
  filters?: Record<string, any>;

}

export class CrudService {
  // GET ALL (Hỗ trợ _fields)
  async findAll(tableName: string, options: QueryOptions = {}) {
    const validColumns = schemaService.getValidColumns(tableName);
    const tableDef = schemaService.getTableDef(tableName);

    //Filter By _field
    let selectedFields = validColumns;
    if(options._fields && options._fields.length > 0){
      selectedFields = options._fields.filter((f) => validColumns.includes(f));
      if(selectedFields.length === 0) selectedFields = validColumns;
    }

    const query = db(tableName);

    //_Filtering (_gte, _lte, _ne, _like, & exact match)
    if(options.filters){
      for(const [key, rawValue] of Object.entries(options.filters)){
        if(rawValue == undefined || rawValue === '') continue;

        let field = key;
        let operator = '=';
        let val = rawValue;

        if(key.endsWith('_gte')){
          field = key.slice(0, -4);
          operator = '>=';
        }else if(key.endsWith('_lte')){
          field = key.slice(0, -4);
          operator = '<=';
        }else if(key.endsWith('_ne')){
          field = key.slice(0, -3);
          operator = "<>";
        }else if(key.endsWith("_like")){
          field = key.slice(0, -5);
          operator = 'ILIKE';
          val = `%${rawValue}%`;
        }

        //Lay cot chi thuoc whitelist
        if(validColumns.includes(field)){
          query.where(field, operator, val);
        }
      }
    }

    if(options.q && tableDef){
      const textColumns = tableDef.columns.filter((col) => ['string','text','enum'].includes(col.type))
      .map((col) => col.name);

      if(textColumns.length > 0){
        const keyword = `%${options.q}%`;
        query.where((builder) => {
          textColumns.forEach((col, index) => {
            if(index === 0){
              builder.where(col, 'ILIKE', keyword);
            }else{
              builder.orWhere(col, 'ILIKE', keyword);
            }
          });
        });
      }
    }

    //Dem so ban ghi khop truoc khi phan trang
    const countResult = await query.clone().count('* as total').first();
    const totalCount = countResult ? parseInt(countResult.total as string, 10) : 0;
    
    if(options._sort && validColumns.includes(options._sort)){
      const order = options._order?.toLowerCase() === 'desc' ? 'desc' : 'asc';
      query.orderBy(options._sort, order);
    }

    //Pagination
    if(options._limit){
      const limit = Math.max(1, options._limit);
      const page = options._page ? Math.max(1, options._page) : 1;
      const offset = (page - 1) * limit;

      query.limit(limit).offset(offset);
    }

    const data = await query.select(selectedFields);

    return {
      data,
      totalCount
    };
  }

  // GET BY ID
  async findById(tableName: string, id: string) {
    return await db(tableName).where({ id }).first();
  }

  // POST (Create)
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

  // PUT (Full Update) - Ghi đè toàn bộ dữ liệu ngoại trừ ID
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

  // PATCH (Partial Update) - Chỉ cập nhật các field được gửi lên
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

  // DELETE
  async delete(tableName: string, id: string) {
    const deletedCount = await db(tableName).where({ id }).del();
    return deletedCount > 0;
  }
}

export const crudService = new CrudService();