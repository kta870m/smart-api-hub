import { Router } from "express";
import { validateResource } from "../middlewares/resource-whitelist.middleware";
import { crudController } from "../controllers/crud.controller";
import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createSchema, updatePutSchema } from "../validators/crud.validator";

const router = Router();

router.use("/:resource", validateResource);

router.get('/:resource', (req, res) => crudController.getAll(req, res));
router.get('/:resource/:id', (req, res) => crudController.getById(req, res));

router.post('/:resource', authenticateToken, validate(createSchema), (req, res) => crudController.create(req, res));
router.put('/:resource/:id', authenticateToken, validate(updatePutSchema), (req, res) => crudController.updatePut(req, res));

router.patch('/:resource/:id', authenticateToken, (req, res) => crudController.updatePatch(req, res));
router.delete('/:resource/:id', authenticateToken, requireAdmin, (req, res) => crudController.delete(req, res));

export default router;