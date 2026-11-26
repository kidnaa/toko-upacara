import { useEffect, useState, type FormEvent } from 'react'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'

type Product = { id: number; name: string; sku: string; stock: number }
type LowStock = { id: number; name: string; sku: string; stock: number; minStock: number; shortfall: number }

export default function Stock() {
  const [products, setProducts] = useState<Product[]>([])
  const [lowStock, setLowStock] = useState<LowStock[]>([])
  const [form, setForm] = useState({ productId: '', type: 'IN', quantity: '', note: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    setError('')
    try {
      const [p, l] = await Promise.all([api<Product[]>('/products'), api<LowStock[]>('/low-stock')])
      setProducts(p)
      setLowStock(l)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat stok')
    }
  }

  useEffect(() => { void load() }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await api('/stock-movements', {
        method: 'POST',
        body: JSON.stringify({
          productId: Number(form.productId),
          type: form.type,
          quantity: Number(form.quantity),
          note: form.note || undefined,
        }),
      })
      setMessage('Pergerakan stok berhasil disimpan')
      setForm({ productId: '', type: 'IN', quantity: '', note: '' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan stok')
    }
  }

  return (
    <AppLayout title="Stok">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader><CardTitle>Catat Pergerakan</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1"><Label>Barang</Label><select className="h-8 w-full rounded-lg border px-2" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required><option value="">Pilih barang</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}</select></div>
              <div className="space-y-1"><Label>Jenis</Label><select className="h-8 w-full rounded-lg border px-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="IN">Barang masuk</option><option value="OUT">Barang keluar</option><option value="ADJUST">Penyesuaian (+/-)</option></select></div>
              <div className="space-y-1"><Label>Jumlah</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></div>
              <div className="space-y-1"><Label>Catatan</Label><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-green-700">{message}</p>}
              <Button type="submit" className="w-full">Simpan</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Daftar Belanja</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Barang</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Stok</TableHead><TableHead className="text-right">Minimum</TableHead><TableHead className="text-right">Kurang</TableHead></TableRow></TableHeader>
              <TableBody>{lowStock.map((p) => <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell>{p.sku}</TableCell><TableCell className="text-right">{p.stock}</TableCell><TableCell className="text-right">{p.minStock}</TableCell><TableCell className="text-right">{p.shortfall}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
