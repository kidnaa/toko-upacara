import { Router } from 'express';
import { z } from 'zod';
import { db } from './prisma/db.js';
import { requireAuth, requireRole, type AuthUser } from './middleware.js';

export const catalogRouter = Router();
catalogRouter.use(requireAuth);

// Stok = jumlah semua pergerakan: IN menambah, OUT mengurangi, ADJUST bisa + atau -
export async function stockByProduct() {
  const moves = await db.orm.public.StockMovement
    .select('productId', 'type', 'quantity')
    .all();
  const map = new Map<number, number>();
  for (const m of moves) {
    const delta = m.type === 'OUT' ? -m.quantity : m.quantity;
    map.set(m.productId, (map.get(m.productId) ?? 0) + delta);
  }
  return map;
}

// ---------- Kategori ----------
catalogRouter.get('/categories', async (_req, res) => {
  res.json(await db.orm.public.Category.all());
});

const categorySchema = z.object({ name: z.string().trim().min(1) });

catalogRouter.post('/categories', requireRole('OWNER'), async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Nama kategori wajib diisi' });
  try {
    const category = await db.orm.public.Category.create({ name: parsed.data.name });
    res.status(201).json(category);
  } catch {
    res.status(409).json({ message: 'Kategori sudah ada atau gagal disimpan' });
  }
});

// ---------- Barang ----------
catalogRouter.get('/products', async (_req, res) => {
  const [products, stock] = await Promise.all([
    db.orm.public.Product.all(),
    stockByProduct(),
  ]);
  res.json(
    products.map((p) => {
      const s = stock.get(p.id) ?? 0;
      return { ...p, stock: s, lowStock: s <= p.minStock };
    }),
  );
});

const productSchema = z.object({
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  price: z.number().int().min(0),
  minStock: z.number().int().min(0).default(0),
  categoryId: z.number().int(),
  rackId: z.number().int().optional(),
});

catalogRouter.post('/products', requireRole('OWNER'), async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Data barang tidak valid' });
  const { rackId, ...rest } = parsed.data;
  try {
    const product = await db.orm.public.Product.create(
      rackId === undefined ? rest : { ...rest, rackId },
    );
    res.status(201).json(product);
  } catch {
    res.status(409).json({ message: 'SKU sudah dipakai, atau kategori/rak tidak ditemukan' });
  }
});

// ---------- Pergerakan stok ----------
const movementSchema = z
  .object({
    type: z.enum(['IN', 'OUT', 'ADJUST']),
    quantity: z.number().int(),
    note: z.string().optional(),
    productId: z.number().int(),
  })
  .refine((m) => (m.type === 'ADJUST' ? m.quantity !== 0 : m.quantity > 0), {
    message: 'Jumlah tidak valid',
  });

catalogRouter.post('/stock-movements', async (req, res) => {
  const parsed = movementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Data pergerakan stok tidak valid' });
  const { type, quantity, note, productId } = parsed.data;
  const user = res.locals['user'] as AuthUser;

  const product = await db.orm.public.Product.where({ id: productId }).first();
  if (!product) return res.status(404).json({ message: 'Barang tidak ditemukan' });

  const current = (await stockByProduct()).get(productId) ?? 0;
  const delta = type === 'OUT' ? -quantity : quantity;
  if (current + delta < 0) {
    return res.status(400).json({ message: `Stok tidak cukup (tersisa ${current})` });
  }

  try {
    const movement = await db.orm.public.StockMovement.create(
      note === undefined
        ? { type, quantity, productId, userId: user.id }
        : { type, quantity, note, productId, userId: user.id },
    );
    res.status(201).json({ movement, stock: current + delta });
  } catch {
    res.status(500).json({ message: 'Gagal menyimpan pergerakan stok' });
  }
});