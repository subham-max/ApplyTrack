// src/services/applications.service.ts
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../middlewares/errorHandler';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  UpdateStatusInput,
} from '../validations/application.schema';

// TEMP until Module 3 — replace with req.user.id
const TEMP_USER_ID = 'req.user!.sub';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

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
  async  getApplicationById(applicationId: string, userId: string) {
  const app = await prisma.jobApplication.findUnique({ where: { id: applicationId } });

  if (!app) {
    throw new Error('NOT_FOUND');
  }
  if (app.id !== userId) {
    throw new Error('NOT_FOUND'); // same error as not found — see below
  }

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

 async  refresh(refreshToken: string) {
  let payload: { sub: string };

  try {
    payload = jwt.verify(refreshToken, REFRESH_SECRET) as { sub: string };
  } catch {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  return { accessToken };
}
};