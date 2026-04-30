import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Badge from '../components/ui/Badge'
import { Plus, ArrowRight, FileText, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { formatCurrency, formatDate, RENTAL_STATUS, PAYMENT_STATUS } from '../utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: rentals } = useQuery({
    queryKey: ['rentals-dash'],
    queryFn: () => api.get('/rentals').then(r => r.data),
  })

  // Monta gráfico dos últimos 6 meses
  const chartData = (() => {
    if (!rentals) return []
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      const key = format(date, 'yyyy-MM')
      const label = format(date, 'MMM', { locale: ptBR })
      return { key, label }
    })

    return months.map(({ key, label }) => {
      const monthRentals = rentals.filter(r => r.startDate?.startsWith(key))
      const recebido = monthRentals
        .filter(r => r.payment?.status === 'PAID')
        .reduce((s, r) => s + Number(r.payment.totalAmount), 0)
      const pendente = monthRentals
        .filter(r => r.payment?.status !== 'PAID')
        .reduce((s, r) => s + Number(r.payment?.totalAmount || 0), 0)
      return { label, recebido, pendente }
    })
  })()

  const activeRentals = rentals?.filter(r => r.status === 'ACTIVE') || []
  const delayedRentals = rentals?.filter(r => r.status === 'DELAYED') || []
  const pendingPayments = rentals?.filter(r =>
    (r.status === 'COMPLETED' || r.status === 'DELAYED') && r.payment?.status !== 'PAID'
  ) || []

  const now = new Date()
  const in3days = new Date(now.getTime() + 3 * 86400000)
  const dueSoon = rentals?.filter(r => {
    if (r.status !== 'ACTIVE') return false
    const end = new Date(r.endDate)
    return end >= now && end <= in3days
  }) || []

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-slate-700 mb-1 capitalize">{label}</p>
        <p className="text-green-600">Recebido: {formatCurrency(payload[0]?.value)}</p>
        <p className="text-yellow-600">Pendente: {formatCurrency(payload[1]?.value)}</p>
      </div>
    )
  }

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

      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><FileText size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Locações Ativas</p>
              <p className="text-2xl font-bold text-blue-600">{isLoading ? '—' : activeRentals.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle size={20} className="text-red-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Atrasadas</p>
              <p className="text-2xl font-bold text-red-600">{isLoading ? '—' : delayedRentals.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg"><Clock size={20} className="text-yellow-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Vencem em 3 dias</p>
              <p className="text-2xl font-bold text-yellow-600">{isLoading ? '—' : dueSoon.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><DollarSign size={20} className="text-green-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Receita do Mês</p>
              <p className="text-xl font-bold text-green-600">{isLoading ? '—' : formatCurrency(data?.monthRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de receita */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800">Receita dos Últimos 6 Meses</h2>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block"></span>Recebido</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block"></span>Pendente</span>
          </div>
        </div>
        {chartData.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">Nenhum dado ainda</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="recebido" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pendente" fill="#facc15" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Locações ativas */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-blue-500" /> Locações Ativas
            </h2>
            <Link to="/rentals?status=ACTIVE" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>
          {activeRentals.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">Nenhuma locação ativa</p>
          ) : (
            activeRentals.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.client?.name}</p>
                  <p className="text-xs text-slate-400">Devolução: {formatDate(r.endDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">{formatCurrency(r.totalAmount)}</p>
                  <Badge {...PAYMENT_STATUS[r.payment?.status || 'PENDING']} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Alertas */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" /> Requer Atenção
            </h2>
            <Link to="/alerts" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>

          {delayedRentals.length === 0 && dueSoon.length === 0 && pendingPayments.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle size={28} className="mx-auto text-green-400 mb-2" />
              <p className="text-slate-400 text-sm">Tudo em ordem! 🎉</p>
            </div>
          ) : (
            <>
              {delayedRentals.slice(0, 2).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.client?.name}</p>
                    <p className="text-xs text-red-500">Atrasada desde {formatDate(r.endDate)}</p>
                  </div>
                  <Badge {...RENTAL_STATUS.DELAYED} />
                </div>
              ))}
              {dueSoon.slice(0, 2).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.client?.name}</p>
                    <p className="text-xs text-yellow-600">Vence em {formatDate(r.endDate)}</p>
                  </div>
                  <Badge {...RENTAL_STATUS.ACTIVE} />
                </div>
              ))}
              {pendingPayments.slice(0, 2).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.client?.name}</p>
                    <p className="text-xs text-slate-400">Pagamento pendente</p>
                  </div>
                  <Badge {...PAYMENT_STATUS.PENDING} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
