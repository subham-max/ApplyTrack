// src/controllers/applications.controller.ts
import { Request, Response } from 'express';
import { applicationsService } from '../services/application.service';
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateStatusSchema,
} from '../validations/application.schema';

export const applicationsController = {
  async list(_req: Request, res: Response) {
    const apps = await applicationsService.list();
    res.json(apps);
  },

  async getById(req: any, res: Response) {
    const app = await applicationsService.getById(req.params.id);
    res.json(app);
  },

  async create(req: any, res: Response) {
    const data = createApplicationSchema.parse(req.body);
    const app = await applicationsService.create(data);
    res.status(201).json(app);
  },

  async update(req: any, res: Response) {
    const data = updateApplicationSchema.parse(req.body);
    const app = await applicationsService.update(req.params.id, data);
    res.json(app);
  },

  async updateStatus(req: any, res: Response) {
    const data = updateStatusSchema.parse(req.body);
    const app = await applicationsService.updateStatus(req.params.id, data);
    res.json(app);
  },

  async remove(req: any, res: Response) {
    await applicationsService.remove(req.params.id);
    res.status(204).send();
  },
};