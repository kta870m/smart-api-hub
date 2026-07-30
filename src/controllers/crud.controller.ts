import { Request, Response } from "express";
import { crudService, QueryOptions } from "../services/crud.service";


export class CrudController {
    private parseStringArray(param: any):string[] {
        if(!param) return [];
        if(Array.isArray(param)){
            return param.flatMap((p) => String(p).split(',')).map((s) => s.trim());
        }
        if(typeof param === 'string'){
            return param.split(',').map((s) => s.trim());
        }

        return [];
    }

    async getAll(req: Request, res: Response) {
        try {
            const resourceParam = req.params.resource;
            const resource = Array.isArray(resourceParam) ? resourceParam[0] : resourceParam;
            const { _page, _limit, _sort, _order, _fields,_expand, _embed,  q, ...restQuery } = req.query;


            const options: QueryOptions = {
                _page: _page ? parseInt(_page as string, 10) : undefined,
                _limit: _limit ? parseInt(_limit as string, 10) : undefined,
                _sort: typeof _sort === 'string' ? _sort : undefined,
                _order: _order === 'desc' ? 'desc' : 'asc',
                _fields: this.parseStringArray(_fields),
                _expand: this.parseStringArray(_expand),
                _embed: this.parseStringArray(_embed),
                q: typeof q === 'string' ? q : undefined,
                filters: restQuery,
            }

            const { data, totalCount } = await crudService.findAll(resource, options);

            //Set Header
            res.setHeader('X-Total-Count',totalCount.toString());
            res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');

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