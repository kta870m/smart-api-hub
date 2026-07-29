import { Request, Response, NextFunction } from 'express';
import { schemaService } from '../services/schema.service';

export function validateResource(req: Request, res: Response, next: NextFunction) {
  const resource = Array.isArray(req.params.resource) ? req.params.resource[0] : req.params.resource;

  if (!schemaService.isValidTable(resource)) {
    return res.status(400).json({
      error: `Resource '${resource}' không hợp lệ hoặc không tồn tại trong schema.json.`,
    });
  }

  next();
}