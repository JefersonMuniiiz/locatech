import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'
import Table from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import { Plus, Search, Pencil, Trash2, Loader2, Phone, MapPin } from 'lucide-react'

const EMPTY = { name: '', phone: '', document: '', email: '', address: '', city: '', state: '', zipCode: '', notes: '' }

export default function ClientsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => api.get('/clients', { params: { search } }).then(r => r.data),
  })

  const save = useMutation({
    mutationFn: d => editing ? api.put(`/clients/${editing.id}`, d) : api.post('/clients', d),
    onSuccess: () => { toast.success(editing ? 'Cliente atualizado!' : 'Cliente criado!'); qc.invalidateQueries(['clients']); closeModal() },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao salvar'),
  })

  const remove = useMutation({
    mutationFn: id => api.delete(`/clients/${id}`),
    onSuccess: () => { toast.success('Cliente removido!'); qc.invalidateQueries(['clients']) },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao remover'),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (c) => { setEditing(c); setForm(c); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const columns = [
    {
      header: 'Cliente',
      render: r => (
        <div>
          <p className="font-medium text-slate-800">{r.name}</p>
          <p className="text-xs text-slate-400">{r.document}</p>
        </div>
      )
    },
    { header: 'Contato', render: r => <div className="flex items-center gap-1 text-sm"><Phone size={13} className="text-slate-400" />{r.phone}</div> },
    { header: 'Cidade', render: r => <div className="flex items-center gap-1 text-sm"><MapPin size={13} className="text-slate-400" />{r.city} – {r.state}</div> },
    { header: 'Locações', render: r => <span className="font-mono text-slate-600">{r._count?.rentals ?? 0}</span> },
    {
      header: '', className: 'w-20',
      render: r => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-slate-100 rounded-lg"><Pencil size={14} className="text-slate-500" /></button>
          <button onClick={() => { if (confirm('Remover cliente?')) remove.mutate(r.id) }} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-500" /></button>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Novo Cliente</button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Buscar por nome, documento ou telefone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card"><Table columns={columns} data={data} loading={isLoading} /></div>

      <Modal open={modal} onClose={closeModal} title={editing ? 'Editar Cliente' : 'Novo Cliente'} size="lg">
        <form onSubmit={e => { e.preventDefault(); save.mutate(form) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nome completo / Razão Social *</label>
              <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">CPF / CNPJ *</label>
              <input className="input" required value={form.document} onChange={e => set('document', e.target.value)} />
            </div>
            <div>
              <label className="label">Telefone *</label>
              <input className="input" required value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">E-mail</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Endereço *</label>
              <input className="input" required value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div>
              <label className="label">Cidade *</label>
              <input className="input" required value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className="label">Estado *</label>
              <input className="input" required maxLength={2} value={form.state} onChange={e => set('state', e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="label">CEP</label>
              <input className="input" value={form.zipCode} onChange={e => set('zipCode', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Observações</label>
              <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
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
