// src/services/applications.service.ts
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../middlewares/errorHandler';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  UpdateStatusInput,
} from '../validations/application.schema';

// TEMP until Module 3 — replace with req.user.id
const TEMP_USER_ID = 'temp-user-id';

export const applicationsService = {
  async list() {
    return prisma.jobApplication.findMany({
      where: { userId: TEMP_USER_ID },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: string) {
    const app = await prisma.jobApplication.findFirst({
      where: { id, userId: TEMP_USER_ID },
      include: { statusEvents: true, reminders: true },
    });
    if (!app) throw new NotFoundError('Application not found');
    return app;
  },

  async create(data: CreateApplicationInput) {
    return prisma.jobApplication.create({
      data: {
        ...data,
        userId: TEMP_USER_ID,
        status: 'APPLIED',
      },
    });
  },

  async update(id: string, data: UpdateApplicationInput) {
    await this.getById(id); // throws if not found/not owned
    return prisma.jobApplication.update({ where: { id }, data });
  },

  async updateStatus(id: string, data: UpdateStatusInput) {
    const existing = await this.getById(id);

    // transaction: status change + event log must succeed or fail together
    return prisma.$transaction(async (tx) => {
      const updated = await tx.jobApplication.update({
        where: { id },
        data: { status: data.status },
      });

      await tx.statusEvent.create({
        data: {
          applicationId: id,
          fromStatus: existing.status,
          toStatus: data.status,
          note: data.note,
        },
      });

      return updated;
    });
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.jobApplication.delete({ where: { id } });
  },
};