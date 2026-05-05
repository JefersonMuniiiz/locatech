import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { TrendingUp, TrendingDown, DollarSign, Clock, Plus, Trash2, Pencil, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, PAYMENT_METHODS } from '../utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { format, subMonths } from 'date-fns'

const CATEGORIES = {
  MAINTENANCE: 'Manutenção',
  FUEL: 'Combustível',
  SALARY: 'Salários',
  RENT: 'Aluguel',
  SUPPLIES: 'Suprimentos',
  TRANSPORT: 'Transporte',
  TAX: 'Impostos',
  OTHER: 'Outros',
}

const EQUIPMENT_TYPES = {
  SCAFFOLD: 'Andaime',
  PROP: 'Escora',
  CONCRETE_MIXER: 'Betoneira',
  MACHINE: 'Máquina',
  TOOL: 'Ferramenta',
  OTHER: 'Outros',
}

const PIE_COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#64748b']

const EMPTY_FORM = { description: '', category: 'MAINTENANCE', amount: '', paidAt: format(new Date(), 'yyyy-MM-dd'), method: 'PIX', notes: '' }

export default function CashFlowPage() {
  const qc = useQueryClient()
  const now = new Date()
  const [startDate, setStartDate] = useState(format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd'))
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [activeTab, setActiveTab] = useState('overview')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const { data, isLoading } = useQuery({
    queryKey: ['cashflow', startDate, endDate],
    queryFn: () => api.get('/cashflow', { params: { startDate, endDate } }).then(r => r.data),
  })

  const save = useMutation({
    mutationFn: d => editing ? api.put(`/expenses/${editing.id}`, d) : api.post('/expenses', d),
    onSuccess: () => {
      toast.success(editing ? 'Despesa atualizada!' : 'Despesa registrada!')
      qc.invalidateQueries(['cashflow'])
      setModal(false); setEditing(null); setForm(EMPTY_FORM)
    },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao salvar'),
  })

  const remove = useMutation({
    mutationFn: id => api.delete(`/expenses/${id}`),
    onSuccess: () => { toast.success('Despesa removida!'); qc.invalidateQueries(['cashflow']) },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao remover'),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  const openEdit = (e) => {
    setEditing(e)
    setForm({ description: e.description, category: e.category, amount: e.amount, paidAt: e.paidAt?.split('T')[0], method: e.method || 'PIX', notes: e.notes || '' })
    setModal(true)
  }

  const pieDataExpenses = Object.entries(data?.byCategory || {}).map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }))
  const pieDataRevenue = Object.entries(data?.byEquipmentType || {}).map(([key, value], i) => ({ name: EQUIPMENT_TYPES[key] || key, value, color: PIE_COLORS[i % PIE_COLORS.length] }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fluxo de Caixa</h1>
          <p className="text-slate-500 text-sm">Saúde financeira da sua empresa</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <input type="date" className="input w-36" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="text-slate-400">até</span>
            <input type="date" className="input w-36" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Nova Despesa</button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><TrendingUp size={20} className="text-green-600" /></div>
            <div>
              <p className="text-xs text-slate-500">Receitas Recebidas</p>
              <p className="text-xl font-bold text-green-600">{isLoading ? '—' : formatCurrency(data?.totalReceitas)}</p>
              {data?.pctReceitas && (
                <p className={`text-xs ${Number(data.pctReceitas) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Number(data.pctReceitas) >= 0 ? '↑' : '↓'} {Math.abs(data.pctReceitas)}% vs mês anterior
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg"><TrendingDown size={20} className="text-red-600" /></div>
            <div>
              <p className="text-xs text-slate-500">Despesas Pagas</p>
              <p className="text-xl font-bold text-red-600">{isLoading ? '—' : formatCurrency(data?.totalDespesas)}</p>
              {data?.pctDespesas && (
                <p className={`text-xs ${Number(data.pctDespesas) <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Number(data.pctDespesas) >= 0 ? '↑' : '↓'} {Math.abs(data.pctDespesas)}% vs mês anterior
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={`card p-5 border-l-4 ${(data?.saldo || 0) >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${(data?.saldo || 0) >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <DollarSign size={20} className={(data?.saldo || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Saldo do Período</p>
              <p className={`text-xl font-bold ${(data?.saldo || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {isLoading ? '—' : formatCurrency(data?.saldo)}
              </p>
              <p className="text-xs text-slate-400">Receitas − Despesas</p>
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg"><Clock size={20} className="text-yellow-600" /></div>
            <div>
              <p className="text-xs text-slate-500">A Receber</p>
              <p className="text-xl font-bold text-yellow-600">{isLoading ? '—' : formatCurrency(data?.totalPendente)}</p>
              <p className="text-xs text-slate-400">Pagamentos pendentes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de barras 6 meses */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Evolução dos Últimos 6 Meses</h2>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block"></span>Receitas</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block"></span>Despesas</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>Saldo</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data?.chartData || []} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="receita" name="Receitas" fill="#22c55e" radius={[4,4,0,0]} />
            <Bar dataKey="despesa" name="Despesas" fill="#f87171" radius={[4,4,0,0]} />
            <Bar dataKey="saldo" name="Saldo" fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pizza charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Receita por Tipo de Equipamento</h2>
          {pieDataRevenue.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Nenhuma receita no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieDataRevenue} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieDataRevenue.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Despesas por Categoria</h2>
          {pieDataExpenses.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Nenhuma despesa no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieDataExpenses} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieDataExpenses.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabs receitas/despesas */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
            Resumo Anual
          </button>
          <button onClick={() => setActiveTab('expenses')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'expenses' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
            Despesas do Período
          </button>
          <button onClick={() => setActiveTab('revenues')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'revenues' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
            Receitas do Período
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="p-5">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Total Receitas</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(data?.totalReceitas)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Total Despesas</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(data?.totalDespesas)}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">A Receber</p>
                <p className="text-lg font-bold text-yellow-600">{formatCurrency(data?.totalPendente)}</p>
              </div>
              <div className={`p-4 rounded-lg ${(data?.saldo || 0) >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <p className="text-xs text-slate-500 mb-1">Saldo</p>
                <p className={`text-lg font-bold ${(data?.saldo || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(data?.saldo)}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div>
            {!data?.recentExpenses?.length ? (
              <p className="text-center text-slate-400 text-sm py-8">Nenhuma despesa no período</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Data</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Descrição</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Categoria</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-600">Valor</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Pagamento</th>
                  <th className="py-3 px-4 w-20"></th>
                </tr></thead>
                <tbody>
                  {data.recentExpenses.map(e => (
                    <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500">{formatDate(e.paidAt)}</td>
                      <td className="py-3 px-4 font-medium">{e.description}</td>
                      <td className="py-3 px-4"><span className="badge bg-slate-100 text-slate-600">{CATEGORIES[e.category]}</span></td>
                      <td className="py-3 px-4 text-right font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                      <td className="py-3 px-4 text-slate-500">{PAYMENT_METHODS[e.method] || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(e)} className="p-1.5 hover:bg-slate-100 rounded"><Pencil size={13} className="text-slate-500" /></button>
                          <button onClick={() => { if (confirm('Remover despesa?')) remove.mutate(e.id) }} className="p-1.5 hover:bg-red-50 rounded"><Trash2 size={13} className="text-red-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'revenues' && (
          <div>
            {!data?.recentPayments?.length ? (
              <p className="text-center text-slate-400 text-sm py-8">Nenhuma receita no período</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Data</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Cliente</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-600">Valor</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Forma</th>
                </tr></thead>
                <tbody>
                  {data.recentPayments.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500">{formatDate(p.paidAt)}</td>
                      <td className="py-3 px-4 font-medium">{p.rental?.client?.name || '—'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">{formatCurrency(p.totalAmount)}</td>
                      <td className="py-3 px-4 text-slate-500">{PAYMENT_METHODS[p.method] || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal despesa */}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); setForm(EMPTY_FORM) }} title={editing ? 'Editar Despesa' : 'Nova Despesa'}>
        <form onSubmit={e => { e.preventDefault(); save.mutate(form) }} className="space-y-4">
          <div>
            <label className="label">Descrição *</label>
            <input className="input" required value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ex: Revisão do caminhão" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoria *</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Valor (R$) *</label>
              <input className="input" type="number" step="0.01" min="0.01" required value={form.amount}
                onChange={e => set('amount', e.target.value)} onFocus={e => e.target.select()} />
            </div>
            <div>
              <label className="label">Data de Pagamento *</label>
              <input className="input" type="date" required value={form.paidAt} onChange={e => set('paidAt', e.target.value)} />
            </div>
            <div>
              <label className="label">Forma de Pagamento</label>
              <select className="input" value={form.method} onChange={e => set('method', e.target.value)}>
                {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => { setModal(false); setEditing(null); setForm(EMPTY_FORM) }}>Cancelar</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={save.isPending}>
              {save.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
