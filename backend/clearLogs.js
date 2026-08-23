const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearLogs() {
  try {
    const result = await prisma.logPresensi.deleteMany({});
    console.log('Successfully deleted ' + result.count + ' records from LogPresensi');
  } catch (err) {
    console.error('Error deleting logs:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clearLogs();
