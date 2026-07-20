import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL is not set. Please define it in your backend .env file.');
}

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'test@applytrack.dev',
      passwordHash,
    },
  });

  const app1 = await prisma.jobApplication.create({
    data: {
      userId: user.id,
      company: 'Acme Corp',
      role: 'Backend Engineer',
      jobUrl: 'https://acme.example.com/jobs/123',
      status: 'INTERVIEW',
      statusEvents: {
        create: [
          { toStatus: 'APPLIED', note: 'Applied via website' },
          { toStatus: 'INTERVIEW', fromStatus: 'APPLIED', note: 'Recruiter screen scheduled' },
        ],
      },
      reminders: {
        create: [
          { dueDate: new Date(Date.now() + 3 * 86400000), message: 'Follow up after interview' },
        ],
      },
    },
  });

  console.log({ user, app1 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());