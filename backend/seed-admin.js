const prisma = require('./db');

async function main() {
  const adminExists = await prisma.admin.findUnique({
    where: { username: 'admin' }
  });

  if (!adminExists) {
    await prisma.admin.create({
      data: {
        username: 'admin',
        password: 'password', // Ideally hashed, but keeping it simple for now as requested
        nama: 'Administrator'
      }
    });
    console.log('Admin account created: admin / password');
  } else {
    console.log('Admin account already exists.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
