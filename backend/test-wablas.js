const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testWablas() {
  const p = await prisma.pengaturan.findFirst();
  const domain = p.wa_domain;
  const token = p.wa_token;
  console.log('Testing Wablas with:', { domain, token: '***' });
  
  const url = domain + '/api/send-message';
  const payload = new URLSearchParams({ phone: '6281381123837', message: 'Test dari Server API' });
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload
    });
    const result = await res.text();
    console.log('Wablas Response HTTP Status:', res.status);
    console.log('Wablas Response:', result);
  } catch (e) {
    console.error('Fetch error:', e);
  }
  process.exit(0);
}
testWablas();
