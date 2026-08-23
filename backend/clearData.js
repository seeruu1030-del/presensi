const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clearData() {
  try {
    const result = await prisma.guruTendik.deleteMany({});
    console.log('Deleted ' + result.count + ' records from GuruTendik');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
clearData();
