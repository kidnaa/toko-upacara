import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Boxes, CircleCheck, Package, ShoppingBasket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, setToken, setUser, type AuthUser } from '@/lib/api'

type LoginResponse = { token: string; user: AuthUser }

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(data.token)
      setUser(data.user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-border/80 bg-card shadow-xl shadow-primary/[0.06] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-[#173d2d] p-10 text-white lg:flex xl:p-14">
          <div aria-hidden="true" className="absolute -right-20 top-12 size-80 rounded-full border-[48px] border-white/[0.06]" />
          <div aria-hidden="true" className="absolute -bottom-24 -left-20 size-72 rounded-full bg-white/[0.04]" />
          <div className="relative flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
              <ShoppingBasket className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold tracking-tight">Toko Upacara</p>
              <p className="text-xs text-white/65">Sistem manajemen toko</p>
            </div>
          </div>
          <div className="relative max-w-lg py-12">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-emerald-100/75">Selamat datang kembali</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Semua urusan toko, lebih tertata.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">
              Kelola stok, temukan lokasi barang, dan layani pelanggan dari satu dashboard sederhana.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { label: 'Pantau stok dan barang menipis', icon: CircleCheck },
                { label: 'Kelola kategori dan lokasi rak', icon: Boxes },
                { label: 'Proses transaksi dengan cepat', icon: Package },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-white/85">
                  <Icon className="size-4 text-emerald-200" aria-hidden="true" />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-white/50">Satu tempat untuk operasional toko harian Anda.</p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ShoppingBasket className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">Toko Upacara</p>
                <p className="text-xs text-muted-foreground">Sistem manajemen toko</p>
              </div>
            </div>
            <p className="text-sm font-medium text-primary">Masuk ke akun Anda</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Selamat datang</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Masukkan email dan kata sandi untuk melanjutkan ke dashboard toko.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl bg-background"
                />
              </div>
              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </p>
              )}
              <Button type="submit" className="h-11 w-full gap-2 rounded-xl" disabled={loading}>
                {loading ? 'Memeriksa akun...' : 'Masuk'}
                {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
              </Button>
            </form>
            <p className="mt-8 text-center text-xs text-muted-foreground">
              Akses khusus pemilik dan petugas toko.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
