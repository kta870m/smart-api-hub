import fs from 'fs';
import path from 'path';

export interface ColumnDef {
    name: string;
    type: string;
    primary?: boolean;
    unique?: boolean;
    nullable?: boolean;
    default?: string;
}

export interface TableDef {
    name:string;
    columns: ColumnDef[];
}

export interface SchemaDef {
    tables: TableDef[];
}

class SchemaService {
    private schema : SchemaDef | null = null;

    public getSchema(): SchemaDef {
        if(this.schema){
            const schemaPath = path.resolve(process.cwd(), 'schema.json');
            if(!fs.existsSync(schemaPath)){
                throw new Error("File schema.json không tồn tại");
            }
            const rawData = fs.readFileSync(schemaPath, 'utf-8');
            this.schema = JSON.parse(rawData);
        }

        return this.schema!;
    }
    
    public getAllowedTables():string[] {
        const schema = this.getSchema();
        return schema.tables.map((t) => t.name);
    }

    public isValidTable(tableName: string): boolean {
        return this.getAllowedTables().includes(tableName);
    } 

    public getTableDef(tableName: string): TableDef | undefined {
        const schema = this.getSchema();
        return schema.tables.find((t) => t.name === tableName);
    } 

    public getValidColumns(tableName: string): string[]{
        const table = this.getTableDef(tableName);
        return table ? table.columns.map((c) => c.name) : [];
    }
}

export const schemaService = new SchemaService();
