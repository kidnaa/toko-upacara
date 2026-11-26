import { Router } from 'express';
import { z } from 'zod';
import { db } from './prisma/db.js';
import { requireAuth, type AuthUser } from './middleware.js';

export const salesRouter = Router();
salesRouter.use(requireAuth);

class SaleError extends Error {}

const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  paid: z.number().int().min(0),
});

// ---------- Buat transaksi ----------
salesRouter.post('/sales', async (req, res) => {
  const parsed = saleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Data transaksi tidak valid' });
  }
  const user = res.locals['user'] as AuthUser;
  const { paid } = parsed.data;

  // Gabungkan baris dengan barang yang sama
  const qtyById = new Map<number, number>();
  for (const it of parsed.data.items) {
    qtyById.set(it.productId, (qtyById.get(it.productId) ?? 0) + it.quantity);
  }

  try {
    const result = await db.transaction(async (tx) => {
      const lines: { productId: number; name: string; price: number; quantity: number }[] = [];

      for (const [productId, quantity] of qtyById) {
        const product = await tx.orm.public.Product.where({ id: productId }).first();
        if (!product) throw new SaleError(`Barang #${productId} tidak ditemukan`);

        const moves = await tx.orm.public.StockMovement
          .select('type', 'quantity')
          .where({ productId })
          .all();
        const stock = moves.reduce(
          (sum, m) => sum + (m.type === 'OUT' ? -m.quantity : m.quantity),
          0,
        );
        if (stock < quantity) {
          throw new SaleError(`Stok ${product.name} tidak cukup (tersisa ${stock})`);
        }
        lines.push({ productId, name: product.name, price: product.price, quantity });
      }

      const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
      if (paid < total) throw new SaleError(`Uang kurang (total Rp ${total})`);
      const change = paid - total;

      const sale = await tx.orm.public.Sale.create({ total, paid, change, userId: user.id });

      for (const l of lines) {
        await tx.orm.public.SaleItem.create({
          saleId: sale.id,
          productId: l.productId,
          quantity: l.quantity,
          price: l.price,
        });
        await tx.orm.public.StockMovement.create({
          type: 'OUT',
          quantity: l.quantity,
          note: `Penjualan #${sale.id}`,
          productId: l.productId,
          userId: user.id,
        });
      }

      return { saleId: sale.id, total, paid, change };
    });
    res.status(201).json(result);
  } catch (e) {
    if (e instanceof SaleError) return res.status(400).json({ message: e.message });
    res.status(500).json({ message: 'Gagal menyimpan transaksi' });
  }
});

// ---------- Nota digital ----------
salesRouter.get('/sales/:id', async (req, res) => {
  const id = Number(req.params['id']);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID tidak valid' });

  const sale = await db.orm.public.Sale.where({ id }).first();
  if (!sale) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

  const [items, products] = await Promise.all([
    db.orm.public.SaleItem.where({ saleId: id }).all(),
    db.orm.public.Product.all(),
  ]);
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  res.json({
    id: sale.id,
    createdAt: sale.createdAt,
    items: items.map((i) => ({
      name: nameById.get(i.productId) ?? `Barang #${i.productId}`,
      quantity: i.quantity,
      price: i.price,
      subtotal: i.price * i.quantity,
    })),
    total: sale.total,
    paid: sale.paid,
    change: sale.change,
  });
});