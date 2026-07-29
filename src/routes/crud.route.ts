import { Router } from "express";
import { validateResource } from "../middlewares/resource-whitelist.middleware";
import { crudController } from "../controllers/crud.controller";

const router = Router();

router.use("/:resource", validateResource);

router.get('/:resource',(req, res) => crudController.getAll(req, res));
router.get('/:resource/:id',(req, res) => crudController.getById(req, res));

router.post('/:resource',(req, res) => crudController.create(req, res));
router.put('/:resource/:id',(req,res) => crudController.updatePut(req,res));

router.patch('/:resource/:id',(req, res) => crudController.updatePatch(req, res));
router.delete('/:resource/:id',(req, res) => crudController.delete(req, res));

export default router;