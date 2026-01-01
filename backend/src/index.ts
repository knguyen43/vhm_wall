import { app } from './app';
import { prisma } from './lib/prisma';
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
