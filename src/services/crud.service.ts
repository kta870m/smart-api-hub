import { record } from 'zod';
import { db } from '../config/data-source';
import { schemaService } from './schema.service';
import { table } from 'node:console';

export interface QueryOptions {
  _page?: number;
  _limit?: number;
  _sort?: string;
  _order?: 'asc' | 'desc';
  _fields?: string[];
  _expand?: string[];
  _embed?: string[];
  q?: string;
  filters?: Record<string, any>;

}

export class CrudService {
  // Query N + 1 expand parent
  private async handleExpand(tableName: string, records: any[], embedTarget: string[]){
    if(!records || records.length === 0 || !embedTarget.length) return;

    for(const target of embedTarget){
      const rel = schemaService.findForeignKeyTo(tableName, target);
      if(!rel) return;

      //Gom id cua bang cha thanh 1 mang duy nhat
      const parentIds = Array.from(
        new Set(records.map((r) => r[rel.fkColumn]).filter(Boolean))
      );

      if(parentIds.length === 0) continue;

      //Chay duy nhat 1 query Batch
      const parents = await db(rel.parentTable).whereIn(rel.parentColumn, parentIds);
      const parentMap = new Map();
      parents.forEach((p) => parentMap.set(p[rel.parentColumn], p));
      
      records.forEach((record) => {
        const parentObj = parentMap.get(record[rel.fkColumn]) || null;
        record[target] = parentObj;
      });
    }
  }

  //Query N + 1 expand child
  private async handleEmbed(tableName: string, records: any[],embedTargets: string[]){
    if(!records || records.length === 0 || !embedTargets.length) return;

    for(const target of embedTargets){
      const rel = schemaService.findForeginKeyFrom(target, tableName);
      if(!rel) continue;

      //Group Id in an array
      const parentIds = Array.from(
        new Set(records.map((r) => r[rel.parentColumn]).filter(Boolean))
      );

      if(parentIds.length === 0) continue;

      //Lay du lieu con
      const children = await db(rel.childTable).whereIn(rel.fkColumn, parentIds);

      const childGroupMap = new Map<any, any[]>();
      children.forEach((c) => {
        const key = c[rel.fkColumn];
        if(!childGroupMap.has(key)){
            childGroupMap.set(key, []);
        }
        childGroupMap.get(key)!.push(c);
      });

      records.forEach((record) => {
        const childrenList = childGroupMap.get(record[rel.parentColumn]) || [];
        record[target] = childrenList;
      })
    }
  }


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

    if(options._expand && options._expand.length > 0){
      await this.handleExpand(tableName, data, options._expand);
    }
    if(options._embed && options._embed.length > 0){
      await this.handleEmbed(tableName,data,options._embed);
    }

    return {
      data,
      totalCount
    };
  }

  // GET BY ID
  async findById(tableName: string, id: string, options: {_expand?: string[], _embed?: string[]} = {}) {
    const record = await db(tableName).where({id}).first();
    if(!record) return null;

    const data = [record];
    if(options._expand && options._expand.length > 0){
      await this.handleExpand(tableName, data, options._expand);
    }
    if(options._embed && options._embed.length > 0){
      await this.handleEmbed(tableName, data, options._embed);
    }

    return data[0];
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