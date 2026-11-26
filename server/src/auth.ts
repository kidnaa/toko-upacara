import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from './prisma/db.js';
import { jwtSecret } from './config.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Email atau password tidak valid' });
  }
  const { email, password } = parsed.data;

  const user = await db.orm.public.User.where({ email }).first();
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !ok) {
    return res.status(401).json({ message: 'Email atau password salah' });
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    jwtSecret,
    { expiresIn: '8h' },
  );
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});