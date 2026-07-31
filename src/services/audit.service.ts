import { record } from "zod";
import { db } from "../config/data-source";
import { timeStamp } from "console";

export interface AuditLogParams{
    user_id?:string | null;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    resource_name: string;
    record_id: string; 
}

export class AuditService {
    async initTable() {
        try{
            const hasTable = await db.schema.hasTable('audit_logs');
            if(!hasTable){
                await db.schema.createTable('audit_logs', (table) => {
                    table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
                    table.string('user_id').nullable();
                    table.string('action', 10).notNullable();
                    table.string('resource_name', 100).notNullable();
                    table.string('record_id', 100).notNullable();
                    table.timestamp('timestamp').defaultTo(db.fn.now());
                });
                console.log("Đã khởi tạo bảng audit_logs thành công");
            }
        }catch(error: any){
            console.error("Lỗi khi tạo bảng audit_logs:", error);
        }
    }

    log(params: AuditLogParams){
        db('audit_logs')
            .insert({
                user_id: params.user_id || null,
                action: params.action,
                resource_name: params.resource_name,
                record_id: params.record_id,
                timestamp: new Date(),
            })
            .catch((err) => {
                console.error("[AuditLog Error]: Không thể lưu audit log:", err.message);
            })
    }
}

export const auditService = new AuditService();