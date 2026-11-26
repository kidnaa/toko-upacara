import { useEffect, useState, type FormEvent } from 'react'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'

type Product = { id: number; name: string; price: number; stock: number }
type CartItem = { productId: number; name: string; price: number; quantity: number }
type ReceiptItem = { name: string; quantity: number; price: number; subtotal: number }
type Receipt = { id: number; createdAt: string; items: ReceiptItem[]; total: number; paid: number; change: number }

const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] ?? char)
}

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [paid, setPaid] = useState('')
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api<Product[]>('/products')
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat barang'))
  }, [])

  function addItem(e: FormEvent) {
    e.preventDefault()
    setError('')
    const product = products.find((p) => p.id === Number(productId))
    const amount = Number(quantity)
    if (!product || amount < 1) return
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + amount } : item)
      }
      return [...current, { productId: product.id, name: product.name, price: product.price, quantity: amount }]
    })
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  async function checkout(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const result = await api<{ saleId: number; total: number; paid: number; change: number }>('/sales', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(({ productId, quantity }) => ({ productId, quantity })),
          paid: Number(paid),
        }),
      })
      const fallbackReceipt: Receipt = {
        id: result.saleId,
        createdAt: new Date().toISOString(),
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        total: result.total,
        paid: result.paid,
        change: result.change,
      }
      setReceipt(fallbackReceipt)
      setCart([])
      setPaid('')
      try {
        setReceipt(await api<Receipt>(`/sales/${result.saleId}`))
      } catch {
        setError('Transaksi berhasil, tetapi nota lengkap gagal dimuat. Nota ringkas tetap tersedia.')
      }
      try {
        setProducts(await api<Product[]>('/products'))
      } catch {
        setError((current) => current ? `${current} Gagal memperbarui daftar barang.` : 'Transaksi berhasil, tetapi daftar barang gagal diperbarui.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaksi gagal')
    } finally {
      setSubmitting(false)
    }
  }

  function downloadReceipt() {
    if (!receipt) return
    const itemRows = receipt.items.map((item) =>
      `<tr><td>${escapeHtml(item.name)}</td><td>${item.quantity}</td><td>${rupiah(item.price)}</td><td>${rupiah(item.subtotal)}</td></tr>`,
    ).join('')
    const html = `<!doctype html><html lang="id"><meta charset="utf-8"><title>Nota #${receipt.id}</title><style>body{font-family:Arial,sans-serif;max-width:640px;margin:32px auto;padding:0 16px;color:#222}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{text-align:left;padding:8px;border-bottom:1px solid #ddd}td:nth-child(n+2),th:nth-child(n+2){text-align:right}.summary{margin-left:auto;width:max-content}.summary p{display:flex;justify-content:space-between;gap:40px}</style><h1>Toko Alat Upacara</h1><p>Nota transaksi #${receipt.id}</p><p>${new Date(receipt.createdAt).toLocaleString('id-ID')}</p><table><thead><tr><th>Barang</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>${itemRows}</tbody></table><div class="summary"><p><span>Total</span><strong>${rupiah(receipt.total)}</strong></p><p><span>Tunai</span><strong>${rupiah(receipt.paid)}</strong></p><p><span>Kembalian</span><strong>${rupiah(receipt.change)}</strong></p></div><p>Terima kasih telah berbelanja.</p></html>`
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `nota-${receipt.id}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  function printReceipt() {
    if (!receipt) return
    const printWindow = window.open('', '_blank', 'width=640,height=720')
    if (!printWindow) {
      setError('Jendela cetak diblokir browser. Izinkan pop-up lalu coba lagi.')
      return
    }
    const rows = receipt.items.map((item) =>
      `<tr><td>${escapeHtml(item.name)}</td><td>${item.quantity}</td><td>${rupiah(item.subtotal)}</td></tr>`,
    ).join('')
    printWindow.document.write(`<!doctype html><html lang="id"><meta charset="utf-8"><title>Nota #${receipt.id}</title><style>body{font-family:Arial,sans-serif;max-width:420px;margin:24px auto;padding:0 16px;color:#222}h1{text-align:center;font-size:20px}p{text-align:center;font-size:12px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{text-align:left;padding:7px 3px;border-bottom:1px solid #ddd}td:last-child,th:last-child{text-align:right}.summary p{display:flex;justify-content:space-between}.thanks{text-align:center;margin-top:24px}</style><h1>Toko Alat Upacara</h1><p>Nota transaksi #${receipt.id}<br>${new Date(receipt.createdAt).toLocaleString('id-ID')}</p><table><thead><tr><th>Barang</th><th>Qty</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><p><span>Total</span><strong>${rupiah(receipt.total)}</strong></p><p><span>Tunai</span><strong>${rupiah(receipt.paid)}</strong></p><p><span>Kembalian</span><strong>${rupiah(receipt.change)}</strong></p></div><div class="thanks">Terima kasih telah berbelanja.</div><script>window.onload=()=>window.print()</script></html>`)
    printWindow.document.close()
  }

  return (
    <AppLayout title="Kasir">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle>Tambah Barang</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addItem} className="flex flex-wrap items-end gap-2">
              <div className="min-w-52 flex-1 space-y-1"><Label>Barang</Label><select className="h-8 w-full rounded-lg border px-2" value={productId} onChange={(e) => setProductId(e.target.value)} required><option value="">Pilih barang</option>{products.map((p) => <option key={p.id} value={p.id} disabled={p.stock <= 0}>{p.name} · {rupiah(p.price)} · stok {p.stock}</option>)}</select></div>
              <div className="w-24 space-y-1"><Label>Jumlah</Label><Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
              <Button type="submit">Tambahkan</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Keranjang</CardTitle></CardHeader>
          <CardContent>
            {cart.length === 0 ? <p className="text-muted-foreground">Belum ada barang.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Barang</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                <TableBody>{cart.map((item) => <TableRow key={item.productId}><TableCell>{item.name}</TableCell><TableCell className="text-right">{item.quantity}</TableCell><TableCell className="text-right">{rupiah(item.price * item.quantity)}</TableCell></TableRow>)}</TableBody>
              </Table>
            )}
            <div className="mt-4 border-t pt-4">
              <div className="mb-3 flex justify-between text-lg font-semibold"><span>Total</span><span>{rupiah(total)}</span></div>
              <form onSubmit={checkout} className="space-y-3">
                <div className="space-y-1"><Label>Uang dibayar</Label><Input type="number" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} required /></div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {receipt && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                  <p className="font-semibold">Nota transaksi #{receipt.id}</p>
                  <p>{new Date(receipt.createdAt).toLocaleString('id-ID')}</p>
                  <div className="my-2 space-y-1 border-y border-green-200 py-2">{receipt.items.map((item, index) => <p key={`${item.name}-${index}`} className="flex justify-between gap-3"><span>{item.name} × {item.quantity}</span><span>{rupiah(item.subtotal)}</span></p>)}</div>
                  <p>Total: {rupiah(receipt.total)}</p>
                  <p>Tunai: {rupiah(receipt.paid)}</p>
                  <p>Kembalian: {rupiah(receipt.change)}</p>
                  <div className="mt-3 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={downloadReceipt}>Unduh nota</Button><Button type="button" size="sm" variant="outline" onClick={printReceipt}>Cetak nota</Button></div>
                </div>}
                <Button type="submit" className="w-full" disabled={cart.length === 0 || submitting}>{submitting ? 'Memproses...' : 'Proses Pembayaran'}</Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
