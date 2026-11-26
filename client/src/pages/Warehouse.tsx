import { useEffect, useState, type FormEvent } from 'react'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api, getUser } from '@/lib/api'

type Rack = { id: number; code: string; description?: string | null }
type Product = { id: number; name: string; sku: string; stock: number }
type LocationResult = { id: number; name: string; sku: string; stock: number; rackCode: string | null }

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] ?? char)
}

export default function Warehouse() {
  const canManage = getUser()?.role === 'OWNER'
  const [racks, setRacks] = useState<Rack[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationResult[]>([])
  const [searching, setSearching] = useState(false)
  const [rackForm, setRackForm] = useState({ code: '', description: '' })
  const [placeForm, setPlaceForm] = useState({ productId: '', rackId: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    const [r, p] = await Promise.all([api<Rack[]>('/racks'), api<Product[]>('/products')])
    setRacks(r)
    setProducts(p)
  }

  useEffect(() => {
    Promise.all([api<Rack[]>('/racks'), api<Product[]>('/products')])
      .then(([r, p]) => {
        setRacks(r)
        setProducts(p)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat gudang'))
  }, [])

  async function searchLocation(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSearching(true)
    try {
      setResults(await api<LocationResult[]>(`/products/search?q=${encodeURIComponent(query)}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencari lokasi barang')
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  function printLabel(product: LocationResult) {
    const printWindow = window.open('', '_blank', 'width=480,height=360')
    if (!printWindow) {
      setError('Jendela cetak diblokir browser. Izinkan pop-up lalu coba lagi.')
      return
    }
    printWindow.document.write(`<!doctype html><html><head><title>Label ${escapeHtml(product.sku)}</title><style>body{font-family:Arial,sans-serif;padding:24px}.label{border:1px dashed #555;padding:20px;max-width:320px}h1{font-size:20px;margin:0 0 12px}p{margin:6px 0}.sku{font-size:18px;font-weight:bold}</style></head><body><div class="label"><h1>${escapeHtml(product.name)}</h1><p class="sku">${escapeHtml(product.sku)}</p><p>Lokasi: ${escapeHtml(product.rackCode ?? 'Belum ditempatkan')}</p></div><script>window.onload=()=>window.print()</script></body></html>`)
    printWindow.document.close()
  }

  async function addRack(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await api<Rack>('/racks', { method: 'POST', body: JSON.stringify({ code: rackForm.code, description: rackForm.description || undefined }) })
      setRackForm({ code: '', description: '' })
      setMessage('Rak berhasil ditambahkan')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan rak')
    }
  }

  async function placeProduct(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await api(`/products/${placeForm.productId}/rack`, { method: 'PATCH', body: JSON.stringify({ rackId: Number(placeForm.rackId) }) })
      setMessage('Lokasi barang berhasil diperbarui')
      setPlaceForm({ productId: '', rackId: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menempatkan barang')
    }
  }

  return (
    <AppLayout title="Gudang">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {canManage && <div className="space-y-4">
          <Card><CardHeader><CardTitle>Tambah Rak</CardTitle></CardHeader><CardContent>
            <form onSubmit={addRack} className="space-y-3"><div className="space-y-1"><Label>Kode Rak</Label><Input value={rackForm.code} onChange={(e) => setRackForm({ ...rackForm, code: e.target.value })} required /></div><div className="space-y-1"><Label>Keterangan</Label><Input value={rackForm.description} onChange={(e) => setRackForm({ ...rackForm, description: e.target.value })} /></div><Button type="submit" className="w-full">Tambah Rak</Button></form>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Tempatkan Barang</CardTitle></CardHeader><CardContent>
            <form onSubmit={placeProduct} className="space-y-3"><div className="space-y-1"><Label>Barang</Label><select className="h-8 w-full rounded-lg border px-2" value={placeForm.productId} onChange={(e) => setPlaceForm({ ...placeForm, productId: e.target.value })} required><option value="">Pilih barang</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="space-y-1"><Label>Rak</Label><select className="h-8 w-full rounded-lg border px-2" value={placeForm.rackId} onChange={(e) => setPlaceForm({ ...placeForm, rackId: e.target.value })} required><option value="">Pilih rak</option>{racks.map((r) => <option key={r.id} value={r.id}>{r.code}</option>)}</select></div><Button type="submit" className="w-full">Simpan Lokasi</Button></form>
          </CardContent></Card>
        </div>}
        <Card><CardHeader><CardTitle>Daftar Rak</CardTitle></CardHeader><CardContent>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {message && <p className="mb-3 text-sm text-green-700">{message}</p>}
          <Table><TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Keterangan</TableHead></TableRow></TableHeader><TableBody>{racks.map((r) => <TableRow key={r.id}><TableCell>{r.code}</TableCell><TableCell>{r.description || '-'}</TableCell></TableRow>)}</TableBody></Table>
        </CardContent></Card>
      </div>
      <Card className="mt-4">
        <CardHeader><CardTitle>Cari Lokasi Barang</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={searchLocation} className="mb-4 flex gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama barang" required />
            <Button type="submit" disabled={searching}>{searching ? 'Mencari...' : 'Cari'}</Button>
          </form>
          {results.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Barang</TableHead><TableHead>SKU</TableHead><TableHead>Lokasi</TableHead><TableHead>Stok</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
              <TableBody>{results.map((product) => <TableRow key={product.id}><TableCell>{product.name}</TableCell><TableCell>{product.sku}</TableCell><TableCell>{product.rackCode ?? 'Belum ditempatkan'}</TableCell><TableCell>{product.stock}</TableCell><TableCell><Button type="button" variant="outline" size="sm" onClick={() => printLabel(product)}>Cetak label</Button></TableCell></TableRow>)}</TableBody>
            </Table>
          ) : query && !searching && !error ? <p className="text-sm text-muted-foreground">Tidak ada barang yang cocok.</p> : null}
        </CardContent>
      </Card>
    </AppLayout>
  )
}
