import { Router } from 'express';
import { z } from 'zod';
import { db } from './prisma/db.js';
import { requireAuth, requireRole } from './middleware.js';
import { stockByProduct } from './catalog.js';

export const warehouseRouter = Router();
warehouseRouter.use(requireAuth);

// ---------- Rak ----------
warehouseRouter.get('/racks', async (_req, res) => {
  res.json(await db.orm.public.Rack.all());
});

const rackSchema = z.object({
  code: z.string().trim().min(1),
  description: z.string().optional(),
});

warehouseRouter.post('/racks', requireRole('OWNER'), async (req, res) => {
  const parsed = rackSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Kode rak wajib diisi' });
  const { code, description } = parsed.data;
  try {
    const rack = await db.orm.public.Rack.create(
      description === undefined ? { code } : { code, description },
    );
    res.status(201).json(rack);
  } catch {
    res.status(409).json({ message: 'Kode rak sudah ada atau gagal disimpan' });
  }
});

// ---------- Tempatkan barang di rak ----------
const placeSchema = z.object({ rackId: z.number().int() });

warehouseRouter.patch('/products/:id/rack', requireRole('OWNER'), async (req, res) => {
  const id = Number(req.params['id']);
  const parsed = placeSchema.safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success) {
    return res.status(400).json({ message: 'Data tidak valid' });
  }
  try {
    const updated = await db.orm.public.Product
      .where({ id })
      .update({ rackId: parsed.data.rackId });
    if (!updated) return res.status(404).json({ message: 'Barang tidak ditemukan' });
    res.json(updated);
  } catch {
    res.status(400).json({ message: 'Barang atau rak tidak ditemukan' });
  }
});

// ---------- Cari lokasi barang ----------
warehouseRouter.get('/products/search', async (req, res) => {
  const q = String(req.query['q'] ?? '').trim();
  if (!q) return res.status(400).json({ message: 'Kata kunci wajib diisi' });
  const safe = q.replace(/[\\%_]/g, '\\$&');

  const [found, racks, stock] = await Promise.all([
    db.orm.public.Product.where((p) => p.name.ilike(`%${safe}%`)).all(),
    db.orm.public.Rack.all(),
    stockByProduct(),
  ]);
  const rackCode = new Map(racks.map((r) => [r.id, r.code]));

  res.json(
    found.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: stock.get(p.id) ?? 0,
      rackCode: p.rackId == null ? null : (rackCode.get(p.rackId) ?? null),
    })),
  );
});

// ---------- Stok menipis (daftar belanja) ----------
warehouseRouter.get('/low-stock', async (_req, res) => {
  const [products, stock] = await Promise.all([
    db.orm.public.Product.all(),
    stockByProduct(),
  ]);
  const low = products
    .map((p) => {
      const s = stock.get(p.id) ?? 0;
      return { id: p.id, name: p.name, sku: p.sku, stock: s, minStock: p.minStock, shortfall: p.minStock - s };
    })
    .filter((p) => p.stock <= p.minStock)
    .sort((a, b) => b.shortfall - a.shortfall);
  res.json(low);
});