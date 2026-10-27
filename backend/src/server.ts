import 'dotenv/config';
import { app } from './app';
import prisma from './infrastructure/database/prisma/client';
import { startOverdueReviewsJob } from './presentation/jobs/overdueReviewsJob';

const PORT = process.env.PORT || 3333;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// UC02 FA02: verifica prazos de avaliação vencidos ao subir e a cada 15 minutos
const overdueCheck = startOverdueReviewsJob(15 * 60 * 1000);

const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Closing HTTP server and disconnecting Prisma...`);
  clearInterval(overdueCheck);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database connection closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
