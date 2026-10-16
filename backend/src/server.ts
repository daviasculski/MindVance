import 'dotenv/config';
import { app } from './app';
import prisma from './infrastructure/database/prisma/client';

const PORT = process.env.PORT || 3333;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Closing HTTP server and disconnecting Prisma...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database connection closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
