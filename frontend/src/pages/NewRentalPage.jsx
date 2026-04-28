import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, Trash2, Loader2, Calculator } from 'lucide-react'
import { formatCurrency, EQUIPMENT_TYPES } from '../utils'

export default function NewRentalPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState({ clientId: '', startDate: '', endDate: '', address: '', notes: '' })
  const [items, setItems] = useState([])
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: () => api.get('/clients').then(r => r.data) })
  const { data: equipments } = useQuery({ queryKey: ['equipments'], queryFn: () => api.get('/equipments').then(r => r.data) })

  const totalDays = (() => {
    if (!form.startDate || !form.endDate) return 0
    const diff = new Date(form.endDate) - new Date(form.startDate)
    return Math.max(0, Math.ceil(diff / 86400000))
  })()

  const totalAmount = items.reduce((acc, item) => {
    const eq = equipments?.find(e => e.id === item.equipmentId)
    return acc + (eq ? parseFloat(eq.dailyRate) * item.quantity * totalDays : 0)
  }, 0)

  const addItem = () => setItems(p => [...p, { equipmentId: '', quantity: 1 }])
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i))
  const setItem = (i, k, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it))

  const selectedClient = clients?.find(c => c.id === form.clientId)

  // Auto-fill address when client is selected
  const handleClientChange = (clientId) => {
    set('clientId', clientId)
    const client = clients?.find(c => c.id === clientId)
    if (client) set('address', `${client.address}, ${client.city} – ${client.state}`)
  }

  const create = useMutation({
    mutationFn: d => api.post('/rentals', d),
    onSuccess: () => {
      toast.success('Locação criada com sucesso!')
      qc.invalidateQueries(['rentals'])
      qc.invalidateQueries(['dashboard'])
      qc.invalidateQueries(['equipments'])
      navigate('/rentals')
    },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao criar locação'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (items.length === 0) return toast.error('Adicione ao menos um equipamento')
    if (items.some(i => !i.equipmentId)) return toast.error('Selecione todos os equipamentos')
    if (totalDays === 0) return toast.error('Datas inválidas')
    create.mutate({ ...form, items })
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/rentals')} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Nova Locação</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Client & Dates */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Dados Gerais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Cliente *</label>
              <select className="input" required value={form.clientId} onChange={e => handleClientChange(e.target.value)}>
                <option value="">Selecione um cliente...</option>
                {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Data de Início *</label>
              <input className="input" type="date" required value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Data de Fim *</label>
              <input className="input" type="date" required value={form.endDate} min={form.startDate} onChange={e => set('endDate', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Endereço de Entrega *</label>
              <input className="input" required value={form.address} onChange={e => set('address', e.target.value)} placeholder="Endereço completo" />
            </div>
            <div className="col-span-2">
              <label className="label">Observações</label>
              <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Ex: obra 3° andar, portão azul..." />
            </div>
          </div>
        </div>

        {/* Equipment Items */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Equipamentos</h2>
            <button type="button" className="btn-secondary text-sm" onClick={addItem}>
              <Plus size={14} /> Adicionar
            </button>
          </div>

          {items.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
              Clique em "Adicionar" para incluir equipamentos
            </div>
          )}

          {items.map((item, i) => {
            const eq = equipments?.find(e => e.id === item.equipmentId)
            const itemTotal = eq ? parseFloat(eq.dailyRate) * item.quantity * totalDays : 0
            return (
              <div key={i} className="grid grid-cols-12 gap-3 items-end p-3 bg-slate-50 rounded-lg">
                <div className="col-span-6">
                  <label className="label">Equipamento</label>
                  <select className="input" value={item.equipmentId} onChange={e => setItem(i, 'equipmentId', e.target.value)}>
                    <option value="">Selecionar...</option>
                    {equipments?.filter(e => e.availableQuantity > 0 || e.id === item.equipmentId).map(e => (
                      <option key={e.id} value={e.id}>{e.name} (disp: {e.availableQuantity})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Qtd</label>
                  <input className="input" type="number" min="1"
                    max={eq ? eq.availableQuantity : undefined}
                    value={item.quantity}
                    onChange={e => setItem(i, 'quantity', parseInt(e.target.value) || 1)} />
                </div>
                <div className="col-span-3 text-sm">
                  <label className="label">Subtotal</label>
                  <div className="py-2 px-3 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700">
                    {formatCurrency(itemTotal)}
                  </div>
                </div>
                <div className="col-span-1">
                  <button type="button" onClick={() => removeItem(i)} className="p-2 hover:bg-red-50 rounded-lg w-full flex justify-center">
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="card p-5 bg-slate-800 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Calculator size={18} className="text-blue-400" />
            <h2 className="font-semibold">Resumo</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <p className="text-slate-400">Período</p>
              <p className="font-bold text-lg">{totalDays} dias</p>
            </div>
            <div>
              <p className="text-slate-400">Itens</p>
              <p className="font-bold text-lg">{items.length}</p>
            </div>
            <div>
              <p className="text-slate-400">Total Estimado</p>
              <p className="font-bold text-lg text-blue-400">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full justify-center py-3 bg-blue-500 hover:bg-blue-400" disabled={create.isPending}>
            {create.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Locação'}
          </button>
        </div>
      </form>
    </div>
  )
}
