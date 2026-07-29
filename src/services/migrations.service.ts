import fs from 'fs';
import path from 'path';
import { db } from '../config/data-source';

interface ColumnDef {
  name: string;
  type: 'string' | 'number' | 'text' | 'boolean' | 'uuid' | 'timestamp' | 'enum';
  primary?: boolean;
  unique?: boolean;
  nullable?: boolean;
  default?: string;
  values?: string[];
  foreignKey?: {
    table: string;
    column: string;
    onDelete?: string;
  };
}

interface TableDef {
  name: string;
  columns: ColumnDef[];
}

interface SchemaDef {
  tables: TableDef[];
}

export async function runAutoMigration(): Promise<void> {
  const schemaPath = path.resolve(process.cwd(), 'schema.json');
  if (!fs.existsSync(schemaPath)) {
    throw new Error('File schema.json không tồn tại ở thư mục gốc!');
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const schema: SchemaDef = JSON.parse(schemaContent);

  // Đảm bảo Postgres hỗ trợ pgcrypto để sinh UUID ngẫu nhiên
  await db.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  for (const table of schema.tables) {
    const exists = await db.schema.hasTable(table.name);

    if (!exists) {
      await db.schema.createTable(table.name, (tableBuilder) => {
        for (const col of table.columns) {
          let colBuilder;

          // 1. Áp dụng kiểu dữ liệu với Knex Builder
          switch (col.type) {
            case 'uuid':
              colBuilder = tableBuilder.uuid(col.name);
              break;
            case 'string':
              colBuilder = tableBuilder.string(col.name, 255);
              break;
            case 'number':
              colBuilder = tableBuilder.decimal(col.name, 14, 2);
              break;
            case 'text':
              colBuilder = tableBuilder.text(col.name);
              break;
            case 'boolean':
              colBuilder = tableBuilder.boolean(col.name);
              break;
            case 'timestamp':
              colBuilder = tableBuilder.timestamp(col.name, { useTz: true });
              break;
            case 'enum':
              colBuilder = tableBuilder.enum(col.name, col.values || []);
              break;
            default:
              colBuilder = tableBuilder.string(col.name, 255);
          }

          // 2. Khóa chính (Primary Key)
          if (col.primary) {
            colBuilder.primary();
          }

          // 3. Nullable
          if (col.nullable === false) {
            colBuilder.notNullable();
          } else if (col.nullable === true) {
            colBuilder.nullable();
          }

          // 4. Unique Constraint
          if (col.unique) {
            colBuilder.unique();
          }

          // 5. Giá trị mặc định (Default Value)
          if (col.default) {
            if (col.default === 'gen_random_uuid()') {
              colBuilder.defaultTo(db.raw('gen_random_uuid()'));
            } else if (col.default === 'CURRENT_TIMESTAMP') {
              colBuilder.defaultTo(db.fn.now());
            } else {
              colBuilder.defaultTo(db.raw(col.default));
            }
          }

          // 6. Khóa ngoại (Foreign Key)
          if (col.foreignKey) {
            const fk = colBuilder.references(col.foreignKey.column).inTable(col.foreignKey.table);
            if (col.foreignKey.onDelete) {
              fk.onDelete(col.foreignKey.onDelete);
            }
          }
        }
      });
      console.log(`[Auto-Migration] Bảng "${table.name}" đã tạo thành công qua Knex.`);
    } else {
      console.log(`[Auto-Migration] Bảng "${table.name}" đã tồn tại, bỏ qua.`);
    }
  }

  
}