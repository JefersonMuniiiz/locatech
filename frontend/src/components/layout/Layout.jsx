import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import {
  LayoutDashboard, Package, Users, FileText, DollarSign, TrendingUp,
  Truck, LogOut, Building2, Menu, Bell, BarChart2, UserCog, MessageCircle
} from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const { user, company, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const { data: rentals } = useQuery({
    queryKey: ['rentals-alert-count'],
    queryFn: () => api.get('/rentals').then(r => r.data),
    refetchInterval: 60_000,
  })
  const alertCount = rentals ? rentals.filter(r =>
    r.status === 'DELAYED' ||
    (r.status === 'ACTIVE' && new Date(r.endDate) <= new Date(Date.now() + 3 * 86400000))
  ).length : 0

  const nav = [
    { to: '/',           icon: LayoutDashboard, label: 'Dashboard',    end: true },
    { to: '/equipments', icon: Package,         label: 'Equipamentos' },
    { to: '/clients',    icon: Users,           label: 'Clientes' },
    { to: '/rentals',    icon: FileText,        label: 'Locações' },
    { to: '/financial',  icon: DollarSign,      label: 'Financeiro' },
    { to: '/deliveries', icon: Truck,           label: 'Entregas' },
    { to: '/reports',    icon: BarChart2,       label: 'Relatórios' },
    { to: '/alerts',     icon: Bell,            label: 'Alertas', badge: alertCount },
    { to: '/whatsapp',   icon: MessageCircle,   label: 'WhatsApp' },
    { to: '/cashflow',  icon: TrendingUp,     label: 'Fluxo de Caixa' },
    ...(user?.role === 'ADMIN' ? [{ to: '/users', icon: UserCog, label: 'Usuários' }] : []),
  ]

  const handleLogout = () => { logout(); navigate('/login') }

  const Sidebar = ({ mobile }) => (
    <aside className={`${mobile ? 'flex' : 'hidden lg:flex'} flex-col w-64 bg-slate-900 text-white min-h-screen`}>
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Building2 size={16} />
          </div>
          <span className="font-bold text-lg">LocaTech</span>
        </div>
        <p className="text-slate-400 text-xs truncate">{company?.name}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to} to={to} end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role === 'ADMIN' ? 'Administrador' : 'Operador'}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors w-full">
          <LogOut size={16} /> Sair
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-10"><Sidebar mobile /></div>
        </div>
      )}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="p-1"><Menu size={22} /></button>
          <span className="font-bold text-blue-600">LocaTech</span>
          {alertCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{alertCount}</span>
          )}
        </header>
        <div className="flex-1 p-6 max-w-screen-xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
