import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBasket,
  Warehouse,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUser, setToken, setUser } from '@/lib/api'

const links = [
  { to: '/', label: 'Ringkasan', icon: LayoutDashboard },
  { to: '/products', label: 'Barang', icon: Package },
  { to: '/stock', label: 'Stok', icon: ArrowLeftRight },
  { to: '/warehouse', label: 'Gudang', icon: Warehouse },
  { to: '/sales', label: 'Kasir', icon: ShoppingBasket },
]

export default function AppLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  const user = getUser()

  function logout() {
    setToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }

  const initials = user?.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShoppingBasket className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold tracking-tight">Toko Upacara</p>
              <p className="text-xs text-muted-foreground">Sistem manajemen toko</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden items-center gap-2.5 sm:flex">
                <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                  {initials}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{user.role.toLowerCase()}</p>
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={logout} className="gap-2">
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] md:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-border/80 bg-card/60 px-3 py-3 md:sticky md:top-[68px] md:h-[calc(100vh-68px)] md:border-r md:border-b-0 md:px-4 md:py-7">
          <p className="mb-3 hidden px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground md:block">
            Menu utama
          </p>
          <nav aria-label="Navigasi utama" className="flex gap-1 overflow-x-auto md:flex-col">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                  }`
                }
              >
                <Icon className="size-[18px]" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 hidden rounded-2xl bg-secondary/70 p-4 md:block">
            <p className="text-sm font-semibold text-secondary-foreground">Kelola toko lebih mudah</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Pantau stok, atur lokasi barang, dan layani transaksi dari satu tempat.
            </p>
          </div>
        </aside>
        <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">
          <div className="mb-6">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-primary">Toko Upacara</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
