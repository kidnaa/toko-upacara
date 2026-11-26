import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, getUser } from '@/lib/api'
import AppLayout from '@/components/AppLayout'

type Product = {
  id: number
  name: string
  sku: string
  price: number
  minStock: number
  stock: number
  lowStock: boolean
}

type Category = { id: number; name: string }
type Rack = { id: number; code: string }

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)

export default function Products() {
  const canManage = getUser()?.role === 'OWNER'
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [racks, setRacks] = useState<Rack[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '',
    minStock: '0',
    categoryId: '',
    rackId: '',
  })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [productData, categoryData, rackData] = await Promise.all([
        api<Product[]>('/products'),
        api<Category[]>('/categories'),
        api<Rack[]>('/racks'),
      ])
      setProducts(productData)
      setCategories(categoryData)
      setRacks(rackData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.all([
      api<Product[]>('/products'),
      api<Category[]>('/categories'),
      api<Rack[]>('/racks'),
    ])
      .then(([productData, categoryData, rackData]) => {
        setProducts(productData)
        setCategories(categoryData)
        setRacks(rackData)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat data'))
      .finally(() => setLoading(false))
  }, [])

  async function createCategory(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: categoryName }),
      })
      setCategoryName('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kategori')
    }
  }

  async function createProduct(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api<Product>('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          price: Number(form.price),
          minStock: Number(form.minStock),
          categoryId: Number(form.categoryId),
          rackId: form.rackId ? Number(form.rackId) : undefined,
        }),
      })
      setForm({ name: '', sku: '', price: '', minStock: '0', categoryId: '', rackId: '' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan barang')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Barang">
      <div className={`grid gap-4 ${canManage ? 'lg:grid-cols-[320px_1fr]' : ''}`}>
        {canManage && <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Tambah Barang</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={createProduct} className="space-y-3">
                <div className="space-y-1"><Label>Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="space-y-1"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label>Harga</Label><Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
                  <div className="space-y-1"><Label>Stok min.</Label><Input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></div>
                </div>
                <div className="space-y-1"><Label>Kategori</Label><select className="h-8 w-full rounded-lg border px-2" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required><option value="">Pilih kategori</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="space-y-1"><Label>Rak</Label><select className="h-8 w-full rounded-lg border px-2" value={form.rackId} onChange={(e) => setForm({ ...form, rackId: e.target.value })}><option value="">Belum ditempatkan</option>{racks.map((r) => <option key={r.id} value={r.id}>{r.code}</option>)}</select></div>
                <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Barang'}</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Kategori Baru</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={createCategory} className="flex gap-2"><Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Nama kategori" required /><Button type="submit">Tambah</Button></form>
            </CardContent>
          </Card>
        </div>}

        <Card>
          <CardHeader><CardTitle>Daftar Barang</CardTitle></CardHeader>
          <CardContent>
            {loading && <p>Memuat...</p>}
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            {!loading && !error && (
              <Table>
                <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Harga</TableHead><TableHead className="text-right">Stok</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{products.map((p) => (
                  <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell>{p.sku}</TableCell><TableCell className="text-right">{rupiah(p.price)}</TableCell><TableCell className="text-right">{p.stock}</TableCell><TableCell>{p.lowStock ? <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">Stok menipis</span> : <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">Aman</span>}</TableCell></TableRow>
                ))}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}