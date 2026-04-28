import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { Plus, Trash2, Loader2, AlertTriangle, Wrench } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils'

export default function DamageFinesModal({ open, onClose, rental }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ description: '', amount: '', equipmentId: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const { data: fines, isLoading } = useQuery({
    queryKey: ['damage-fines', rental?.id],
    queryFn: () => api.get(`/rentals/${rental.id}/damages`).then(r => r.data),
    enabled: !!rental?.id && open,
  })

  const add = useMutation({
    mutationFn: () => api.post(`/rentals/${rental.id}/damages`, {
      ...form,
      amount: parseFloat(form.amount),
      equipmentId: form.equipmentId || undefined,
    }),
    onSuccess: () => {
      toast.success('Multa registrada!')
      qc.invalidateQueries(['damage-fines', rental.id])
      qc.invalidateQueries(['rentals'])
      setForm({ description: '', amount: '', equipmentId: '' })
    },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao registrar'),
  })

  const remove = useMutation({
    mutationFn: (fineId) => api.delete(`/rentals/${rental.id}/damages/${fineId}`),
    onSuccess: () => {
      toast.success('Multa removida!')
      qc.invalidateQueries(['damage-fines', rental.id])
      qc.invalidateQueries(['rentals'])
    },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao remover'),
  })

  const totalDamages = fines?.reduce((s, f) => s + Number(f.amount), 0) || 0

  if (!rental) return null

  return (
    <Modal open={open} onClose={onClose} title="Multas por Danos / Perda" size="lg">
      <div className="space-y-5">
        {/* Info */}
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Cliente: {rental.client?.name}</p>
            <p>Registre aqui valores por danos, perda ou mal uso dos equipamentos. O total será adicionado ao pagamento automaticamente.</p>
          </div>
        </div>

        {/* Add form */}
        <div className="p-4 bg-slate-50 rounded-lg space-y-3">
          <p className="font-semibold text-slate-700 text-sm flex items-center gap-2">
            <Plus size={14} /> Adicionar Multa
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Descrição *</label>
              <input
                className="input"
                placeholder="Ex: Andaime amassado, Betoneira com defeito..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Equipamento (opcional)</label>
              <select className="input" value={form.equipmentId} onChange={e => set('equipmentId', e.target.value)}>
                <option value="">Geral / não especificado</option>
                {rental.items?.map(item => (
                  <option key={item.equipmentId} value={item.equipmentId}>
                    {item.equipment?.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Valor (R$) *</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
              />
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => add.mutate()}
            disabled={add.isPending || !form.description || !form.amount}
          >
            {add.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Registrar Multa
          </button>
        </div>

        {/* List */}
        <div>
          <p className="font-semibold text-slate-700 text-sm mb-3">Multas Registradas</p>
          {isLoading ? (
            <p className="text-slate-400 text-sm text-center py-4">Carregando...</p>
          ) : fines?.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">Nenhuma multa por danos registrada</p>
          ) : (
            <div className="space-y-2">
              {fines.map(fine => (
                <div key={fine.id} className="flex items-start justify-between p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Wrench size={15} className="text-orange-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{fine.description}</p>
                      {fine.equipment && (
                        <p className="text-xs text-slate-500">Equipamento: {fine.equipment.name}</p>
                      )}
                      <p className="text-xs text-slate-400">{formatDate(fine.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-orange-600">{formatCurrency(fine.amount)}</span>
                    <button
                      onClick={() => { if (confirm('Remover esta multa?')) remove.mutate(fine.id) }}
                      className="p-1 hover:bg-red-50 rounded"
                      disabled={remove.isPending}
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center p-3 bg-orange-50 border border-orange-200 rounded-lg font-bold">
                <span className="text-orange-800">Total Multas por Danos</span>
                <span className="text-orange-700 text-lg">{formatCurrency(totalDamages)}</span>
              </div>
            </div>
          )}
        </div>

        <button className="btn-secondary w-full justify-center" onClick={onClose}>Fechar</button>
      </div>
    </Modal>
  )
}
