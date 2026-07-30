import fs from 'fs';
import path from 'path';

export interface ColumnDef {
    name: string;
    type: string;
    primary?: boolean;
    unique?: boolean;
    nullable?: boolean;
    default?: string;
    foreignKey?:{
        table: string,
        column: string,
        onDelete?: string
    };
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
        if(!this.schema){
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

    //chuan hoa ten bang
    private normalizeName(name: string): string{
        return name.toLowerCase().trim().replace(/s$/, '');
    }

    //Tim khoa ngoai cho den bang cha
    public findForeignKeyTo(sourceTableName: string, parentTarget: string){
        const sourceTable = this.getTableDef(sourceTableName);

        if(!sourceTable) return null;

        const normTarget = this.normalizeName(parentTarget);

        for(const col of sourceTable.columns){
            if(col.foreignKey){
                const normFkTable = this.normalizeName(col.foreignKey.table);
                if(normFkTable === normTarget){
                    return {
                        fkColumn: col.name,
                        parentTable: col.foreignKey.table,
                        parentColumn: col.foreignKey.column || 'id'
                    }
                }
            }
        }
        return null;
    }

    //Tim khoa ngoai tu con tro len bang hien tai
    public findForeginKeyFrom(childTarget: string, parentTableName: string){
        const schema = this.getSchema();
        const normChild = this.normalizeName(childTarget);
        const normParent = this.normalizeName(parentTableName);

        const childTable = schema.tables.find((t) => this.normalizeName(t.name) === normChild);

        if(!childTable) return null;

        for(const col of childTable.columns){
            if(col.foreignKey){
                const normFkTable = this.normalizeName(col.foreignKey.table);
                if(normFkTable === normParent){
                    return {
                        childTable: childTable.name,
                        fkColumn: col.name,
                        parentColumn: col.foreignKey.column || 'id'
                    }
                }
            }
        }

        return null;
    }
}

export const schemaService = new SchemaService();
