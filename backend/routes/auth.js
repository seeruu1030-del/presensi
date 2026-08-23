const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-presensi';

// Login Endpoint
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    let user = null;
    let userRole = '';
    let userName = '';
    let userId = '';

    if (role === 'admin') {
      const admin = await prisma.admin.findUnique({ where: { username } });
      if (admin && admin.password === password) {
        user = admin;
        userRole = 'admin';
        userName = admin.nama;
        userId = admin.id;
      }
    } else if (role === 'guru') {
      // Find by NIP, NUPTK, or NIK
      const guru = await prisma.guruTendik.findFirst({
        where: {
          OR: [
            { nip: username },
            { nuptk: username },
            { nik: username }
          ]
        }
      });
      if (guru && guru.password === password) {
        user = guru;
        userRole = guru.kategori.toLowerCase() === 'tendik' ? 'tendik' : 'guru';
        userName = guru.nama;
        userId = guru.id;
      }
    } else if (role === 'siswa') {
      const siswa = await prisma.siswa.findUnique({ where: { nisn: username } });
      if (siswa && siswa.password === password) {
        user = siswa;
        userRole = 'siswa';
        userName = siswa.nama;
        userId = siswa.id;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: userId, role: userRole, name: userName },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: {
        id: userId,
        name: userName,
        role: userRole
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
