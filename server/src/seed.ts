import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db } from './prisma/db.js';

function getBootstrapPassword(user: { password: string | undefined; passwordVariable: string; email: string }): string {
  const password = user.password;
  if (!password || password.length < 12) {
    throw new Error(`${user.passwordVariable} must be set to at least 12 characters to create ${user.email}`);
  }
  return password;
}

async function seed() {
  const users = [
    {
      email: process.env['OWNER_EMAIL'] || 'owner@toko.local',
      name: 'Pemilik Toko',
      password: process.env['OWNER_PASSWORD'],
      passwordVariable: 'OWNER_PASSWORD',
      role: 'OWNER',
    },
    {
      email: process.env['STAFF_EMAIL'] || 'staff@toko.local',
      name: 'Pegawai Toko',
      password: process.env['STAFF_PASSWORD'],
      passwordVariable: 'STAFF_PASSWORD',
      role: 'STAFF',
    },
  ];

  const existingUsers = await Promise.all(
    users.map(async (user) => ({
      user,
      existing: await db.orm.public.User.where({ email: user.email }).first(),
    })),
  );

  for (const { user, existing } of existingUsers) {
    if (!existing) {
      getBootstrapPassword(user);
    }
  }

  for (const { user, existing } of existingUsers) {
    if (existing) {
      console.log(`Already exists ${user.email}`);
      continue;
    }

    await db.orm.public.User.create({
      email: user.email,
      name: user.name,
      passwordHash: await bcrypt.hash(getBootstrapPassword(user), 10),
      role: user.role,
    });
    console.log(`Created ${user.email}`);
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
