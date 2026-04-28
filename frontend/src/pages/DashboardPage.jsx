import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../services/api'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import { Package, FileText, DollarSign, AlertTriangle, Plus, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate, RENTAL_STATUS, PAYMENT_STATUS } from '../utils'

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    refetchInterval: 60_000,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Visão geral do seu negócio</p>
        </div>
        <Link to="/rentals/new" className="btn-primary">
          <Plus size={16} /> Nova Locação
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Equipamentos" value={isLoading ? '—' : data?.totalEquipments} icon={Package} color="blue" />
        <StatCard title="Equipamentos Locados" value={isLoading ? '—' : data?.rentedEquipments} subtitle={`${data?.availableEquipments ?? '—'} disponíveis`} icon={FileText} color="purple" />
        <StatCard title="Receita do Mês" value={isLoading ? '—' : formatCurrency(data?.monthRevenue)} icon={DollarSign} color="green" />
        <StatCard title="Locações Atrasadas" value={isLoading ? '—' : data?.delayedCount} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Delayed alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" /> Alertas de Atraso
            </h2>
            <Link to="/rentals?status=DELAYED" className="text-blue-600 text-sm hover:underline flex items-center gap-1">Ver todas <ArrowRight size={14} /></Link>
          </div>
          {isLoading ? <p className="text-slate-400 text-sm">Carregando...</p> :
            data?.delayedRentals?.length === 0
              ? <p className="text-slate-400 text-sm py-4 text-center">Nenhuma locação atrasada 🎉</p>
              : data?.delayedRentals?.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.client.name}</p>
                    <p className="text-xs text-slate-400">Venceu em {formatDate(r.endDate)}</p>
                  </div>
                  <div className="text-right">
                    <Badge {...RENTAL_STATUS.DELAYED} />
                    <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(r.payment?.totalAmount)}</p>
                  </div>
                </div>
              ))
          }
        </div>

        {/* Recent rentals */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Locações Recentes</h2>
            <Link to="/rentals" className="text-blue-600 text-sm hover:underline flex items-center gap-1">Ver todas <ArrowRight size={14} /></Link>
          </div>
          {isLoading ? <p className="text-slate-400 text-sm">Carregando...</p> :
            data?.recentRentals?.length === 0
              ? <p className="text-slate-400 text-sm py-4 text-center">Nenhuma locação ainda</p>
              : data?.recentRentals?.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.client?.name}</p>
                    <p className="text-xs text-slate-400">{formatDate(r.startDate)} → {formatDate(r.endDate)}</p>
                  </div>
                  <div className="text-right">
                    <Badge {...RENTAL_STATUS[r.status]} />
                    <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(r.totalAmount)}</p>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
