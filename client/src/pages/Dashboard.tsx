import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Check,
  CircleAlert,
  Package,
  ShoppingBasket,
  Warehouse,
} from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api, getUser } from '@/lib/api'

type Product = {
  id: number
  name: string
  sku: string
  categoryId: number
  stock: number
  minStock: number
  lowStock: boolean
}
type Category = { id: number; name: string }
type LowStock = { id: number; name: string; sku: string; stock: number; minStock: number; shortfall: number }

const shortcuts = [
  { to: '/stock', label: 'Catat stok masuk/keluar', icon: ArrowUpRight },
  { to: '/warehouse', label: 'Cari lokasi barang', icon: Warehouse },
  { to: '/products', label: 'Kelola daftar barang', icon: Package },
]

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [lowStock, setLowStock] = useState<LowStock[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const user = getUser()

  useEffect(() => {
    Promise.all([
      api<Product[]>('/products'),
      api<LowStock[]>('/low-stock'),
      api<Category[]>('/categories'),
    ])
      .then(([productData, lowStockData, categoryData]) => {
        setProducts(productData)
        setLowStock(lowStockData)
        setCategories(categoryData)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat ringkasan'))
      .finally(() => setLoading(false))
  }, [])

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
  const categoryStatus = categories.map((category) => {
    const items = products.filter((product) => product.categoryId === category.id)
    const lowCount = items.filter((product) => product.lowStock).length
    return {
      ...category,
      itemCount: items.length,
      units: items.reduce((sum, product) => sum + product.stock, 0),
      lowCount,
      safePercent: items.length ? Math.round(((items.length - lowCount) / items.length) * 100) : 0,
    }
  })

  const stats = [
    { label: 'Jenis barang', value: products.length, detail: `${categories.length} kategori`, icon: Boxes, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Total unit stok', value: totalStock.toLocaleString('id-ID'), detail: 'Unit tersedia di gudang', icon: Package, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Perlu diperhatikan', value: lowStock.length, detail: lowStock.length ? 'Barang di bawah batas minimum' : 'Semua stok dalam batas aman', icon: CircleAlert, tone: lowStock.length ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700' },
  ]

  return (
    <AppLayout title="Ringkasan">
      {error && (
        <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <section className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[#173d2d] px-6 py-7 text-white shadow-lg shadow-primary/10 md:px-8 md:py-9">
        <div aria-hidden="true" className="absolute -right-12 -top-24 size-72 rounded-full border-[38px] border-white/[0.06]" />
        <div aria-hidden="true" className="absolute -bottom-28 right-40 size-56 rounded-full bg-white/[0.04]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium text-white/75">
              {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Selamat datang{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75 md:text-base">
              Pantau persediaan dan aktivitas toko alat upacara Anda hari ini.
            </p>
          </div>
          <Link
            to="/sales"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-white/90"
          >
            <ShoppingBasket className="size-4" aria-hidden="true" />
            Buka kasir
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-label="Statistik toko" className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, detail, icon: Icon, tone }) => (
          <Card key={label} className="rounded-2xl border-border/80 shadow-sm">
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{loading ? '—' : value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{loading ? 'Memuat data...' : detail}</p>
              </div>
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
                <Icon className="size-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base">Persediaan per kategori</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Ringkasan jumlah barang dan kondisi stok</p>
            </div>
            <Boxes className="size-5 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="rounded-xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">Memuat data persediaan...</p>
            ) : categoryStatus.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-8 text-center">
                <Boxes className="mx-auto size-8 text-muted-foreground/60" aria-hidden="true" />
                <p className="mt-3 font-medium">Belum ada data kategori</p>
                <p className="mt-1 text-sm text-muted-foreground">Tambahkan kategori dan barang untuk mulai memantau persediaan.</p>
                <Link to="/products" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  Kelola barang <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {categoryStatus.map((category) => (
                  <div key={category.id} className="rounded-xl border border-border/80 bg-background/70 p-4 transition hover:border-primary/30 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                          <Package className="size-[18px]" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{category.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{category.itemCount} jenis · {category.units.toLocaleString('id-ID')} unit</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${category.lowCount ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {category.lowCount ? `${category.lowCount} menipis` : 'Aman'}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
                        <span>Kondisi stok</span><span>{category.safePercent}% aman</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full transition-all ${category.lowCount ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${category.safePercent}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base">Perlu restok</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Barang yang stoknya di bawah minimum</p>
            </div>
            <div className={`flex size-9 items-center justify-center rounded-xl ${lowStock.length ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {lowStock.length ? <ArrowDownRight className="size-5" aria-hidden="true" /> : <Check className="size-5" aria-hidden="true" />}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="rounded-xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">Memeriksa stok...</p>
            ) : lowStock.length === 0 ? (
              <div className="rounded-xl bg-emerald-50/80 px-4 py-7 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-5" aria-hidden="true" />
                </div>
                <p className="mt-3 font-semibold text-emerald-900">Stok aman</p>
                <p className="mt-1 text-sm text-emerald-800/75">Belum ada barang yang perlu segera di-restok.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {lowStock.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-amber-700">{product.stock} / {product.minStock}</p>
                      <p className="text-[11px] text-muted-foreground">stok / minimum</p>
                    </div>
                  </div>
                ))}
                {lowStock.length > 5 && (
                  <p className="pt-3 text-xs text-muted-foreground">dan {lowStock.length - 5} barang lainnya perlu diperiksa</p>
                )}
              </div>
            )}
            <Link to="/stock" className="mt-4 flex items-center justify-between rounded-xl bg-muted/70 px-3 py-2.5 text-sm font-medium transition hover:bg-secondary">
              Lihat daftar stok
              <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {shortcuts.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="group flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <span className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
          </Link>
        ))}
      </section>
    </AppLayout>
  )
}
