import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'
import Table from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { Plus, Pencil, Trash2, Loader2, Shield, User } from 'lucide-react'
import { formatDate } from '../utils'

const EMPTY = { name: '', email: '', password: '', role: 'OPERATOR' }

export default function UsersPage() {
  const qc = useQueryClient()
  const { user: me } = useAuth()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  })

  const save = useMutation({
    mutationFn: d => editing ? api.put(`/users/${editing.id}`, d) : api.post('/users', d),
    onSuccess: () => { toast.success(editing ? 'Usuário atualizado!' : 'Usuário criado!'); qc.invalidateQueries(['users']); closeModal() },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao salvar'),
  })

  const remove = useMutation({
    mutationFn: id => api.delete(`/users/${id}`),
    onSuccess: () => { toast.success('Usuário removido!'); qc.invalidateQueries(['users']) },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao remover'),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = u => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null); setForm(EMPTY) }
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const columns = [
    {
      header: 'Usuário',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
            {r.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-800">{r.name} {r.id === me?.id && <span className="text-xs text-slate-400">(você)</span>}</p>
            <p className="text-xs text-slate-400">{r.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Perfil',
      render: r => (
        <div className="flex items-center gap-1.5">
          {r.role === 'ADMIN'
            ? <><Shield size={14} className="text-blue-600" /><span className="text-sm text-blue-700 font-medium">Administrador</span></>
            : <><User size={14} className="text-slate-500" /><span className="text-sm text-slate-600">Operador</span></>
          }
        </div>
      )
    },
    { header: 'Cadastrado em', render: r => formatDate(r.createdAt) },
    {
      header: '', className: 'w-20',
      render: r => r.id !== me?.id && (
        <div className="flex gap-1">
          <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-slate-100 rounded-lg"><Pencil size={14} className="text-slate-500" /></button>
          <button onClick={() => { if (confirm(`Remover ${r.name}?`)) remove.mutate(r.id) }} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-500" /></button>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie quem tem acesso ao sistema</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Novo Usuário</button>
      </div>

      <div className="card p-4 bg-blue-50 border-blue-200 text-blue-800 text-sm flex items-start gap-2">
        <Shield size={16} className="mt-0.5 shrink-0" />
        <div>
          <strong>Administrador:</strong> acesso total ao sistema, incluindo configurações e usuários.<br />
          <strong>Operador:</strong> acesso a equipamentos, clientes, locações e entregas. Sem acesso a usuários e configurações.
        </div>
      </div>

      <div className="card"><Table columns={columns} data={data} loading={isLoading} emptyMsg="Nenhum usuário cadastrado" /></div>

      <Modal open={modal} onClose={closeModal} title={editing ? 'Editar Usuário' : 'Novo Usuário'}>
        <form onSubmit={e => { e.preventDefault(); save.mutate(form) }} className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">E-mail *</label>
            <input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="label">{editing ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha *'}</label>
            <input className="input" type="password" minLength={editing ? 0 : 6} required={!editing} value={form.password} onChange={e => set('password', e.target.value)} placeholder={editing ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'} />
          </div>
          <div>
            <label className="label">Perfil *</label>
            <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="OPERATOR">Operador</option>
              <option value="ADMIN">Administrador</option>
            </select>
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
