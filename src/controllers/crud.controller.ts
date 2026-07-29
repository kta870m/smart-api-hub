import { Request, Response } from "express";
import { crudService } from "../services/crud.service";
import { error } from "node:console";

export class CrudController {
    async getAll(req: Request, res: Response) {
        try {
            const resourceParam = req.params.resource;
            const resource = Array.isArray(resourceParam) ? resourceParam[0] : resourceParam;
            const { _fields } = req.query;

            let fields: string[] | undefined = undefined;
            if (typeof _fields === 'string') {
                fields = _fields.split(',').map((f) => f.trim());
            }

            const data = await crudService.findAll(resource, fields);
            return res.status(200).json(data);

        } catch (error: any) {
            return res.status(500).json({ error: error.message || 'Server Error' });
        }
    }

    //GET :resource/:id
    async getById(req: Request, res: Response) {
        try {
            const resourceParam = req.params.resource;
            const idParam = req.params.id;
            const resource = Array.isArray(resourceParam) ? resourceParam[0] : resourceParam;
            const id = Array.isArray(idParam) ? idParam[0] : idParam;
            const data = await crudService.findById(resource, id);

            if (!data) {
                return res.status(404).json({ error: `Không tìm thấy bản ghi với id: ${id}` });
            }
            return res.status(200).json(data);
        } catch (error: any) {
            return res.status(500).json({ error: error.message || 'Server Error' });
        }
    }

    //POST /:resource
    async create(req: Request, res: Response) {
        try {
            const resourceParam = req.params.resource;
            const resource = Array.isArray(resourceParam) ? resourceParam[0] : resourceParam;
            const created = await crudService.create(resource, req.body);
            return res.status(201).json(created);
        } catch (error: any) {
            return res.status(500).json({ error: error.message || 'Server Error' });
        }
    }

    //PUT /:resource/:id
    async updatePut(req: Request, res: Response) {
        try {
            const resourceParam = req.params.resource;
            const idParam = req.params.id;
            const resource = Array.isArray(resourceParam) ? resourceParam[0] : resourceParam;
            const id = Array.isArray(idParam) ? idParam[0] : idParam;

            const updated = await crudService.updatePut(resource, id, req.body);

            if (!updated) {
                return res.status(404).json({ error: `Không tìm thấy bản ghi với id: ${id}` });
            }
            return res.status(200).json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: error.message || 'Server error' });
        }
    }

    //PATCH /:resource/:id
    async updatePatch(req: Request, res: Response) {
        try {
            const resourceParam = req.params.resource;
            const idParam = req.params.id;
            const resource = Array.isArray(resourceParam) ? resourceParam[0] : resourceParam;
            const id = Array.isArray(idParam) ? idParam[0] : idParam;

            const updated = await crudService.updatePatch(resource, id, req.body);

            if (!updated) {
                return res.status(404).json({ error: `Không tìm thấy bản ghi với id: ${id}` });
            }

            return res.status(200).json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: error.message || 'Server error' });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const resourceParam = req.params.resource;
            const idParam = req.params.id;
            const resource = Array.isArray(resourceParam) ? resourceParam[0] : resourceParam;
            const id = Array.isArray(idParam) ? idParam[0] : idParam;

            const isDeleted = await crudService.delete(resource, id);

            if (!isDeleted) {
                return res.status(404).json({ error: `Không tìm thấy bản ghi với id: ${id}` });
            }
            return res.status(200).json({ message: 'Xóa bản ghi thành công.' });
        } catch (error: any) {
            return res.status(500).json({ error: error.message || 'Server error' });
        }
    }

}

export const crudController = new CrudController();