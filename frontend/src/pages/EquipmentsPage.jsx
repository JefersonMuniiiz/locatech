import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'
import Table from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react'
import { formatCurrency, EQUIPMENT_STATUS, EQUIPMENT_TYPES } from '../utils'

const EMPTY = { name: '', type: 'SCAFFOLD', totalQuantity: 1, availableQuantity: 1, dailyRate: '', status: 'AVAILABLE', description: '', serialNumber: '' }

export default function EquipmentsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const { data, isLoading } = useQuery({
    queryKey: ['equipments', search],
    queryFn: () => api.get('/equipments', { params: { search } }).then(r => r.data),
  })

  const save = useMutation({
    mutationFn: d => editing ? api.put(`/equipments/${editing.id}`, d) : api.post('/equipments', d),
    onSuccess: () => { toast.success(editing ? 'Equipamento atualizado!' : 'Equipamento criado!'); qc.invalidateQueries(['equipments']); closeModal() },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao salvar'),
  })

  const remove = useMutation({
    mutationFn: id => api.delete(`/equipments/${id}`),
    onSuccess: () => { toast.success('Equipamento removido!'); qc.invalidateQueries(['equipments']) },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao remover'),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (eq) => { setEditing(eq); setForm({ ...eq, dailyRate: eq.dailyRate }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null); setForm(EMPTY) }
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    save.mutate({ ...form, dailyRate: parseFloat(form.dailyRate), totalQuantity: parseInt(form.totalQuantity), availableQuantity: editing ? parseInt(form.availableQuantity) : parseInt(form.totalQuantity) })
  }

  const columns = [
    { header: 'Nome', render: r => <div><p className="font-medium text-slate-800">{r.name}</p><p className="text-xs text-slate-400">{r.serialNumber || '—'}</p></div> },
    { header: 'Tipo', render: r => EQUIPMENT_TYPES[r.type] },
    { header: 'Total', render: r => <span className="font-mono">{r.totalQuantity}</span> },
    { header: 'Disponível', render: r => <span className="font-mono font-semibold text-green-600">{r.availableQuantity}</span> },
    { header: 'Diária', render: r => formatCurrency(r.dailyRate) },
    { header: 'Status', render: r => <Badge {...EQUIPMENT_STATUS[r.status]} /> },
    {
      header: '', className: 'w-20',
      render: r => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-slate-100 rounded-lg"><Pencil size={14} className="text-slate-500" /></button>
          <button onClick={() => { if (confirm('Remover equipamento?')) remove.mutate(r.id) }} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-500" /></button>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Equipamentos</h1>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Novo Equipamento</button>
      </div>

      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card"><Table columns={columns} data={data} loading={isLoading} /></div>

      <Modal open={modal} onClose={closeModal} title={editing ? 'Editar Equipamento' : 'Novo Equipamento'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nome *</label>
              <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Tipo *</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                {Object.entries(EQUIPMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(EQUIPMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Qtd Total *</label>
              <input className="input" type="number" min="1" required value={form.totalQuantity} onChange={e => set('totalQuantity', e.target.value)} />
            </div>
            {editing && (
              <div>
                <label className="label">Qtd Disponível</label>
                <input className="input" type="number" min="0" value={form.availableQuantity} onChange={e => set('availableQuantity', e.target.value)} />
              </div>
            )}
            <div>
              <label className="label">Valor Diária (R$) *</label>
              <input className="input" type="number" step="0.01" min="0" required value={form.dailyRate} onChange={e => set('dailyRate', e.target.value)} />
            </div>
            <div>
              <label className="label">Nº de Série</label>
              <input className="input" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Descrição</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1 justify-center" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={save.isPending}>
              {save.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
